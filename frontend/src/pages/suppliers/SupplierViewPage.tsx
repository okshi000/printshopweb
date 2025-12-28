'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, Calendar, Edit, FileText,
  DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle, CreditCard, Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency, fadeInUp, staggerContainer } from '@/lib/utils'
import { suppliersApi } from '../../api'

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

interface Payment {
  id: number
  amount: number
  payment_method: string
  created_at: string
  notes?: string
}

interface SupplierCost {
  id: number
  invoice_number: string
  invoice_id: number
  cost_type: string
  amount: number
  created_at: string
}

interface Supplier {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at: string
  total_costs: number
  paid_amount: number
  remaining_amount: number
  costs: SupplierCost[]
  payments: Payment[]
}

export default function SupplierViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentNotes, setPaymentNotes] = useState('')

  const { data: supplier, isLoading, error } = useQuery<Supplier>({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const res = await suppliersApi.getById(Number(id))
      return res.data.data || res.data
    },
    enabled: !!id,
  })

  const paymentMutation = useMutation({
    mutationFn: async () => {
      return suppliersApi.addPayment(Number(id), {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        notes: paymentNotes,
      })
    },
    onSuccess: () => {
      toast.success('تم تسجيل الدفعة بنجاح')
      queryClient.invalidateQueries({ queryKey: ['supplier', id] })
      setPaymentOpen(false)
      setPaymentAmount('')
      setPaymentNotes('')
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل تسجيل الدفعة'),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold">المورد غير موجود</h2>
          <Button className="mt-4" onClick={() => navigate('/suppliers')}>العودة للموردين</Button>
        </div>
      </div>
    )
  }

  const initials = supplier.name.split(' ').map(n => n[0]).join('').substring(0, 2)

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-16 w-16 text-xl">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{supplier.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              مورد منذ {formatDate(supplier.created_at, 'MMMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setPaymentOpen(true)} disabled={supplier.remaining_amount <= 0}>
            <CreditCard className="h-4 w-4" /> تسجيل دفعة
          </Button>
          <Link to={`/suppliers/${id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" /> تعديل
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> معلومات المورد
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {supplier.phone && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                      <Phone className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الهاتف</p>
                      <p className="font-medium">{supplier.phone}</p>
                    </div>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                      <Mail className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                      <p className="font-medium">{supplier.email}</p>
                    </div>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">العنوان</p>
                      <p className="font-medium">{supplier.address}</p>
                    </div>
                  </div>
                )}
                {supplier.notes && (
                  <div className="sm:col-span-2 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">ملاحظات</p>
                    <p>{supplier.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Costs */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" /> التكاليف المسجلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supplier.costs?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد تكاليف مسجلة لهذا المورد</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الفاتورة</TableHead>
                        <TableHead>نوع التكلفة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead className="text-left">المبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplier.costs?.map((cost) => (
                        <TableRow key={cost.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/invoices/${cost.invoice_id}`)}>
                          <TableCell className="font-medium">#{cost.invoice_number}</TableCell>
                          <TableCell>{cost.cost_type}</TableCell>
                          <TableCell>{formatDate(cost.created_at, 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-left font-medium">{formatCurrency(cost.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
                {supplier.payments?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد دفعات مسجلة</p>
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
                      {supplier.payments?.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.created_at, 'dd/MM/yyyy')}</TableCell>
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
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الحساب المالي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-l from-orange-50 to-transparent dark:from-orange-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <span>إجمالي التكاليف</span>
                </div>
                <span className="text-xl font-bold text-orange-600">{formatCurrency(supplier.total_costs)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-l from-green-50 to-transparent dark:from-green-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>المدفوع</span>
                </div>
                <span className="text-xl font-bold text-green-600">{formatCurrency(supplier.paid_amount)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-l from-red-50 to-transparent dark:from-red-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  <span>المستحق للمورد</span>
                </div>
                <span className="text-xl font-bold text-red-600">{formatCurrency(supplier.remaining_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setPaymentOpen(true)} disabled={supplier.remaining_amount <= 0}>
                <DollarSign className="h-4 w-4" /> تسجيل دفعة
              </Button>
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Phone className="h-4 w-4" /> اتصال
                  </Button>
                </a>
              )}
              {supplier.email && (
                <a href={`mailto:${supplier.email}`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Mail className="h-4 w-4" /> إرسال بريد
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل دفعة للمورد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>المبلغ *</Label>
              <Input
                type="number"
                min={0}
                max={supplier.remaining_amount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`المستحق: ${formatCurrency(supplier.remaining_amount)}`}
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
    </motion.div>
  )
}
