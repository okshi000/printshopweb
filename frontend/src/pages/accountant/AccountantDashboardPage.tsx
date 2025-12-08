'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useState } from 'react'
import {
  Calculator, TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard,
  Calendar as CalendarIcon, ArrowUp, ArrowDown, BarChart3, PieChart
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
                  {change > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  <span>{Math.abs(change)}%</span>
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

  const { data: _expenseChart } = useQuery({
    queryKey: ['accountant-expense-chart', dateRange],
    queryFn: async () => {
      const res = await accountantApi.getExpenseChart({
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
            <p className="text-sm text-muted-foreground">نظرة شاملة على الوضع المالي</p>
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
          />
          <StatCard
            title="النقد المتاح"
            value={formatCurrency(stats?.available_cash || 0)}
            icon={<Wallet className="h-6 w-6 text-white" />}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          />
        </div>
      )}

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
    </motion.div>
  )
}
