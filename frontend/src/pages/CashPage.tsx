'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
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
  Briefcase,
  CheckCircle2,
  Clock,
  Plus,
  ShieldCheck,
  Inbox,
  UserCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui'
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatCurrency, formatDateTime, fadeInUp, staggerContainer, staggerItem } from '@/lib/utils'
import { cashApi, custodiesApi, expensesApi, usersApi } from '../api'
import type { CashMovement, Custody } from '../types'

// ==================== Zod Validation Schemas ====================
const adjustSchema = z.object({
  source: z.enum(['drawer', 'vault', 'bank']),
  operation: z.enum(['add', 'subtract']),
  amount: z.coerce.number().min(0.01, 'المبلغ مطلوب ويجب أن يكون أكبر من 0'),
  description: z.string().min(1, 'السبب مطلوب'),
})

const transferSchema = z.object({
  from: z.enum(['drawer', 'vault', 'bank']),
  to: z.enum(['drawer', 'vault', 'bank']),
  amount: z.coerce.number().min(0.01, 'المبلغ مطلوب ويجب أن يكون أكبر من 0'),
  notes: z.string().optional(),
}).refine((data) => data.from !== data.to, {
  message: 'يجب اختيار حسابين مختلفين للتحويل',
  path: ['to'],
})

const initialSchema = z.object({
  drawer_balance: z.coerce.number().min(0, 'الرصيد لا يمكن أن يكون سالباً'),
  vault_balance: z.coerce.number().min(0, 'الرصيد لا يمكن أن يكون سالباً'),
  bank_balance: z.coerce.number().min(0, 'الرصيد لا يمكن أن يكون سالباً'),
})

const createCustodySchema = z.object({
  employee_name: z.string().min(1, 'اسم الموظف مطلوب'),
  user_id: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'المبلغ مطلوب ويجب أن يكون أكبر من 0'),
  source: z.enum(['drawer', 'vault', 'bank']).default('drawer'),
  purpose: z.string().optional(),
})

const settleCustodySchema = z.object({
  spent_amount: z.coerce.number().min(0, 'المصروف الفعلي لا يمكن أن يكون سالباً'),
  expense_type_id: z.string().min(1, 'نوع المصروف مطلوب'),
  settlement_notes: z.string().optional(),
})

// ==================== Helper Functions ====================
const getSourceLabel = (source: string) => {
  switch (source) {
    case 'drawer': return 'درج المكتب'
    case 'vault': return 'الخزينة الرئيسية'
    case 'bank': return 'حساب المصرف'
    case 'cash': return 'الكاش'
    default: return source
  }
}

const getSourceBadgeColor = (source: string) => {
  switch (source) {
    case 'drawer': return 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
    case 'vault': return 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
    case 'bank': return 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
}

export default function CashPage() {
  const queryClient = useQueryClient()
  
  // Modals state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [initialModalOpen, setInitialModalOpen] = useState(false)
  const [custodyModalOpen, setCustodyModalOpen] = useState(false)
  const [settleModalOpen, setSettleModalOpen] = useState(false)
  const [selectedCustody, setSelectedCustody] = useState<Custody | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  // Tabs state
  const [activeTab, setActiveTab] = useState<'overview' | 'custodies' | 'movements'>('overview')
  const [custodyStatusFilter, setCustodyStatusFilter] = useState<'open' | 'settled' | 'all'>('open')
  const [custodyPage, setCustodyPage] = useState(1)

  // Movements Filters
  const [movementsPage, setMovementsPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // ==================== Queries ====================
  const { data: balance, isLoading: balanceLoading, error: balanceError } = useQuery({
    queryKey: ['cash', 'balance'],
    queryFn: async () => {
      const res = await cashApi.balance()
      return res.data.data || res.data
    },
  })

  const { data: movements, isLoading: movementsLoading, error: movementsError } = useQuery({
    queryKey: ['cash', 'movements', movementsPage, typeFilter, sourceFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params: any = { page: movementsPage, per_page: 12 }
      if (typeFilter && typeFilter !== 'all') params.movement_type = typeFilter
      if (sourceFilter && sourceFilter !== 'all') params.source = sourceFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const res = await cashApi.movements(params)
      return res.data
    },
  })

  const { data: custodiesData, isLoading: custodiesLoading } = useQuery({
    queryKey: ['custodies', custodyStatusFilter, custodyPage],
    queryFn: async () => {
      const res = await custodiesApi.list({
        status: custodyStatusFilter,
        page: custodyPage,
        per_page: 10,
      })
      return res.data
    },
  })

  const { data: expenseTypes } = useQuery({
    queryKey: ['expense-types'],
    queryFn: async () => {
      const res = await expensesApi.types()
      return res.data.data || res.data
    },
  })

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await usersApi.list()
      return res.data.data || res.data
    },
  })

  // ==================== Forms ====================
  const adjustForm = useForm<z.infer<typeof adjustSchema>>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { source: 'drawer', operation: 'add', amount: 0, description: '' },
  })

  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: { from: 'drawer', to: 'vault', amount: 0, notes: '' },
  })

  const initialForm = useForm<z.infer<typeof initialSchema>>({
    resolver: zodResolver(initialSchema),
    defaultValues: {
      drawer_balance: balance?.drawer_balance ?? 0,
      vault_balance: balance?.vault_balance ?? 0,
      bank_balance: balance?.bank_balance ?? 0,
    },
  })

  const custodyForm = useForm<z.infer<typeof createCustodySchema>>({
    resolver: zodResolver(createCustodySchema),
    defaultValues: { employee_name: '', amount: 0, source: 'drawer', purpose: '' },
  })

  const settleForm = useForm<z.infer<typeof settleCustodySchema>>({
    resolver: zodResolver(settleCustodySchema),
    defaultValues: { spent_amount: 0, expense_type_id: '', settlement_notes: '' },
  })

  // ==================== Mutations ====================
  const adjustMutation = useMutation({
    mutationFn: (data: z.infer<typeof adjustSchema>) => cashApi.adjust({
      source: data.source,
      amount: data.operation === 'subtract' ? -data.amount : data.amount,
      description: data.description,
    }),
    onSuccess: () => {
      toast.success('تم تسوية الرصيد بنجاح')
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setAdjustModalOpen(false)
      adjustForm.reset()
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل تسوية الرصيد'),
  })

  const transferMutation = useMutation({
    mutationFn: (data: z.infer<typeof transferSchema>) => cashApi.transfer(data),
    onSuccess: () => {
      toast.success('تم إجراء التحويل الداخلي بنجاح')
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setTransferModalOpen(false)
      transferForm.reset()
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل التحويل'),
  })

  const initialMutation = useMutation({
    mutationFn: (data: z.infer<typeof initialSchema>) => cashApi.setInitial(data),
    onSuccess: () => {
      toast.success('تم تعيين الأرصدة الافتتاحية بنجاح')
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setInitialModalOpen(false)
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل تعيين الأرصدة'),
  })

  const createCustodyMutation = useMutation({
    mutationFn: (data: z.infer<typeof createCustodySchema>) => custodiesApi.create({
      ...data,
      user_id: data.user_id ? parseInt(data.user_id) : null,
    }),
    onSuccess: () => {
      toast.success('تم صرف العهدة بنجاح وخصمها من رصيد درج المكتب')
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      queryClient.invalidateQueries({ queryKey: ['custodies'] })
      setCustodyModalOpen(false)
      custodyForm.reset()
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل صرف العهدة'),
  })

  const settleCustodyMutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (!selectedCustody) throw new Error('لا توجد عهدة محددة')
      return custodiesApi.settle(selectedCustody.id, formData)
    },
    onSuccess: () => {
      toast.success('تم تسوية العهدة بنجاح وقيد المصروف وإرجاع المتبقي للدرج')
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      queryClient.invalidateQueries({ queryKey: ['custodies'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setSettleModalOpen(false)
      setSelectedCustody(null)
      setReceiptFile(null)
      settleForm.reset()
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل تسوية العهدة'),
  })

  const cancelCustodyMutation = useMutation({
    mutationFn: (custodyId: number) => custodiesApi.delete(custodyId),
    onSuccess: () => {
      toast.success('تم إلغاء العهدة وإعادة كامل المبلغ إلى درج المكتب')
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      queryClient.invalidateQueries({ queryKey: ['custodies'] })
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل إلغاء العهدة'),
  })

  const handleOpenSettle = (custody: Custody) => {
    setSelectedCustody(custody)
    settleForm.reset({
      spent_amount: custody.amount,
      expense_type_id: '',
      settlement_notes: '',
    })
    setReceiptFile(null)
    setSettleModalOpen(true)
  }

  const handleSettleSubmit = (data: z.infer<typeof settleCustodySchema>) => {
    const formData = new FormData()
    formData.append('spent_amount', data.spent_amount.toString())
    formData.append('expense_type_id', data.expense_type_id)
    if (data.settlement_notes) formData.append('settlement_notes', data.settlement_notes)
    if (receiptFile) formData.append('receipt', receiptFile)
    settleCustodyMutation.mutate(formData)
  }

  // ==================== Calculated Values ====================
  const drawerBalance = parseFloat(String(balance?.drawer_balance ?? balance?.cash_balance ?? 0)) || 0
  const vaultBalance = parseFloat(String(balance?.vault_balance ?? 0)) || 0
  const bankBalance = parseFloat(String(balance?.bank_balance ?? balance?.bank ?? 0)) || 0
  const totalBalance = parseFloat(String(balance?.total_balance ?? 0)) || (drawerBalance + vaultBalance + bankBalance)
  const openCustodiesTotal = parseFloat(String(balance?.open_custodies_total ?? custodiesData?.summary?.open_total ?? 0)) || 0
  const openCustodiesCount = parseInt(String(balance?.open_custodies_count ?? custodiesData?.summary?.open_count ?? 0)) || 0

  const incomeTypes = ['income', 'initial', 'invoice_payment', 'debt_repayment', 'custody_return']
  const expenseTypesList = ['expense', 'withdrawal', 'supplier_payment', 'debt_created', 'custody_out']

  const today = new Date().toISOString().split('T')[0]
  const todayMovements = movements?.data?.filter((m: CashMovement) => {
    const date = new Date(m.created_at || m.movement_date || '').toISOString().split('T')[0]
    return date === today
  }) || []
  
  const todayIn = todayMovements
    .filter((m: CashMovement) => incomeTypes.includes(m.type || m.movement_type))
    .reduce((sum: number, m: CashMovement) => sum + Math.abs(parseFloat(String(m.amount))), 0)
  
  const todayOut = todayMovements
    .filter((m: CashMovement) => expenseTypesList.includes(m.type || m.movement_type))
    .reduce((sum: number, m: CashMovement) => sum + Math.abs(parseFloat(String(m.amount))), 0)

  const typeLabels: Record<string, { label: string; color: string }> = {
    initial: { label: 'رصيد افتتاحي', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    income: { label: 'إيراد نقدي', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    invoice_payment: { label: 'دفعة فاتورة', color: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
    expense: { label: 'مصروف', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    withdrawal: { label: 'سحب شخصي', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    supplier_payment: { label: 'دفعة مورد', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
    transfer: { label: 'تحويل داخلي', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
    custody_out: { label: 'صرف عهدة', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
    custody_return: { label: 'إرجاع متبقي عهدة', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
    adjustment: { label: 'تسوية رصيد', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    debt_repayment: { label: 'سداد دين', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' },
    debt_created: { label: 'سلفة / دين', color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
  }

  const balanceCards = [
    {
      title: 'درج المكتب (اليومي)',
      subtitle: 'الحركة اليومية والمشتريات',
      value: drawerBalance,
      icon: Inbox,
      gradient: 'from-emerald-500 to-green-600 shadow-emerald-500/20',
      badge: 'الدرج',
    },
    {
      title: 'الخزينة الرئيسية / المنزل',
      subtitle: 'حفظ السيولة والأمان',
      value: vaultBalance,
      icon: ShieldCheck,
      gradient: 'from-purple-600 to-indigo-700 shadow-purple-600/20',
      badge: 'الخزينة',
    },
    {
      title: 'حساب المصرف',
      subtitle: 'التحويلات والحساب البنكي',
      value: bankBalance,
      icon: Building2,
      gradient: 'from-blue-600 to-cyan-600 shadow-blue-600/20',
      badge: 'البنك',
    },
    {
      title: 'إجمالي السيولة النقدية',
      subtitle: 'مجموع الحسابات الثلاثة',
      value: totalBalance,
      icon: Wallet,
      gradient: 'from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 shadow-slate-900/20',
      badge: 'الإجمالي',
    },
  ]

  if (balanceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </div>
    )
  }

  if (balanceError || movementsError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل بيانات الخزينة</h3>
        <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل البيانات</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['cash'] })}>
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة الخزينة والسيولة النقدية</h1>
            <p className="text-sm text-muted-foreground">أرصدة درج المكتب، الخزينة الرئيسية، المصرف، ونظام عُهد الموظفين</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* New Custody Button */}
          <Button
            onClick={() => setCustodyModalOpen(true)}
            className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm"
          >
            <Briefcase className="h-4 w-4" /> صرف عُهدة موظف
          </Button>

          {/* Internal Transfer Button */}
          <Button
            onClick={() => setTransferModalOpen(true)}
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
          >
            <ArrowLeftRight className="h-4 w-4" /> تحويل داخلي
          </Button>

          {/* Adjust Balance Button */}
          <Button variant="outline" onClick={() => setAdjustModalOpen(true)} className="gap-2">
            <Edit className="h-4 w-4" /> تسوية رصيد
          </Button>

          {/* Initial Balances Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setInitialModalOpen(true)}
            title="تعيين الأرصدة الافتتاحية"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </motion.div>

      {/* 4 Main Balance Cards */}
      <motion.div variants={fadeInUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {balanceCards.map((card) => (
          <motion.div key={card.title} variants={staggerItem} whileHover={{ scale: 1.02, y: -3 }}>
            <Card className={cn('relative overflow-hidden border-0 bg-gradient-to-br text-white shadow-lg', card.gradient)}>
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-white/20 mb-2">
                      {card.badge}
                    </span>
                    <h3 className="text-sm font-medium text-white/90">{card.title}</h3>
                    <p className="text-2xl font-bold mt-1 tracking-tight">{formatCurrency(card.value)}</p>
                    <p className="text-[11px] text-white/75 mt-1">{card.subtitle}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shrink-0">
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Custody Alert Banner */}
      {openCustodiesCount > 0 && (
        <motion.div variants={fadeInUp}>
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-purple-950 dark:text-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 mt-0.5 shrink-0 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="font-semibold text-sm">
                  يوجد {openCustodiesCount} عُهد مفتوحة في أيدي الموظفين بإجمالي: {formatCurrency(openCustodiesTotal)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  هذه المبالغ صُرفت من درج المكتب لشراء مستلزمات المطبعة وبانتظار عودة الموظف بالفاتورة لتسويتها.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5 border-purple-300 text-purple-800 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-200"
              onClick={() => {
                setActiveTab('custodies')
                setCustodyStatusFilter('open')
              }}
            >
              عرض وتسوية العُهد المفتوحة ({openCustodiesCount})
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Tabs Navigation */}
      <motion.div variants={fadeInUp} className="flex border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-5 py-2.5 font-medium text-sm border-b-2 transition-all flex items-center gap-2',
            activeTab === 'overview'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar className="h-4 w-4" />
          <span>ملخص اليوم والحركات</span>
        </button>

        <button
          onClick={() => setActiveTab('custodies')}
          className={cn(
            'px-5 py-2.5 font-medium text-sm border-b-2 transition-all flex items-center gap-2 relative',
            activeTab === 'custodies'
              ? 'border-purple-600 text-purple-700 dark:text-purple-300 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Briefcase className="h-4 w-4" />
          <span>عُهد الموظفين (من الدرج)</span>
          {openCustodiesCount > 0 && (
            <span className="bg-purple-600 text-white rounded-full px-1.5 py-0.2 text-[11px] font-bold">
              {openCustodiesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={cn(
            'px-5 py-2.5 font-medium text-sm border-b-2 transition-all flex items-center gap-2',
            activeTab === 'movements'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <RefreshCw className="h-4 w-4" />
          <span>سجل الحركات المفصل</span>
        </button>
      </motion.div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          {/* Today Activity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">إيرادات اليوم المستلمة</span>
                    <span className="text-lg font-bold text-emerald-600">+{formatCurrency(todayIn)}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">وارد اليوم</Badge>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">مصروفات ومسحوبات اليوم</span>
                    <span className="text-lg font-bold text-red-600">-{formatCurrency(todayOut)}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-red-300 text-red-700">صادر اليوم</Badge>
              </div>
            </div>
          </div>

          {/* Quick Custodies List & Recent Movements */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Custody Summary */}
            <Card className="lg:col-span-1 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-600" />
                    العُهد المفتوحة حالياً
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 text-purple-700"
                    onClick={() => setActiveTab('custodies')}
                  >
                    عرض الكل
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {custodiesLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (custodiesData?.custodies?.data || []).filter((c: Custody) => c.status === 'open').length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-xs space-y-1">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                    <p className="font-semibold text-foreground">لا توجد عُهد مفتوحة حالياً</p>
                    <p>جميع عُهد الموظفين مسواة ومغلقة بالكامل.</p>
                  </div>
                ) : (
                  (custodiesData?.custodies?.data || [])
                    .filter((c: Custody) => c.status === 'open')
                    .slice(0, 4)
                    .map((c: Custody) => (
                      <div key={c.id} className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-sm text-foreground">{c.employee_name}</p>
                          <p className="text-muted-foreground text-[11px] mt-0.5">{c.purpose || 'شراء مستلزمات'}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-purple-700 dark:text-purple-300 text-sm">
                            {formatCurrency(c.amount)}
                          </p>
                          <Button
                            size="sm"
                            className="h-6 text-[11px] px-2 mt-1 bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => handleOpenSettle(c)}
                          >
                            تسوية
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            {/* Recent Movements Preview */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    آخر الحركات المالية
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7"
                    onClick={() => setActiveTab('movements')}
                  >
                    السجل الكامل
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {movementsLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : movements?.data?.length === 0 ? (
                  <p className="text-center py-8 text-sm text-muted-foreground">لا توجد حركات مالية مسجلة</p>
                ) : (
                  <div className="space-y-2">
                    {movements?.data?.slice(0, 6).map((m: CashMovement) => {
                      const typeInfo = typeLabels[m.movement_type] || { label: m.movement_type, color: 'bg-muted' }
                      const isIncome = incomeTypes.includes(m.movement_type)
                      return (
                        <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg border text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'p-1.5 rounded-md',
                              isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            )}>
                              {isIncome ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{m.description || typeInfo.label}</p>
                              <p className="text-[11px] text-muted-foreground">{formatDateTime(m.movement_date || m.created_at || '')}</p>
                            </div>
                          </div>
                          <div className="text-left flex items-center gap-2">
                            <Badge variant="outline" className={cn('text-[10px]', getSourceBadgeColor(m.source))}>
                              {getSourceLabel(m.source)}
                              {m.destination && ` ⬅️ ${getSourceLabel(m.destination)}`}
                            </Badge>
                            <span className={cn('font-bold text-sm', isIncome ? 'text-emerald-600' : 'text-red-600')}>
                              {isIncome ? '+' : '-'}{formatCurrency(Math.abs(m.amount))}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Custodies Management (عُهد الموظفين) */}
      {activeTab === 'custodies' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    نظام عُهد الموظفين (من درج المكتب)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    صرف مبالغ من الدرج للموظفين لشراء مستلزمات المطبعة وتسويتها عند عودتهم بالفواتير وإرجاع الباقي
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border p-1 bg-muted/40">
                    <button
                      onClick={() => { setCustodyStatusFilter('open'); setCustodyPage(1) }}
                      className={cn(
                        'px-3 py-1 text-xs rounded-md font-medium transition-all',
                        custodyStatusFilter === 'open'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      العُهد المفتوحة ({custodiesData?.summary?.open_count ?? 0})
                    </button>
                    <button
                      onClick={() => { setCustodyStatusFilter('settled'); setCustodyPage(1) }}
                      className={cn(
                        'px-3 py-1 text-xs rounded-md font-medium transition-all',
                        custodyStatusFilter === 'settled'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      المسوّاة ({custodiesData?.summary?.settled_count ?? 0})
                    </button>
                    <button
                      onClick={() => { setCustodyStatusFilter('all'); setCustodyPage(1) }}
                      className={cn(
                        'px-3 py-1 text-xs rounded-md font-medium transition-all',
                        custodyStatusFilter === 'all'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      الكل
                    </button>
                  </div>

                  <Button
                    onClick={() => setCustodyModalOpen(true)}
                    className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> صرف عُهدة
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {custodiesLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (custodiesData?.custodies?.data || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Briefcase className="h-12 w-12 text-purple-300 mb-3" />
                  <p className="font-semibold text-foreground">
                    {custodyStatusFilter === 'open' ? 'لا توجد عُهد مفتوحة حالياً' : 'لا توجد عُهد مسجلة'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {custodyStatusFilter === 'open'
                      ? 'جميع العُهد تم تسويتها وإغلاقها بالكامل.'
                      : 'اضغط على زر "صرف عُهدة" لتسليم مبلغ لموظف للشراء.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>الموظف</TableHead>
                        <TableHead>مبلغ العهدة</TableHead>
                        <TableHead>المصروف الفعلي</TableHead>
                        <TableHead>المتبقي للدرج</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الغرض / الملاحظات</TableHead>
                        <TableHead>تاريخ الصرف</TableHead>
                        <TableHead className="text-left">الإجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {custodiesData.custodies.data.map((c: Custody) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="h-4 w-4 text-purple-600" />
                              <span>{c.employee_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-foreground">
                            {formatCurrency(c.amount)}
                          </TableCell>
                          <TableCell>
                            {c.status === 'settled' ? (
                              <span className="font-semibold text-rose-600">
                                {formatCurrency(c.spent_amount)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">قيد الشراء...</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.status === 'settled' ? (
                              <span className="font-semibold text-emerald-600">
                                {formatCurrency(c.returned_amount)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.status === 'open' ? (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 gap-1">
                                <Clock className="h-3 w-3" /> مفتوحة
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 gap-1">
                                <CheckCircle2 className="h-3 w-3" /> مسوّاة ومغلقة
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                            {c.purpose || c.settlement_notes || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTime(c.disbursed_at)}
                          </TableCell>
                          <TableCell className="text-left">
                            {c.status === 'open' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
                                  onClick={() => handleOpenSettle(c)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> تسوية العهدة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                                  onClick={() => {
                                    if (confirm(`هل أنت متأكد من إلغاء عهدة ${c.employee_name} وإعادة كامل المبلغ (${formatCurrency(c.amount)}) إلى درج المكتب؟`)) {
                                      cancelCustodyMutation.mutate(c.id)
                                    }
                                  }}
                                  disabled={cancelCustodyMutation.isPending}
                                >
                                  إلغاء
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                سوّيت في {formatDateTime(c.settled_at || c.updated_at || '')}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {custodiesData?.custodies?.last_page > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={custodiesData.custodies.current_page}
                    totalPages={custodiesData.custodies.last_page}
                    totalItems={custodiesData.custodies.total}
                    perPage={custodiesData.custodies.per_page}
                    onPageChange={setCustodyPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tab 3: Detailed Movements Table */}
      {activeTab === 'movements' && (
        <motion.div variants={fadeInUp}>
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">سجل الحركات المالية المفصل</CardTitle>
              <CardDescription>
                تتبع كافة حركات الإيرادات، المصروفات، التحويلات الداخلية، وصرف العُهد وإرجاعها
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Filters */}
              <div className="mb-6 grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>نوع الحركة</Label>
                  <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setMovementsPage(1) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الأنواع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      <SelectItem value="invoice_payment">دفعة فاتورة</SelectItem>
                      <SelectItem value="expense">مصروف</SelectItem>
                      <SelectItem value="custody_out">صرف عهدة موظف</SelectItem>
                      <SelectItem value="custody_return">إرجاع متبقي عهدة</SelectItem>
                      <SelectItem value="transfer">تحويل داخلي</SelectItem>
                      <SelectItem value="supplier_payment">دفعة مورد</SelectItem>
                      <SelectItem value="withdrawal">سحب شخصي</SelectItem>
                      <SelectItem value="debt_repayment">سداد دين</SelectItem>
                      <SelectItem value="initial">رصيد افتتاحي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الحساب / الخزينة</Label>
                  <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setMovementsPage(1) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الحسابات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحسابات</SelectItem>
                      <SelectItem value="drawer">درج المكتب</SelectItem>
                      <SelectItem value="vault">الخزينة الرئيسية</SelectItem>
                      <SelectItem value="bank">المصرف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setMovementsPage(1) }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setMovementsPage(1) }}
                  />
                </div>
              </div>

              {movementsLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : movements?.data?.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/60" />
                  <p>لا توجد حركات مالية مطابقة للفلاتر</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>التاريخ والوقت</TableHead>
                        <TableHead>نوع الحركة</TableHead>
                        <TableHead>الحساب / المصدر</TableHead>
                        <TableHead>البيان / الوصف</TableHead>
                        <TableHead className="text-left">المبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements?.data?.map((m: CashMovement) => {
                        const typeInfo = typeLabels[m.movement_type] || { label: m.movement_type, color: 'bg-muted' }
                        const isIncome = incomeTypes.includes(m.movement_type)
                        const isTransfer = m.movement_type === 'transfer'

                        return (
                          <TableRow key={m.id}>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {formatDateTime(m.movement_date || m.created_at || '')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('text-xs font-semibold', typeInfo.color)}>
                                {typeInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-xs">
                                <Badge variant="outline" className={getSourceBadgeColor(m.source)}>
                                  {getSourceLabel(m.source)}
                                </Badge>
                                {m.destination && (
                                  <>
                                    <span className="text-muted-foreground">⬅️</span>
                                    <Badge variant="outline" className={getSourceBadgeColor(m.destination)}>
                                      {getSourceLabel(m.destination)}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {m.description || typeInfo.label}
                            </TableCell>
                            <TableCell className="text-left font-bold text-base">
                              <span className={cn(
                                isTransfer ? 'text-indigo-600 dark:text-indigo-400' : (isIncome ? 'text-emerald-600' : 'text-red-600')
                              )}>
                                {!isTransfer && (isIncome ? '+' : '-')}
                                {formatCurrency(Math.abs(m.amount))}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {movements?.last_page > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={movements.current_page}
                    totalPages={movements.last_page}
                    totalItems={movements.total}
                    perPage={movements.per_page}
                    onPageChange={setMovementsPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ==================== Modals ==================== */}

      {/* 1. Modal: صرف عهدة جديدة (New Custody) */}
      <Dialog open={custodyModalOpen} onOpenChange={setCustodyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Briefcase className="h-5 w-5" /> صرف عُهدة للموظف (من درج المكتب)
            </DialogTitle>
            <DialogDescription>
              يتم خصم المبلغ فوراً من رصيد درج المكتب وتسجيله كعهدة مفتوحة لحين عودة الموظف بالفاتورة
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={custodyForm.handleSubmit((data) => createCustodyMutation.mutate(data))} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>اسم الموظف *</Label>
              <div className="space-y-1.5">
                {users && users.length > 0 && (
                  <Select
                    onValueChange={(val) => {
                      const selectedUser = users.find((u: any) => u.id.toString() === val)
                      if (selectedUser) {
                        custodyForm.setValue('employee_name', selectedUser.full_name || selectedUser.name)
                        custodyForm.setValue('user_id', selectedUser.id.toString())
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر موظفاً من النظام (أو اكتب بالأسفل)" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u: any) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.full_name || u.name} ({u.role === 'owner' ? 'المالك' : 'موظف'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  placeholder="أو اكتب اسم الموظف يدوياً..."
                  {...custodyForm.register('employee_name')}
                />
              </div>
              {custodyForm.formState.errors.employee_name && (
                <p className="text-xs text-destructive">{custodyForm.formState.errors.employee_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>المبلغ المصروف (د.ل) *</Label>
                <span className="text-xs text-muted-foreground">رصيد الدرج المتاح: {formatCurrency(drawerBalance)}</span>
              </div>
              <Input
                type="number"
                step="any"
                min="0.01"
                placeholder="مثال: 100"
                className="text-lg font-bold"
                {...custodyForm.register('amount')}
              />
              {custodyForm.formState.errors.amount && (
                <p className="text-xs text-destructive">{custodyForm.formState.errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>الحساب المصروف منه</Label>
              <Select
                value={custodyForm.watch('source')}
                onValueChange={(v) => custodyForm.setValue('source', v as 'drawer' | 'vault' | 'bank')}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="drawer">💵 درج المكتب (الافتراضي للحركة اليومية)</SelectItem>
                  <SelectItem value="vault">🏦 الخزينة الرئيسية</SelectItem>
                  <SelectItem value="bank">💳 حساب المصرف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الغرض من العهدة / بيان المشتريات (اختياري)</Label>
              <Textarea
                placeholder="مثال: شراء أوراق وأحبار ومستلزمات صيانة للمطبعة..."
                {...custodyForm.register('purpose')}
              />
            </div>

            <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3 text-xs text-purple-900 dark:text-purple-200">
              💡 <strong>تنبيه:</strong> سيتم خصم المبلغ فوراً من رصيد درج المكتب. وعند عودة الموظف، ستسجل قيمة الفاتورة كمصروف والمتبقي سيعود تلقائياً للدرج.
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setCustodyModalOpen(false)}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createCustodyMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {createCustodyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تأكيد صرف العهدة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal: تسوية العهدة (Settle Custody) */}
      <Dialog open={settleModalOpen} onOpenChange={setSettleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" /> تسوية عُهدة الموظف
            </DialogTitle>
            <DialogDescription>
              تسجيل الفاتورة في المصروفات وإرجاع المبلغ المتبقي تلقائياً إلى رصيد الدرج
            </DialogDescription>
          </DialogHeader>

          {selectedCustody && (() => {
            const currentSpent = parseFloat(String(settleForm.watch('spent_amount'))) || 0
            const remaining = parseFloat((selectedCustody.amount - currentSpent).toFixed(2))

            return (
              <form onSubmit={settleForm.handleSubmit(handleSettleSubmit)} className="space-y-4 pt-2">
                {/* Custody Info Box */}
                <div className="rounded-xl border bg-muted/30 p-3.5 space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">الموظف:</span>
                    <span className="font-bold text-foreground">{selectedCustody.employee_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">المبلغ المصروف من الدرج:</span>
                    <span className="font-bold text-base text-purple-700 dark:text-purple-300">
                      {formatCurrency(selectedCustody.amount)}
                    </span>
                  </div>
                  {selectedCustody.purpose && (
                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t">
                      <span>الغرض:</span>
                      <span>{selectedCustody.purpose}</span>
                    </div>
                  )}
                </div>

                {/* Spent Amount Field */}
                <div className="space-y-2">
                  <Label>قيمة الفاتورة / المصروف الفعلي (د.ل) *</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="مثال: 80"
                    className="text-lg font-bold"
                    {...settleForm.register('spent_amount')}
                  />
                  {settleForm.formState.errors.spent_amount && (
                    <p className="text-xs text-destructive">{settleForm.formState.errors.spent_amount.message}</p>
                  )}
                </div>

                {/* Expense Type Selection */}
                <div className="space-y-2">
                  <Label>نوع / تصنيف المصروف *</Label>
                  <Select
                    value={settleForm.watch('expense_type_id')}
                    onValueChange={(val) => settleForm.setValue('expense_type_id', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر تصنيف المصروف (أحبار، صيانة، مستلزمات...)" />
                    </SelectTrigger>
                    <SelectContent>
                      {(expenseTypes || []).map((t: any) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {settleForm.formState.errors.expense_type_id && (
                    <p className="text-xs text-destructive">{settleForm.formState.errors.expense_type_id.message}</p>
                  )}
                </div>

                {/* Dynamic Calculated Remainder Banner */}
                <div className={cn(
                  'rounded-xl p-3 border text-sm transition-all',
                  remaining > 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : remaining === 0
                    ? 'bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200'
                    : 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                )}>
                  <div className="flex justify-between items-center font-bold">
                    <span>
                      {remaining > 0 && 'المبلغ المتبقي المرجع للدرج:'}
                      {remaining === 0 && 'المتبقي:'}
                      {remaining < 0 && 'صرف الموظف زيادة (فارق يصرف له):'}
                    </span>
                    <span className="text-base" dir="ltr">
                      {remaining >= 0 ? `+ ${formatCurrency(remaining)}` : `- ${formatCurrency(Math.abs(remaining))}`}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">
                    {remaining > 0 && '✅ سيقوم النظام تلقائياً بإرجاع هذا المبلغ إلى رصيد درج المكتب.'}
                    {remaining === 0 && 'تم استهلاك العهدة بالكامل بالتطابق مع الفاتورة.'}
                    {remaining < 0 && '⚠️ دفع الموظف من جيبه، وسيتم صرف فارق الزيادة له من الدرج تلقائياً.'}
                  </p>
                </div>

                {/* Settlement Notes */}
                <div className="space-y-2">
                  <Label>بيان / ملاحظات التسوية (اختياري)</Label>
                  <Input
                    placeholder="رقم الفاتورة أو أي تفاصيل أخرى..."
                    {...settleForm.register('settlement_notes')}
                  />
                </div>

                {/* Receipt Upload */}
                <div className="space-y-2">
                  <Label>صورة الفاتورة / الإيصال (اختياري)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button type="button" variant="outline" onClick={() => setSettleModalOpen(false)}>
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={settleCustodyMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {settleCustodyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    تأكيد التسوية وإغلاق العهدة
                  </Button>
                </DialogFooter>
              </form>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* 3. Modal: التحويل الداخلي (Internal Transfer) */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <ArrowLeftRight className="h-5 w-5" /> تحويل داخلي بين الحسابات
            </DialogTitle>
            <DialogDescription>
              نقل مبلغ بين درج المكتب، الخزينة الرئيسية، أو حساب المصرف
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={transferForm.handleSubmit((data) => transferMutation.mutate(data))} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>التحويل من (المصدر)</Label>
                <Select
                  value={transferForm.watch('from')}
                  onValueChange={(v) => transferForm.setValue('from', v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drawer">💵 درج المكتب ({formatCurrency(drawerBalance)})</SelectItem>
                    <SelectItem value="vault">🏦 الخزينة الرئيسية ({formatCurrency(vaultBalance)})</SelectItem>
                    <SelectItem value="bank">💳 حساب المصرف ({formatCurrency(bankBalance)})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>التحويل إلى (الوجهة)</Label>
                <Select
                  value={transferForm.watch('to')}
                  onValueChange={(v) => transferForm.setValue('to', v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drawer">💵 درج المكتب</SelectItem>
                    <SelectItem value="vault">🏦 الخزينة الرئيسية</SelectItem>
                    <SelectItem value="bank">💳 حساب المصرف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {transferForm.formState.errors.to && (
              <p className="text-xs text-destructive">{transferForm.formState.errors.to.message}</p>
            )}

            <div className="space-y-2">
              <Label>المبلغ المراد تحويله (د.ل) *</Label>
              <Input
                type="number"
                step="any"
                min="0.01"
                className="text-lg font-bold"
                placeholder="0.00"
                {...transferForm.register('amount')}
              />
              {transferForm.formState.errors.amount && (
                <p className="text-xs text-destructive">{transferForm.formState.errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>ملاحظات / سبب التحويل (اختياري)</Label>
              <Textarea
                placeholder="مثال: توريد إيرادات اليوم من الدرج إلى الخزينة الرئيسية..."
                {...transferForm.register('notes')}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setTransferModalOpen(false)}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={transferMutation.isPending}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تأكيد التحويل الداخلي
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Modal: تسوية رصيد (Adjust Balance) */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> تسوية رصيد حساب
            </DialogTitle>
            <DialogDescription>
              إضافة أو خصم مبلغ لتصحيح الرصيد يدوياً مع ذكر السبب
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={adjustForm.handleSubmit((data) => adjustMutation.mutate(data))} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>الحساب المراد تسويته</Label>
              <Select
                value={adjustForm.watch('source')}
                onValueChange={(v) => adjustForm.setValue('source', v as any)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="drawer">💵 درج المكتب ({formatCurrency(drawerBalance)})</SelectItem>
                  <SelectItem value="vault">🏦 الخزينة الرئيسية ({formatCurrency(vaultBalance)})</SelectItem>
                  <SelectItem value="bank">💳 حساب المصرف ({formatCurrency(bankBalance)})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>نوع العملية</Label>
              <Select
                value={adjustForm.watch('operation')}
                onValueChange={(v) => adjustForm.setValue('operation', v as 'add' | 'subtract')}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">➕ إضافة للرصيد (فائض / إيداع مباشر)</SelectItem>
                  <SelectItem value="subtract">➖ خصم من الرصيد (عجز / سحب تسوية)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المبلغ (د.ل) *</Label>
              <Input
                type="number"
                step="any"
                min="0.01"
                className="text-lg font-bold"
                {...adjustForm.register('amount')}
              />
              {adjustForm.formState.errors.amount && (
                <p className="text-xs text-destructive">{adjustForm.formState.errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>سبب التسوية *</Label>
              <Textarea
                placeholder="اكتب سبب التسوية بالتفصيل..."
                {...adjustForm.register('description')}
              />
              {adjustForm.formState.errors.description && (
                <p className="text-xs text-destructive">{adjustForm.formState.errors.description.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setAdjustModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تأكيد التسوية
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Modal: تعيين الأرصدة الافتتاحية (Initial Balances) */}
      <Dialog open={initialModalOpen} onOpenChange={setInitialModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Settings className="h-5 w-5" /> تعيين الأرصدة الافتتاحية
            </DialogTitle>
            <DialogDescription>
              تحديد أرصدة البداية لدرج المكتب، الخزينة الرئيسية، والمصرف
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={initialForm.handleSubmit((data) => initialMutation.mutate(data))} className="space-y-4 pt-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 text-xs">
              ⚠️ <strong>تحذير:</strong> هذا الإجراء سيقوم بإعادة ضبط وتعيين الأرصدة الحالية للحسابات إلى الأرقام المدخلة أدناه.
            </div>

            <div className="space-y-2">
              <Label>رصيد درج المكتب الافتتاحي (د.ل)</Label>
              <Input
                type="number"
                step="any"
                min="0"
                {...initialForm.register('drawer_balance')}
              />
            </div>

            <div className="space-y-2">
              <Label>رصيد الخزينة الرئيسية الافتتاحي (د.ل)</Label>
              <Input
                type="number"
                step="any"
                min="0"
                {...initialForm.register('vault_balance')}
              />
            </div>

            <div className="space-y-2">
              <Label>رصيد المصرف الافتتاحي (د.ل)</Label>
              <Input
                type="number"
                step="any"
                min="0"
                {...initialForm.register('bank_balance')}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setInitialModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" variant="destructive" disabled={initialMutation.isPending}>
                {initialMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تعيين الأرصدة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
