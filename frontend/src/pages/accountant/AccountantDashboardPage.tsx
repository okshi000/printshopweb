'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useState } from 'react'
import {
  Calculator, TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard,
  Calendar as CalendarIcon, ArrowUp, ArrowDown, BarChart3, PieChart,
  AlertCircle, CheckCircle, AlertTriangle, Target, Percent, Clock,
  Activity, Package, Receipt
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn, formatCurrency, fadeInUp, staggerContainer } from '@/lib/utils'
import { accountantApi } from '../../api'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  gradient: string
  subtitle?: string
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function StatCard({ title, value, change, icon, gradient, subtitle }: StatCardProps) {
  return (
    <motion.div variants={fadeInUp}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
              {change !== undefined && (
                <div className={cn(
                  'flex items-center gap-1 mt-2 text-sm',
                  change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  {change > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  <span>{Math.abs(change)}% من الفترة السابقة</span>
                </div>
              )}
            </div>
            <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg', gradient)}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// KPI Card Component
function KPICard({ title, value, unit, status, icon, description }: {
  title: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'danger'
  icon: React.ReactNode
  description: string
}) {
  const statusColors = {
    good: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    warning: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    danger: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  }

  const statusIcons = {
    good: <CheckCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    danger: <AlertCircle className="h-4 w-4" />,
  }

  return (
    <motion.div variants={fadeInUp}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={cn('p-2 rounded-lg', statusColors[status])}>
              {icon}
            </div>
            <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', statusColors[status])}>
              {statusIcons[status]}
              <span>{status === 'good' ? 'جيد' : status === 'warning' ? 'تحذير' : 'يحتاج تحسين'}</span>
            </div>
          </div>
          <p className="text-2xl font-bold">{value}{unit}</p>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Health Score Card Component
function HealthScoreCard({ score, status, warnings, recommendations }: {
  score: number
  status: string
  warnings: string[]
  recommendations: string[]
}) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return '#10b981'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          الصحة المالية
        </CardTitle>
        <CardDescription>تقييم شامل للوضع المالي</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={[{ value: score, fill: getScoreColor(score) }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar background dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-bold">{score}</span>
              <span className="text-xs text-muted-foreground">{status}</span>
            </div>
          </div>
          <div className="flex-1">
            {warnings.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-amber-600 mb-1">تحذيرات:</p>
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    {w}
                  </p>
                ))}
              </div>
            )}
            {recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">توصيات:</p>
                {recommendations.map((r, i) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3 text-blue-500" />
                    {r}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AccountantDashboardPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [period, setPeriod] = useState('month')

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['accountant-stats', dateRange],
    queryFn: async () => {
      const res = await accountantApi.getDashboardStats({
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      })
      return res.data.data || res.data
    },
  })

  const { data: revenueChart, error: chartError } = useQuery({
    queryKey: ['accountant-revenue-chart', dateRange],
    queryFn: async () => {
      const res = await accountantApi.getRevenueChart({
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      })
      return res.data.data || res.data
    },
  })

  const { data: expenseChart } = useQuery({
    queryKey: ['accountant-expense-chart', dateRange],
    queryFn: async () => {
      const res = await accountantApi.getExpenseChart({
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      })
      return res.data.data || res.data
    },
  })

  const { data: healthData } = useQuery({
    queryKey: ['accountant-health'],
    queryFn: async () => {
      const res = await accountantApi.getFinancialHealth({})
      return res.data.data || res.data
    },
  })

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    const now = new Date()
    switch (value) {
      case 'week':
        setDateRange({ from: subDays(now, 7), to: now })
        break
      case 'month':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) })
        break
      case 'quarter':
        setDateRange({ from: subDays(now, 90), to: now })
        break
      case 'year':
        setDateRange({ from: subDays(now, 365), to: now })
        break
    }
  }

  // حساب KPI statuses
  const getKPIStatus = (value: number, thresholds: { good: number, warning: number }): 'good' | 'warning' | 'danger' => {
    if (value >= thresholds.good) return 'good'
    if (value >= thresholds.warning) return 'warning'
    return 'danger'
  }

  if (statsError || chartError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calculator className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل بيانات المحاسبة</h3>
        <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل البيانات</p>
        <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">لوحة تحكم المحاسب</h1>
            <p className="text-sm text-muted-foreground">نظرة شاملة على الوضع المالي والتحليلات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">هذا الأسبوع</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="quarter">ربع سنوي</SelectItem>
              <SelectItem value="year">سنوي</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(dateRange.from, 'dd/MM', { locale: ar })} - {format(dateRange.to, 'dd/MM', { locale: ar })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="إجمالي الإيرادات"
            value={formatCurrency(stats?.total_revenue || 0)}
            change={stats?.revenue_change}
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            subtitle={`${stats?.paid_invoices || 0} فاتورة مدفوعة`}
          />
          <StatCard
            title="إجمالي المصروفات"
            value={formatCurrency(stats?.total_expenses || 0)}
            change={stats?.expenses_change}
            icon={<TrendingDown className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-red-500 to-rose-600"
          />
          <StatCard
            title="صافي الربح"
            value={formatCurrency(stats?.net_profit || 0)}
            change={stats?.profit_change}
            icon={<DollarSign className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            subtitle={stats?.kpis ? `هامش الربح: ${stats.kpis.net_profit_margin}%` : undefined}
          />
          <StatCard
            title="النقد المتاح"
            value={formatCurrency(stats?.available_cash || 0)}
            icon={<Wallet className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          />
        </div>
      )}

      {/* KPIs Section */}
      {stats?.kpis && (
        <motion.div variants={fadeInUp}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            مؤشرات الأداء الرئيسية
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="هامش الربح الإجمالي"
              value={stats.kpis.gross_profit_margin || 0}
              unit="%"
              status={getKPIStatus(stats.kpis.gross_profit_margin || 0, { good: 40, warning: 20 })}
              icon={<Percent className="h-5 w-5" />}
              description="نسبة الربح قبل خصم المصروفات"
            />
            <KPICard
              title="هامش الربح الصافي"
              value={stats.kpis.net_profit_margin || 0}
              unit="%"
              status={getKPIStatus(stats.kpis.net_profit_margin || 0, { good: 20, warning: 10 })}
              icon={<DollarSign className="h-5 w-5" />}
              description="نسبة الربح بعد جميع المصروفات"
            />
            <KPICard
              title="نسبة السيولة السريعة"
              value={stats.kpis.quick_ratio || 0}
              unit=""
              status={getKPIStatus(stats.kpis.quick_ratio || 0, { good: 1.5, warning: 1 })}
              icon={<Activity className="h-5 w-5" />}
              description="قدرة تغطية الالتزامات قصيرة الأجل"
            />
            <KPICard
              title="متوسط أيام التحصيل"
              value={stats.kpis.days_payable_outstanding || 0}
              unit=" يوم"
              status={getKPIStatus(30 - (stats.kpis.days_payable_outstanding || 0), { good: 0, warning: -15 })}
              icon={<Clock className="h-5 w-5" />}
              description="متوسط أيام تحصيل الفواتير"
            />
          </div>
        </motion.div>
      )}

      {/* Tabs Section */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="charts">الرسوم البيانية</TabsTrigger>
          <TabsTrigger value="details">التفاصيل</TabsTrigger>
          <TabsTrigger value="health">الصحة المالية</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                الإيرادات والمصروفات
              </CardTitle>
              <CardDescription>مقارنة يومية للإيرادات والمصروفات</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueChart || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number, name: string) => [formatCurrency(value), name === 'revenue' ? 'الإيرادات' : 'المصروفات']}
                  />
                  <Legend formatter={(value) => value === 'revenue' ? 'الإيرادات' : 'المصروفات'} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profit Trend */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                تطور صافي الربح
              </CardTitle>
              <CardDescription>الاتجاه اليومي لصافي الربح</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueChart || []}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [formatCurrency(value), 'صافي الربح']}
                  />
                  <Area type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} fill="url(#profitGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Receivables */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                المستحقات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">مستحقات العملاء</span>
                <span className="font-bold text-blue-600">{formatCurrency(stats?.customer_receivables || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">فواتير غير مدفوعة</span>
                <span className="font-medium">{stats?.unpaid_invoices || 0}</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${stats?.receivables_percentage || 0}%` }} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payables */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                المطلوبات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">مستحقات الموردين</span>
                <span className="font-bold text-red-600">{formatCurrency(stats?.supplier_payables || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ديون مستحقة</span>
                <span className="font-bold text-red-600">{formatCurrency(stats?.outstanding_debts || 0)}</span>
              </div>
              <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${stats?.payables_percentage || 0}%` }} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cash Flow */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" />
                التدفق النقدي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الصندوق</span>
                <span className="font-bold text-emerald-600">{formatCurrency(stats?.cash_balance || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">البنك</span>
                <span className="font-bold text-blue-600">{formatCurrency(stats?.bank_balance || 0)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">الإجمالي</span>
                  <span className="text-xl font-bold text-emerald-600">{formatCurrency(stats?.total_cash || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Expense Breakdown */}
      {expenseChart?.by_type && expenseChart.by_type.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                توزيع المصروفات حسب النوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-8">
                <ResponsiveContainer width="50%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={expenseChart.by_type}
                      dataKey="amount"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ type, percent }) => `${type} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {expenseChart.by_type.map((_: Record<string, unknown>, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {expenseChart.by_type.map((item: { type: string; amount: number }, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm">{item.type || 'غير مصنف'}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Assets & Liabilities */}
          {stats?.assets && (
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-emerald-500" />
                      الأصول
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span>النقد في الصندوق</span>
                      <span className="font-medium">{formatCurrency(stats.assets.cash_balance)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>النقد في البنك</span>
                      <span className="font-medium">{formatCurrency(stats.assets.bank_balance)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>قيمة المخزون</span>
                      <span className="font-medium">{formatCurrency(stats.assets.inventory_value)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>ذمم العملاء</span>
                      <span className="font-medium">{formatCurrency(stats.assets.customer_debts)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>ديون أخرى مستحقة</span>
                      <span className="font-medium">{formatCurrency(stats.assets.other_debts)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-lg">
                      <span className="font-semibold">إجمالي الأصول</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(stats.assets.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-red-500" />
                      الخصوم وحقوق الملكية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span>ذمم الموردين</span>
                      <span className="font-medium text-red-600">{formatCurrency(stats.liabilities.supplier_debts)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b bg-red-50 dark:bg-red-900/20 px-3 rounded-lg">
                      <span className="font-semibold">إجمالي الخصوم</span>
                      <span className="font-bold text-red-600">{formatCurrency(stats.liabilities.total)}</span>
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between py-2 bg-blue-50 dark:bg-blue-900/20 px-3 rounded-lg">
                        <span className="font-semibold">حقوق الملكية</span>
                        <span className="font-bold text-blue-600">{formatCurrency(stats.equity)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Receipt className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">فواتير غير مدفوعة</p>
                    <p className="text-xl font-bold">{stats?.unpaid_invoices || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">فواتير مدفوعة</p>
                    <p className="text-xl font-bold">{stats?.paid_invoices || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Package className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">موردين نشطين</p>
                    <p className="text-xl font-bold">{stats?.active_suppliers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">عملاء لديهم مستحقات</p>
                    <p className="text-xl font-bold">{stats?.customers_with_receivables || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          {healthData ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <HealthScoreCard
                score={healthData.health_score}
                status={healthData.status}
                warnings={healthData.warnings || []}
                recommendations={healthData.recommendations || []}
              />
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      مقاييس الأداء
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">نسبة السيولة</span>
                        <span className="text-sm font-medium">{healthData.metrics?.current_ratio || 0}</span>
                      </div>
                      <Progress value={Math.min((healthData.metrics?.current_ratio || 0) * 33, 100)} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">نمو الإيرادات</span>
                        <span className="text-sm font-medium">{healthData.metrics?.revenue_growth || 0}%</span>
                      </div>
                      <Progress value={Math.max(0, Math.min(healthData.metrics?.revenue_growth || 0, 100))} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">معدل التحصيل</span>
                        <span className="text-sm font-medium">{healthData.metrics?.collection_rate || 0}%</span>
                      </div>
                      <Progress value={healthData.metrics?.collection_rate || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">نسبة المصروفات</span>
                        <span className="text-sm font-medium">{healthData.metrics?.expense_ratio || 0}%</span>
                      </div>
                      <Progress value={100 - (healthData.metrics?.expense_ratio || 0)} className="[&>div]:bg-amber-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Skeleton className="h-64 w-full max-w-2xl" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
