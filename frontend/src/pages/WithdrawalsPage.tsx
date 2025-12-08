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
import { Plus, Trash2, Wallet, Loader2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react'
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
import { cn, formatCurrency, formatDateTime, fadeInUp, staggerContainer } from '@/lib/utils'
import { withdrawalsApi } from '../api'
import type { Withdrawal } from '../types'
import { useAuth } from '../contexts/AuthContext'

const withdrawalSchema = z.object({
  withdrawn_by: z.string().min(1, 'من قام بالسحب مطلوب'),
  amount: z.coerce.number().min(1, 'المبلغ يجب أن يكون أكبر من صفر'),
  payment_method: z.enum(['cash', 'bank']),
  withdrawal_date: z.date(),
  notes: z.string().optional(),
})

export default function WithdrawalsPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: withdrawals, isLoading, error } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const res = await withdrawalsApi.list()
      return res.data.data || res.data
    },
  })

  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { withdrawn_by: '', amount: 0, payment_method: 'cash', withdrawal_date: new Date(), notes: '' },
  })

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof withdrawalSchema>) => withdrawalsApi.create({
      withdrawn_by: data.withdrawn_by,
      amount: data.amount,
      payment_method: data.payment_method,
      withdrawal_date: format(data.withdrawal_date, 'yyyy-MM-dd'),
      notes: data.notes || '',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setModalOpen(false)
      form.reset()
      toast.success('تم تسجيل السحب بنجاح')
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل تسجيل السحب'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => withdrawalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      toast.success('تم حذف السحب بنجاح')
    },
    onError: () => toast.error('فشل حذف السحب'),
  })

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا السحب؟')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-destructive">
        <AlertCircle className="h-12 w-12" />
        <p>فشل تحميل السحوبات</p>
      </div>
    )
  }

  const sourceLabels: Record<string, string> = { cash: 'الخزينة', bank: 'البنك' }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">السحوبات</h1>
            <p className="text-sm text-muted-foreground">إدارة عمليات السحب من الخزينة</p>
          </div>
        </div>
        {hasPermission('create withdrawals') && (
          <Button onClick={() => { form.reset(); setModalOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> سحب جديد
          </Button>
        )}
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">قائمة السحوبات</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>المصدر</TableHead>
                  <TableHead>السبب</TableHead>
                  <TableHead>بواسطة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {withdrawals?.map((withdrawal: Withdrawal, index: number) => (
                    <motion.tr
                      key={withdrawal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{formatDateTime(withdrawal.created_at || new Date().toISOString())}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-red-600">{formatCurrency(parseFloat(String(withdrawal.amount)))}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(withdrawal.source || 'cash') === 'cash' ? 'default' : 'secondary'} className={cn(
                          (withdrawal.source || 'cash') === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {sourceLabels[withdrawal.source || 'cash'] || withdrawal.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{withdrawal.reason}</TableCell>
                      <TableCell>{withdrawal.user?.name || '-'}</TableCell>
                      <TableCell>
                        {hasPermission('delete withdrawals') && (
                          <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(withdrawal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            {withdrawals?.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">لا توجد سحوبات</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>سحب جديد</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label>من قام بالسحب *</Label>
              <Input {...form.register('withdrawn_by')} placeholder="اسم الشخص" />
              {form.formState.errors.withdrawn_by && (
                <p className="text-sm text-destructive">{form.formState.errors.withdrawn_by.message}</p>
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
              <Label>طريقة الدفع *</Label>
              <Select value={form.watch('payment_method')} onValueChange={(v) => form.setValue('payment_method', v as 'cash' | 'bank')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي (الخزينة)</SelectItem>
                  <SelectItem value="bank">بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تاريخ السحب *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-right font-normal')}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {form.watch('withdrawal_date') ? format(form.watch('withdrawal_date'), 'PPP', { locale: ar }) : 'اختر تاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('withdrawal_date') || undefined}
                    onSelect={(date) => form.setValue('withdrawal_date', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea {...form.register('notes')} placeholder="ملاحظات إضافية (اختياري)" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
              <Button type="submit" variant="destructive" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                سحب
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
