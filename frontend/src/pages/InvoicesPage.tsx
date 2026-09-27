import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Download,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Archive,
  ArchiveRestore,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { invoicesApi } from '../api';
import type { Invoice, PaginatedResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatCurrency, formatDate, getStatusColor, getStatusLabel, getPaymentStatus, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/utils';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [invoiceToArchive, setInvoiceToArchive] = useState<Invoice | null>(null);
  const [invoiceToUnarchive, setInvoiceToUnarchive] = useState<Invoice | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [sortByDeliveryDate, setSortByDeliveryDate] = useState<'asc' | 'desc' | ''>('');

  // Statistics for live tab counts
  const { data: statsData } = useQuery({
    queryKey: ['invoices-statistics-tab-counts'],
    queryFn: async () => {
      const res = await invoicesApi.statistics();
      return res.data;
    },
  });

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
    queryKey: ['invoices', page, invoiceStatusFilter, debouncedSearch, dateFrom, dateTo, sortByDeliveryDate, activeTab],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 10 };
      if (activeTab === 'archived') {
        params.archived = 'true';
      }
      if (invoiceStatusFilter) params.status = invoiceStatusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      if (dateFrom) params.date_from = dateFrom.toISOString().split('T')[0];
      if (dateTo) params.date_to = dateTo.toISOString().split('T')[0];
      if (sortByDeliveryDate) {
        params.sort_by = 'delivery_date';
        params.sort_direction = sortByDeliveryDate;
      }
      const res = await invoicesApi.list(params);
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
    setSortByDeliveryDate('');
    setPage(1);
  };

  const handleConfirmArchive = async () => {
    if (!invoiceToArchive) return;
    try {
      setIsActionPending(true);
      await invoicesApi.archive(invoiceToArchive.id);
      toast.success(`تمت أرشفة الفاتورة ${invoiceToArchive.invoice_number} بنجاح واستبعادها من الحسابات المالية`);
      setInvoiceToArchive(null);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-statistics-tab-counts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل أرشفة الفاتورة');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleConfirmUnarchive = async () => {
    if (!invoiceToUnarchive) return;
    try {
      setIsActionPending(true);
      await invoicesApi.unarchive(invoiceToUnarchive.id);
      toast.success(`تم إلغاء أرشفة الفاتورة ${invoiceToUnarchive.invoice_number} واستعادتها للحسابات المالية بنجاح`);
      setInvoiceToUnarchive(null);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-statistics-tab-counts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل استعادة الفاتورة');
    } finally {
      setIsActionPending(false);
    }
  };

  const hasActiveFilters = invoiceStatusFilter || paymentStatusFilter || dateFrom || dateTo || searchTerm || sortByDeliveryDate;

  const exportHeaders = [
    'رقم الفاتورة',
    'العميل',
    'التاريخ',
    'الإجمالي',
    'المدفوع',
    'المتبقي',
    'حالة الفاتورة',
    'حالة الدفع',
    'المنتج',
    'الكمية',
    'سعر الوحدة',
  ];

  type InvoiceExportRow = {
    'رقم الفاتورة': string;
    'العميل': string;
    'التاريخ': string;
    'الإجمالي': number | null;
    'المدفوع': number | null;
    'المتبقي': number | null;
    'حالة الفاتورة': string;
    'حالة الدفع': string;
    'المنتج': string;
    'الكمية': number | null;
    'سعر الوحدة': number | null;
  };

  const buildExportParams = (targetPage: number) => {
    const params: Record<string, string | number> = { page: targetPage, per_page: 200 };
    if (activeTab === 'archived') params.archived = 'true';
    if (invoiceStatusFilter) params.status = invoiceStatusFilter;
    if (debouncedSearch) params.search = debouncedSearch;
    if (dateFrom) params.date_from = dateFrom.toISOString().split('T')[0];
    if (dateTo) params.date_to = dateTo.toISOString().split('T')[0];
    return params;
  };

  const fetchAllInvoices = async (): Promise<Invoice[]> => {
    const firstRes = await invoicesApi.list(buildExportParams(1));
    const firstPage = firstRes.data;
    const invoices = firstPage?.data || [];
    const lastPage = firstPage?.last_page || 1;

    if (lastPage <= 1) return invoices;

    const pages = Array.from({ length: lastPage - 1 }, (_, index) => index + 2);
    const responses = await Promise.all(
      pages.map((pageNumber) => invoicesApi.list(buildExportParams(pageNumber)))
    );
    const moreInvoices = responses.flatMap((res) => res.data?.data || []);
    return [...invoices, ...moreInvoices];
  };

  const fetchInvoiceDetails = async (invoiceId: number): Promise<Invoice | null> => {
    try {
      const res = await invoicesApi.getById(invoiceId);
      return res.data?.data || res.data;
    } catch (error) {
      console.warn('Failed to fetch invoice details', invoiceId, error);
      return null;
    }
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const allInvoices = await fetchAllInvoices();
      const detailResponses = await Promise.all(
        allInvoices.map((invoice) => fetchInvoiceDetails(invoice.id))
      );
      const detailedInvoices = detailResponses.map((detail, index) => detail || allInvoices[index]);

      const paymentFiltered = paymentStatusFilter
        ? detailedInvoices.filter((invoice) => {
            const total = parseFloat(String(invoice.total || 0));
            const paid = parseFloat(String(invoice.paid_amount || 0));
            return getPaymentStatus(total, paid) === paymentStatusFilter;
          })
        : detailedInvoices;

      if (paymentFiltered.length === 0) {
        toast.info('لا توجد فواتير للتصدير');
        return;
      }

      const rows: InvoiceExportRow[] = paymentFiltered.flatMap((invoice) => {
        const total = parseFloat(String(invoice.total || 0));
        const paid = parseFloat(String(invoice.paid_amount || 0));
        const remaining = total - paid;
        const paymentStatus = getPaymentStatus(total, paid);
        const invoiceDate = formatDate(invoice.invoice_date || invoice.created_at);
        const items = invoice.items || [];

        const invoiceRow: InvoiceExportRow = {
          'رقم الفاتورة': invoice.invoice_number,
          'العميل': invoice.customer?.name || 'عميل نقدي',
          'التاريخ': invoiceDate,
          'الإجمالي': total,
          'المدفوع': paid,
          'المتبقي': remaining,
          'حالة الفاتورة': getStatusLabel(invoice.status),
          'حالة الدفع': getPaymentStatusLabel(paymentStatus),
          'المنتج': '',
          'الكمية': null,
          'سعر الوحدة': null,
        };

        if (items.length === 0) {
          return [invoiceRow];
        }

        const itemRows: InvoiceExportRow[] = items.map((item) => {
          const quantity = parseFloat(String(item.quantity || 0));
          const unitPrice = parseFloat(String(item.unit_price || 0));
          const productName = item.product_name || item.description || 'منتج غير محدد';

          return {
            'رقم الفاتورة': '',
            'العميل': '',
            'التاريخ': '',
            'الإجمالي': null,
            'المدفوع': null,
            'المتبقي': null,
            'حالة الفاتورة': '',
            'حالة الدفع': '',
            'المنتج': productName,
            'الكمية': quantity,
            'سعر الوحدة': unitPrice,
          };
        });

        return [invoiceRow, ...itemRows];
      });

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: exportHeaders });
      worksheet['!cols'] = [
        { wch: 18 },
        { wch: 22 },
        { wch: 18 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 },
        { wch: 28 },
        { wch: 10 },
        { wch: 12 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'الفواتير');

      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, '-')
        .replace('T', '_')
        .slice(0, 16);

      XLSX.writeFile(workbook, `invoices_${timestamp}.xlsx`);
      toast.success('تم تصدير الفواتير بنجاح');
    } catch (error) {
      console.error(error);
      toast.error('فشل تصدير الفواتير');
    } finally {
      setIsExporting(false);
    }
  };

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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Button>
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
      </div>

      {/* Tabs for Active vs Archived Invoices */}
      <div className="flex border-b border-border/60 gap-4">
        <button
          type="button"
          onClick={() => {
            setActiveTab('active');
            setPage(1);
          }}
          className={cn(
            "flex items-center gap-2 pb-3 px-3 font-medium text-sm transition-all border-b-2 -mb-px",
            activeTab === 'active'
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Receipt className="h-4 w-4" />
          <span>الفواتير النشطة</span>
          {statsData?.active_invoices_count !== undefined && (
            <Badge variant="secondary" className="mr-1 text-xs">
              {statsData.active_invoices_count}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('archived');
            setPage(1);
          }}
          className={cn(
            "flex items-center gap-2 pb-3 px-3 font-medium text-sm transition-all border-b-2 -mb-px",
            activeTab === 'archived'
              ? "border-amber-500 text-amber-600 dark:text-amber-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Archive className="h-4 w-4" />
          <span>الفواتير المؤرشفة (الأرشيف)</span>
          {statsData?.archived_invoices_count !== undefined && (
            <Badge 
              variant="outline" 
              className={cn(
                "mr-1 text-xs",
                activeTab === 'archived'
                  ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {statsData.archived_invoices_count}
            </Badge>
          )}
        </button>
      </div>

      {activeTab === 'archived' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <Info className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-sm">
            <span className="font-semibold block mb-0.5">قسم الفواتير المؤرشفة:</span>
            جميع الفواتير في هذا القسم مستبعدة كلياً من الحسابات المالية وتقارير الأرباح والمبيعات ومستحقات الديون. الفواتير هنا محفوظة كبيانات مرجعية وسجلات تاريخية فقط.
          </div>
        </div>
      )}

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

              <Button
                variant={sortByDeliveryDate ? 'default' : 'outline'}
                className={cn('gap-2', sortByDeliveryDate && 'bg-orange-500 hover:bg-orange-600 text-white')}
                onClick={() => {
                  setSortByDeliveryDate((prev) => {
                    if (prev === '') return 'asc';
                    if (prev === 'asc') return 'desc';
                    return '';
                  });
                  setPage(1);
                }}
              >
                {sortByDeliveryDate === 'asc' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : sortByDeliveryDate === 'desc' ? (
                  <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUpDown className="h-4 w-4" />
                )}
                تاريخ التسليم
              </Button>

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
          <CardTitle className="text-lg flex items-center justify-between">
            <span>{activeTab === 'archived' ? 'فواتير الأرشيف (مرجع بيانات)' : 'قائمة الفواتير النشطة'}</span>
            {activeTab === 'archived' && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                مستبعدة من الحسابات المالية
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {data?.total || 0} {activeTab === 'archived' ? 'فاتورة مؤرشفة' : 'فاتورة نشطة'}
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
                    <TableHead className="font-semibold">تاريخ التسليم</TableHead>
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
                              <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                invoice.is_archived
                                  ? "bg-amber-500/15 text-amber-600"
                                  : "bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-500"
                              )}>
                                {invoice.is_archived ? <Archive className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-mono font-medium">{invoice.invoice_number}</span>
                                {invoice.is_archived && (
                                  <Badge variant="outline" className="w-fit text-[10px] py-0 px-1.5 mt-0.5 bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400">
                                    مؤرشفة
                                  </Badge>
                                )}
                              </div>
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
                            {invoice.delivery_date ? (
                              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                {formatDate(invoice.delivery_date)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">غير محدد</span>
                            )}
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
                                title="عرض التفاصيل"
                                onClick={() => navigate(`/invoices/${invoice.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!invoice.is_archived && hasPermission('edit invoices') && invoice.status === 'draft' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                                  title="تعديل"
                                  onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {!invoice.is_archived && hasPermission('create invoice_payments') && remaining > 0 && invoice.status !== 'cancelled' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                  title="تسجيل دفعة"
                                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                                >
                                  <Banknote className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="طباعة"
                                onClick={() => window.open(`/invoices/${invoice.id}/print`, '_blank')}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>

                              {hasPermission('edit invoices') && (
                                invoice.is_archived ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                                    title="إلغاء الأرشفة واستعادة للحسابات المالية"
                                    onClick={() => setInvoiceToUnarchive(invoice)}
                                  >
                                    <ArchiveRestore className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                                    title="أرشفة الفاتورة واستبعادها من المالية"
                                    onClick={() => setInvoiceToArchive(invoice)}
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                )
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

      {/* Archive Confirmation Dialog */}
      <Dialog open={!!invoiceToArchive} onOpenChange={(open) => !open && setInvoiceToArchive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Archive className="h-5 w-5" />
              تأكيد أرشفة الفاتورة
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2 text-foreground/80">
              <p>
                هل أنت متأكد من أرشفة الفاتورة رقم{' '}
                <span className="font-bold text-foreground">{invoiceToArchive?.invoice_number}</span>؟
              </p>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300">
                ⚠️ بمجرد الأرشفة، ستخرج هذه الفاتورة من كافة الحسابات المالية وتقارير الإيرادات والأرباح ومستحقات الديون، وستبقى فقط كمرجع بيانات.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setInvoiceToArchive(null)}>
              إلغاء
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
              onClick={handleConfirmArchive}
              disabled={isActionPending}
            >
              <Archive className="h-4 w-4" />
              {isActionPending ? 'جاري الأرشفة...' : 'تأكيد الأرشفة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unarchive Confirmation Dialog */}
      <Dialog open={!!invoiceToUnarchive} onOpenChange={(open) => !open && setInvoiceToUnarchive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <ArchiveRestore className="h-5 w-5" />
              تأكيد إلغاء الأرشفة
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2 text-foreground/80">
              <p>
                هل تريد إلغاء أرشفة الفاتورة رقم{' '}
                <span className="font-bold text-foreground">{invoiceToUnarchive?.invoice_number}</span> وإعادتها لقائمة الفواتير النشطة؟
              </p>
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-800 dark:text-blue-300">
                ℹ️ ستعود الفاتورة مجدداً للدخول في الحسابات المالية ومطالبات الديون والتقارير.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setInvoiceToUnarchive(null)}>
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmUnarchive}
              disabled={isActionPending}
              className="gap-2"
            >
              <ArchiveRestore className="h-4 w-4" />
              {isActionPending ? 'جاري الاستعادة...' : 'استعادة الفاتورة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
