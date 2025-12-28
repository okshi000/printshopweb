// صفحة تقارير التدفق النقدي

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpDown,
  PiggyBank,
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
import { StatsCard, TrendCard } from '@/components/reports/cards';
import { 
  BarChartComponent, 
  PieChartComponent,
  ComboChart,
} from '@/components/charts';
import { useReportFilters, useReportExport } from '@/hooks/reports';
import { cashflowApi } from '@/api/reports/cashflow.api';
import { formatCurrency, CHART_COLOR_ARRAY } from '@/types/reports/common.types';
import { fadeInUp, staggerContainer } from '@/lib/utils';

export const CashflowReportsPage: React.FC = () => {
  const { filters, dateRange, setDateRange, period, setPeriod, resetFilters } = useReportFilters();
  const { exportToPdf, exportToExcel, isExporting } = useReportExport({ defaultFilename: 'cashflow-report' });

  // جلب ملخص التدفق النقدي
  const { 
    data: summary, 
    isLoading: summaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['cashflow-summary', filters],
    queryFn: async () => {
      const res = await cashflowApi.getSummary(filters);
      return res.data;
    },
  });

  // جلب اتجاه التدفق النقدي
  const { data: trend } = useQuery({
    queryKey: ['cashflow-trend', filters],
    queryFn: async () => {
      const res = await cashflowApi.getTrend(filters);
      return res.data;
    },
  });

  // جلب التدفق حسب الفئة
  const { data: byCategory } = useQuery({
    queryKey: ['cashflow-by-category', filters],
    queryFn: async () => {
      const res = await cashflowApi.getByCategory(filters);
      return res.data;
    },
  });

  // جلب الحركات النقدية
  const { data: movements } = useQuery({
    queryKey: ['cash-movements', filters],
    queryFn: async () => {
      const res = await cashflowApi.getMovements(filters);
      return res.data;
    },
  });

  // جلب أرصدة الخزائن
  const { data: balanceBySource } = useQuery({
    queryKey: ['balance-by-source'],
    queryFn: async () => {
      const res = await cashflowApi.getBalanceBySource();
      return res.data;
    },
  });

  const isLoading = summaryLoading;

  if (summaryError) {
    return (
      <ReportError
        title="فشل تحميل تقارير التدفق النقدي"
        error={summaryError as Error}
        onRetry={() => refetchSummary()}
      />
    );
  }

  const handleExportPdf = async () => {
    await exportToPdf(
      (format, f) => cashflowApi.export('summary', format, f).then((r: any) => r.data as unknown as Blob),
      'cashflow-summary',
      filters
    );
  };

  const handleExportExcel = async () => {
    await exportToExcel(
      (format, f) => cashflowApi.export('summary', format, f).then((r: any) => r.data as unknown as Blob),
      'cashflow-summary',
      filters
    );
  };

  // فصل التدفقات الداخلة والخارجة
  const inflows = (byCategory || []).filter((c: any) => c.type === 'inflow');
  const outflows = (byCategory || []).filter((c: any) => c.type === 'outflow');

  // تحويل البيانات للرسوم البيانية
  const inflowsChartData = inflows.map((item: any, index: number) => ({
    name: item.category,
    value: item.amount,
    color: CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length],
  }));

  const outflowsChartData = outflows.map((item: any, index: number) => ({
    name: item.category,
    value: item.amount,
    color: CHART_COLOR_ARRAY[(index + 4) % CHART_COLOR_ARRAY.length],
  }));

  // أعمدة جدول الحركات
  const movementColumns = [
    { 
      key: 'type', 
      title: 'النوع',
      render: (value: unknown) => {
        const type = value as string;
        const isInflow = type === 'inflow';
        return (
          <div className="flex items-center gap-2">
            {isInflow ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span>{isInflow ? 'إيداع' : 'سحب'}</span>
          </div>
        );
      },
    },
    { key: 'category', title: 'الفئة' },
    { 
      key: 'amount', 
      title: 'المبلغ',
      render: (value: unknown, row: Record<string, unknown>) => {
        const type = row.type as string;
        const amount = value as number;
        return (
          <span className={type === 'inflow' ? 'text-green-600' : 'text-red-600'}>
            {type === 'inflow' ? '+' : '-'}{formatCurrency(amount)}
          </span>
        );
      },
    },
    { key: 'description', title: 'الوصف' },
    { key: 'created_at', title: 'التاريخ' },
  ];

  // أعمدة جدول الأرصدة
  const balanceColumns = [
    { key: 'source_name', title: 'الخزينة' },
    { 
      key: 'balance', 
      title: 'الرصيد',
      render: (value: unknown) => (
        <span className="font-bold">{formatCurrency(value as number)}</span>
      ),
    },
    { 
      key: 'percentage', 
      title: 'النسبة',
      render: (value: unknown) => `${(value as number)?.toFixed(1) || 0}%`,
    },
    { key: 'transaction_count', title: 'عدد الحركات' },
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
          title="تقارير التدفق النقدي"
          subtitle="تحليل شامل للتدفقات والأرصدة النقدية"
          icon={<CreditCard className="h-6 w-6 text-white" />}
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
                title="الرصيد الافتتاحي"
                value={formatCurrency(summary?.opening_balance || 0)}
                icon={<Wallet className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              />
              <StatsCard
                title="إجمالي الإيداعات"
                value={formatCurrency(summary?.total_inflows || 0)}
                icon={<TrendingUp className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              />
              <StatsCard
                title="إجمالي المسحوبات"
                value={formatCurrency(summary?.total_outflows || 0)}
                icon={<TrendingDown className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-red-500 to-rose-600"
              />
              <StatsCard
                title="الرصيد الختامي"
                value={formatCurrency(summary?.closing_balance || 0)}
                icon={<PiggyBank className="h-6 w-6" />}
                gradient="bg-gradient-to-br from-purple-500 to-pink-600"
              />
            </div>
          </motion.div>

          {/* صافي التدفق */}
          <motion.div variants={fadeInUp}>
            <TrendCard
              title="صافي التدفق النقدي"
              currentValue={summary?.net_cash_flow || 0}
              previousValue={summary?.opening_balance || 0}
              format={(v) => formatCurrency(v)}
              positiveIsGood={true}
              icon={<ArrowUpDown className="h-5 w-5" />}
            />
          </motion.div>

          {/* التبويبات */}
          <motion.div variants={fadeInUp}>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="inflows" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  الإيداعات
                </TabsTrigger>
                <TabsTrigger value="outflows" className="gap-2">
                  <TrendingDown className="h-4 w-4" />
                  المسحوبات
                </TabsTrigger>
                <TabsTrigger value="movements" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  الحركات
                </TabsTrigger>
                <TabsTrigger value="balances" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  الأرصدة
                </TabsTrigger>
              </TabsList>

              {/* نظرة عامة */}
              <TabsContent value="overview" className="space-y-6">
                {/* رسم اتجاه التدفق النقدي */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      اتجاه التدفق النقدي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ComboChart
                      data={trend || []}
                      xKey="period"
                      series={[
                        { key: 'inflows', name: 'الإيداعات', color: '#10b981', type: 'bar' },
                        { key: 'outflows', name: 'المسحوبات', color: '#ef4444', type: 'bar' },
                        { key: 'balance', name: 'الرصيد', color: '#8b5cf6', type: 'line', yAxisId: 'right' },
                      ]}
                      height={350}
                      formatLeftAxis={(v) => formatCurrency(v)}
                      formatRightAxis={(v) => formatCurrency(v)}
                    />
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* توزيع الإيداعات */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        مصادر الإيداعات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PieChartComponent
                        data={inflowsChartData}
                        nameKey="name"
                        valueKey="value"
                        height={280}
                        formatValue={(v) => formatCurrency(v)}
                        showLegend
                      />
                    </CardContent>
                  </Card>

                  {/* توزيع المسحوبات */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        أوجه الصرف
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PieChartComponent
                        data={outflowsChartData}
                        nameKey="name"
                        valueKey="value"
                        height={280}
                        formatValue={(v) => formatCurrency(v)}
                        showLegend
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* الإيداعات */}
              <TabsContent value="inflows" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>تفاصيل الإيداعات حسب المصدر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChartComponent
                      data={inflows}
                      xKey="category"
                      yKeys={[
                        { key: 'amount', name: 'المبلغ', color: '#10b981' },
                      ]}
                      height={350}
                      formatValue={(v) => formatCurrency(v)}
                    />
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {inflows.map((item: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{item.category}</span>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {item.transaction_count} حركة
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          +{formatCurrency(item.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.percentage?.toFixed(1)}% من الإجمالي
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* المسحوبات */}
              <TabsContent value="outflows" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>تفاصيل المسحوبات حسب الفئة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChartComponent
                      data={outflows}
                      xKey="category"
                      yKeys={[
                        { key: 'amount', name: 'المبلغ', color: '#ef4444' },
                      ]}
                      height={350}
                      formatValue={(v) => formatCurrency(v)}
                    />
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {outflows.map((item: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{item.category}</span>
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            {item.transaction_count} حركة
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                          -{formatCurrency(item.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.percentage?.toFixed(1)}% من الإجمالي
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* الحركات */}
              <TabsContent value="movements">
                <ReportTable
                  title="الحركات النقدية"
                  columns={movementColumns}
                  data={(movements || []) as any}
                  emptyMessage="لا توجد حركات نقدية"
                />
              </TabsContent>

              {/* الأرصدة */}
              <TabsContent value="balances">
                <ReportTable
                  title="أرصدة الخزائن"
                  columns={balanceColumns}
                  data={balanceBySource || []}
                  emptyMessage="لا توجد خزائن"
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default CashflowReportsPage;
