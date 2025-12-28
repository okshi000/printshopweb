'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Plus, Trash2, ArrowLeft, Package, Coins, Receipt, Loader2, Calendar as CalendarIcon
} from 'lucide-react'
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn, formatCurrency, fadeInUp, staggerContainer } from '@/lib/utils'
import { invoicesApi, customersApi, productsApi, suppliersApi } from '../api'
import type { Customer, Product } from '../types'

interface Supplier { id: number; name: string }

interface ItemCost {
  id: string
  supplier_id: string | null
  cost_type: string
  amount: number
}

interface InvoiceItem {
  id: string
  product_id: string | null
  quantity: number
  price: number
  item_notes: string
  costs: ItemCost[]
}

export default function CreateInvoicePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEditMode = !!id
  
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [customerId, setCustomerId] = useState<string>('')
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null)
  const [notes, setNotes] = useState('')
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [supplierSearch, setSupplierSearch] = useState('')

  // Set customer from URL parameter if provided
  useEffect(() => {
    const customerParam = searchParams.get('customer')
    if (customerParam && !isEditMode) {
      setCustomerId(customerParam)
    }
  }, [searchParams, isEditMode])

  // Load invoice data when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      setIsLoadingInvoice(true)
      invoicesApi.getById(Number(id))
        .then((res) => {
          const invoice = res.data.data || res.data
          setCustomerId(invoice.customer_id?.toString() || '')
          setDeliveryDate(invoice.delivery_date ? new Date(invoice.delivery_date) : null)
          setNotes(invoice.notes || '')
          
          // Convert invoice items to form format
          const formItems: InvoiceItem[] = invoice.items.map((item: any) => ({
            id: crypto.randomUUID(),
            product_id: item.product_id?.toString() || null,
            quantity: item.quantity,
            price: item.unit_price,
            item_notes: item.description || '',
            costs: item.costs?.map((cost: any) => ({
              id: crypto.randomUUID(),
              supplier_id: cost.supplier_id?.toString() || null,
              cost_type: cost.cost_type,
              amount: cost.amount,
            })) || [],
          }))
          setItems(formItems)
        })
        .catch((error) => {
          toast.error('فشل تحميل بيانات الفاتورة')
          console.error(error)
        })
        .finally(() => {
          setIsLoadingInvoice(false)
        })
    }
  }, [isEditMode, id])

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: async () => {
      const params: any = { active_only: true }
      if (customerSearch) params.search = customerSearch
      const res = await customersApi.list(params)
      return res.data.data || res.data
    },
  })

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', productSearch],
    queryFn: async () => {
      const params: any = {}
      if (productSearch) params.search = productSearch
      const res = await productsApi.list(params)
      return res.data.data || res.data
    },
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', supplierSearch],
    queryFn: async () => {
      const params: any = { active_only: true }
      if (supplierSearch) params.search = supplierSearch
      const res = await suppliersApi.list(params)
      return res.data.data || res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (isEditMode && id) {
        return invoicesApi.update(Number(id), data)
      }
      return invoicesApi.create(data)
    },
    onSuccess: (res) => {
      toast.success(isEditMode ? 'تم تحديث الفاتورة بنجاح' : 'تم إنشاء الفاتورة بنجاح')
      navigate(`/invoices/${res.data.data?.id || res.data.id}`)
    },
    onError: (error: any) => toast.error(error.response?.data?.message || (isEditMode ? 'فشل تحديث الفاتورة' : 'فشل إنشاء الفاتورة')),
  })

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      product_id: null,
      quantity: 1,
      price: 0,
      item_notes: '',
      costs: [],
    }])
  }

  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId))
  }

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: unknown) => {
    setItems(items.map((item) => item.id === itemId ? { ...item, [field]: value } : item))
  }

  const selectProduct = (itemId: string, productId: string) => {
    const product = products?.find((p: Product) => p.id.toString() === productId)
    if (product) {
      setItems(items.map((item) =>
        item.id === itemId
          ? { ...item, product_id: productId, price: parseFloat(String(product.unit_price || product.default_price || '0')) }
          : item
      ))
    }
  }

  const addCost = (itemId: string) => {
    setItems(items.map((item) =>
      item.id === itemId
        ? { ...item, costs: [...item.costs, { id: crypto.randomUUID(), supplier_id: null, cost_type: '', amount: 0 }] }
        : item
    ))
  }

  const removeCost = (itemId: string, costId: string) => {
    setItems(items.map((item) =>
      item.id === itemId ? { ...item, costs: item.costs.filter((c) => c.id !== costId) } : item
    ))
  }

  const updateCost = (itemId: string, costId: string, field: keyof ItemCost, value: unknown) => {
    setItems(items.map((item) =>
      item.id === itemId
        ? { ...item, costs: item.costs.map((c) => c.id === costId ? { ...c, [field]: value } : c) }
        : item
    ))
  }

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.price), 0), [items])
  const totalCosts = useMemo(() => items.reduce((sum, item) => sum + item.costs.reduce((cs, c) => cs + (parseFloat(String(c.amount)) || 0), 0), 0), [items])

  const handleSubmit = () => {
    if (!customerId) {
      toast.error('يرجى اختيار العميل')
      return
    }
    if (items.length === 0) {
      toast.error('يرجى إضافة بند واحد على الأقل')
      return
    }

    const data = {
      customer_id: parseInt(customerId),
      delivery_date: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : null,
      notes,
      items: items.map((item) => ({
        product_id: item.product_id ? parseInt(item.product_id) : null,
        quantity: item.quantity,
        unit_price: item.price,
        notes: item.item_notes,
        costs: item.costs.map((c) => ({
          supplier_id: c.supplier_id ? parseInt(c.supplier_id) : null,
          cost_type: c.cost_type,
          amount: c.amount,
        })),
      })),
    }
    createMutation.mutate(data)
  }

  if (customersLoading || productsLoading || isLoadingInvoice) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{isEditMode ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة'}</h1>
            <p className="text-sm text-muted-foreground">{isEditMode ? 'تعديل بيانات الفاتورة' : 'إضافة فاتورة جديدة للعميل'}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Details */}
        <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>العميل *</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                    <SelectContent>
                      <div className="px-2 pb-2">
                        <Input
                          placeholder="ابحث عن عميل..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      {customers?.map((c: Customer) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ التسليم</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-right', !deliveryDate && 'text-muted-foreground')}>
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {deliveryDate ? format(deliveryDate, 'PPP', { locale: ar }) : 'اختر تاريخ'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={deliveryDate || undefined} onSelect={(d) => setDeliveryDate(d || null)} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات على الفاتورة" />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">البنود</CardTitle>
              <Button onClick={addItem} size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> إضافة بند
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">لا توجد بنود. اضغط على "إضافة بند" للبدء.</p>
                </div>
              ) : (
                items.map((item, idx) => (
                  <Card key={item.id} className="border-dashed">
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline">بند {idx + 1}</Badge>
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-4">
                        <div className="sm:col-span-2 space-y-2">
                          <Label>المنتج</Label>
                          <Select value={item.product_id || ''} onValueChange={(v) => selectProduct(item.id, v)}>
                            <SelectTrigger><SelectValue placeholder="اختر المنتج" /></SelectTrigger>
                            <SelectContent>
                              <div className="px-2 pb-2">
                                <Input
                                  placeholder="ابحث عن منتج..."
                                  value={productSearch}
                                  onChange={(e) => setProductSearch(e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              {products?.map((p: Product) => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>الكمية</Label>
                          <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)} />
                        </div>
                        <div className="space-y-2">
                          <Label>السعر</Label>
                          <Input type="number" min={0} step="0.01" value={item.price} onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>ملاحظات البند</Label>
                        <Input value={item.item_notes} onChange={(e) => updateItem(item.id, 'item_notes', e.target.value)} placeholder="ملاحظات" />
                      </div>

                      {/* Costs */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="flex items-center gap-1"><Coins className="h-4 w-4" /> التكاليف</Label>
                          <Button variant="outline" size="sm" onClick={() => addCost(item.id)}>
                            <Plus className="h-3 w-3" /> تكلفة
                          </Button>
                        </div>
                        {item.costs.map((cost) => (
                          <div key={cost.id} className="flex items-end gap-2 mb-2">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">المورد</Label>
                              <Select value={cost.supplier_id || ''} onValueChange={(v) => updateCost(item.id, cost.id, 'supplier_id', v)}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="اختر" /></SelectTrigger>
                                <SelectContent>
                                  <div className="px-2 pb-2">
                                    <Input
                                      placeholder="ابحث عن مورد..."
                                      value={supplierSearch}
                                      onChange={(e) => setSupplierSearch(e.target.value)}
                                      className="h-8"
                                    />
                                  </div>
                                  {suppliers?.map((s: Supplier) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">النوع</Label>
                              <Input className="h-9" value={cost.cost_type} onChange={(e) => updateCost(item.id, cost.id, 'cost_type', e.target.value)} placeholder="طباعة خارجية" />
                            </div>
                            <div className="w-28 space-y-1">
                              <Label className="text-xs">المبلغ</Label>
                              <Input className="h-9" type="number" min={0} value={cost.amount} onChange={(e) => updateCost(item.id, cost.id, 'amount', parseFloat(e.target.value) || 0)} />
                            </div>
                            <Button variant="ghost" size="icon" className="h-9 text-red-600" onClick={() => removeCost(item.id, cost.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="text-left text-sm font-medium">
                        إجمالي البند: <span className="text-primary">{formatCurrency(item.quantity * item.price)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary */}
        <motion.div variants={fadeInUp}>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">ملخص الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المجموع الفرعي:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">إجمالي التكاليف:</span>
                  <span className="font-medium text-orange-600">{formatCurrency(totalCosts)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">الإجمالي:</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">صافي الربح:</span>
                  <span className={cn('font-semibold', subtotal - totalCosts >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {formatCurrency(subtotal - totalCosts)}
                  </span>
                </div>
              </div>

              <Button className="w-full gap-2" size="lg" onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditMode ? 'تحديث الفاتورة' : 'حفظ الفاتورة'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
