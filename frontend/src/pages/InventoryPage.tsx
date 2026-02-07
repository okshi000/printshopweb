'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Package, TrendingUp, TrendingDown, Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn, fadeInUp, staggerContainer } from '@/lib/utils'
import { inventoryApi } from '../api'
import type { InventoryItem } from '../types'
import { useAuth } from '../contexts/AuthContext'

const itemSchema = z.object({
  name: z.string().min(1, 'اسم الصنف مطلوب'),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  minimum_quantity: z.coerce.number().min(0),
  notes: z.string().optional(),
})

const movementSchema = z.object({
  movement_type: z.string().min(1),
  quantity: z.coerce.number().min(1, 'الكمية يجب أن تكون أكبر من صفر'),
  unit_cost: z.coerce.number().min(0),
  notes: z.string().optional(),
})

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory', page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 10 }
      const res = await inventoryApi.list(params)
      return res.data
    },
  })

  const items = (data?.data || []) as InventoryItem[]

  const form = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: '', unit: 'قطعة', minimum_quantity: 0, notes: '' },
  })

  const movementForm = useForm({
    resolver: zodResolver(movementSchema),
    defaultValues: { movement_type: 'in', quantity: 1, unit_cost: 0, notes: '' },
  })

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof itemSchema>) => inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setModalOpen(false)
      form.reset()
      toast.success('تم إضافة الصنف بنجاح')
    },
    onError: () => toast.error('فشل إضافة الصنف'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof itemSchema>) => inventoryApi.update(editingItem!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setModalOpen(false)
      setEditingItem(null)
      form.reset()
      toast.success('تم تحديث الصنف بنجاح')
    },
    onError: () => toast.error('فشل تحديث الصنف'),
  })

  const movementMutation = useMutation({
    mutationFn: (data: z.infer<typeof movementSchema> & { inventory_item_id: number }) => inventoryApi.addMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setMovementModalOpen(false)
      movementForm.reset()
      toast.success('تم تسجيل الحركة بنجاح')
    },
    onError: () => toast.error('فشل تسجيل الحركة'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('تم حذف الصنف')
    },
  })

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    form.setValue('name', item.name)
    form.setValue('unit', item.unit)
    form.setValue('minimum_quantity', item.minimum_quantity)
    form.setValue('notes', item.notes || '')
    setModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (values: z.infer<typeof itemSchema>) => {
    if (editingItem) {
      updateMutation.mutate(values)
    } else {
      createMutation.mutate(values)
    }
  }

  const handleMovementSubmit = (values: z.infer<typeof movementSchema>) => {
    if (selectedItem) {
      movementMutation.mutate({ ...values, inventory_item_id: selectedItem.id })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-destructive">
        <AlertCircle className="h-12 w-12" />
        <p>فشل تحميل المخزون</p>
      </div>
    )
  }

  const lowStockItems = items?.filter((item) => item.current_quantity <= item.minimum_quantity) || []

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة المخزون</h1>
            <p className="text-sm text-muted-foreground">إدارة الأصناف والكميات</p>
          </div>
        </div>
        {hasPermission('create inventory') && (
          <Button onClick={() => { setEditingItem(null); form.reset(); setModalOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> إضافة صنف
          </Button>
        )}
      </motion.div>

      {lowStockItems.length > 0 && (
        <motion.div variants={fadeInUp}>
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">تنبيه: أصناف منخفضة المخزون</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">يوجد {lowStockItems.length} صنف/أصناف تحت الحد الأدنى للمخزون</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">قائمة المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الصنف</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>الكمية الحالية</TableHead>
                  <TableHead>الحد الأدنى</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {items?.map((item: InventoryItem, index: number) => {
                    const isLowStock = item.current_quantity <= item.minimum_quantity
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className={cn('font-semibold', isLowStock ? 'text-red-600' : 'text-emerald-600')}>
                          {item.current_quantity}
                        </TableCell>
                        <TableCell>{item.minimum_quantity}</TableCell>
                        <TableCell>
                          {isLowStock ? (
                            <Badge variant="destructive">منخفض</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700">جيد</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50" onClick={() => { setSelectedItem(item); movementForm.setValue('movement_type', 'in'); setMovementModalOpen(true) }}>
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => { setSelectedItem(item); movementForm.setValue('movement_type', 'out'); setMovementModalOpen(true) }}>
                              <TrendingDown className="h-4 w-4" />
                            </Button>
                            {hasPermission('edit inventory') && (
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission('delete inventory') && (
                              <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
            {/* Pagination */}
            {data && data.last_page > 1 && (
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
                  صفحة {data.current_page} من {data.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
                  disabled={page === data.last_page}
                >
                  التالي
                </Button>
              </div>
            )}
            {items?.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">لا توجد أصناف في المخزون</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add/Edit Item Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? 'تعديل صنف' : 'إضافة صنف جديد'}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الصنف</Label>
              <Input {...form.register('name')} />
            </div>
            <div className="space-y-2">
              <Label>الوحدة</Label>
              <Select value={form.watch('unit')} onValueChange={(v) => form.setValue('unit', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="قطعة">قطعة</SelectItem>
                  <SelectItem value="متر">متر</SelectItem>
                  <SelectItem value="كيلو">كيلو</SelectItem>
                  <SelectItem value="لتر">لتر</SelectItem>
                  <SelectItem value="علبة">علبة</SelectItem>
                  <SelectItem value="رزمة">رزمة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحد الأدنى للكمية</Label>
              <Input type="number" min={0} {...form.register('minimum_quantity')} />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea {...form.register('notes')} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Movement Modal */}
      <Dialog open={movementModalOpen} onOpenChange={setMovementModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementForm.watch('movement_type') === 'in' ? 'إضافة للمخزون' : 'صرف من المخزون'}: {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={movementForm.handleSubmit(handleMovementSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>نوع الحركة</Label>
              <Select value={movementForm.watch('movement_type')} onValueChange={(v) => movementForm.setValue('movement_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">إدخال (شراء)</SelectItem>
                  <SelectItem value="out">إخراج (صرف)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الكمية</Label>
              <Input type="number" min={1} {...movementForm.register('quantity')} />
            </div>
            {movementForm.watch('movement_type') === 'in' && (
              <div className="space-y-2">
                <Label>تكلفة الوحدة</Label>
                <Input type="number" min={0} step="0.01" {...movementForm.register('unit_cost')} />
              </div>
            )}
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea {...movementForm.register('notes')} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setMovementModalOpen(false)}>إلغاء</Button>
              <Button type="submit" className={movementForm.watch('movement_type') === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} disabled={movementMutation.isPending}>
                {movementMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تأكيد
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
