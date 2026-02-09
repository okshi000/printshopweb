import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Package,
  Tag,
  Loader2,
  AlertCircle,
  DollarSign,
  BarChart3,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { productsApi, categoriesApi } from '../api';
import type { Product, Category } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatCurrency } from '@/lib/utils';

const productSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب'),
  category_id: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().default('قطعة'),
  unit_price: z.number().min(0, 'السعر يجب أن يكون صفر أو أكثر'),
  cost_price: z.number().min(0, 'السعر يجب أن يكون صفر أو أكثر'),
  min_stock: z.number().min(0).default(0),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

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
    queryKey: ['products', page, debouncedSearch],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await productsApi.list(params);
      return res.data;
    },
  });

  const products = data?.data || [];

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.list();
      return res.data.data || res.data;
    },
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category_id: '',
      description: '',
      unit: 'قطعة',
      unit_price: 0,
      cost_price: 0,
      min_stock: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => productsApi.create({
      ...data,
      category_id: data.category_id ? parseInt(data.category_id) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setModalOpen(false);
      form.reset();
      toast.success('تم إضافة المنتج بنجاح');
    },
    onError: () => {
      toast.error('فشل إضافة المنتج');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProductFormData) => productsApi.update(editingProduct!.id, {
      ...data,
      category_id: data.category_id ? parseInt(data.category_id) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setModalOpen(false);
      setEditingProduct(null);
      form.reset();
      toast.success('تم تحديث المنتج بنجاح');
    },
    onError: () => {
      toast.error('فشل تحديث المنتج');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteConfirmId(null);
      toast.success('تم حذف المنتج بنجاح');
    },
    onError: () => {
      toast.error('فشل حذف المنتج');
    },
  });

  const handleSubmit = (values: ProductFormData) => {
    if (editingProduct) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      category_id: product.category_id?.toString() || '',
      description: product.description || '',
      unit: product.unit || 'قطعة',
      unit_price: parseFloat(String(product.unit_price || '0')),
      cost_price: parseFloat(String(product.cost_price || '0')),
      min_stock: product.min_stock || 0,
    });
    setModalOpen(true);
  };

  const handleView = async (product: Product) => {
    try {
      const res = await productsApi.get(product.id);
      setViewingProduct(res.data.data || res.data);
      setViewModalOpen(true);
    } catch {
      toast.error('فشل تحميل بيانات المنتج');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    form.reset();
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= 0) return { label: 'نفذ', variant: 'destructive' as const, color: 'text-destructive' };
    if (stock <= minStock) return { label: 'منخفض', variant: 'warning' as const, color: 'text-amber-600' };
    return { label: 'متوفر', variant: 'default' as const, color: 'text-green-600' };
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل المنتجات</h3>
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            المنتجات والخدمات
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة المنتجات والخدمات والأسعار
          </p>
        </div>
        {hasPermission('create products') && (
          <Button
            onClick={() => { form.reset(); setEditingProduct(null); setModalOpen(true); }}
            className="gap-2 shadow-lg shadow-purple-500/25 bg-purple-500 hover:bg-purple-600"
          >
            <Plus className="h-4 w-4" />
            إضافة منتج
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="بحث عن منتج..."
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
          <CardTitle className="text-lg">قائمة المنتجات</CardTitle>
          <CardDescription>
            {data?.total || 0} منتج مسجل
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
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
                    <TableHead className="font-semibold">المنتج</TableHead>
                    <TableHead className="font-semibold">الفئة</TableHead>
                    <TableHead className="font-semibold">الوحدة</TableHead>
                    <TableHead className="font-semibold">سعر البيع</TableHead>
                    <TableHead className="font-semibold">التكلفة</TableHead>
                    <TableHead className="font-semibold">المخزون</TableHead>
                    <TableHead className="font-semibold text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {products?.map((product: Product, index: number) => {
                      const unitPrice = parseFloat(String(product.unit_price || '0'));
                      const costPrice = parseFloat(String(product.cost_price || '0'));
                      const currentStock = product.current_stock || 0;
                      const minStock = product.min_stock || 0;
                      const stockStatus = getStockStatus(currentStock, minStock);
                      
                      return (
                        <motion.tr
                          key={product.id}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          transition={{ delay: index * 0.05 }}
                          className="group border-b border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center">
                                <Package className="h-5 w-5 text-purple-500" />
                              </div>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.category?.name ? (
                              <Badge variant="outline" className="font-normal">
                                <Tag className="h-3 w-3 ml-1" />
                                {product.category.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{product.unit}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-primary">
                              {formatCurrency(unitPrice)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(costPrice)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={stockStatus.variant === 'warning' ? 'secondary' : stockStatus.variant}
                                className={cn(
                                  "font-mono",
                                  stockStatus.variant === 'warning' && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                )}
                              >
                                {currentStock}
                              </Badge>
                              {currentStock <= minStock && currentStock > 0 && (
                                <span className="text-xs text-amber-600">تحذير</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => handleView(product)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {hasPermission('edit products') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                                  onClick={() => handleEdit(product)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {hasPermission('delete products') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteConfirmId(product.id)}
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
              {products?.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">لا يوجد منتجات</h3>
                  <p className="text-muted-foreground mb-4">ابدأ بإضافة منتج جديد</p>
                  {hasPermission('create products') && (
                    <Button onClick={() => setModalOpen(true)} className="bg-purple-500 hover:bg-purple-600">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة منتج
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'قم بتعديل بيانات المنتج' : 'أدخل بيانات المنتج الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المنتج *</Label>
              <Input
                id="name"
                placeholder="اسم المنتج"
                {...form.register('name')}
                className={form.formState.errors.name ? 'border-destructive' : ''}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الفئة</Label>
                <Select
                  value={form.watch('category_id')}
                  onValueChange={(value) => form.setValue('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat: Category) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">الوحدة</Label>
                <Input
                  id="unit"
                  placeholder="مثل: قطعة، متر، كيلو"
                  {...form.register('unit')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_price">سعر البيع</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  {...form.register('unit_price', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_price">سعر التكلفة</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  {...form.register('cost_price', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock">الحد الأدنى للمخزون</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                placeholder="0"
                {...form.register('min_stock', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                placeholder="وصف المنتج"
                {...form.register('description')}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                )}
                {editingProduct ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={(open) => {
        if (!open) {
          setViewModalOpen(false);
          setViewingProduct(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              تفاصيل المنتج
            </DialogTitle>
          </DialogHeader>
          {viewingProduct && (() => {
            const unitPrice = parseFloat(String(viewingProduct.unit_price || '0'));
            const costPrice = parseFloat(String(viewingProduct.cost_price || '0'));
            const profitMargin = unitPrice > 0 
              ? ((unitPrice - costPrice) / unitPrice * 100).toFixed(1) 
              : '0';
            const currentStock = viewingProduct.current_stock || 0;
            const minStock = viewingProduct.min_stock || 0;
            const stockStatus = getStockStatus(currentStock, minStock);
            
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center">
                    <Package className="h-8 w-8 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{viewingProduct.name}</h3>
                    {viewingProduct.category?.name && (
                      <Badge variant="outline" className="mt-1">
                        <Tag className="h-3 w-3 ml-1" />
                        {viewingProduct.category.name}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-center">
                    <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <div className="text-sm text-muted-foreground">سعر البيع</div>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(unitPrice)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">التكلفة</div>
                    <p className="text-lg font-bold">
                      {formatCurrency(costPrice)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 text-center">
                    <BarChart3 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <div className="text-sm text-muted-foreground">الهامش</div>
                    <p className="text-lg font-bold text-green-600">
                      {profitMargin}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Layers className="h-4 w-4" />
                      المخزون الحالي
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={stockStatus.variant === 'warning' ? 'secondary' : stockStatus.variant}
                        className={cn(
                          "text-lg px-3 py-1",
                          stockStatus.variant === 'warning' && "bg-amber-100 text-amber-700"
                        )}
                      >
                        {currentStock}
                      </Badge>
                      <span className={cn("text-sm", stockStatus.color)}>
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">الحد الأدنى</div>
                    <p className="text-lg font-bold">{minStock}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">الوحدة</div>
                  <p className="font-medium">{viewingProduct.unit}</p>
                </div>

                {viewingProduct.description && (
                  <div className="p-3 rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">الوصف</div>
                    <p>{viewingProduct.description}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.
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
