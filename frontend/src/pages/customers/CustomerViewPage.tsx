'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, Edit, FileText,
  TrendingUp, Clock, CheckCircle2, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn, formatCurrency, fadeInUp, staggerContainer } from '@/lib/utils'
import { customersApi } from '../../api'

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

interface Invoice {
  id: number
  invoice_number: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  status: string
  created_at: string
}

interface Customer {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at: string
  total_invoices?: number
  invoices_count?: number
  total_amount?: number
  paid_amount?: number
  remaining_amount?: number
  invoices: Invoice[]
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  completed: { label: 'مكتملة', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  cancelled: { label: 'ملغاة', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
}

export default function CustomerViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: customer, isLoading, error } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await customersApi.getById(Number(id))
      return res.data.data || res.data
    },
    enabled: !!id,
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

  if (error || !customer) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold">العميل غير موجود</h2>
          <Button className="mt-4" onClick={() => navigate('/customers')}>العودة للعملاء</Button>
        </div>
      </div>
    )
  }

  const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2)

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-16 w-16 text-xl">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              عميل منذ {formatDate(customer.created_at, 'MMMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>
        <Link to={`/customers?edit=${id}`}>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" /> تعديل
          </Button>
        </Link>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> معلومات الاتصال
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الهاتف</p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                      <Mail className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                      <p className="font-medium">{customer.email}</p>
                    </div>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">العنوان</p>
                      <p className="font-medium">{customer.address}</p>
                    </div>
                  </div>
                )}
                {customer.notes && (
                  <div className="sm:col-span-2 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">ملاحظات</p>
                    <p>{customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Invoices */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" /> فواتير العميل
                </CardTitle>
                <Link to={`/invoices/create?customer=${id}`}>
                  <Button size="sm">فاتورة جديدة</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {customer.invoices?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد فواتير لهذا العميل</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الفاتورة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead className="text-left">الإجمالي</TableHead>
                        <TableHead className="text-left">المتبقي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.invoices?.map((invoice) => {
                        const status = statusMap[invoice.status] || statusMap.pending
                        return (
                          <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                            <TableCell className="font-medium">#{invoice.invoice_number}</TableCell>
                            <TableCell>{formatDate(invoice.created_at, 'dd/MM/yyyy')}</TableCell>
                            <TableCell>
                              <Badge className={status.color}>{status.label}</Badge>
                            </TableCell>
                            <TableCell className="text-left">{formatCurrency(invoice.total_amount)}</TableCell>
                            <TableCell className={cn('text-left font-medium', invoice.remaining_amount > 0 ? 'text-red-600' : 'text-emerald-600')}>
                              {formatCurrency(invoice.remaining_amount)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
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
              <CardTitle className="text-lg">إحصائيات العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-l from-blue-50 to-transparent dark:from-blue-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>عدد الفواتير</span>
                </div>
                <span className="text-xl font-bold text-blue-600">{customer.total_invoices || customer.invoices_count || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-l from-emerald-50 to-transparent dark:from-emerald-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span>إجمالي المبيعات</span>
                </div>
                <span className="text-xl font-bold text-emerald-600">{formatCurrency(parseFloat(String(customer.total_amount || 0)) || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-l from-green-50 to-transparent dark:from-green-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>المدفوع</span>
                </div>
                <span className="text-xl font-bold text-green-600">{formatCurrency(parseFloat(String(customer.paid_amount || 0)) || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-l from-red-50 to-transparent dark:from-red-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  <span>المستحقات</span>
                </div>
                <span className="text-xl font-bold text-red-600">{formatCurrency(parseFloat(String(customer.remaining_amount || 0)) || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/invoices/create?customer=${id}`} className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" /> إنشاء فاتورة
                </Button>
              </Link>
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Phone className="h-4 w-4" /> اتصال
                  </Button>
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Mail className="h-4 w-4" /> إرسال بريد
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
