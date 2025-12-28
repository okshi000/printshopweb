'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  ArrowLeft, Printer, Edit, CreditCard, User, Calendar, Clock, 
  CheckCircle2, AlertCircle, Loader2, Package, Coins, Receipt, Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn, formatCurrency, fadeInUp, staggerContainer, getPaymentStatus, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/utils'
import { invoicesApi } from '../api'

// Helper function to safely format dates
const formatDate = (date: string | null | undefined, formatStr: string, options?: any) => {
  if (!date) return '-'
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return '-'
    return format(dateObj, formatStr, options)
  } catch {
    return '-'
  }
}

interface InvoiceItem {
  id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  total_cost: number
  profit: number
  notes?: string
  description?: string
  costs?: { id: number; supplier_name?: string; cost_type: string; amount: number }[]
}

interface Payment {
  id: number
  amount: number
  payment_method: string
  payment_date?: string
  created_at?: string
  notes?: string
}

interface Invoice {
  id: number
  invoice_number: string
  customer_id: number
  customer_name: string
  customer_phone?: string
  status: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  delivery_date?: string
  notes?: string
  created_at: string
  items: InvoiceItem[]
  payments: Payment[]
}

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'جديدة', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: <Clock className="h-4 w-4" /> },
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: <Clock className="h-4 w-4" /> },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: <Package className="h-4 w-4" /> },
  ready: { label: 'جاهزة', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', icon: <CheckCircle2 className="h-4 w-4" /> },
  delivered: { label: 'تم التسليم', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', icon: <CheckCircle2 className="h-4 w-4" /> },
  completed: { label: 'مكتملة', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', icon: <CheckCircle2 className="h-4 w-4" /> },
  cancelled: { label: 'ملغاة', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: <AlertCircle className="h-4 w-4" /> },
}

export default function ViewInvoicePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentType, setPaymentType] = useState('partial')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: invoice, isLoading, error } = useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await invoicesApi.getById(Number(id))
      return res.data.data || res.data
    },
    enabled: !!id,
  })

  const paymentMutation = useMutation({
    mutationFn: async () => {
      return invoicesApi.addPayment(Number(id), {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        payment_type: paymentType,
        payment_date: new Date().toISOString(),
        notes: paymentNotes,
      })
    },
    onSuccess: () => {
      toast.success('تم تسجيل الدفعة بنجاح')
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      setPaymentOpen(false)
      setPaymentAmount('')
      setPaymentNotes('')
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل تسجيل الدفعة'),
  })

  const statusMutation = useMutation({
    mutationFn: async (status: string) => invoicesApi.updateStatus(Number(id), status),
    onSuccess: () => {
      toast.success('تم تحديث حالة الفاتورة')
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل تحديث الحالة'),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => invoicesApi.delete(Number(id)),
    onSuccess: () => {
      toast.success('تم حذف الفاتورة بنجاح')
      navigate('/invoices')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل حذف الفاتورة')
      setDeleteConfirm(false)
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold">الفاتورة غير موجودة</h2>
          <Button className="mt-4" onClick={() => navigate('/invoices')}>العودة للفواتير</Button>
        </div>
      </div>
    )
  }

  const status = statusMap[invoice.status] || statusMap.pending
  const totalCosts = invoice.items.reduce((sum, item) => sum + (parseFloat(String(item.total_cost || 0)) || 0), 0)

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">فاتورة #{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(invoice.created_at, 'PPP', { locale: ar })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('gap-1', status.color)}>{status.icon}{status.label}</Badge>
          <Link to={`/invoices/${id}/print`}>
            <Button variant="outline" size="sm" className="gap-1">
              <Printer className="h-4 w-4" /> طباعة
            </Button>
          </Link>
          <Link to={`/invoices/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1">
              <Edit className="h-4 w-4" /> تعديل
            </Button>
          </Link>
          <Button size="sm" className="gap-1" onClick={() => setPaymentOpen(true)} disabled={invoice.remaining_amount <= 0}>
            <CreditCard className="h-4 w-4" /> تسجيل دفعة
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="gap-1" 
            onClick={() => setDeleteConfirm(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> معلومات العميل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">الاسم</p>
                    <p className="font-medium">{invoice.customer_name}</p>
                  </div>
                  {invoice.customer_phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">الهاتف</p>
                      <p className="font-medium">{invoice.customer_phone}</p>
                    </div>
                  )}
                  {invoice.delivery_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">تاريخ التسليم</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(invoice.delivery_date, 'PPP', { locale: ar })}
                      </p>
                    </div>
                  )}
                </div>
                {invoice.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">ملاحظات</p>
                    <p className="mt-1">{invoice.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Items */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" /> بنود الفاتورة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead className="text-center">الكمية</TableHead>
                      <TableHead className="text-left">السعر</TableHead>
                      <TableHead className="text-left">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                            {item.costs && item.costs.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {item.costs.map((cost) => (
                                  <Badge key={cost.id} variant="outline" className="text-xs">
                                    <Coins className="h-3 w-3 ml-1" />
                                    {cost.cost_type}: {formatCurrency(cost.amount)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-left">{formatCurrency(parseFloat(String(item.unit_price)))}</TableCell>
                        <TableCell className="text-left font-medium">{formatCurrency(parseFloat(String(item.total_price || 0)))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payments */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> سجل الدفعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoice.payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">لا توجد دفعات مسجلة</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>طريقة الدفع</TableHead>
                        <TableHead className="text-left">المبلغ</TableHead>
                        <TableHead>ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {formatDate(payment.payment_date || payment.created_at, 'PPP', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.payment_method === 'cash' ? 'نقدي' : payment.payment_method === 'bank' ? 'بنكي' : payment.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-left font-medium text-emerald-600">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{payment.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <motion.div variants={fadeInUp} className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ملخص الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">المجموع:</span>
                <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">حالة الدفع:</span>
                <Badge className={cn("gap-1", getPaymentStatusColor(getPaymentStatus(invoice.total_amount, invoice.paid_amount)))}>
                  {getPaymentStatusLabel(getPaymentStatus(invoice.total_amount, invoice.paid_amount))}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">التكاليف:</span>
                <span className="font-medium text-orange-600">{formatCurrency(totalCosts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المدفوع:</span>
                <span className="font-medium text-emerald-600">{formatCurrency(invoice.paid_amount)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">المتبقي:</span>
                <span className={cn('text-xl font-bold', invoice.remaining_amount > 0 ? 'text-red-600' : 'text-emerald-600')}>
                  {formatCurrency(invoice.remaining_amount)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-muted-foreground">صافي الربح:</span>
                <span className={cn('font-semibold', invoice.total_amount - totalCosts >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {formatCurrency(invoice.total_amount - totalCosts)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تحديث الحالة</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={invoice.status} onValueChange={(v) => statusMutation.mutate(v)} disabled={statusMutation.isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">جديدة</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="ready">جاهزة</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>المبلغ *</Label>
              <Input
                type="number"
                min={0}
                max={invoice.remaining_amount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`المتبقي: ${formatCurrency(invoice.remaining_amount)}`}
              />
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="bank">بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>نوع الدفعة</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="partial">دفعة جزئية</SelectItem>
                  <SelectItem value="full">دفعة كاملة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="ملاحظات اختيارية" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>إلغاء</Button>
            <Button onClick={() => paymentMutation.mutate()} disabled={!paymentAmount || paymentMutation.isPending}>
              {paymentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تأكيد الدفعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">تأكيد حذف الفاتورة</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>هل أنت متأكد من حذف الفاتورة <strong>#{invoice.invoice_number}</strong>؟</p>
            <p className="text-sm text-muted-foreground mt-2">لا يمكن التراجع عن هذا الإجراء.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>إلغاء</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              حذف الفاتورة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
