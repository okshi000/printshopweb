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
  Search,
  Eye,
  User,
  Phone,
  MapPin,
  FileText,
  Loader2,
  Users,
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
import { customersApi } from '../../api';
import type { Customer, PaginatedResponse } from '../../types';
import { cn, formatCurrency } from '@/lib/utils';

const customerSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب'),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const res = await customersApi.list({ page, search, per_page: 15 });
      return res.data;
    },
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      phone2: '',
      address: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم إضافة العميل بنجاح');
      setModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة العميل');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CustomerFormData) => 
      customersApi.update(selectedCustomer!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم تعديل بيانات العميل بنجاح');
      setModalOpen(false);
      setSelectedCustomer(null);
      form.reset();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تعديل العميل');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم حذف العميل بنجاح');
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف العميل');
    },
  });

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.reset({
      name: customer.name,
      phone: customer.phone || '',
      phone2: customer.phone2 || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setModalOpen(true);
  };

  const onSubmit = (values: CustomerFormData) => {
    if (selectedCustomer) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCustomer(null);
    form.reset();
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل العملاء</h3>
        <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل البيانات</p>
        <Button onClick={() => refetch()}>إعادة المحاولة</Button>
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            العملاء
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة بيانات العملاء والمديونيات
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="gap-2 shadow-lg shadow-primary/25"
        >
          <Plus className="h-4 w-4" />
          إضافة عميل
        </Button>
      </div>

      {/* Main Content */}
      <Card className="shadow-soft">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">قائمة العملاء</CardTitle>
              <CardDescription>
                {data?.total || 0} عميل مسجل
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث عن عميل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
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
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">الاسم</TableHead>
                      <TableHead className="font-semibold">الهاتف</TableHead>
                      <TableHead className="font-semibold">عدد الفواتير</TableHead>
                      <TableHead className="font-semibold">المديونية</TableHead>
                      <TableHead className="font-semibold">الحالة</TableHead>
                      <TableHead className="font-semibold text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {data?.data.map((customer, index) => (
                        <motion.tr
                          key={customer.id}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          transition={{ delay: index * 0.05 }}
                          className="group border-b border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                {customer.address && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {customer.address}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {customer.phone || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono">
                              {customer.invoices_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "font-semibold",
                              (customer.invoices_sum_remaining_amount || 0) > 0 
                                ? "text-destructive" 
                                : "text-muted-foreground"
                            )}>
                              {formatCurrency(customer.invoices_sum_remaining_amount || 0)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={customer.is_active ? 'default' : 'destructive'}>
                              {customer.is_active ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => navigate(`/customers/${customer.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                                onClick={() => handleEdit(customer)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteConfirmId(customer.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

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
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, data.last_page))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'ghost'}
                          size="sm"
                          className="w-8 h-8"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
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
              {data?.data.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">لا يوجد عملاء</h3>
                  <p className="text-muted-foreground mb-4">
                    {search ? 'لم يتم العثور على عملاء مطابقين للبحث' : 'ابدأ بإضافة عميل جديد'}
                  </p>
                  {!search && (
                    <Button onClick={() => setModalOpen(true)}>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة عميل
                    </Button>
                  )}
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {selectedCustomer ? 'تعديل عميل' : 'إضافة عميل جديد'}
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer ? 'قم بتعديل بيانات العميل' : 'أدخل بيانات العميل الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم العميل *</Label>
              <Input
                id="name"
                placeholder="أدخل اسم العميل"
                {...form.register('name')}
                className={form.formState.errors.name ? 'border-destructive' : ''}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  placeholder="05xxxxxxxx"
                  {...form.register('phone')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone2">رقم هاتف إضافي</Label>
                <Input
                  id="phone2"
                  placeholder="05xxxxxxxx"
                  {...form.register('phone2')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                placeholder="عنوان العميل"
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
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                )}
                {selectedCustomer ? 'حفظ التعديلات' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={(open) => {
        if (!open) {
          setViewModalOpen(false);
          setSelectedCustomer(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              تفاصيل العميل
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                  <Badge variant={selectedCustomer.is_active ? 'default' : 'destructive'}>
                    {selectedCustomer.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Phone className="h-4 w-4" />
                    الهاتف
                  </div>
                  <p className="font-mono">{selectedCustomer.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Phone className="h-4 w-4" />
                    هاتف إضافي
                  </div>
                  <p className="font-mono">{selectedCustomer.phone2 || '-'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4" />
                  العنوان
                </div>
                <p>{selectedCustomer.address || '-'}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <FileText className="h-4 w-4" />
                  ملاحظات
                </div>
                <p>{selectedCustomer.notes || '-'}</p>
              </div>

              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="text-sm text-muted-foreground mb-1">المديونية</div>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency((selectedCustomer as Customer & { total_debt?: number }).total_debt || 0)}
                </p>
              </div>
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
              هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.
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
