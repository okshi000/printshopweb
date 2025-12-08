'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Plus, Banknote, Loader2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn, formatCurrency, formatDate, fadeInUp, staggerContainer } from '@/lib/utils'
import { debtsApi } from '../api'
import type { Debt } from '../types'
import { useAuth } from '../contexts/AuthContext'

const debtSchema = z.object({
  debtor_name: z.string().min(1, 'اسم المدين مطلوب'),
  amount: z.coerce.number().min(1, 'المبلغ يجب أن يكون أكبر من صفر'),
  debt_date: z.date(),
  notes: z.string().optional(),
  due_date: z.date().optional().nullable(),
})

const repaySchema = z.object({
  amount: z.coerce.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  payment_method: z.string().min(1),
  notes: z.string().optional(),
})

export default function DebtsPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [repayModalOpen, setRepayModalOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)

  const { data: debts, isLoading, error } = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const res = await debtsApi.list()
      return res.data.data || res.data
    },
  })

  const form = useForm({
    resolver: zodResolver(debtSchema),
    defaultValues: { debtor_name: '', amount: 0, debt_date: new Date(), notes: '', due_date: null as Date | null },
  })

  const repayForm = useForm({
    resolver: zodResolver(repaySchema),
    defaultValues: { amount: 0, payment_method: 'cash', notes: '' },
  })

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof debtSchema>) => debtsApi.create({
      debtor_name: data.debtor_name,
      amount: data.amount,
      debt_date: format(data.debt_date, 'yyyy-MM-dd'),
      notes: data.notes || '',
      due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      setModalOpen(false)
      form.reset()
      toast.success('تم إضافة الدين بنجاح')
    },
    onError: () => toast.error('فشل إضافة الدين'),
  })

  const repayMutation = useMutation({
    mutationFn: (data: z.infer<typeof repaySchema>) => debtsApi.repay(selectedDebt!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      setRepayModalOpen(false)
      setSelectedDebt(null)
      repayForm.reset()
      toast.success('تم تسجيل السداد بنجاح')
    },
    onError: () => toast.error('فشل تسجيل السداد'),
  })

  const handleRepay = (debt: Debt) => {
    setSelectedDebt(debt)
    repayForm.reset()
    setRepayModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-destructive">
        <AlertCircle className="h-12 w-12" />
        <p>فشل تحميل الديون</p>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }

  const statusLabels: Record<string, string> = {
    pending: 'معلق', partial: 'مدفوع جزئياً', paid: 'مدفوع',
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
            <Banknote className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الديون</h1>
            <p className="text-sm text-muted-foreground">إدارة الديون والسداد</p>
          </div>
        </div>
        {hasPermission('create debts') && (
          <Button onClick={() => { form.reset(); setModalOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> إضافة دين
          </Button>
        )}
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">قائمة الديون</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم المدين</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">المبلغ الكلي</TableHead>
                  <TableHead className="text-right">المدفوع</TableHead>
                  <TableHead className="text-right">المتبقي</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                  <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {debts?.map((debt: Debt, index: number) => {
                    const total = parseFloat(String(debt.amount || '0'))
                    const paid = parseFloat(String(debt.paid_amount || '0'))
                    const remaining = total - paid
                    return (
                      <motion.tr
                        key={debt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium text-right">{debt.debtor_name}</TableCell>
                        <TableCell className="text-muted-foreground text-right">{debt.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                        <TableCell className="text-emerald-600 text-right">{formatCurrency(paid)}</TableCell>
                        <TableCell className={cn('font-semibold text-right', remaining > 0 ? 'text-red-600' : 'text-emerald-600')}>
                          {formatCurrency(remaining)}
                        </TableCell>
                        <TableCell className="text-right">{formatDate(debt.debt_date)}</TableCell>
                        <TableCell className="text-right">{debt.due_date ? formatDate(debt.due_date) : '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={statusColors[debt.status || 'pending']}>
                            {statusLabels[debt.status || 'pending'] || debt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {hasPermission('create debt_repayments') && remaining > 0 && (
                            <Button variant="ghost" size="sm" className="gap-1 text-emerald-600 hover:bg-emerald-50" onClick={() => handleRepay(debt)}>
                              <Banknote className="h-4 w-4" /> سداد
                            </Button>
                          )}
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
            {debts?.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">لا توجد ديون</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Debt Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة دين جديد</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المدين *</Label>
              <Input {...form.register('debtor_name')} placeholder="اسم المدين" />
              {form.formState.errors.debtor_name && (
                <p className="text-sm text-destructive">{form.formState.errors.debtor_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>المبلغ *</Label>
              <Input type="number" min={0} step="0.01" {...form.register('amount')} />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>تاريخ الدين *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-right font-normal')}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {form.watch('debt_date') ? format(form.watch('debt_date'), 'PPP', { locale: ar }) : 'اختر تاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('debt_date') || undefined}
                    onSelect={(date) => form.setValue('debt_date', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Input {...form.register('notes')} placeholder="ملاحظات إضافية" />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الاستحقاق (اختياري)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-right font-normal', !form.watch('due_date') && 'text-muted-foreground')}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {form.watch('due_date') ? format(form.watch('due_date')!, 'PPP', { locale: ar }) : 'اختر تاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('due_date') || undefined}
                    onSelect={(date) => form.setValue('due_date', date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                إضافة
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Repay Modal */}
      <Dialog open={repayModalOpen} onOpenChange={setRepayModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>سداد دين: {selectedDebt?.description}</DialogTitle></DialogHeader>
          <form onSubmit={repayForm.handleSubmit((data) => repayMutation.mutate(data))} className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">المتبقي:</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(parseFloat(String(selectedDebt?.amount || 0)) - parseFloat(String(selectedDebt?.paid_amount || 0)))}
              </p>
            </div>
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input type="number" min={0} max={parseFloat(String(selectedDebt?.amount || 0)) - parseFloat(String(selectedDebt?.paid_amount || 0))} step="0.01" {...repayForm.register('amount')} />
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={repayForm.watch('payment_method')} onValueChange={(v) => repayForm.setValue('payment_method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="bank">تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea {...repayForm.register('notes')} placeholder="ملاحظات إضافية" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setRepayModalOpen(false)}>إلغاء</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={repayMutation.isPending}>
                {repayMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                سداد
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
