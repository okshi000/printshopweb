import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangeFilter } from '@/components/reports/DateRangeFilter';
import {
  BarChartComponent,
  PieChartComponent,
} from '@/components/charts';
import { reportsApi } from '@/api/reports';
import { format } from 'date-fns';
import { ShoppingCart, Users, Package, TrendingUp } from 'lucide-react';
import type { ReportFilters } from '@/types/reports';

export const SalesReports: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 3))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const filters: ReportFilters = {
    start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  };

  // Sales Summary
  const { data: summary } = useQuery({
    queryKey: ['sales-summary', filters],
    queryFn: () => reportsApi.sales.getSummary(filters),
  });

  // Sales by Customer
  const { data: salesByCustomer } = useQuery({
    queryKey: ['sales-by-customer', filters],
    queryFn: () => reportsApi.sales.getByCustomer(filters),
  });

  // Sales by Product
  const { data: salesByProduct } = useQuery({
    queryKey: ['sales-by-product', filters],
    queryFn: () => reportsApi.sales.getByProduct(filters),
  });

  // Top Products
  const { data: topProducts } = useQuery({
    queryKey: ['top-products', filters],
    queryFn: () => reportsApi.sales.getTopProducts({ ...filters, limit: 10 }),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0) + ' د.ل';
  };

  // Extract data safely - axios response.data contains the actual data
  const summaryData = summary?.data as Record<string, unknown> | undefined;
  const customerData = Array.isArray(salesByCustomer?.data) ? salesByCustomer.data : [];
  const productData = Array.isArray(salesByProduct?.data) ? salesByProduct.data : [];
  const topProductsData = Array.isArray(topProducts?.data) ? topProducts.data : [];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">تقارير المبيعات</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الفلاتر</CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(Number(summaryData?.total_sales) || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              عدد الفواتير: {Number(summaryData?.total_invoices) || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">متوسط قيمة الفاتورة</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(Number(summaryData?.average_invoice_value) || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المدفوع</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(Number(summaryData?.paid_amount) || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المعلق</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(Number(summaryData?.pending_amount) || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="customers">العملاء</TabsTrigger>
          <TabsTrigger value="top">الأكثر مبيعاً</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المبيعات حسب المنتج</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartComponent
                data={productData.slice(0, 15).map((item: any) => ({
                  product_name: item.product_name || '',
                  total_revenue: item.total_revenue || 0,
                }))}
                xKey="product_name"
                yKeys={[
                  { key: 'total_revenue', name: 'الإيرادات', color: '#10b981' },
                ]}
                height={400}
                formatValue={formatCurrency}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الكمية المباعة</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartComponent
                data={productData.slice(0, 15).map((item: any) => ({
                  product_name: item.product_name || '',
                  quantity_sold: item.quantity_sold || 0,
                }))}
                xKey="product_name"
                yKeys={[
                  { key: 'quantity_sold', name: 'الكمية', color: '#3b82f6' },
                ]}
                height={400}
                formatValue={(value) => value.toLocaleString()}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المبيعات حسب المنتج</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">المنتج</th>
                      <th className="text-right p-2">الكمية المباعة</th>
                      <th className="text-right p-2">الإيرادات</th>
                      <th className="text-right p-2">متوسط السعر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productData.map((item: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.product_name || ''}</td>
                        <td className="p-2">{item.quantity_sold || 0}</td>
                        <td className="p-2 font-semibold">
                          {formatCurrency(item.total_revenue || 0)}
                        </td>
                        <td className="p-2">
                          {formatCurrency(item.average_price || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المبيعات حسب العميل</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartComponent
                data={customerData.slice(0, 15).map((item: any) => ({
                  customer_name: item.customer_name || '',
                  total_purchases: item.total_purchases || 0,
                }))}
                xKey="customer_name"
                yKeys={[
                  { key: 'total_purchases', name: 'المشتريات', color: '#8b5cf6' },
                ]}
                height={400}
                formatValue={formatCurrency}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>توزيع العملاء</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChartComponent
                data={customerData.slice(0, 10).map((item: any) => ({
                  customer_name: item.customer_name || '',
                  total_purchases: item.total_purchases || 0,
                }))}
                dataKey="total_purchases"
                nameKey="customer_name"
                height={400}
                formatValue={formatCurrency}
                showPercentage={false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المبيعات حسب العميل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">العميل</th>
                      <th className="text-right p-2">إجمالي المشتريات</th>
                      <th className="text-right p-2">عدد الفواتير</th>
                      <th className="text-right p-2">متوسط الطلب</th>
                      <th className="text-right p-2">آخر شراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerData.map((item: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.customer_name || ''}</td>
                        <td className="p-2 font-semibold">
                          {formatCurrency(item.total_purchases || 0)}
                        </td>
                        <td className="p-2">{item.invoice_count || 0}</td>
                        <td className="p-2">
                          {formatCurrency(item.average_order_value || 0)}
                        </td>
                        <td className="p-2">{item.last_purchase_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>أفضل 10 منتجات مبيعاً</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  data={topProductsData.map((item: any) => ({
                    product_name: item.product_name || '',
                    quantity_sold: item.quantity_sold || 0,
                  }))}
                  xKey="product_name"
                  yKeys={[
                    { key: 'quantity_sold', name: 'الكمية المباعة', color: '#f59e0b' },
                  ]}
                  height={400}
                  layout="vertical"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الإيرادات من أفضل المنتجات</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChartComponent
                  data={topProductsData.map((item: any) => ({
                    product_name: item.product_name || '',
                    revenue: item.revenue || 0,
                  }))}
                  dataKey="revenue"
                  nameKey="product_name"
                  height={400}
                  formatValue={formatCurrency}
                  showPercentage={false}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>قائمة أفضل المنتجات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">الترتيب</th>
                      <th className="text-right p-2">المنتج</th>
                      <th className="text-right p-2">الكمية المباعة</th>
                      <th className="text-right p-2">الإيرادات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProductsData.map((item: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold">
                            {item.rank || index + 1}
                          </div>
                        </td>
                        <td className="p-2 font-semibold">{item.product_name || ''}</td>
                        <td className="p-2">{item.quantity_sold || 0}</td>
                        <td className="p-2 font-semibold text-green-600">
                          {formatCurrency(item.revenue || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
