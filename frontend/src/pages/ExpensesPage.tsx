import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Wallet,
  Calendar,
  User,
  Tag,
  Pencil,
  Settings,
  Building2,
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { expensesApi } from '../api';
import type { Expense, ExpenseType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';

const expenseSchema = z.object({
  expense_type_id: z.string().min(1, 'نوع المصروف مطلوب'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  payment_method: z.enum(['cash', 'bank']),
  description: z.string().optional(),
  expense_date: z.date(),
  notes: z.string().optional(),
});

const typeSchema = z.object({
  name: z.string().min(1, 'اسم النوع مطلوب'),
  description: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;
type TypeFormData = z.infer<typeof typeSchema>;

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('expenses');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  // Type management states
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ExpenseType | null>(null);
  const [deleteTypeId, setDeleteTypeId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses', page],
    queryFn: async () => {
      const res = await expensesApi.list({ page, per_page: 10 });
      return res.data;
    },
  });

  const expenses = data?.data || [];

  const { data: expenseTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['expense-types'],
    queryFn: async () => {
      const res = await expensesApi.types();
      return res.data.data || res.data;
    },
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_type_id: '',
      amount: 0,
      payment_method: 'cash',
      description: '',
      expense_date: new Date(),
      notes: '',
    },
  });

  const typeForm = useForm<TypeFormData>({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Expense Mutations
  const createMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => expensesApi.create({
      expense_type_id: parseInt(data.expense_type_id),
      amount: data.amount,
      payment_method: data.payment_method,
      expense_date: data.expense_date.toISOString().split('T')[0],
      notes: data.notes || data.description || '',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-types'] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      setModalOpen(false);
      form.reset();
      toast.success('تم إضافة المصروف بنجاح');
    },
    onError: () => {
      toast.error('فشل إضافة المصروف');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-types'] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      setDeleteConfirmId(null);
      toast.success('تم حذف المصروف بنجاح');
    },
    onError: () => {
      toast.error('فشل حذف المصروف');
    },
  });

  // Type Mutations
  const createTypeMutation = useMutation({
    mutationFn: (data: TypeFormData) => expensesApi.createType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-types'] });
      setTypeModalOpen(false);
      typeForm.reset();
      toast.success('تم إضافة نوع المصروف بنجاح');
    },
    onError: () => {
      toast.error('فشل إضافة نوع المصروف');
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: (data: TypeFormData) => expensesApi.updateType(editingType!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-types'] });
      setTypeModalOpen(false);
      setEditingType(null);
      typeForm.reset();
      toast.success('تم تحديث نوع المصروف بنجاح');
    },
    onError: () => {
      toast.error('فشل تحديث نوع المصروف');
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: number) => expensesApi.deleteType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-types'] });
      setDeleteTypeId(null);
      toast.success('تم حذف نوع المصروف بنجاح');
    },
    onError: () => {
      toast.error('فشل حذف نوع المصروف - قد يكون مرتبط بمصروفات');
    },
  });

  const handleCloseModal = () => {
    setModalOpen(false);
    form.reset();
  };

  const handleEditType = (type: ExpenseType) => {
    setEditingType(type);
    typeForm.reset({
      name: type.name,
      description: type.description || '',
    });
    setTypeModalOpen(true);
  };

  const handleCloseTypeModal = () => {
    setTypeModalOpen(false);
    setEditingType(null);
    typeForm.reset();
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  // Calculate total expenses
  const totalExpenses = expenses?.reduce((sum: number, exp: Expense) => 
    sum + parseFloat(String(exp.amount || 0)), 0) || 0;

  // Filter active types for expense form
  const activeTypes = expenseTypes?.filter((t: ExpenseType) => t.is_active) || [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل المصروفات</h3>
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            المصروفات
          </h1>
          <p className="text-muted-foreground mt-1">
            تسجيل ومتابعة المصروفات وإدارة أنواعها
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="shadow-soft bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">إجمالي المصروفات</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-red-500/20 flex items-center justify-center">
              <Wallet className="h-7 w-7 text-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="expenses" className="gap-2">
            <Wallet className="h-4 w-4" /> المصروفات
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-2">
            <Settings className="h-4 w-4" /> أنواع المصروفات
          </TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card className="shadow-soft">
            <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">سجل المصروفات</CardTitle>
                <CardDescription>
                  {expenses?.length || 0} مصروف مسجل
                </CardDescription>
              </div>
              {hasPermission('expenses.create') && (
                <Button
                  onClick={() => { form.reset({ expense_date: new Date() }); setModalOpen(true); }}
                  className="gap-2 shadow-lg shadow-red-500/25 bg-red-500 hover:bg-red-600"
                >
                  <Plus className="h-4 w-4" />
                  إضافة مصروف
                </Button>
              )}
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
                        <TableHead className="font-semibold">التاريخ</TableHead>
                        <TableHead className="font-semibold">النوع</TableHead>
                        <TableHead className="font-semibold">طريقة الدفع</TableHead>
                        <TableHead className="font-semibold">الوصف</TableHead>
                        <TableHead className="font-semibold">المبلغ</TableHead>
                        <TableHead className="font-semibold">بواسطة</TableHead>
                        <TableHead className="font-semibold text-center">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {expenses?.map((expense: Expense, index: number) => (
                          <motion.tr
                            key={expense.id}
                            variants={rowVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ delay: index * 0.03 }}
                            className="group border-b border-border/50 hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{formatDate(expense.expense_date)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="gap-1">
                                <Tag className="h-3 w-3" />
                                {expense.expense_type?.name || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={expense.payment_method === 'bank' 
                                  ? 'border-blue-500 text-blue-500' 
                                  : 'border-green-500 text-green-500'
                                }
                              >
                                {expense.payment_method === 'bank' ? (
                                  <><Building2 className="h-3 w-3 ml-1" /> بنكي</>
                                ) : (
                                  <><Wallet className="h-3 w-3 ml-1" /> نقدي</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {expense.description || expense.notes || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-red-600">
                                {formatCurrency(parseFloat(String(expense.amount)))}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{expense.user?.name || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {hasPermission('expenses.delete') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteConfirmId(expense.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
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
                  {expenses?.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Wallet className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">لا توجد مصروفات</h3>
                      <p className="text-muted-foreground mb-4">ابدأ بتسجيل مصروف جديد</p>
                      {hasPermission('expenses.create') && (
                        <Button onClick={() => setModalOpen(true)} className="bg-red-500 hover:bg-red-600">
                          <Plus className="h-4 w-4 ml-2" />
                          إضافة مصروف
                        </Button>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Types Tab */}
        <TabsContent value="types">
          <Card className="shadow-soft">
            <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">أنواع المصروفات</CardTitle>
                <CardDescription>
                  إدارة أنواع المصروفات المتاحة - {expenseTypes?.length || 0} نوع
                </CardDescription>
              </div>
              {hasPermission('expenses.create') && (
                <Button
                  onClick={() => { setEditingType(null); typeForm.reset(); setTypeModalOpen(true); }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  إضافة نوع
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {typesLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold">اسم النوع</TableHead>
                        <TableHead className="font-semibold">الوصف</TableHead>
                        <TableHead className="font-semibold">عدد المصروفات</TableHead>
                        <TableHead className="font-semibold">الحالة</TableHead>
                        <TableHead className="font-semibold text-center">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {expenseTypes?.map((type: ExpenseType, index: number) => (
                          <motion.tr
                            key={type.id}
                            variants={rowVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ delay: index * 0.03 }}
                            className="group border-b border-border/50 hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-red-500" />
                                <span className="font-medium">{type.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {type.description || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {type.expenses_count || 0} مصروف
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={type.is_active 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }>
                                {type.is_active ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleEditType(type)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {(type.expenses_count || 0) === 0 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteTypeId(type.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>

                  {/* Empty State */}
                  {expenseTypes?.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Tag className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">لا توجد أنواع مصروفات</h3>
                      <p className="text-muted-foreground mb-4">أضف أنواع المصروفات للبدء</p>
                      {hasPermission('expenses.create') && (
                        <Button onClick={() => setTypeModalOpen(true)}>
                          <Plus className="h-4 w-4 ml-2" />
                          إضافة نوع
                        </Button>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Expense Modal */}
      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-red-500" />
              إضافة مصروف جديد
            </DialogTitle>
            <DialogDescription>
              أدخل تفاصيل المصروف
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
            <div className="space-y-2">
              <Label>نوع المصروف *</Label>
              <Select
                value={form.watch('expense_type_id')}
                onValueChange={(value) => form.setValue('expense_type_id', value)}
              >
                <SelectTrigger className={form.formState.errors.expense_type_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {activeTypes.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <p className="text-sm">لا توجد أنواع مصروفات</p>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="mt-2"
                        onClick={() => { handleCloseModal(); setActiveTab('types'); setTypeModalOpen(true); }}
                      >
                        إضافة نوع جديد
                      </Button>
                    </div>
                  ) : (
                    activeTypes.map((type: ExpenseType) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.expense_type_id && (
                <p className="text-sm text-destructive">{form.formState.errors.expense_type_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">المبلغ *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  {...form.register('amount', { valueAsNumber: true })}
                  className={form.formState.errors.amount ? 'border-destructive' : ''}
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-right font-normal">
                      <Calendar className="h-4 w-4 ml-2" />
                      {form.watch('expense_date') 
                        ? formatDate(form.watch('expense_date'))
                        : 'اختر التاريخ'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={form.watch('expense_date')}
                      onSelect={(date) => form.setValue('expense_date', date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>طريقة الدفع *</Label>
              <Select value={form.watch('payment_method')} onValueChange={(v) => form.setValue('payment_method', v as 'cash' | 'bank')}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-green-600" />
                      نقدي (الخزينة)
                    </div>
                  </SelectItem>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      بنكي
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Input
                id="description"
                placeholder="وصف المصروف"
                {...form.register('description')}
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
                disabled={createMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                إضافة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Type Modal */}
      <Dialog open={typeModalOpen} onOpenChange={handleCloseTypeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-red-500" />
              {editingType ? 'تعديل نوع المصروف' : 'إضافة نوع مصروف جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingType ? 'قم بتعديل بيانات نوع المصروف' : 'أدخل بيانات نوع المصروف الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={typeForm.handleSubmit((values) => 
            editingType ? updateTypeMutation.mutate(values) : createTypeMutation.mutate(values)
          )} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="typeName">اسم النوع *</Label>
              <Input
                id="typeName"
                placeholder="مثال: إيجار، كهرباء، رواتب..."
                {...typeForm.register('name')}
                className={typeForm.formState.errors.name ? 'border-destructive' : ''}
              />
              {typeForm.formState.errors.name && (
                <p className="text-sm text-destructive">{typeForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeDescription">الوصف (اختياري)</Label>
              <Textarea
                id="typeDescription"
                placeholder="وصف نوع المصروف"
                {...typeForm.register('description')}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCloseTypeModal}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createTypeMutation.isPending || updateTypeMutation.isPending}
              >
                {(createTypeMutation.isPending || updateTypeMutation.isPending) && (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                )}
                {editingType ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Confirmation */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
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

      {/* Delete Type Confirmation */}
      <Dialog open={deleteTypeId !== null} onOpenChange={() => setDeleteTypeId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">تأكيد حذف النوع</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا النوع؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTypeId(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTypeId && deleteTypeMutation.mutate(deleteTypeId)}
              disabled={deleteTypeMutation.isPending}
            >
              {deleteTypeMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
