// صفحة التقارير المالية الرئيسية

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  PieChart,
  BarChart3,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ReportHeader, 
  ReportFilters, 
  ReportLoading, 
  ReportError 
} from '@/components/reports/common';
import { StatsCard } from '@/components/reports/cards';
import { 
  AreaChartComponent, 
  BarChartComponent, 
  PieChartComponent 
} from '@/components/charts';
import { useReportFilters, useReportExport } from '@/hooks/reports';
import { financialApi } from '@/api/reports/financial.api';
import { formatCurrency, CHART_COLOR_ARRAY } from '@/types/reports/common.types';
import { fadeInUp, staggerContainer } from '@/lib/utils';

export const FinancialReportsPage: React.FC = () => {
  const { filters, dateRange, setDateRange, period, setPeriod, resetFilters } = useReportFilters();
  const { exportToPdf, exportToExcel, isExporting } = useReportExport({ defaultFilename: 'financial-report' });

  // جلب الملخص المالي
  const { 
    data: summary, 
    isLoading: summaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['financial-summary', filters],
    queryFn: async () => {
      const res = await financialApi.getSummary(filters);
      return res.data;
    },
  });

  // جلب الإيرادات حسب الفترة
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-by-period', filters],
    queryFn: async () => {
      const res = await financialApi.getRevenueByPeriod(filters);
      return res.data;
    },
  });

  // جلب تفصيل المصروفات
  const { data: expenseData, isLoading: expenseLoading } = useQuery({
    queryKey: ['expense-breakdown', filters],
    queryFn: async () => {
      const res = await financialApi.getExpenseBreakdown(filters);
      return res.data;
    },
  });

  const isLoading = summaryLoading || revenueLoading || expenseLoading;

  if (summaryError) {
    return (
      <ReportError
        title="فشل تحميل التقارير المالية"
        error={summaryError as Error}
        onRetry={() => refetchSummary()}
      />
    );
  }

  const handleExportPdf = async () => {
    await exportToPdf(
      (format, f) => financialApi.export('summary', format, f).then((r: any) => r.data as unknown as Blob),
      'financial-summary',
      filters
    );
  };

  const handleExportExcel = async () => {
    await exportToExcel(
      (format, f) => financialApi.export('summary', format, f).then((r: any) => r.data as unknown as Blob),
      'financial-summary',
      filters
    );
  };

  // تحويل بيانات المصروفات للرسم الدائري
  const expenseChartData = (expenseData || []).map((item: any, index: number) => ({
    name: item.category,
    value: item.amount,
    color: CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length],
  }));

  // تحويل بيانات الإيرادات للرسم المساحي
  const revenueChartData = (revenueData || []).map((item: any) => ({
    period: item.period || item.date,
    revenue: item.revenue,
    expenses: item.expenses,
    profit: item.profit,
  }));

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
          title="التقارير المالية"
          subtitle="تحليل شامل للإيرادات والمصروفات والأرباح"
          icon={<DollarSign className="h-6 w-6 text-white" />}
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
                title="إجمالي الإيرادات"
                value={formatCurrency(summary?.total_revenue || 0)}
                icon={<DollarSign className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                trend={{
                  value: 12.5,
                  direction: 'up',
                  label: 'مقارنة بالفترة السابقة',
                }}
              />
              <StatsCard
                title="إجمالي المصروفات"
                value={formatCurrency(summary?.total_expenses || 0)}
                icon={<TrendingDown className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-red-500 to-rose-600"
                trend={{
                  value: 5.2,
                  direction: 'down',
                  label: 'مقارنة بالفترة السابقة',
                }}
              />
              <StatsCard
                title="صافي الربح"
                value={formatCurrency(summary?.net_profit || 0)}
                icon={<TrendingUp className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-purple-500 to-pink-600"
                trend={{
                  value: 18.3,
                  direction: 'up',
                  label: 'مقارنة بالفترة السابقة',
                }}
              />
              <StatsCard
                title="الرصيد النقدي"
                value={formatCurrency(summary?.total_cash || 0)}
                icon={<Wallet className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              />
            </div>
          </motion.div>

          {/* التبويبات */}
          <motion.div variants={fadeInUp}>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="revenue" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  الإيرادات
                </TabsTrigger>
                <TabsTrigger value="expenses" className="gap-2">
                  <PieChart className="h-4 w-4" />
                  المصروفات
                </TabsTrigger>
                <TabsTrigger value="profit-loss" className="gap-2">
                  <FileText className="h-4 w-4" />
                  الأرباح والخسائر
                </TabsTrigger>
              </TabsList>

              {/* نظرة عامة */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* رسم الإيرادات والمصروفات */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        تطور الإيرادات والمصروفات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AreaChartComponent
                        data={revenueChartData}
                        xKey="period"
                        yKeys={[
                          { key: 'revenue', name: 'الإيرادات', color: '#10b981' },
                          { key: 'expenses', name: 'المصروفات', color: '#ef4444' },
                        ]}
                        height={300}
                        formatValue={(v) => formatCurrency(v)}
                      />
                    </CardContent>
                  </Card>

                  {/* توزيع المصروفات */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        توزيع المصروفات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PieChartComponent
                        data={expenseChartData}
                        nameKey="name"
                        dataKey="value"
                        height={300}
                        formatValue={(v) => formatCurrency(v)}
                        showLegend
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* ملخص الفترة */}
                <Card>
                  <CardHeader>
                    <CardTitle>ملخص الفترة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">هامش الربح</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {summary?.profit_margin?.toFixed(1) || 0}%
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">إجمالي الديون</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(summary?.total_debts || 0)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">متوسط الإيراد اليومي</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {formatCurrency((summary?.total_revenue || 0) / 30)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">نسبة المصروفات</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {summary?.total_revenue ? 
                            ((summary.total_expenses / summary.total_revenue) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* الإيرادات */}
              <TabsContent value="revenue" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>تفاصيل الإيرادات حسب الفترة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChartComponent
                      data={revenueChartData}
                      xKey="period"
                      yKeys={[
                        { key: 'revenue', name: 'الإيرادات', color: '#10b981' },
                      ]}
                      height={400}
                      formatValue={(v) => formatCurrency(v)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* المصروفات */}
              <TabsContent value="expenses" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>المصروفات حسب الفئة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PieChartComponent
                        data={expenseChartData}
                        nameKey="name"
                        valueKey="value"
                        height={350}
                        formatValue={(v) => formatCurrency(v)}
                        showLegend
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>تفاصيل المصروفات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(expenseData || []).map((expense: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length] }}
                              />
                              <span className="font-medium">{expense.category}</span>
                            </div>
                            <div className="text-left">
                              <p className="font-bold">{formatCurrency(expense.amount)}</p>
                              <p className="text-xs text-muted-foreground">{expense.percentage?.toFixed(1)}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* الأرباح والخسائر */}
              <TabsContent value="profit-loss" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>صافي الربح عبر الفترات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AreaChartComponent
                      data={revenueChartData}
                      xKey="period"
                      yKeys={[
                        { key: 'profit', name: 'صافي الربح', color: '#8b5cf6' },
                      ]}
                      height={400}
                      formatValue={(v) => formatCurrency(v)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default FinancialReportsPage;
