'use client'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  Activity, Search, Calendar as CalendarIcon, User, FileText,
  DollarSign, Package, Settings, Trash2, Edit, Plus, Eye, Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn, fadeInUp, staggerContainer } from '@/lib/utils'
import { activityApi } from '../api'

interface ActivityLog {
  id: number
  user_name: string
  action: string
  entity_type: string
  entity_id: number
  entity_name?: string
  description: string
  created_at: string
  ip_address?: string
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4" />,
  update: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  view: <Eye className="h-4 w-4" />,
  login: <User className="h-4 w-4" />,
  logout: <User className="h-4 w-4" />,
  payment: <DollarSign className="h-4 w-4" />,
}

const actionColors: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  view: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  login: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  logout: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  payment: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
}

const entityIcons: Record<string, React.ReactNode> = {
  invoice: <FileText className="h-4 w-4" />,
  customer: <User className="h-4 w-4" />,
  product: <Package className="h-4 w-4" />,
  expense: <DollarSign className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
}

const actionLabels: Record<string, string> = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  view: 'عرض',
  login: 'تسجيل دخول',
  logout: 'تسجيل خروج',
  payment: 'دفعة',
}

const entityLabels: Record<string, string> = {
  invoices: 'فاتورة',
  invoice: 'فاتورة',
  customers: 'عميل',
  customer: 'عميل',
  products: 'منتج',
  product: 'منتج',
  expenses: 'مصروف',
  expense: 'مصروف',
  users: 'مستخدم',
  user: 'مستخدم',
  suppliers: 'مورد',
  supplier: 'مورد',
  inventory: 'مخزون',
  cash: 'خزينة',
  withdrawals: 'سحب',
  withdrawal: 'سحب',
  debts: 'دين',
  debt: 'دين',
  payments: 'دفعة',
  payment: 'دفعة',
  other: 'آخر',
}

export default function ActivityPage() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activity', { search, actionFilter, entityFilter, dateRange, page }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: 10 }
      if (search) params.search = search
      if (actionFilter !== 'all') params.action = actionFilter
      if (entityFilter !== 'all') params.entity_type = entityFilter
      if (dateRange.from) params.start_date = format(dateRange.from, 'yyyy-MM-dd')
      if (dateRange.to) params.end_date = format(dateRange.to, 'yyyy-MM-dd')
      const res = await activityApi.list(params)
      return res.data
    },
  })

  const activities: ActivityLog[] = data?.data || []
  const pagination = { current_page: data?.current_page || 1, last_page: data?.last_page || 1 }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Activity className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل سجل النشاطات</h3>
        <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل البيانات</p>
        <Button onClick={() => refetch()}>إعادة المحاولة</Button>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">سجل النشاطات</h1>
          <p className="text-sm text-muted-foreground">متابعة جميع العمليات في النظام</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في النشاطات..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="نوع العملية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العمليات</SelectItem>
                  <SelectItem value="create">إنشاء</SelectItem>
                  <SelectItem value="update">تعديل</SelectItem>
                  <SelectItem value="delete">حذف</SelectItem>
                  <SelectItem value="login">تسجيل دخول</SelectItem>
                  <SelectItem value="payment">دفعة</SelectItem>
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="invoice">فواتير</SelectItem>
                  <SelectItem value="customer">عملاء</SelectItem>
                  <SelectItem value="product">منتجات</SelectItem>
                  <SelectItem value="expense">مصروفات</SelectItem>
                  <SelectItem value="user">مستخدمين</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                      ) : format(dateRange.from, 'dd/MM/yyyy')
                    ) : 'تاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={isMobile ? 1 : 2}
                  />
                </PopoverContent>
              </Popover>
              {(search || actionFilter !== 'all' || entityFilter !== 'all' || dateRange.from) && (
                <Button variant="ghost" onClick={() => {
                  setSearch('')
                  setActionFilter('all')
                  setEntityFilter('all')
                  setDateRange({})
                }}>
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity List */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">النشاطات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Activity className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">لا توجد نشاطات</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((activity, idx) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Action Icon */}
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      actionColors[activity.action] || 'bg-gray-100 text-gray-700'
                    )}>
                      {actionIcons[activity.action] || <Activity className="h-4 w-4" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            <span className="text-primary">{activity.user_name}</span>
                            {' '}
                            <span className="text-muted-foreground">قام بـ</span>
                            {' '}
                            <Badge variant="outline" className="mx-1">
                              {actionLabels[activity.action] || activity.action}
                            </Badge>
                            {' '}
                            <span className="inline-flex items-center gap-1">
                              {entityIcons[activity.entity_type]}
                              {entityLabels[activity.entity_type?.toLowerCase()] || entityLabels[activity.entity_type] || activity.entity_type}
                            </span>
                            {activity.entity_name && (
                              <span className="font-semibold"> "{activity.entity_name}"</span>
                            )}
                          </p>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          )}
                        </div>
                        <div className="text-left text-sm text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ar })}
                          </div>
                          {activity.ip_address && (
                            <p className="text-xs">{activity.ip_address}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={pagination.current_page === 1}
                >
                  السابق
                </Button>
                <span className="text-sm text-muted-foreground">
                  صفحة {pagination.current_page} من {pagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  التالي
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
