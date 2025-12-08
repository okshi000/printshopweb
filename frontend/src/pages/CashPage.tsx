'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Wallet,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  ArrowLeftRight,
  Settings,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, formatCurrency, formatDateTime, fadeInUp, staggerContainer, staggerItem } from '@/lib/utils'
import { cashApi } from '../api'
import type { CashMovement } from '../types'

const adjustSchema = z.object({
  source: z.enum(['cash', 'bank']),
  operation: z.enum(['add', 'subtract']),
  amount: z.coerce.number().min(0.01, 'المبلغ مطلوب'),
  description: z.string().min(1, 'السبب مطلوب'),
})

const transferSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  amount: z.coerce.number().min(1, 'المبلغ مطلوب'),
  description: z.string().optional(),
})

const initialSchema = z.object({
  cash_balance: z.coerce.number().min(0),
  bank_balance: z.coerce.number().min(0),
})

export default function CashPage() {
  const queryClient = useQueryClient()
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [initialModalOpen, setInitialModalOpen] = useState(false)
  const [showAllMovements, setShowAllMovements] = useState(false)

  const { data: balance, isLoading: balanceLoading, error: balanceError } = useQuery({
    queryKey: ['cash', 'balance'],
    queryFn: async () => {
      const res = await cashApi.balance()
      return res.data.data || res.data
    },
  })

  const { data: movements, isLoading: movementsLoading, error: movementsError } = useQuery({
    queryKey: ['cash', 'movements'],
    queryFn: async () => {
      const res = await cashApi.movements()
      return res.data.data || res.data
    },
  })

  const adjustForm = useForm<z.infer<typeof adjustSchema>>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { source: 'cash', operation: 'add', amount: 0, description: '' },
  })

  const transferForm = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: { from: 'cash', to: 'bank', amount: 0, description: '' },
  })

  const initialForm = useForm({
    resolver: zodResolver(initialSchema),
    defaultValues: { cash_balance: 0, bank_balance: 0 },
  })

  const adjustMutation = useMutation({
    mutationFn: (data: z.infer<typeof adjustSchema>) => cashApi.adjust({
      source: data.source,
      amount: data.operation === 'subtract' ? -data.amount : data.amount,
      description: data.description,
    }),
    onSuccess: () => {
      toast.success('تم تعديل الرصيد بنجاح')
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setAdjustModalOpen(false)
      adjustForm.reset()
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل تعديل الرصيد'),
  })

  const transferMutation = useMutation({
    mutationFn: (data: z.infer<typeof transferSchema>) => cashApi.transfer(data),
    onSuccess: () => {
      toast.success('تم التحويل بنجاح')
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setTransferModalOpen(false)
      transferForm.reset()
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل التحويل'),
  })

  const initialMutation = useMutation({
    mutationFn: (data: z.infer<typeof initialSchema>) => cashApi.setInitial(data),
    onSuccess: () => {
      toast.success('تم تعيين الرصيد الافتتاحي')
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setInitialModalOpen(false)
      initialForm.reset()
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل تعيين الرصيد'),
  })

  if (balanceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  if (balanceError || movementsError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل بيانات الخزنة</h3>
        <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل البيانات</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['cash'] })}>
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  const cashBalance = balance?.cash || balance?.cash_balance || 0
  const bankBalance = balance?.bank || balance?.bank_balance || 0
  const totalBalance = cashBalance + bankBalance

  const today = new Date().toISOString().split('T')[0]
  const todayMovements = movements?.filter((m: CashMovement) => {
    const date = new Date(m.created_at || m.movement_date || '').toISOString().split('T')[0]
    return date === today
  }) || []
  
  const todayIn = todayMovements
    .filter((m: CashMovement) => parseFloat(String(m.amount)) > 0)
    .reduce((sum: number, m: CashMovement) => sum + Math.abs(parseFloat(String(m.amount))), 0)
  
  const todayOut = todayMovements
    .filter((m: CashMovement) => parseFloat(String(m.amount)) < 0)
    .reduce((sum: number, m: CashMovement) => sum + Math.abs(parseFloat(String(m.amount))), 0)

  const typeLabels: Record<string, string> = {
    initial: 'رصيد افتتاحي', invoice_payment: 'دفعة فاتورة', expense: 'مصروف',
    withdrawal: 'سحب', supplier_payment: 'دفعة مورد', transfer: 'تحويل',
    adjustment: 'تعديل', debt_repayment: 'سداد دين',
  }

  const balanceCards = [
    { title: 'الكاش', value: cashBalance, icon: Wallet, gradient: 'from-emerald-500 to-green-600' },
    { title: 'المصرف', value: bankBalance, icon: Building2, gradient: 'from-blue-500 to-indigo-600' },
    { title: 'الإجمالي', value: totalBalance, icon: RefreshCw, gradient: 'from-violet-500 to-purple-600' },
  ]

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeInUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">لوحة الخزنة</h1>
            <p className="text-sm text-muted-foreground">إدارة الأرصدة والحركات المالية</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAdjustModalOpen(true)} className="gap-2">
            <Edit className="h-4 w-4" /> تعديل الرصيد
          </Button>
          <Button onClick={() => setTransferModalOpen(true)} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <ArrowLeftRight className="h-4 w-4" /> تحويل
          </Button>
          <Button variant="secondary" onClick={() => setInitialModalOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" /> رصيد افتتاحي
          </Button>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="grid gap-6 md:grid-cols-3">
        {balanceCards.map((card) => (
          <motion.div key={card.title} variants={staggerItem} whileHover={{ scale: 1.02, y: -4 }}>
            <Card className={cn('relative overflow-hidden border-0 bg-gradient-to-br text-white shadow-lg', card.gradient)}>
              <CardContent className="relative p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <card.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-medium opacity-80">{card.title}</p>
                    <p className="text-2xl font-bold">{formatCurrency(card.value)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" /> حركة اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">الإيرادات</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-600">+{formatCurrency(todayIn)}</span>
                </div>
              </div>
              <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">المصروفات</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">-{formatCurrency(todayOut)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">آخر الحركات</CardTitle>
          </CardHeader>
          <CardContent>
            {movementsLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : movements?.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                <AlertCircle className="h-10 w-10" />
                <p>لا توجد حركات مالية</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-[120px]">التاريخ</TableHead>
                      <TableHead className="text-right w-[100px]">النوع</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right w-[100px]">المصدر</TableHead>
                      <TableHead className="text-left w-[120px]">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {movements?.slice(0, showAllMovements ? movements.length : 20).map((movement: CashMovement, index: number) => {
                        const isPositive = parseFloat(String(movement.amount)) > 0
                        const movementType = movement.type || movement.movement_type
                        const sourceLabel = movement.source === 'cash' ? 'الكاش' : 'المصرف'
                        return (
                          <motion.tr
                            key={movement.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell className="font-medium text-right">{formatDateTime(movement.created_at || movement.movement_date || '')}</TableCell>
                            <TableCell className="text-right"><Badge variant="secondary">{typeLabels[movementType] || movementType}</Badge></TableCell>
                            <TableCell className="text-muted-foreground text-right">{movement.description || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {movement.source === 'cash' ? (
                                  <Wallet className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Building2 className="h-4 w-4 text-green-500" />
                                )}
                                <span className="text-sm">{sourceLabel}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-left">
                              <div className="flex items-center justify-start gap-1">
                                {isPositive ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                                <span className={cn('font-semibold', isPositive ? 'text-emerald-600' : 'text-red-600')}>
                                  {isPositive ? '+' : ''}{formatCurrency(parseFloat(String(movement.amount)))}
                                </span>
                              </div>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
                {movements && movements.length > 20 && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllMovements(!showAllMovements)}
                    >
                      {showAllMovements ? 'عرض أقل' : `عرض المزيد (${movements.length - 20})`}
                    </Button>
                  </div>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Adjust Modal */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعديل الرصيد</DialogTitle></DialogHeader>
          <form onSubmit={adjustForm.handleSubmit((data) => adjustMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label>الخزينة</Label>
              <Select value={adjustForm.watch('source')} onValueChange={(v) => adjustForm.setValue('source', v as 'cash' | 'bank')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">الكاش</SelectItem>
                  <SelectItem value="bank">المصرف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>نوع العملية</Label>
              <Select value={adjustForm.watch('operation')} onValueChange={(v) => adjustForm.setValue('operation', v as 'add' | 'subtract')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">إضافة</SelectItem>
                  <SelectItem value="subtract">خصم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input type="number" min={0} {...adjustForm.register('amount')} />
            </div>
            <div className="space-y-2">
              <Label>السبب</Label>
              <Textarea {...adjustForm.register('description')} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setAdjustModalOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تأكيد
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تحويل بين الخزنات</DialogTitle></DialogHeader>
          <form onSubmit={transferForm.handleSubmit((data) => transferMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label>من</Label>
              <Select value={transferForm.watch('from')} onValueChange={(v) => transferForm.setValue('from', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">الكاش</SelectItem>
                  <SelectItem value="bank">المصرف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>إلى</Label>
              <Select value={transferForm.watch('to')} onValueChange={(v) => transferForm.setValue('to', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">الكاش</SelectItem>
                  <SelectItem value="bank">المصرف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input type="number" min={0} {...transferForm.register('amount')} />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea {...transferForm.register('description')} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setTransferModalOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={transferMutation.isPending} className="bg-gradient-to-r from-amber-500 to-orange-500">
                {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تأكيد التحويل
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Initial Balance Modal */}
      <Dialog open={initialModalOpen} onOpenChange={setInitialModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعيين الرصيد الافتتاحي</DialogTitle></DialogHeader>
          <form onSubmit={initialForm.handleSubmit((data) => initialMutation.mutate(data))} className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">تحذير: هذا سيعيد تعيين جميع الأرصدة!</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>رصيد الكاش</Label>
              <Input type="number" min={0} {...initialForm.register('cash_balance')} />
            </div>
            <div className="space-y-2">
              <Label>رصيد المصرف</Label>
              <Input type="number" min={0} {...initialForm.register('bank_balance')} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setInitialModalOpen(false)}>إلغاء</Button>
              <Button type="submit" variant="destructive" disabled={initialMutation.isPending}>
                {initialMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تعيين الرصيد
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
