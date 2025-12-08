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
import { Package, AlertCircle, TrendingDown, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ReportFilters } from '@/types/reports';

export const InventoryReports: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 3))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const filters: ReportFilters = {
    start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  };

  // Inventory Summary
  const { data: summary } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => reportsApi.inventory.getSummary(),
  });

  // Inventory Details
  const { data: details } = useQuery({
    queryKey: ['inventory-details'],
    queryFn: () => reportsApi.inventory.getDetails(),
  });

  // Inventory Movements
  const { data: movements } = useQuery({
    queryKey: ['inventory-movements', filters],
    queryFn: () => reportsApi.inventory.getMovements(filters),
  });

  // Stock Valuation
  const { data: valuation } = useQuery({
    queryKey: ['stock-valuation'],
    queryFn: () => reportsApi.inventory.getValuation(),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0) + ' د.ل';
  };

  // Extract data safely
  const summaryData = summary?.data as Record<string, unknown> | undefined;
  const detailsData = Array.isArray(details?.data) ? details.data : [];
  const movementsData = Array.isArray(movements?.data) ? movements.data : [];
  const valuationData = Array.isArray(valuation?.data) ? valuation.data : [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string }> = {
      in_stock: { variant: 'default', label: 'متوفر' },
      low_stock: { variant: 'secondary', label: 'مخزون منخفض' },
      out_of_stock: { variant: 'destructive', label: 'نفذ' },
    };
    const config = variants[status] || variants.in_stock;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMovementTypeBadge = (type: string) => {
    const config = type === 'in' 
      ? { variant: 'default' as const, label: 'إضافة' }
      : type === 'out'
      ? { variant: 'destructive' as const, label: 'سحب' }
      : { variant: 'secondary' as const, label: 'تعديل' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">تقارير المخزون</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Number(summaryData?.total_items) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(Number(summaryData?.total_value) || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Number(summaryData?.low_stock_items) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">نفذ من المخزون</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {Number(summaryData?.out_of_stock_items) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="details">تفاصيل المخزون</TabsTrigger>
          <TabsTrigger value="movements">الحركات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>توزيع قيمة المخزون حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChartComponent
                  data={valuationData.map((item: any) => ({
                    category: item.category || '',
                    total_value: item.total_value || 0,
                  }))}
                  dataKey="total_value"
                  nameKey="category"
                  height={350}
                  formatValue={formatCurrency}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>عدد الأصناف حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  data={valuationData.map((item: any) => ({
                    category: item.category || '',
                    item_count: item.item_count || 0,
                  }))}
                  xKey="category"
                  yKeys={[
                    { key: 'item_count', name: 'عدد الأصناف', color: '#3b82f6' },
                  ]}
                  height={350}
                  formatValue={(value) => value.toString()}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تقييم المخزون حسب الفئة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">الفئة</th>
                      <th className="text-right p-2">عدد الأصناف</th>
                      <th className="text-right p-2">الكمية الإجمالية</th>
                      <th className="text-right p-2">القيمة</th>
                      <th className="text-right p-2">النسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valuationData.map((item: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-semibold">{item.category || ''}</td>
                        <td className="p-2">{item.item_count || 0}</td>
                        <td className="p-2">{item.total_quantity || 0}</td>
                        <td className="p-2 font-semibold">
                          {formatCurrency(item.total_value || 0)}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${item.percentage || 0}%` }}
                              />
                            </div>
                            <span>{item.percentage || 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">الصنف</th>
                      <th className="text-right p-2">الكمية الحالية</th>
                      <th className="text-right p-2">سعر الوحدة</th>
                      <th className="text-right p-2">القيمة الإجمالية</th>
                      <th className="text-right p-2">حد إعادة الطلب</th>
                      <th className="text-right p-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailsData.map((item: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-semibold">{item.item_name || ''}</td>
                        <td className="p-2">{item.current_quantity || 0}</td>
                        <td className="p-2">{formatCurrency(item.unit_cost || 0)}</td>
                        <td className="p-2 font-semibold">
                          {formatCurrency(item.total_value || 0)}
                        </td>
                        <td className="p-2">{item.reorder_level || 0}</td>
                        <td className="p-2">{getStatusBadge(item.status || 'in_stock')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>أعلى 10 أصناف قيمة</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  data={[...detailsData]
                    .sort((a: any, b: any) => (b.total_value || 0) - (a.total_value || 0))
                    .slice(0, 10)
                    .map((item: any) => ({
                      item_name: item.item_name || '',
                      total_value: item.total_value || 0,
                    }))}
                  xKey="item_name"
                  yKeys={[
                    { key: 'total_value', name: 'القيمة', color: '#10b981' },
                  ]}
                  height={350}
                  formatValue={formatCurrency}
                  layout="vertical"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الأصناف التي تحتاج إعادة طلب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {detailsData
                    .filter((item: any) => item.status !== 'in_stock')
                    .slice(0, 10)
                    .map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-semibold">{item.item_name || ''}</div>
                          <div className="text-sm text-gray-600">
                            الكمية: {item.current_quantity || 0} / حد الطلب: {item.reorder_level || 0}
                          </div>
                        </div>
                        {getStatusBadge(item.status || 'in_stock')}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
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

          <Card>
            <CardHeader>
              <CardTitle>حركات المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">التاريخ</th>
                      <th className="text-right p-2">الصنف</th>
                      <th className="text-right p-2">النوع</th>
                      <th className="text-right p-2">الكمية</th>
                      <th className="text-right p-2">التكلفة</th>
                      <th className="text-right p-2">الإجمالي</th>
                      <th className="text-right p-2">المرجع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementsData.map((item: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.date || ''}</td>
                        <td className="p-2">{item.item_name || ''}</td>
                        <td className="p-2">{getMovementTypeBadge(item.movement_type || '')}</td>
                        <td className="p-2">{item.quantity || 0}</td>
                        <td className="p-2">{formatCurrency(item.cost_per_unit || 0)}</td>
                        <td className="p-2 font-semibold">
                          {formatCurrency(item.total_cost || 0)}
                        </td>
                        <td className="p-2 text-gray-600">{item.reference || '-'}</td>
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
