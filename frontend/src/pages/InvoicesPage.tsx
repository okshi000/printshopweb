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
import { invoicesApi } from '../api';
import type { Invoice } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices', statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.date_from = dateFrom.toISOString().split('T')[0];
      if (dateTo) params.date_to = dateTo.toISOString().split('T')[0];
      const res = await invoicesApi.list(params);
      return res.data.data || res.data;
    },
  });

  const filteredInvoices = invoices?.filter((inv: Invoice) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(search) ||
      inv.customer?.name?.toLowerCase().includes(search)
    );
  });

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSearchTerm('');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = statusFilter || dateFrom || dateTo || searchTerm;

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

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الفاتورة أو اسم العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="partial">مدفوعة جزئياً</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="cancelled">ملغية</SelectItem>
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
            {filteredInvoices?.length || 0} فاتورة
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
                    <TableHead className="font-semibold">الحالة</TableHead>
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
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
