'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useState } from 'react'
import {
  Scale, Building2, Wallet, TrendingUp, TrendingDown, Printer, Calendar as CalendarIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table, TableBody, TableCell, TableRow,
} from '@/components/ui/table'
import { cn, formatCurrency, fadeInUp, staggerContainer } from '@/lib/utils'
import { accountantApi } from '../../api'

interface BalanceSheetData {
  date: string
  assets: {
    current: {
      cash: number
      bank: number
      receivables: number
      inventory: number
      total: number
    }
    fixed: {
      equipment: number
      furniture: number
      total: number
    }
    total: number
  }
  liabilities: {
    current: {
      payables: number
      debts: number
      total: number
    }
    total: number
  }
  equity: {
    capital: number
    retained_earnings: number
    current_period_profit: number
    total: number
  }
  total_liabilities_equity: number
}

export default function BalanceSheetPage() {
  const [date, setDate] = useState<Date>(new Date())

  const { data: balanceSheet, isLoading, error } = useQuery<BalanceSheetData>({
    queryKey: ['balance-sheet', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await accountantApi.getBalanceSheet({
        date: format(date, 'yyyy-MM-dd'),
      })
      return res.data.data || res.data
    },
  })

  const handlePrint = () => {
    window.print()
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Scale className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل الميزانية</h3>
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الميزانية العمومية</h1>
            <p className="text-sm text-muted-foreground">
              كما في {format(date, 'dd MMMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(date, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
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
        <h2 className="text-xl mt-2">الميزانية العمومية</h2>
        <p className="text-muted-foreground mt-1">كما في {format(date, 'dd/MM/yyyy')}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Assets */}
          <motion.div variants={fadeInUp} className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-l from-blue-50 to-transparent dark:from-blue-950 print:bg-gray-100">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Building2 className="h-5 w-5" />
                  الأصول
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Current Assets */}
                <div className="mb-6">
                  <h4 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    الأصول المتداولة
                  </h4>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="pr-8">النقدية (الصندوق)</TableCell>
                        <TableCell className="text-left">{formatCurrency(balanceSheet?.assets.current.cash || 0)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pr-8">النقدية (البنك)</TableCell>
                        <TableCell className="text-left">{formatCurrency(balanceSheet?.assets.current.bank || 0)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pr-8">ذمم مدينة (العملاء)</TableCell>
                        <TableCell className="text-left">{formatCurrency(balanceSheet?.assets.current.receivables || 0)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pr-8">المخزون</TableCell>
                        <TableCell className="text-left">{formatCurrency(balanceSheet?.assets.current.inventory || 0)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-blue-50 dark:bg-blue-950 print:bg-gray-100">
                        <TableCell className="font-semibold">إجمالي الأصول المتداولة</TableCell>
                        <TableCell className="text-left font-bold text-blue-600">
                          {formatCurrency(balanceSheet?.assets.current.total || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Fixed Assets */}
                <div className="mb-6">
                  <h4 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    الأصول الثابتة
                  </h4>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="pr-8">المعدات والآلات</TableCell>
                        <TableCell className="text-left">{formatCurrency(balanceSheet?.assets.fixed.equipment || 0)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pr-8">الأثاث والتجهيزات</TableCell>
                        <TableCell className="text-left">{formatCurrency(balanceSheet?.assets.fixed.furniture || 0)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-blue-50 dark:bg-blue-950 print:bg-gray-100">
                        <TableCell className="font-semibold">إجمالي الأصول الثابتة</TableCell>
                        <TableCell className="text-left font-bold text-blue-600">
                          {formatCurrency(balanceSheet?.assets.fixed.total || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Total Assets */}
                <div className="border-t-2 pt-4">
                  <div className="flex justify-between items-center bg-gradient-to-l from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-950 p-4 rounded-lg print:bg-gray-200">
                    <span className="text-lg font-bold">إجمالي الأصول</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(balanceSheet?.assets.total || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Liabilities & Equity */}
          <motion.div variants={fadeInUp} className="space-y-6">
            {/* Liabilities */}
            <Card>
              <CardHeader className="bg-gradient-to-l from-red-50 to-transparent dark:from-red-950 print:bg-gray-100">
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <TrendingDown className="h-5 w-5" />
                  الالتزامات
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="mb-4">
                  <h4 className="font-semibold text-muted-foreground mb-3">الالتزامات المتداولة</h4>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="pr-8">ذمم دائنة (الموردين)</TableCell>
                        <TableCell className="text-left">{formatCurrency(balanceSheet?.liabilities.current.payables || 0)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pr-8">قروض وديون</TableCell>
                        <TableCell className="text-left">{formatCurrency(balanceSheet?.liabilities.current.debts || 0)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-red-50 dark:bg-red-950 print:bg-gray-100">
                        <TableCell className="font-semibold">إجمالي الالتزامات</TableCell>
                        <TableCell className="text-left font-bold text-red-600">
                          {formatCurrency(balanceSheet?.liabilities.total || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Equity */}
            <Card>
              <CardHeader className="bg-gradient-to-l from-emerald-50 to-transparent dark:from-emerald-950 print:bg-gray-100">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                  حقوق الملكية
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="pr-8">رأس المال</TableCell>
                      <TableCell className="text-left">{formatCurrency(balanceSheet?.equity.capital || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pr-8">الأرباح المحتجزة</TableCell>
                      <TableCell className="text-left">{formatCurrency(balanceSheet?.equity.retained_earnings || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pr-8">أرباح الفترة الحالية</TableCell>
                      <TableCell className={cn(
                        'text-left',
                        (balanceSheet?.equity.current_period_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {formatCurrency(balanceSheet?.equity.current_period_profit || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-emerald-50 dark:bg-emerald-950 print:bg-gray-100">
                      <TableCell className="font-semibold">إجمالي حقوق الملكية</TableCell>
                      <TableCell className="text-left font-bold text-emerald-600">
                        {formatCurrency(balanceSheet?.equity.total || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Total Liabilities & Equity */}
                <div className="border-t-2 pt-4 mt-6">
                  <div className="flex justify-between items-center bg-gradient-to-l from-purple-100 to-purple-50 dark:from-purple-900 dark:to-purple-950 p-4 rounded-lg print:bg-gray-200">
                    <span className="text-lg font-bold">إجمالي الالتزامات وحقوق الملكية</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {formatCurrency(balanceSheet?.total_liabilities_equity || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Balance Check */}
      {!isLoading && balanceSheet && (
        <motion.div variants={fadeInUp}>
          <Card className={cn(
            'border-2',
            Math.abs((balanceSheet.assets.total || 0) - (balanceSheet.total_liabilities_equity || 0)) < 0.01
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
              : 'border-red-500 bg-red-50 dark:bg-red-950'
          )}>
            <CardContent className="py-4">
              <div className="flex items-center justify-center gap-4">
                <Scale className={cn(
                  'h-6 w-6',
                  Math.abs((balanceSheet.assets.total || 0) - (balanceSheet.total_liabilities_equity || 0)) < 0.01
                    ? 'text-emerald-600'
                    : 'text-red-600'
                )} />
                <span className="text-lg font-semibold">
                  {Math.abs((balanceSheet.assets.total || 0) - (balanceSheet.total_liabilities_equity || 0)) < 0.01
                    ? '✓ الميزانية متوازنة'
                    : '✗ الميزانية غير متوازنة'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Print Footer */}
      <div className="hidden print:block text-center mt-8 pt-4 border-t text-sm text-muted-foreground">
        <p>تم إنشاء هذا التقرير في {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </div>
    </motion.div>
  )
}
