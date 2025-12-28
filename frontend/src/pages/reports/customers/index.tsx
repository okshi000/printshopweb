// صفحة تقارير العملاء والديون

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { customersReportApi, debtsReportApi } from '@/api/reports/customers.api';
import { CHART_COLOR_ARRAY } from '@/types/reports/common.types';
import { formatCurrency, fadeInUp, staggerContainer } from '@/lib/utils';

export const CustomersReportsPage: React.FC = () => {
  const { filters, dateRange, setDateRange, period, setPeriod, resetFilters } = useReportFilters();
  const { exportToPdf, exportToExcel, isExporting } = useReportExport({ defaultFilename: 'customers-report' });

  // جلب ملخص العملاء
  const { 
    data: customerSummary, 
    isLoading: customersLoading, 
    error: customersError,
    refetch: refetchCustomers 
  } = useQuery({
    queryKey: ['customer-summary', filters],
    queryFn: async () => {
      const res = await customersReportApi.getSummary(filters);
      return res.data;
    },
  });

  // جلب تقارير العملاء
  const { data: customerReport } = useQuery({
    queryKey: ['customer-report', filters],
    queryFn: async () => {
      const res = await customersReportApi.getReport(filters);
      return res.data;
    },
  });

  // جلب ملخص الديون
  const { data: debtSummary } = useQuery({
    queryKey: ['debt-summary', filters],
    queryFn: async () => {
      const res = await debtsReportApi.getSummary(filters);
      return res.data;
    },
  });

  // جلب ديون العملاء
  const { data: customerDebts } = useQuery({
    queryKey: ['customer-debts', filters],
    queryFn: async () => {
      const res = await debtsReportApi.getByCustomer(filters);
      return res.data;
    },
  });

  // جلب تقادم الديون
  const { data: debtAging } = useQuery({
    queryKey: ['debt-aging', filters],
    queryFn: async () => {
      const res = await debtsReportApi.getAging(filters);
      return res.data;
    },
  });

  const isLoading = customersLoading;

  if (customersError) {
    return (
      <ReportError
        title="فشل تحميل تقارير العملاء"
        error={customersError as Error}
        onRetry={() => refetchCustomers()}
      />
    );
  }

  const handleExportPdf = async () => {
    await exportToPdf(
      (format, f) => customersReportApi.export('summary', format, f).then((r: any) => r.data as unknown as Blob),
      'customers-summary',
      filters
    );
  };

  const handleExportExcel = async () => {
    await exportToExcel(
      (format, f) => customersReportApi.export('summary', format, f).then((r: any) => r.data as unknown as Blob),
      'customers-summary',
      filters
    );
  };

  // تحويل بيانات تقادم الديون للرسم
  const agingChartData = (debtAging || []).map((item: any, index: number) => ({
    name: item.range_label || item.age_range,
    value: item.total_amount,
    color: CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length],
  }));

  // نسبة التحصيل
  const collectionRate = debtSummary?.total_debts 
    ? ((debtSummary.total_repaid / (debtSummary.total_debts + debtSummary.total_repaid)) * 100)
    : 0;

  // أعمدة جدول العملاء
  const customerColumns = [
    { key: 'customer_name', title: 'العميل' },
    { key: 'customer_phone', title: 'الهاتف' },
    { 
      key: 'total_purchases', 
      title: 'إجمالي المشتريات',
      render: (value: unknown) => formatCurrency(value as number),
    },
    { 
      key: 'total_paid', 
      title: 'المدفوع',
      render: (value: unknown) => formatCurrency(value as number),
    },
    { 
      key: 'total_debt', 
      title: 'الدين المتبقي',
      render: (value: unknown) => {
        const debt = value as number;
        return (
          <span className={debt > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
            {formatCurrency(debt)}
          </span>
        );
      },
    },
    { key: 'invoice_count', title: 'عدد الفواتير' },
  ];

  // أعمدة جدول الديون
  const debtColumns = [
    { key: 'customer_name', title: 'العميل' },
    { key: 'customer_phone', title: 'الهاتف' },
    { 
      key: 'total_debt', 
      title: 'إجمالي الدين',
      render: (value: unknown) => formatCurrency(value as number),
    },
    { 
      key: 'remaining_amount', 
      title: 'المتبقي',
      render: (value: unknown) => (
        <span className="text-red-600 font-medium">{formatCurrency(value as number)}</span>
      ),
    },
    { key: 'days_overdue', title: 'أيام التأخير' },
    { 
      key: 'status', 
      title: 'الحالة',
      render: (value: unknown) => {
        const status = value as string;
        const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
          'current': { label: 'حالي', variant: 'default' },
          'overdue': { label: 'متأخر', variant: 'secondary' },
          'critical': { label: 'حرج', variant: 'destructive' },
        };
        const config = statusConfig[status] || statusConfig['current'];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
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
          title="تقارير العملاء والديون"
          subtitle="تحليل شامل للعملاء والمستحقات"
          icon={<Users className="h-6 w-6 text-white" />}
          onRefresh={() => refetchCustomers()}
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
                title="إجمالي العملاء"
                value={customerSummary?.total_customers || 0}
                icon={<Users className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              />
              <StatsCard
                title="إجمالي الديون"
                value={formatCurrency(debtSummary?.total_pending || 0)}
                icon={<CreditCard className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-red-500 to-rose-600"
              />
              <StatsCard
                title="المتأخرات"
                value={formatCurrency(debtSummary?.overdue_amount || 0)}
                icon={<AlertCircle className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
              />
              <StatsCard
                title="نسبة التحصيل"
                value={`${collectionRate.toFixed(1)}%`}
                icon={<CheckCircle className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
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
                <TabsTrigger value="customers" className="gap-2">
                  <Users className="h-4 w-4" />
                  العملاء
                </TabsTrigger>
                <TabsTrigger value="debts" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  الديون
                </TabsTrigger>
                <TabsTrigger value="aging" className="gap-2">
                  <Clock className="h-4 w-4" />
                  تقادم الديون
                </TabsTrigger>
              </TabsList>

              {/* نظرة عامة */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* تقادم الديون */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        تقادم الديون
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PieChartComponent
                        data={agingChartData}
                        nameKey="name"
                        valueKey="value"
                        height={300}
                        formatValue={(v) => formatCurrency(v)}
                        showLegend
                      />
                    </CardContent>
                  </Card>

                  {/* نسبة التحصيل */}
                  <Card>
                    <CardHeader>
                      <CardTitle>أداء التحصيل</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>نسبة التحصيل</span>
                          <span className="font-medium">{collectionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={collectionRate} className="h-3" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">تم تحصيله</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(debtSummary?.total_repaid || 0)}
                          </p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">المتبقي</p>
                          <p className="text-xl font-bold text-red-600">
                            {formatCurrency(debtSummary?.total_pending || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">عدد المدينين</p>
                        <p className="text-2xl font-bold">{debtSummary?.debtor_count || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* إحصائيات إضافية */}
                <Card>
                  <CardHeader>
                    <CardTitle>إحصائيات العملاء</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">العملاء النشطين</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {customerSummary?.active_customers || 0}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">عملاء جدد</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {customerSummary?.new_customers || 0}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">متوسط قيمة العميل</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(customerSummary?.average_customer_value || 0)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {formatCurrency(customerSummary?.total_revenue || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* العملاء */}
              <TabsContent value="customers">
                <ReportTable
                  title="قائمة العملاء"
                  columns={customerColumns}
                  data={customerReport || []}
                  emptyMessage="لا توجد بيانات للعملاء"
                />
              </TabsContent>

              {/* الديون */}
              <TabsContent value="debts">
                <ReportTable
                  title="ديون العملاء"
                  columns={debtColumns}
                  data={customerDebts || []}
                  emptyMessage="لا توجد ديون مسجلة"
                />
              </TabsContent>

              {/* تقادم الديون */}
              <TabsContent value="aging" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>تحليل تقادم الديون</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChartComponent
                      data={debtAging || []}
                      xKey="range_label"
                      yKeys={[
                        { key: 'total_amount', name: 'المبلغ', color: '#ef4444' },
                      ]}
                      height={350}
                      formatValue={(v) => formatCurrency(v)}
                    />
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {(debtAging || []).map((item: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">{item.range_label || item.age_range}</span>
                          <Badge variant="outline">{item.debt_count} دين</Badge>
                        </div>
                        <p className="text-xl font-bold">{formatCurrency(item.total_amount)}</p>
                        <p className="text-xs text-muted-foreground">{item.customer_count} عميل</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default CustomersReportsPage;

