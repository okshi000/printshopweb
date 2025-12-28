import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Truck,
  Phone,
  Mail,
  MapPin,
  FileText,
  Loader2,
  Banknote,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { suppliersApi } from '../api';
import type { Supplier } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';

const supplierSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  type: z.enum(['printer', 'designer', 'service', 'material', 'other'], {
    required_error: 'نوع المورد مطلوب',
  }),
  phone: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  payment_method: z.string().default('cash'),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers', page, debouncedSearch],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await suppliersApi.list(params);
      return res.data;
    },
  });

  const suppliers = data?.data || [];

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      type: 'other',
      phone: '',
      email: '',
      address: '',
      notes: '',
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_method: 'cash',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: SupplierFormData) => suppliersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setModalOpen(false);
      form.reset();
      toast.success('تم إضافة المورد بنجاح');
    },
    onError: () => {
      toast.error('فشل إضافة المورد');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SupplierFormData) => suppliersApi.update(editingSupplier!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setModalOpen(false);
      setEditingSupplier(null);
      form.reset();
      toast.success('تم تحديث المورد بنجاح');
    },
    onError: () => {
      toast.error('فشل تحديث المورد');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => suppliersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteConfirmId(null);
      toast.success('تم حذف المورد بنجاح');
    },
    onError: () => {
      toast.error('فشل حذف المورد');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) => suppliersApi.addPayment(payingSupplier!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setPaymentModalOpen(false);
      setPayingSupplier(null);
      paymentForm.reset();
      toast.success('تم تسجيل الدفعة بنجاح');
    },
    onError: () => {
      toast.error('فشل تسجيل الدفعة');
    },
  });

  const handleSubmit = (values: SupplierFormData) => {
    if (editingSupplier) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
    setModalOpen(true);
  };

  const handlePayment = (supplier: Supplier) => {
    setPayingSupplier(supplier);
    paymentForm.reset({ amount: 0, payment_method: 'cash', notes: '' });
    setPaymentModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSupplier(null);
    form.reset();
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل الموردين</h3>
        <p className="text-muted-foreground">حدث خطأ أثناء تحميل البيانات</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
            الموردين
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة بيانات الموردين والمستحقات
          </p>
        </div>
        {hasPermission('create suppliers') && (
          <Button
            onClick={() => { form.reset(); setEditingSupplier(null); setModalOpen(true); }}
            className="gap-2 shadow-lg shadow-orange-500/25 bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            إضافة مورد
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="بحث عن مورد..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pr-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="shadow-soft">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg">قائمة الموردين</CardTitle>
          <CardDescription>
            {data?.total || 0} مورد مسجل
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">الاسم</TableHead>
                    <TableHead className="font-semibold">الهاتف</TableHead>
                    <TableHead className="font-semibold">الرصيد المستحق</TableHead>
                    <TableHead className="font-semibold">إجمالي المدفوعات</TableHead>
                    <TableHead className="font-semibold text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {suppliers?.map((supplier: Supplier, index: number) => {
                      const balanceDue = parseFloat(String(supplier.balance_due || '0'));
                      const totalPaid = parseFloat(String(supplier.total_paid || '0'));
                      
                      return (
                        <motion.tr
                          key={supplier.id}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          transition={{ delay: index * 0.05 }}
                          className="group border-b border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/10 flex items-center justify-center">
                                <Truck className="h-5 w-5 text-orange-500" />
                              </div>
                              <div>
                                <p className="font-medium">{supplier.name}</p>
                                {supplier.email && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {supplier.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {supplier.phone || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={balanceDue > 0 ? 'destructive' : 'default'}
                              className="font-mono"
                            >
                              {formatCurrency(balanceDue)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-muted-foreground">
                              {formatCurrency(totalPaid)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => navigate(`/suppliers/${supplier.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {hasPermission('edit suppliers') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                                  onClick={() => handleEdit(supplier)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {hasPermission('delete suppliers') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteConfirmId(supplier.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
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

              {/* Empty State */}
              {suppliers?.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Truck className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">لا يوجد موردين</h3>
                  <p className="text-muted-foreground mb-4">ابدأ بإضافة مورد جديد</p>
                  {hasPermission('create suppliers') && (
                    <Button onClick={() => setModalOpen(true)}>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة مورد
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-500" />
              {editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier ? 'قم بتعديل بيانات المورد' : 'أدخل بيانات المورد الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم *</Label>
              <Input
                id="name"
                placeholder="اسم المورد"
                {...form.register('name')}
                className={form.formState.errors.name ? 'border-destructive' : ''}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>نوع المورد *</Label>
              <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v as 'printer' | 'designer' | 'service' | 'material' | 'other')}>
                <SelectTrigger className={form.formState.errors.type ? 'border-destructive' : ''}>
                  <SelectValue placeholder="اختر نوع المورد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="printer">مطبعة</SelectItem>
                  <SelectItem value="designer">مصمم</SelectItem>
                  <SelectItem value="service">خدمات</SelectItem>
                  <SelectItem value="material">مواد خام</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">الهاتف</Label>
                <Input
                  id="phone"
                  placeholder="رقم الهاتف"
                  {...form.register('phone')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="البريد الإلكتروني"
                  {...form.register('email')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                placeholder="العنوان"
                {...form.register('address')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                placeholder="ملاحظات إضافية"
                {...form.register('notes')}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                )}
                {editingSupplier ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={(open) => {
        if (!open) {
          setPaymentModalOpen(false);
          setPayingSupplier(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-500" />
              تسجيل دفعة للمورد
            </DialogTitle>
            <DialogDescription>
              المورد: {payingSupplier?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={paymentForm.handleSubmit((values) => paymentMutation.mutate(values))} className="space-y-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="text-sm text-muted-foreground mb-1">الرصيد المستحق</div>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(parseFloat(String(payingSupplier?.balance_due || '0')))}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={parseFloat(String(payingSupplier?.balance_due || '0'))}
                placeholder="أدخل المبلغ"
                {...paymentForm.register('amount', { valueAsNumber: true })}
                className={paymentForm.formState.errors.amount ? 'border-destructive' : ''}
              />
              {paymentForm.formState.errors.amount && (
                <p className="text-sm text-destructive">{paymentForm.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_notes">ملاحظات</Label>
              <Textarea
                id="payment_notes"
                placeholder="ملاحظات إضافية"
                {...paymentForm.register('notes')}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={paymentMutation.isPending}
                className="bg-green-500 hover:bg-green-600"
              >
                {paymentMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                تسجيل الدفعة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={(open) => {
        if (!open) {
          setViewModalOpen(false);
          setViewingSupplier(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-500" />
              تفاصيل المورد
            </DialogTitle>
          </DialogHeader>
          {viewingSupplier && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/10 flex items-center justify-center">
                  <Truck className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{viewingSupplier.name}</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Phone className="h-4 w-4" />
                    الهاتف
                  </div>
                  <p className="font-mono">{viewingSupplier.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Mail className="h-4 w-4" />
                    البريد
                  </div>
                  <p className="font-mono">{viewingSupplier.email || '-'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4" />
                  العنوان
                </div>
                <p>{viewingSupplier.address || '-'}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="text-sm text-muted-foreground mb-1">إجمالي المشتريات</div>
                  <p className="text-lg font-bold">
                    {formatCurrency(parseFloat(String(viewingSupplier.total_purchases || '0')))}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 text-center">
                  <div className="text-sm text-muted-foreground mb-1">إجمالي المدفوعات</div>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(parseFloat(String(viewingSupplier.total_paid || '0')))}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center">
                  <div className="text-sm text-muted-foreground mb-1">الرصيد المستحق</div>
                  <p className="text-lg font-bold text-destructive">
                    {formatCurrency(parseFloat(String(viewingSupplier.balance_due || '0')))}
                  </p>
                </div>
              </div>

              {viewingSupplier.notes && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <FileText className="h-4 w-4" />
                    ملاحظات
                  </div>
                  <p>{viewingSupplier.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
