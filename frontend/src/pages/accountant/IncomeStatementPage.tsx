'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import {
  FileText, TrendingUp, TrendingDown, DollarSign, Printer, Calendar as CalendarIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn, formatCurrency, fadeInUp, staggerContainer } from '@/lib/utils'
import { accountantApi } from '../../api'

interface IncomeStatementData {
  revenue: {
    sales: number
    other_income: number
    total: number
  }
  expenses: {
    categories: { name: string; amount: number }[]
    total: number
  }
  gross_profit: number
  net_profit: number
  profit_margin: number
}

export default function IncomeStatementPage() {
  const isMobile = useIsMobile();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [period, setPeriod] = useState('month')

  const { data: statement, isLoading, error } = useQuery<IncomeStatementData>({
    queryKey: ['income-statement', dateRange],
    queryFn: async () => {
      const res = await accountantApi.getIncomeStatement({
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

  const handlePrint = () => {
    window.print()
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل قائمة الدخل</h3>
        <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل البيانات</p>
        <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">قائمة الدخل</h1>
            <p className="text-sm text-muted-foreground">
              {format(dateRange.from, 'dd MMMM yyyy', { locale: ar })} - {format(dateRange.to, 'dd MMMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">شهري</SelectItem>
              <SelectItem value="quarter">ربع سنوي</SelectItem>
              <SelectItem value="year">سنوي</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                تخصيص
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                numberOfMonths={isMobile ? 1 : 2}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> طباعة
          </Button>
        </div>
      </motion.div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-3xl font-bold">مطبعة الأمل</h1>
        <h2 className="text-xl mt-2">قائمة الدخل</h2>
        <p className="text-muted-foreground mt-1">
          للفترة من {format(dateRange.from, 'dd/MM/yyyy')} إلى {format(dateRange.to, 'dd/MM/yyyy')}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue Section */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="bg-gradient-to-l from-emerald-50 to-transparent dark:from-emerald-950 print:bg-gray-100">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                  الإيرادات
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">إيرادات المبيعات</TableCell>
                      <TableCell className="text-left">{formatCurrency(statement?.revenue.sales || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">إيرادات أخرى</TableCell>
                      <TableCell className="text-left">{formatCurrency(statement?.revenue.other_income || 0)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-emerald-50 dark:bg-emerald-950 print:bg-gray-100">
                      <TableCell className="font-bold">إجمالي الإيرادات</TableCell>
                      <TableCell className="text-left text-lg font-bold text-emerald-600">
                        {formatCurrency(statement?.revenue.total || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          {/* Expenses Section */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="bg-gradient-to-l from-red-50 to-transparent dark:from-red-950 print:bg-gray-100">
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <TrendingDown className="h-5 w-5" />
                  المصروفات
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>البند</TableHead>
                      <TableHead className="text-left">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statement?.expenses.categories.map((category, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-left">{formatCurrency(category.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-red-50 dark:bg-red-950 print:bg-gray-100">
                      <TableCell className="font-bold">إجمالي المصروفات</TableCell>
                      <TableCell className="text-left text-lg font-bold text-red-600">
                        {formatCurrency(statement?.expenses.total || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary Section */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="bg-gradient-to-l from-blue-50 to-transparent dark:from-blue-950 print:bg-gray-100">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <DollarSign className="h-5 w-5" />
                  ملخص الأرباح
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">إجمالي الربح</TableCell>
                      <TableCell className="text-left font-medium">
                        {formatCurrency(statement?.gross_profit || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-gradient-to-l from-emerald-100 to-emerald-50 dark:from-emerald-900 dark:to-emerald-950 print:bg-gray-200">
                      <TableCell className="font-bold text-lg">صافي الربح</TableCell>
                      <TableCell className={cn(
                        'text-left text-2xl font-bold',
                        (statement?.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {formatCurrency(statement?.net_profit || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">هامش الربح</TableCell>
                      <TableCell className={cn(
                        'text-left font-bold',
                        (statement?.profit_margin || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {(statement?.profit_margin || 0).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          {/* Visual Summary */}
          <motion.div variants={fadeInUp} className="grid gap-4 sm:grid-cols-3 print:hidden">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-emerald-600" />
                <p className="text-sm text-muted-foreground mt-2">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(statement?.revenue.total || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200">
              <CardContent className="pt-6 text-center">
                <TrendingDown className="h-8 w-8 mx-auto text-red-600" />
                <p className="text-sm text-muted-foreground mt-2">إجمالي المصروفات</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(statement?.expenses.total || 0)}</p>
              </CardContent>
            </Card>
            <Card className={cn(
              'border-2',
              (statement?.net_profit || 0) >= 0
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200'
                : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200'
            )}>
              <CardContent className="pt-6 text-center">
                <DollarSign className={cn('h-8 w-8 mx-auto', (statement?.net_profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600')} />
                <p className="text-sm text-muted-foreground mt-2">صافي الربح</p>
                <p className={cn('text-2xl font-bold', (statement?.net_profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600')}>
                  {formatCurrency(statement?.net_profit || 0)}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Print Footer */}
      <div className="hidden print:block text-center mt-8 pt-4 border-t text-sm text-muted-foreground">
        <p>تم إنشاء هذا التقرير في {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </div>
    </motion.div>
  )
}
