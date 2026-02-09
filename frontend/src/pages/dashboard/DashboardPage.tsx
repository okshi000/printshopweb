import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Building2,
  Receipt,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Package,
  Users,
} from 'lucide-react';
import { formatCurrency, staggerContainer, staggerItem } from '@/lib/utils';
import { StatsCard, CardContent, CardHeader, CardTitle, AnimatedCard } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  AnimatedTableRow,
  TableEmpty,
} from '@/components/ui/table';
import { StatsGridSkeleton, CardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { dashboardApi } from '../../api';

interface DashboardData {
  today: {
    sales: number;
    payments_received: number;
    expenses: number;
    profit: number;
  };
  month: {
    sales: number;
    profit: number;
    expenses: number;
    invoices_count: number;
  };
  cash_balance: {
    cash: number;
    bank: number;
    total: number;
  };
  debts: {
    customers_debt: number;
    our_debt: number;
  };
  invoice_status: {
    new: number;
    in_progress: number;
    ready: number;
    delivered: number;
  };
  low_stock_items: Array<{
    id: number;
    name: string;
    current_quantity: number;
    minimum_quantity: number;
  }>;
  recent_invoices: Array<{
    id: number;
    invoice_number: string;
    customer: { name: string };
    total: number;
    status: string;
    created_at: string;
  }>;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ar-LY').format(value);
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await dashboardApi.index();
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <StatsGridSkeleton />
        <StatsGridSkeleton />
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">مرحباً بك، إليك نظرة عامة على أعمالك اليوم</p>
        </div>
        <Link to="/invoices/create">
          <Button className="gap-2">
            <FileText className="h-4 w-4" />
            فاتورة جديدة
          </Button>
        </Link>
      </motion.div>

      {/* Cash Balance Cards */}
      <motion.div variants={staggerItem}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="الصندوق"
            value={formatCurrency(data.cash_balance.cash)}
            icon={<Wallet className="h-5 w-5" />}
            gradient="success"
            description="الرصيد النقدي الحالي"
          />
          <StatsCard
            title="البنك"
            value={formatCurrency(data.cash_balance.bank)}
            icon={<Building2 className="h-5 w-5" />}
            gradient="primary"
            description="رصيد الحساب البنكي"
          />
          <StatsCard
            title="مبيعات اليوم"
            value={formatCurrency(data.today.sales)}
            icon={<Receipt className="h-5 w-5" />}
            gradient="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="ربح اليوم"
            value={formatCurrency(data.today.profit)}
            icon={<TrendingUp className="h-5 w-5" />}
            gradient="success"
            trend={{ value: 8, isPositive: data.today.profit >= 0 }}
          />
        </div>
      </motion.div>

      {/* Month Stats */}
      <motion.div variants={staggerItem}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="مبيعات الشهر"
            value={formatCurrency(data.month.sales)}
            icon={<TrendingUp className="h-5 w-5" />}
            gradient="primary"
          />
          <StatsCard
            title="أرباح الشهر"
            value={formatCurrency(data.month.profit)}
            icon={<TrendingUp className="h-5 w-5" />}
            gradient="success"
          />
          <StatsCard
            title="ديون العملاء"
            value={formatCurrency(data.debts.customers_debt)}
            icon={<TrendingDown className="h-5 w-5" />}
            gradient="warning"
          />
          <StatsCard
            title="فواتير الشهر"
            value={formatNumber(data.month.invoices_count)}
            icon={<FileText className="h-5 w-5" />}
            gradient="primary"
          />
        </div>
      </motion.div>

      {/* Invoice Status & Low Stock */}
      <motion.div variants={staggerItem}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Invoice Status Card */}
          <AnimatedCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">حالة الفواتير</CardTitle>
              <Link to="/invoices">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  عرض الكل
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.invoice_status.new}</p>
                    <p className="text-sm text-muted-foreground">جديد</p>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-warning/5 border border-warning/10"
                >
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Package className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.invoice_status.in_progress}</p>
                    <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/10"
                >
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.invoice_status.ready}</p>
                    <p className="text-sm text-muted-foreground">جاهز</p>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border"
                >
                  <div className="p-2 rounded-lg bg-muted">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.invoice_status.delivered}</p>
                    <p className="text-sm text-muted-foreground">تم التسليم</p>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </AnimatedCard>

          {/* Low Stock Items */}
          <AnimatedCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <CardTitle className="text-lg font-semibold">أصناف منخفضة المخزون</CardTitle>
              </div>
              <Link to="/inventory">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  عرض الكل
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.low_stock_items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-3 rounded-full bg-success/10 mb-3">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                  <p className="font-medium">المخزون جيد</p>
                  <p className="text-sm text-muted-foreground">لا توجد أصناف منخفضة</p>
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {data.low_stock_items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                      >
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="destructive">
                          {item.current_quantity} / {item.minimum_quantity}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </AnimatedCard>
        </div>
      </motion.div>

      {/* Recent Invoices */}
      <motion.div variants={staggerItem}>
        <AnimatedCard>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">آخر الفواتير</CardTitle>
            <Link to="/invoices">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                عرض الكل
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_invoices.length === 0 ? (
                  <TableEmpty
                    icon={<FileText className="h-8 w-8" />}
                    title="لا توجد فواتير"
                    description="ابدأ بإنشاء فاتورتك الأولى"
                    action={
                      <Link to="/invoices/create">
                        <Button size="sm">إنشاء فاتورة</Button>
                      </Link>
                    }
                  />
                ) : (
                  data.recent_invoices.map((invoice, index) => (
                    <AnimatedTableRow key={invoice.id} index={index}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.customer?.name}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status as 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'} />
                      </TableCell>
                      <TableCell>
                        <Link to={`/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="sm">
                            عرض
                          </Button>
                        </Link>
                      </TableCell>
                    </AnimatedTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </AnimatedCard>
      </motion.div>
    </motion.div>
  );
}
