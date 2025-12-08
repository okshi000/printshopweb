'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  TrendingUp, TrendingDown, DollarSign, Receipt,
  Calendar as CalendarIcon, ArrowUp, ArrowDown, Minus, BarChart3,
  PieChart, LineChart, Activity
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn, formatCurrency, fadeInUp, staggerContainer } from '@/lib/utils'
import { reportsApi } from '../api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  gradient: string
}

function StatCard({ title, value, change, icon, gradient }: StatCardProps) {
  return (
    <motion.div variants={fadeInUp}>
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {change !== undefined && (
                <div className={cn(
                  'flex items-center gap-1 mt-2 text-sm',
                  change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  {change > 0 ? <ArrowUp className="h-4 w-4" /> : change < 0 ? <ArrowDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  <span>{Math.abs(change)}% عن الفترة السابقة</span>
                </div>
              )}
            </div>
            <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', gradient)}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [period, setPeriod] = useState('month')

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['reports-stats', dateRange],
    queryFn: async () => {
      const res = await reportsApi.getStats({
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      })
      return res.data.data || res.data
    },
  })

  const { data: salesChart, isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ['reports-sales', dateRange],
    queryFn: async () => {
      const res = await reportsApi.getSalesChart({
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      })
      return res.data.data || res.data
    },
  })

  const { data: productsChart } = useQuery({
    queryKey: ['reports-products', dateRange],
    queryFn: async () => {
      const res = await reportsApi.getTopProducts({
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      })
      return res.data.data || res.data
    },
  })

  const { data: expensesChart } = useQuery({
    queryKey: ['reports-expenses', dateRange],
    queryFn: async () => {
      const res = await reportsApi.getExpensesChart({
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      })
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

  if (statsError || salesError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل التقارير</h3>
        <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل البيانات</p>
        <Button onClick={() => refetchStats()}>إعادة المحاولة</Button>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">التقارير والإحصائيات</h1>
            <p className="text-sm text-muted-foreground">تحليل شامل للأداء المالي والتشغيلي</p>
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
            title="إجمالي المبيعات"
            value={formatCurrency(stats?.revenue || 0)}
            change={stats?.revenue_change}
            icon={<DollarSign className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <StatCard
            title="عدد الفواتير"
            value={salesChart?.length || 0}
            change={0}
            icon={<Receipt className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          <StatCard
            title="إجمالي المصروفات"
            value={formatCurrency(stats?.expenses || 0)}
            change={stats?.expenses_change}
            icon={<TrendingDown className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-red-500 to-rose-600"
          />
          <StatCard
            title="صافي الربح"
            value={formatCurrency(stats?.profit || 0)}
            change={stats?.profit_change}
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-purple-500 to-pink-600"
          />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                تطور المبيعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <Skeleton className="h-80" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={salesChart || []}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [formatCurrency(value), 'المبيعات']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fill="url(#salesGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Products Pie Chart */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                أكثر المنتجات مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <RePieChart>
                  <Pie
                    data={productsChart || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {(productsChart || []).map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [formatCurrency(value), 'المبيعات']}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expenses Bar Chart */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                المصروفات حسب الفئة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={expensesChart || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [formatCurrency(value), 'المصروفات']}
                  />
                  <Bar dataKey="amount" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Stats */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                ملخص الفترة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">عملاء جدد</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats?.new_customers || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">فواتير مكتملة</p>
                  <p className="text-2xl font-bold text-blue-600">{stats?.completed_invoices || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">المستحقات</p>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats?.receivables || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">متوسط الفاتورة</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats?.avg_invoice || 0)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">أفضل العملاء</h4>
                <div className="space-y-2">
                  {(stats?.top_customers || []).slice(0, 5).map((customer: { name: string; total: number }, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                          {idx + 1}
                        </Badge>
                        <span className="text-sm">{customer.name}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(customer.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
