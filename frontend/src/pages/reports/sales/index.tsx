// صفحة تقارير المبيعات الرئيسية

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Users, 
  Package,
  TrendingUp,
  Receipt,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ReportHeader, 
  ReportFilters, 
  ReportLoading, 
  ReportError,
  ReportTable,
} from '@/components/reports/common';
import { StatsCard } from '@/components/reports/cards';
import { 
  AreaChartComponent, 
  BarChartComponent, 
  PieChartComponent 
} from '@/components/charts';
import { useReportFilters, useReportExport } from '@/hooks/reports';
import { salesApi } from '@/api/reports/sales.api';
import { formatCurrency, CHART_COLOR_ARRAY } from '@/types/reports/common.types';
import { fadeInUp, staggerContainer } from '@/lib/utils';

export const SalesReportsPage: React.FC = () => {
  const { filters, dateRange, setDateRange, period, setPeriod, resetFilters } = useReportFilters();
  const { exportToPdf, exportToExcel, isExporting } = useReportExport({ defaultFilename: 'sales-report' });

  // جلب ملخص المبيعات
  const { 
    data: summary, 
    isLoading: summaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['sales-summary', filters],
    queryFn: async () => {
      const res = await salesApi.getSummary(filters);
      return res.data;
    },
  });

  // جلب المبيعات حسب الفترة
  const { data: salesByPeriod } = useQuery({
    queryKey: ['sales-by-period', filters],
    queryFn: async () => {
      const res = await salesApi.getByPeriod(filters);
      return res.data;
    },
  });

  // جلب أفضل المنتجات
  const { data: topProducts } = useQuery({
    queryKey: ['top-products', filters],
    queryFn: async () => {
      const res = await salesApi.getTopProducts({ ...filters, limit: 10 });
      return res.data;
    },
  });

  // جلب المبيعات حسب العميل
  const { data: salesByCustomer } = useQuery({
    queryKey: ['sales-by-customer', filters],
    queryFn: async () => {
      const res = await salesApi.getByCustomer(filters);
      return res.data;
    },
  });

  // جلب المبيعات حسب المنتج
  const { data: salesByProduct } = useQuery({
    queryKey: ['sales-by-product', filters],
    queryFn: async () => {
      const res = await salesApi.getByProduct(filters);
      return res.data;
    },
  });

  const isLoading = summaryLoading;

  if (summaryError) {
    return (
      <ReportError
        title="فشل تحميل تقارير المبيعات"
        error={summaryError as Error}
        onRetry={() => refetchSummary()}
      />
    );
  }

  const handleExportPdf = async () => {
    await exportToPdf(
      (format, f) => salesApi.export('summary', format, f).then((r: any) => r.data as unknown as Blob),
      'sales-summary',
      filters
    );
  };

  const handleExportExcel = async () => {
    await exportToExcel(
      (format, f) => salesApi.export('summary', format, f).then((r: any) => r.data as unknown as Blob),
      'sales-summary',
      filters
    );
  };

  // تحويل بيانات المنتجات للرسم الدائري
  const productsChartData = (topProducts || []).slice(0, 5).map((item: any, index: number) => ({
    name: item.product_name,
    value: item.revenue,
    color: CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length],
  }));

  // أعمدة جدول العملاء
  const customerColumns = [
    { key: 'customer_name', title: 'العميل' },
    { 
      key: 'total_purchases', 
      title: 'إجمالي المشتريات',
      render: (value: unknown) => formatCurrency(value as number),
    },
    { key: 'invoice_count', title: 'عدد الفواتير' },
    { 
      key: 'average_order_value', 
      title: 'متوسط الطلب',
      render: (value: unknown) => formatCurrency(value as number),
    },
  ];

  // أعمدة جدول المنتجات
  const productColumns = [
    { key: 'product_name', title: 'المنتج' },
    { key: 'quantity_sold', title: 'الكمية المباعة' },
    { 
      key: 'total_revenue', 
      title: 'الإيرادات',
      render: (value: unknown) => formatCurrency(value as number),
    },
    { 
      key: 'profit_margin', 
      title: 'هامش الربح',
      render: (value: unknown) => `${(value as number)?.toFixed(1) || 0}%`,
    },
  ];

  return (
    <motion.div 
      variants={staggerContainer} 
      initial="initial" 
      animate="animate" 
      className="space-y-6"
    >
      {/* رأس الصفحة */}
      <motion.div variants={fadeInUp}>
        <ReportHeader
          title="تقارير المبيعات"
          subtitle="تحليل شامل للمبيعات والعملاء والمنتجات"
          icon={<ShoppingCart className="h-6 w-6 text-white" />}
          onRefresh={() => refetchSummary()}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
          isExporting={isExporting}
        />
      </motion.div>

      {/* الفلاتر */}
      <motion.div variants={fadeInUp}>
        <ReportFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          period={period}
          onPeriodChange={setPeriod}
          onReset={resetFilters}
        />
      </motion.div>

      {isLoading ? (
        <ReportLoading type="full" />
      ) : (
        <>
          {/* بطاقات الملخص */}
          <motion.div variants={fadeInUp}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="إجمالي المبيعات"
                value={formatCurrency(summary?.total_sales || 0)}
                icon={<ShoppingCart className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                trend={{
                  value: summary?.growth_rate || 0,
                  direction: (summary?.growth_rate || 0) >= 0 ? 'up' : 'down',
                }}
              />
              <StatsCard
                title="عدد الفواتير"
                value={summary?.total_invoices || 0}
                icon={<Receipt className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              />
              <StatsCard
                title="متوسط الفاتورة"
                value={formatCurrency(summary?.average_invoice_value || 0)}
                icon={<TrendingUp className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-purple-500 to-pink-600"
              />
              <StatsCard
                title="المستحقات"
                value={formatCurrency(summary?.pending_amount || 0)}
                icon={<Users className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
              />
            </div>
          </motion.div>

          {/* التبويبات */}
          <motion.div variants={fadeInUp}>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-2">
                  <Package className="h-4 w-4" />
                  المنتجات
                </TabsTrigger>
                <TabsTrigger value="customers" className="gap-2">
                  <Users className="h-4 w-4" />
                  العملاء
                </TabsTrigger>
                <TabsTrigger value="top" className="gap-2">
                  <Star className="h-4 w-4" />
                  الأفضل أداءً
                </TabsTrigger>
              </TabsList>

              {/* نظرة عامة */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* تطور المبيعات */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        تطور المبيعات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AreaChartComponent
                        data={salesByPeriod || []}
                        xKey="period"
                        yKeys={[
                          { key: 'total_sales', name: 'المبيعات', color: '#3b82f6' },
                        ]}
                        height={300}
                        formatValue={(v) => formatCurrency(v)}
                      />
                    </CardContent>
                  </Card>

                  {/* توزيع المبيعات */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        أفضل 5 منتجات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PieChartComponent
                        data={productsChartData}
                        nameKey="name"
                        valueKey="value"
                        height={300}
                        formatValue={(v) => formatCurrency(v)}
                        showLegend
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* المنتجات */}
              <TabsContent value="products">
                <ReportTable
                  title="المبيعات حسب المنتج"
                  columns={productColumns}
                  data={salesByProduct || []}
                  emptyMessage="لا توجد بيانات للمنتجات"
                />
              </TabsContent>

              {/* العملاء */}
              <TabsContent value="customers">
                <ReportTable
                  title="المبيعات حسب العميل"
                  columns={customerColumns}
                  data={salesByCustomer || []}
                  emptyMessage="لا توجد بيانات للعملاء"
                />
              </TabsContent>

              {/* الأفضل أداءً */}
              <TabsContent value="top" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* أفضل المنتجات */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        أفضل 10 منتجات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(topProducts || []).map((product: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                                {index + 1}
                              </Badge>
                              <span className="font-medium">{product.product_name}</span>
                            </div>
                            <div className="text-left">
                              <p className="font-bold">{formatCurrency(product.revenue)}</p>
                              <p className="text-xs text-muted-foreground">{product.quantity_sold} وحدة</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* رسم بياني أفضل المنتجات */}
                  <Card>
                    <CardHeader>
                      <CardTitle>مقارنة المنتجات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarChartComponent
                        data={(topProducts || []).slice(0, 5)}
                        xKey="product_name"
                        yKeys={[
                          { key: 'revenue', name: 'الإيرادات', color: '#3b82f6' },
                        ]}
                        height={300}
                        formatValue={(v) => formatCurrency(v)}
                        layout="vertical"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default SalesReportsPage;
