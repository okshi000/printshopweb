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
import { 
  Plus, Banknote, Loader2, Calendar as CalendarIcon, 
  Users, Eye, Pencil, Trash2, Building2, Wallet, ChevronLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn, formatCurrency, formatDate, fadeInUp, staggerContainer } from '@/lib/utils'
import { debtsApi, debtAccountsApi } from '../api'
import type { Debt, DebtAccount } from '../types'
import { useAuth } from '../contexts/AuthContext'

// Schemas
const accountSchema = z.object({
  name: z.string().min(1, 'اسم الحساب مطلوب'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

const debtSchema = z.object({
  debt_account_id: z.number().nullable(),
  debtor_name: z.string().min(1, 'اسم المدين مطلوب'),
  source: z.enum(['cash', 'bank']),
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
  const [activeTab, setActiveTab] = useState('accounts')
  const [page, setPage] = useState(1)
  const [debtsPage, setDebtsPage] = useState(1)
  
  // Modal states
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<DebtAccount | null>(null)
  const [viewingAccount, setViewingAccount] = useState<DebtAccount | null>(null)
  const [debtModalOpen, setDebtModalOpen] = useState(false)
  const [repayModalOpen, setRepayModalOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [deleteAccountId, setDeleteAccountId] = useState<number | null>(null)

  // Queries
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['debt-accounts', page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 10 }
      const res = await debtAccountsApi.list(params)
      return res.data
    },
  })

  const accounts = accountsData?.data || []

  const { data: allAccounts } = useQuery({
    queryKey: ['debt-accounts-all'],
    queryFn: async () => {
      const res = await debtAccountsApi.all()
      return res.data
    },
  })

  const { data: debtsData, isLoading: debtsLoading } = useQuery({
    queryKey: ['debts', debtsPage],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: debtsPage, per_page: 10 }
      const res = await debtsApi.list(params)
      return res.data
    },
  })

  const debts = debtsData?.data || []

  const { data: accountDetails, isLoading: accountDetailsLoading } = useQuery({
    queryKey: ['debt-account', viewingAccount?.id],
    queryFn: async () => {
      if (!viewingAccount?.id) return null
      const res = await debtAccountsApi.get(viewingAccount.id)
      return res.data
    },
    enabled: !!viewingAccount?.id,
  })

  // Forms
  const accountForm = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: '', phone: '', notes: '' },
  })

  const debtForm = useForm<z.infer<typeof debtSchema>>({
    resolver: zodResolver(debtSchema),
    defaultValues: { 
      debt_account_id: null, 
      debtor_name: '', 
      source: 'cash', 
      amount: 0, 
      debt_date: new Date(), 
      notes: '', 
      due_date: null 
    },
  })

  const repayForm = useForm({
    resolver: zodResolver(repaySchema),
    defaultValues: { amount: 0, payment_method: 'cash', notes: '' },
  })

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: (data: z.infer<typeof accountSchema>) => debtAccountsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['debt-accounts-all'] })
      setAccountModalOpen(false)
      accountForm.reset()
      toast.success('تم إنشاء الحساب بنجاح')
    },
    onError: () => toast.error('فشل إنشاء الحساب'),
  })

  const updateAccountMutation = useMutation({
    mutationFn: (data: z.infer<typeof accountSchema>) => 
      debtAccountsApi.update(editingAccount!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['debt-accounts-all'] })
      setAccountModalOpen(false)
      setEditingAccount(null)
      accountForm.reset()
      toast.success('تم تحديث الحساب بنجاح')
    },
    onError: () => toast.error('فشل تحديث الحساب'),
  })

  const deleteAccountMutation = useMutation({
    mutationFn: (id: number) => debtAccountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['debt-accounts-all'] })
      setDeleteAccountId(null)
      toast.success('تم حذف الحساب بنجاح')
    },
    onError: () => toast.error('فشل حذف الحساب - تأكد من عدم وجود ديون غير مسددة'),
  })

  const createDebtMutation = useMutation({
    mutationFn: (data: z.infer<typeof debtSchema>) => debtsApi.create({
      debt_account_id: data.debt_account_id,
      debtor_name: data.debtor_name,
      source: data.source,
      amount: data.amount,
      debt_date: format(data.debt_date, 'yyyy-MM-dd'),
      notes: data.notes || '',
      due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['debt-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['debt-account'] })
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setDebtModalOpen(false)
      debtForm.reset()
      toast.success('تم إضافة الدين بنجاح')
    },
    onError: () => toast.error('فشل إضافة الدين'),
  })

  const repayMutation = useMutation({
    mutationFn: (data: z.infer<typeof repaySchema>) => debtsApi.repay(selectedDebt!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['debt-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['debt-account'] })
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setRepayModalOpen(false)
      setSelectedDebt(null)
      repayForm.reset()
      toast.success('تم تسجيل السداد بنجاح')
    },
    onError: () => toast.error('فشل تسجيل السداد'),
  })

  // Handlers
  const handleEditAccount = (account: DebtAccount) => {
    setEditingAccount(account)
    accountForm.reset({
      name: account.name,
      phone: account.phone || '',
      notes: account.notes || '',
    })
    setAccountModalOpen(true)
  }

  const handleAddDebtToAccount = (account: DebtAccount) => {
    debtForm.reset({
      debt_account_id: account.id,
      debtor_name: account.name,
      source: 'cash',
      amount: 0,
      debt_date: new Date(),
      notes: '',
      due_date: null,
    })
    setDebtModalOpen(true)
  }

  const handleRepay = (debt: Debt) => {
    setSelectedDebt(debt)
    repayForm.reset()
    setRepayModalOpen(true)
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }

  const statusLabels: Record<string, string> = {
    pending: 'معلق', partial: 'مدفوع جزئياً', paid: 'مدفوع',
  }

  if (accountsLoading || debtsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
            <Banknote className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الديون والسلف</h1>
            <p className="text-sm text-muted-foreground">إدارة حسابات الديون والسداد</p>
          </div>
        </div>
      </motion.div>

      {/* Account Details View */}
      {viewingAccount ? (
        <motion.div variants={fadeInUp} className="space-y-4">
          <Button 
            variant="ghost" 
            className="gap-2"
            onClick={() => setViewingAccount(null)}
          >
            <ChevronLeft className="h-4 w-4" />
            العودة للحسابات
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{viewingAccount.name}</CardTitle>
                  <CardDescription>
                    {viewingAccount.phone && <span className="ml-4">📞 {viewingAccount.phone}</span>}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {hasPermission('debts.manage') && (
                    <Button onClick={() => handleAddDebtToAccount(viewingAccount)} className="gap-2">
                      <Plus className="h-4 w-4" /> إضافة دين
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-red-50 dark:bg-red-900/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">إجمالي الديون</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(accountDetails?.total_debt || viewingAccount.total_debt)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-900/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">إجمالي المدفوع</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(accountDetails?.total_paid || viewingAccount.total_paid)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-900/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">الرصيد المتبقي</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(accountDetails?.balance || viewingAccount.balance)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Account Debts */}
              <h3 className="font-semibold mb-4">سجل الديون</h3>
              {accountDetailsLoading ? (
                <Skeleton className="h-48" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">المصدر</TableHead>
                      <TableHead className="text-right">المدفوع</TableHead>
                      <TableHead className="text-right">المتبقي</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountDetails?.debts?.map((debt: Debt) => {
                      const total = parseFloat(String(debt.amount || '0'))
                      const paid = parseFloat(String(debt.paid_amount || '0'))
                      const remaining = total - paid
                      return (
                        <TableRow key={debt.id}>
                          <TableCell className="font-medium">{formatCurrency(total)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={debt.source === 'bank' ? 'border-blue-500 text-blue-500' : 'border-green-500 text-green-500'}>
                              {debt.source === 'bank' ? (
                                <><Building2 className="h-3 w-3 ml-1" /> البنك</>
                              ) : (
                                <><Wallet className="h-3 w-3 ml-1" /> الكاش</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-green-600">{formatCurrency(paid)}</TableCell>
                          <TableCell className={cn('font-semibold', remaining > 0 ? 'text-red-600' : 'text-green-600')}>
                            {formatCurrency(remaining)}
                          </TableCell>
                          <TableCell>{formatDate(debt.debt_date)}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[debt.status || 'pending']}>
                              {statusLabels[debt.status || 'pending']}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {hasPermission('debts.manage') && remaining > 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-1 text-emerald-600 hover:bg-emerald-50" 
                                onClick={() => handleRepay(debt)}
                              >
                                <Banknote className="h-4 w-4" /> سداد
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
              {(!accountDetails?.debts || accountDetails.debts.length === 0) && !accountDetailsLoading && (
                <div className="py-8 text-center text-muted-foreground">
                  لا توجد ديون مسجلة لهذا الحساب
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Main Tabs View */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="accounts" className="gap-2">
              <Users className="h-4 w-4" /> حسابات الديون
            </TabsTrigger>
            <TabsTrigger value="debts" className="gap-2">
              <Banknote className="h-4 w-4" /> كل الديون
            </TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">حسابات الديون</CardTitle>
                  {hasPermission('debts.manage') && (
                    <Button onClick={() => { setEditingAccount(null); accountForm.reset(); setAccountModalOpen(true) }} className="gap-2">
                      <Plus className="h-4 w-4" /> حساب جديد
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم الحساب</TableHead>
                        <TableHead className="text-right">الهاتف</TableHead>
                        <TableHead className="text-right">إجمالي الديون</TableHead>
                        <TableHead className="text-right">المدفوع</TableHead>
                        <TableHead className="text-right">المتبقي</TableHead>
                        <TableHead className="text-right">عدد الديون</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {accounts?.map((account: DebtAccount, index: number) => (
                          <motion.tr
                            key={account.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell>{account.phone || '-'}</TableCell>
                            <TableCell className="text-red-600">{formatCurrency(account.total_debt)}</TableCell>
                            <TableCell className="text-green-600">{formatCurrency(account.total_paid)}</TableCell>
                            <TableCell className={cn('font-bold', account.balance > 0 ? 'text-amber-600' : 'text-green-600')}>
                              {formatCurrency(account.balance)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{account.debts_count || 0}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setViewingAccount(account)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleAddDebtToAccount(account)}>
                                  <Plus className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEditAccount(account)}>
                                  <Pencil className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteAccountId(account.id)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                  {/* Pagination for accounts */}
                  {accountsData && accountsData.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        السابق
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        صفحة {accountsData.current_page} من {accountsData.last_page}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(accountsData.last_page, p + 1))}
                        disabled={page === accountsData.last_page}
                      >
                        التالي
                      </Button>
                    </div>
                  )}
                  {(!accounts || accounts.length === 0) && (
                    <div className="py-12 text-center text-muted-foreground">لا توجد حسابات ديون</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* All Debts Tab */}
          <TabsContent value="debts">
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">كل الديون</CardTitle>
                  {hasPermission('debts.manage') && (
                    <Button onClick={() => { debtForm.reset(); setDebtModalOpen(true) }} className="gap-2">
                      <Plus className="h-4 w-4" /> دين جديد
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم المدين</TableHead>
                        <TableHead className="text-right">الحساب</TableHead>
                        <TableHead className="text-right">المصدر</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">المدفوع</TableHead>
                        <TableHead className="text-right">المتبقي</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
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
                              <TableCell className="font-medium">{debt.debtor_name}</TableCell>
                              <TableCell>
                                {debt.debt_account ? (
                                  <Badge variant="secondary">{debt.debt_account.name}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={debt.source === 'bank' ? 'border-blue-500 text-blue-500' : 'border-green-500 text-green-500'}>
                                  {debt.source === 'bank' ? (
                                    <><Building2 className="h-3 w-3 ml-1" /> البنك</>
                                  ) : (
                                    <><Wallet className="h-3 w-3 ml-1" /> الكاش</>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(total)}</TableCell>
                              <TableCell className="text-green-600">{formatCurrency(paid)}</TableCell>
                              <TableCell className={cn('font-semibold', remaining > 0 ? 'text-red-600' : 'text-green-600')}>
                                {formatCurrency(remaining)}
                              </TableCell>
                              <TableCell>{formatDate(debt.debt_date)}</TableCell>
                              <TableCell>
                                <Badge className={statusColors[debt.status || 'pending']}>
                                  {statusLabels[debt.status || 'pending']}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {hasPermission('debts.manage') && remaining > 0 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="gap-1 text-emerald-600 hover:bg-emerald-50" 
                                    onClick={() => handleRepay(debt)}
                                  >
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
                  {/* Pagination for debts */}
                  {debtsData && debtsData.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDebtsPage(p => Math.max(1, p - 1))}
                        disabled={debtsPage === 1}
                      >
                        السابق
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        صفحة {debtsData.current_page} من {debtsData.last_page}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDebtsPage(p => Math.min(debtsData.last_page, p + 1))}
                        disabled={debtsPage === debtsData.last_page}
                      >
                        التالي
                      </Button>
                    </div>
                  )}
                  {(!debts || debts.length === 0) && (
                    <div className="py-12 text-center text-muted-foreground">لا توجد ديون</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      )}

      {/* Account Modal */}
      <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'تعديل حساب' : 'إنشاء حساب جديد'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? 'تعديل بيانات حساب الدين' : 'إنشاء حساب لتسجيل الديون عليه'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={accountForm.handleSubmit((data) => 
            editingAccount ? updateAccountMutation.mutate(data) : createAccountMutation.mutate(data)
          )} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الحساب *</Label>
              <Input {...accountForm.register('name')} placeholder="اسم صاحب الحساب" />
              {accountForm.formState.errors.name && (
                <p className="text-sm text-destructive">{accountForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input {...accountForm.register('phone')} placeholder="رقم الهاتف (اختياري)" />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea {...accountForm.register('notes')} placeholder="ملاحظات إضافية" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setAccountModalOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={createAccountMutation.isPending || updateAccountMutation.isPending}>
                {(createAccountMutation.isPending || updateAccountMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingAccount ? 'تحديث' : 'إنشاء'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Debt Modal */}
      <Dialog open={debtModalOpen} onOpenChange={setDebtModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة دين جديد</DialogTitle>
            <DialogDescription>
              سجل دين جديد من الكاش أو البنك
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={debtForm.handleSubmit((data) => createDebtMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label>الحساب (اختياري)</Label>
              <Select 
                value={debtForm.watch('debt_account_id')?.toString() || 'none'} 
                onValueChange={(v) => {
                  const accountId = v === 'none' ? null : parseInt(v)
                  debtForm.setValue('debt_account_id', accountId)
                  if (accountId) {
                    const account = allAccounts?.find((a: DebtAccount) => a.id === accountId)
                    if (account) {
                      debtForm.setValue('debtor_name', account.name)
                    }
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="اختر حساب أو اتركه فارغ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون حساب</SelectItem>
                  {allAccounts?.map((account: DebtAccount) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>اسم المدين *</Label>
              <Input {...debtForm.register('debtor_name')} placeholder="اسم المدين" />
              {debtForm.formState.errors.debtor_name && (
                <p className="text-sm text-destructive">{debtForm.formState.errors.debtor_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>مصدر الدين *</Label>
              <Select 
                value={debtForm.watch('source')} 
                onValueChange={(v) => debtForm.setValue('source', v as 'cash' | 'bank')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-green-600" />
                      <span>الكاش</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span>البنك</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المبلغ *</Label>
              <Input type="number" min={0} step="0.01" {...debtForm.register('amount')} />
              {debtForm.formState.errors.amount && (
                <p className="text-sm text-destructive">{debtForm.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>تاريخ الدين *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-right font-normal')}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {debtForm.watch('debt_date') ? format(debtForm.watch('debt_date'), 'PPP', { locale: ar }) : 'اختر تاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={debtForm.watch('debt_date') || undefined}
                    onSelect={(date) => debtForm.setValue('debt_date', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Input {...debtForm.register('notes')} placeholder="ملاحظات إضافية" />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الاستحقاق (اختياري)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-right font-normal', !debtForm.watch('due_date') && 'text-muted-foreground')}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {debtForm.watch('due_date') ? format(debtForm.watch('due_date')!, 'PPP', { locale: ar }) : 'اختر تاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={debtForm.watch('due_date') || undefined}
                    onSelect={(date) => debtForm.setValue('due_date', date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDebtModalOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={createDebtMutation.isPending}>
                {createDebtMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                إضافة
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Repay Modal */}
      <Dialog open={repayModalOpen} onOpenChange={setRepayModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سداد دين: {selectedDebt?.debtor_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={repayForm.handleSubmit((data) => repayMutation.mutate(data))} className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">المتبقي:</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(parseFloat(String(selectedDebt?.amount || 0)) - parseFloat(String(selectedDebt?.paid_amount || 0)))}
              </p>
            </div>
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input 
                type="number" 
                min={0} 
                max={parseFloat(String(selectedDebt?.amount || 0)) - parseFloat(String(selectedDebt?.paid_amount || 0))} 
                step="0.01" 
                {...repayForm.register('amount')} 
              />
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={repayForm.watch('payment_method')} onValueChange={(v) => repayForm.setValue('payment_method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-green-600" />
                      <span>نقداً (كاش)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span>تحويل بنكي</span>
                    </div>
                  </SelectItem>
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

      {/* Delete Account Confirmation */}
      <Dialog open={!!deleteAccountId} onOpenChange={() => setDeleteAccountId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>هل أنت متأكد؟</DialogTitle>
            <DialogDescription>
              سيتم حذف هذا الحساب نهائياً. لا يمكن حذف الحساب إذا كان يحتوي على ديون غير مسددة.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteAccountId(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => deleteAccountId && deleteAccountMutation.mutate(deleteAccountId)}
            >
              {deleteAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
