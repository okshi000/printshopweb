// صفحة تقارير المخزون الرئيسية

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpDown,
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
  BarChartComponent, 
  PieChartComponent 
} from '@/components/charts';
import { useReportFilters, useReportExport } from '@/hooks/reports';
import { inventoryReportApi } from '@/api/reports/inventory.api';
import { CHART_COLOR_ARRAY } from '@/types/reports/common.types';
import { formatCurrency, formatNumber, fadeInUp, staggerContainer } from '@/lib/utils';

export const InventoryReportsPage: React.FC = () => {
  const { filters, dateRange, setDateRange, period, setPeriod, resetFilters } = useReportFilters();
  const { exportToPdf, exportToExcel, isExporting } = useReportExport({ defaultFilename: 'inventory-report' });

  // جلب ملخص المخزون
  const { 
    data: summary, 
    isLoading: summaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['inventory-summary', filters],
    queryFn: async () => {
      const res = await inventoryReportApi.getSummary(filters);
      return res.data;
    },
  });

  // جلب تفاصيل المخزون
  const { data: details } = useQuery({
    queryKey: ['inventory-details', filters],
    queryFn: async () => {
      const res = await inventoryReportApi.getDetails(filters);
      return res.data;
    },
  });

  // جلب تقييم المخزون
  const { data: valuation } = useQuery({
    queryKey: ['inventory-valuation', filters],
    queryFn: async () => {
      const res = await inventoryReportApi.getValuation(filters);
      return res.data;
    },
  });

  // جلب العناصر منخفضة المخزون
  const { data: lowStock } = useQuery({
    queryKey: ['low-stock', filters],
    queryFn: async () => {
      const res = await inventoryReportApi.getLowStock(filters);
      return res.data;
    },
  });

  // جلب حركات المخزون
  const { data: movements } = useQuery({
    queryKey: ['inventory-movements', filters],
    queryFn: async () => {
      const res = await inventoryReportApi.getMovements(filters);
      return res.data;
    },
  });

  const isLoading = summaryLoading;

  if (summaryError) {
    return (
      <ReportError
        title="فشل تحميل تقارير المخزون"
        error={summaryError as Error}
        onRetry={() => refetchSummary()}
      />
    );
  }

  const handleExportPdf = async () => {
    await exportToPdf(
      (format, f) => inventoryReportApi.export('summary', format, f).then((r: any) => r.data as unknown as Blob),
      'inventory-summary',
      filters
    );
  };

  const handleExportExcel = async () => {
    await exportToExcel(
      (format, f) => inventoryReportApi.export('summary', format, f).then((r: any) => r.data as unknown as Blob),
      'inventory-summary',
      filters
    );
  };

  // تحويل بيانات التقييم للرسم الدائري
  const valuationChartData = (valuation || []).map((item: any, index: number) => ({
    name: item.category_name,
    value: item.total_value,
    color: CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length],
  }));

  // أعمدة جدول المخزون
  const inventoryColumns = [
    { key: 'item_name', title: 'الصنف' },
    { key: 'current_quantity', title: 'الكمية الحالية' },
    { key: 'unit', title: 'الوحدة' },
    { 
      key: 'unit_cost', 
      title: 'تكلفة الوحدة',
      render: (value: unknown) => formatCurrency(value as number),
    },
    { 
      key: 'total_value', 
      title: 'القيمة الإجمالية',
      render: (value: unknown) => formatCurrency(value as number),
    },
    { 
      key: 'status', 
      title: 'الحالة',
      render: (value: unknown) => {
        const status = value as string;
        const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
          'in_stock': { label: 'متوفر', variant: 'default' },
          'low_stock': { label: 'منخفض', variant: 'secondary' },
          'out_of_stock': { label: 'نفذ', variant: 'destructive' },
        };
        const config = statusConfig[status] || statusConfig['in_stock'];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  // أعمدة جدول الحركات
  const movementColumns = [
    { key: 'item_name', title: 'الصنف' },
    { 
      key: 'movement_type', 
      title: 'النوع',
      render: (value: unknown) => {
        const type = value as string;
        const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
          'in': { label: 'إدخال', icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
          'out': { label: 'إخراج', icon: <TrendingDown className="h-4 w-4 text-red-500" /> },
          'adjustment': { label: 'تعديل', icon: <ArrowUpDown className="h-4 w-4 text-blue-500" /> },
        };
        const config = typeConfig[type] || typeConfig['in'];
        return (
          <div className="flex items-center gap-2">
            {config.icon}
            <span>{config.label}</span>
          </div>
        );
      },
    },
    { key: 'quantity', title: 'الكمية' },
    { 
      key: 'total_cost', 
      title: 'التكلفة',
      render: (value: unknown) => formatCurrency(value as number),
    },
    { key: 'created_at', title: 'التاريخ' },
  ];

  // أعمدة جدول المخزون المنخفض
  const lowStockColumns = [
    { key: 'item_name', title: 'الصنف' },
    { key: 'current_quantity', title: 'الكمية الحالية' },
    { key: 'reorder_level', title: 'مستوى إعادة الطلب' },
    { key: 'shortage', title: 'النقص' },
    { key: 'supplier_name', title: 'المورد' },
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
          title="تقارير المخزون"
          subtitle="متابعة المخزون والحركات والتقييم"
          icon={<Package className="h-6 w-6 text-white" />}
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
                title="إجمالي الأصناف"
                value={formatNumber(summary?.total_items || 0)}
                icon={<Package className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              />
              <StatsCard
                title="قيمة المخزون"
                value={formatCurrency(summary?.total_value || 0)}
                icon={<Layers className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              />
              <StatsCard
                title="أصناف منخفضة"
                value={summary?.low_stock_items || 0}
                icon={<AlertTriangle className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
              />
              <StatsCard
                title="أصناف نفذت"
                value={summary?.out_of_stock_items || 0}
                icon={<AlertTriangle className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-red-500 to-rose-600"
              />
            </div>
          </motion.div>

          {/* التبويبات */}
          <motion.div variants={fadeInUp}>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview" className="gap-2">
                  <Layers className="h-4 w-4" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-2">
                  <Package className="h-4 w-4" />
                  تفاصيل المخزون
                </TabsTrigger>
                <TabsTrigger value="movements" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  الحركات
                </TabsTrigger>
                <TabsTrigger value="low-stock" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  المخزون المنخفض
                </TabsTrigger>
              </TabsList>

              {/* نظرة عامة */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* تقييم المخزون */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        تقييم المخزون حسب الفئة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PieChartComponent
                        data={valuationChartData}
                        nameKey="name"
                        valueKey="value"
                        height={300}
                        formatValue={(v) => formatCurrency(v)}
                        showLegend
                      />
                    </CardContent>
                  </Card>

                  {/* توزيع المخزون */}
                  <Card>
                    <CardHeader>
                      <CardTitle>توزيع قيمة المخزون</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarChartComponent
                        data={valuation || []}
                        xKey="category_name"
                        yKeys={[
                          { key: 'total_value', name: 'القيمة', color: '#8b5cf6' },
                        ]}
                        height={300}
                        formatValue={(v) => formatCurrency(v)}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* ملخص إحصائي */}
                <Card>
                  <CardHeader>
                    <CardTitle>ملخص المخزون</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">إجمالي الكمية</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatNumber(summary?.total_quantity || 0)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">عدد الفئات</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {summary?.categories_count || 0}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">متوسط قيمة الصنف</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(summary?.average_item_value || 0)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">نسبة المنخفض</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {summary?.total_items ? 
                            ((summary.low_stock_items / summary.total_items) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* تفاصيل المخزون */}
              <TabsContent value="details">
                <ReportTable
                  title="تفاصيل المخزون"
                  columns={inventoryColumns}
                  data={details || []}
                  emptyMessage="لا توجد بيانات للمخزون"
                />
              </TabsContent>

              {/* الحركات */}
              <TabsContent value="movements">
                <ReportTable
                  title="حركات المخزون"
                  columns={movementColumns}
                  data={movements || []}
                  emptyMessage="لا توجد حركات مخزون"
                />
              </TabsContent>

              {/* المخزون المنخفض */}
              <TabsContent value="low-stock">
                <ReportTable
                  title="الأصناف منخفضة المخزون"
                  subtitle="الأصناف التي تحتاج إعادة طلب"
                  columns={lowStockColumns}
                  data={lowStock || []}
                  emptyMessage="لا توجد أصناف منخفضة المخزون"
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default InventoryReportsPage;

