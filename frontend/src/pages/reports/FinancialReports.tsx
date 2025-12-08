import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangeFilter } from '@/components/reports/DateRangeFilter';
import {
  BarChartComponent,
  PieChartComponent,
  AreaChartComponent,
} from '@/components/charts';
import { reportsApi } from '@/api/reports';
import { format } from 'date-fns';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { ReportFilters } from '@/types/reports';

export const FinancialReports: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 6))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const filters: ReportFilters = {
    start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  };

  // Financial Summary
  const { data: summary } = useQuery({
    queryKey: ['financial-summary', filters],
    queryFn: () => reportsApi.financial.getSummary(filters),
  });

  // Revenue by Period
  const { data: revenueByPeriod } = useQuery({
    queryKey: ['revenue-by-period', filters],
    queryFn: () => reportsApi.financial.getRevenueByPeriod(filters),
  });

  // Expense Breakdown
  const { data: expenseBreakdown } = useQuery({
    queryKey: ['expense-breakdown', filters],
    queryFn: () => reportsApi.financial.getExpenseBreakdown(filters),
  });

  // Profit/Loss
  const { data: profitLoss } = useQuery({
    queryKey: ['profit-loss', filters],
    queryFn: () => reportsApi.financial.getProfitLoss(filters),
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
  const revenueData = Array.isArray(revenueByPeriod?.data) ? revenueByPeriod.data : [];
  const expenseData = Array.isArray(expenseBreakdown?.data) ? expenseBreakdown.data : [];
  const profitLossData = profitLoss?.data as Record<string, unknown> | undefined;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">التقارير المالية</h1>
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
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(Number(summaryData?.total_revenue) || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(Number(summaryData?.total_expenses) || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(Number(summaryData?.net_profit) || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Number(summaryData?.net_profit) || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Number(summaryData?.profit_margin) || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">الإيرادات والمصروفات</TabsTrigger>
          <TabsTrigger value="expenses">تفصيل المصروفات</TabsTrigger>
          <TabsTrigger value="profit">الأرباح والخسائر</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإيرادات والمصروفات الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChartComponent
                data={revenueData.map((item: any) => ({
                  period: item.period || '',
                  revenue: item.revenue || 0,
                  expenses: item.expenses || 0,
                  profit: item.profit || 0,
                }))}
                xKey="period"
                yKeys={[
                  { key: 'revenue', name: 'الإيرادات', color: '#10b981' },
                  { key: 'expenses', name: 'المصروفات', color: '#ef4444' },
                  { key: 'profit', name: 'الربح', color: '#3b82f6' },
                ]}
                height={400}
                formatValue={formatCurrency}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>مقارنة الإيرادات والمصروفات</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartComponent
                data={revenueData.map((item: any) => ({
                  period: item.period || '',
                  revenue: item.revenue || 0,
                  expenses: item.expenses || 0,
                }))}
                xKey="period"
                yKeys={[
                  { key: 'revenue', name: 'الإيرادات', color: '#10b981' },
                  { key: 'expenses', name: 'المصروفات', color: '#ef4444' },
                ]}
                height={400}
                formatValue={formatCurrency}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>توزيع المصروفات حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChartComponent
                  data={expenseData.map((item: any) => ({
                    category: item.category || '',
                    amount: item.amount || 0,
                  }))}
                  dataKey="amount"
                  nameKey="category"
                  height={400}
                  formatValue={formatCurrency}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المصروفات حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  data={expenseData.map((item: any) => ({
                    category: item.category || '',
                    amount: item.amount || 0,
                  }))}
                  xKey="category"
                  yKeys={[
                    { key: 'amount', name: 'المبلغ', color: '#ef4444' },
                  ]}
                  height={400}
                  formatValue={formatCurrency}
                  layout="horizontal"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المصروفات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">الفئة</th>
                      <th className="text-right p-2">المبلغ</th>
                      <th className="text-right p-2">النسبة</th>
                      <th className="text-right p-2">العدد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseData.map((item: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.category || ''}</td>
                        <td className="p-2 font-semibold">
                          {formatCurrency(item.amount || 0)}
                        </td>
                        <td className="p-2">{item.percentage || 0}%</td>
                        <td className="p-2">{item.count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>قائمة الدخل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-semibold">إجمالي الإيرادات</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(Number(profitLossData?.total_revenue) || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-semibold">تكلفة البضاعة المباعة</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(Number(profitLossData?.cost_of_goods_sold) || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="font-semibold">إجمالي الربح</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(Number(profitLossData?.gross_profit) || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-semibold">المصروفات التشغيلية</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(Number(profitLossData?.operating_expenses) || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded border-2 border-purple-200">
                  <span className="font-bold text-lg">صافي الربح</span>
                  <span
                    className={`text-xl font-bold ${
                      (Number(profitLossData?.net_profit) || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(Number(profitLossData?.net_profit) || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-semibold">هامش الربح</span>
                  <span className="text-lg font-bold">
                    {Number(profitLossData?.profit_margin) || 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
