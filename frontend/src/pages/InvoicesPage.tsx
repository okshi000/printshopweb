import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Eye,
  Printer,
  Pencil,
  Banknote,
  Search,
  FileText,
  Calendar,
  Filter,
  AlertCircle,
  Receipt,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Pagination } from '@/components/ui/pagination';
import { invoicesApi } from '../api';
import type { Invoice, PaginatedResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatCurrency, formatDate, getStatusColor, getStatusLabel, getPaymentStatus, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/utils';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const { data, isLoading, error } = useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['invoices', page, invoiceStatusFilter, debouncedSearch, dateFrom, dateTo],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 10 };
      if (invoiceStatusFilter) params.status = invoiceStatusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      if (dateFrom) params.date_from = dateFrom.toISOString().split('T')[0];
      if (dateTo) params.date_to = dateTo.toISOString().split('T')[0];
      const res = await invoicesApi.list(params);
      return res.data;
    },
  });

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['invoices-statistics'],
    queryFn: async () => {
      const res = await invoicesApi.statistics({ days: 30 });
      return res.data;
    },
  });

  // Client-side filter for payment status only (since backend doesn't support it)
  const filteredInvoices = data?.data?.filter((inv: Invoice) => {
    if (paymentStatusFilter) {
      const total = parseFloat(String(inv.total || 0));
      const paid = parseFloat(String(inv.paid_amount || 0));
      const paymentStatus = getPaymentStatus(total, paid);
      if (paymentStatus !== paymentStatusFilter) return false;
    }
    return true;
  }) || [];

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const clearFilters = () => {
    setInvoiceStatusFilter('');
    setPaymentStatusFilter('');
    setSearchTerm('');
    setDebouncedSearch('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const hasActiveFilters = invoiceStatusFilter || paymentStatusFilter || dateFrom || dateTo || searchTerm;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل الفواتير</h3>
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            الفواتير
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة الفواتير والمدفوعات
          </p>
        </div>
        {hasPermission('create invoices') && (
          <Button
            onClick={() => navigate('/invoices/create')}
            className="gap-2 shadow-lg shadow-blue-500/25"
          >
            <Plus className="h-4 w-4" />
            إنشاء فاتورة
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">فاتورة (آخر 30 يوم)</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    statistics?.total_invoices || 0
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(statistics?.total_sales || 0)
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/20 dark:to-purple-950/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي الأرباح</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(statistics?.total_profits || 0)
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Banknote className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/20 dark:to-amber-950/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">المتوسط لكل فاتورة</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(statistics?.average_invoice || 0)
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الفاتورة أو اسم العميل..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={invoiceStatusFilter} onValueChange={(value) => { setInvoiceStatusFilter(value); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="حالة الفاتورة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">جديدة</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="ready">جاهزة</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="cancelled">ملغية</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentStatusFilter} onValueChange={(value) => { setPaymentStatusFilter(value); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Banknote className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="حالة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">غير مدفوعة</SelectItem>
                  <SelectItem value="partial">مدفوعة جزئياً</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {dateFrom ? formatDate(dateFrom) : 'من تاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {dateTo ? formatDate(dateTo) : 'إلى تاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="shadow-soft">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg">قائمة الفواتير</CardTitle>
          <CardDescription>
            {data?.total || 0} فاتورة
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
                    <TableHead className="font-semibold">رقم الفاتورة</TableHead>
                    <TableHead className="font-semibold">العميل</TableHead>
                    <TableHead className="font-semibold">التاريخ</TableHead>
                    <TableHead className="font-semibold">الإجمالي</TableHead>
                    <TableHead className="font-semibold">المدفوع</TableHead>
                    <TableHead className="font-semibold">المتبقي</TableHead>
                    <TableHead className="font-semibold">حالة الفاتورة</TableHead>
                    <TableHead className="font-semibold">حالة الدفع</TableHead>
                    <TableHead className="font-semibold text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredInvoices?.map((invoice: Invoice, index: number) => {
                      const total = parseFloat(String(invoice.total || '0'));
                      const paid = parseFloat(String(invoice.paid_amount || '0'));
                      const remaining = total - paid;
                      const statusColor = getStatusColor(invoice.status);
                      
                      return (
                        <motion.tr
                          key={invoice.id}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          transition={{ delay: index * 0.03 }}
                          className="group border-b border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-500" />
                              </div>
                              <span className="font-mono font-medium">{invoice.invoice_number}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {invoice.customer?.name || (
                              <span className="text-muted-foreground">عميل نقدي</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(invoice.invoice_date)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">
                              {formatCurrency(total)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600">
                              {formatCurrency(paid)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "font-semibold",
                              remaining > 0 ? "text-destructive" : "text-green-600"
                            )}>
                              {formatCurrency(remaining)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("gap-1", statusColor)}>
                              {getStatusLabel(invoice.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("gap-1", getPaymentStatusColor(getPaymentStatus(total, paid)))}>
                              {getPaymentStatusLabel(getPaymentStatus(total, paid))}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => navigate(`/invoices/${invoice.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {hasPermission('edit invoices') && invoice.status === 'draft' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                                  onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {hasPermission('create invoice_payments') && remaining > 0 && invoice.status !== 'cancelled' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                                >
                                  <Banknote className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => window.open(`/invoices/${invoice.id}/print`, '_blank')}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
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
                <Pagination
                  currentPage={data.current_page}
                  totalPages={data.last_page}
                  totalItems={data.total}
                  perPage={data.per_page}
                  onPageChange={setPage}
                />
              )}

              {/* Empty State */}
              {filteredInvoices?.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Receipt className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">لا توجد فواتير</h3>
                  <p className="text-muted-foreground mb-4">
                    {hasActiveFilters ? 'لم يتم العثور على فواتير مطابقة للفلترة' : 'ابدأ بإنشاء فاتورة جديدة'}
                  </p>
                  {hasPermission('create invoices') && !hasActiveFilters && (
                    <Button onClick={() => navigate('/invoices/create')}>
                      <Plus className="h-4 w-4 ml-2" />
                      إنشاء فاتورة
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
