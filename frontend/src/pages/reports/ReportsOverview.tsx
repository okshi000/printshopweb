// صفحة نظرة عامة على التقارير - محدثة

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  FileText,
  BarChart3,
  Users,
  CreditCard,
  ArrowUpRight,
  Download,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { StatsCard } from '@/components/reports/cards';
import { financialApi } from '@/api/reports/financial.api';
import { salesApi } from '@/api/reports/sales.api';
import { inventoryReportApi } from '@/api/reports/inventory.api';
import { formatCurrency, fadeInUp, staggerContainer } from '@/lib/utils';

interface ReportCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  path: string;
  reports: {
    id: string;
    name: string;
  }[];
}

export const ReportsOverview: React.FC = () => {
  const navigate = useNavigate();

  // جلب ملخص سريع للبيانات
  const { data: financialSummary, isLoading: financialLoading } = useQuery({
    queryKey: ['quick-financial-summary'],
    queryFn: async () => {
      const res = await financialApi.getSummary({});
      return res.data;
    },
  });

  const { data: salesSummary, isLoading: salesLoading } = useQuery({
    queryKey: ['quick-sales-summary'],
    queryFn: async () => {
      const res = await salesApi.getSummary({});
      return res.data;
    },
  });

  const { data: inventorySummary, isLoading: inventoryLoading } = useQuery({
    queryKey: ['quick-inventory-summary'],
    queryFn: async () => {
      const res = await inventoryReportApi.getSummary({});
      return res.data;
    },
  });

  const isLoading = financialLoading || salesLoading || inventoryLoading;

  const reportCategories: ReportCategory[] = [
    {
      id: 'financial',
      title: 'التقارير المالية',
      description: 'تقارير شاملة عن الإيرادات والمصروفات والأرباح',
      icon: <DollarSign className="h-8 w-8" />,
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      path: '/reports/financial',
      reports: [
        { id: 'summary', name: 'الملخص المالي' },
        { id: 'income', name: 'قائمة الدخل' },
        { id: 'expenses', name: 'تفصيل المصروفات' },
        { id: 'profit-loss', name: 'الأرباح والخسائر' },
      ],
    },
    {
      id: 'sales',
      title: 'تقارير المبيعات',
      description: 'تحليل المبيعات حسب المنتجات والعملاء',
      icon: <ShoppingCart className="h-8 w-8" />,
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      path: '/reports/sales',
      reports: [
        { id: 'sales-summary', name: 'ملخص المبيعات' },
        { id: 'by-product', name: 'المبيعات حسب المنتج' },
        { id: 'by-customer', name: 'المبيعات حسب العميل' },
        { id: 'top-products', name: 'الأكثر مبيعاً' },
      ],
    },
    {
      id: 'inventory',
      title: 'تقارير المخزون',
      description: 'متابعة المخزون والحركات والتقييم',
      icon: <Package className="h-8 w-8" />,
      gradient: 'bg-gradient-to-br from-purple-500 to-pink-600',
      path: '/reports/inventory',
      reports: [
        { id: 'inventory-summary', name: 'ملخص المخزون' },
        { id: 'stock-details', name: 'تفاصيل المخزون' },
        { id: 'movements', name: 'حركات المخزون' },
        { id: 'valuation', name: 'تقييم المخزون' },
      ],
    },
    {
      id: 'customers',
      title: 'تقارير العملاء',
      description: 'تحليل العملاء والديون والمستحقات',
      icon: <Users className="h-8 w-8" />,
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
      path: '/reports/customers',
      reports: [
        { id: 'customer-summary', name: 'ملخص العملاء' },
        { id: 'customer-debts', name: 'ديون العملاء' },
        { id: 'debt-aging', name: 'تقادم الديون' },
        { id: 'collection-rate', name: 'نسبة التحصيل' },
      ],
    },
    {
      id: 'cashflow',
      title: 'التدفق النقدي',
      description: 'متابعة التدفقات النقدية والأرصدة',
      icon: <CreditCard className="h-8 w-8" />,
      gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      path: '/reports/cashflow',
      reports: [
        { id: 'cashflow-summary', name: 'ملخص التدفق' },
        { id: 'inflows', name: 'الإيداعات' },
        { id: 'outflows', name: 'المسحوبات' },
        { id: 'balances', name: 'أرصدة الخزائن' },
      ],
    },
  ];

  const totalReports = reportCategories.reduce((acc, cat) => acc + cat.reports.length, 0);

  return (
    <motion.div 
      variants={staggerContainer} 
      initial="initial" 
      animate="animate" 
      className="space-y-6"
      dir="rtl"
    >
      {/* رأس الصفحة */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            مركز التقارير
          </h1>
          <p className="text-muted-foreground mt-2">
            تقارير شاملة وتفصيلية عن جميع جوانب النشاط التجاري
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            تصدير الكل
          </Button>
        </div>
      </motion.div>

      {/* بطاقات الإحصائيات السريعة */}
      <motion.div variants={fadeInUp}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="إجمالي الإيرادات"
            value={isLoading ? '...' : formatCurrency(financialSummary?.total_revenue || 0)}
            icon={<DollarSign className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <StatsCard
            title="إجمالي المبيعات"
            value={isLoading ? '...' : formatCurrency(salesSummary?.total_sales || 0)}
            icon={<ShoppingCart className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          <StatsCard
            title="قيمة المخزون"
            value={isLoading ? '...' : formatCurrency(inventorySummary?.total_value || 0)}
            icon={<Package className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-purple-500 to-pink-600"
          />
          <StatsCard
            title="التقارير المتاحة"
            value={totalReports}
            icon={<FileText className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          />
        </div>
      </motion.div>

      {/* فئات التقارير */}
      <motion.div variants={fadeInUp}>
        <h2 className="text-xl font-semibold mb-4">فئات التقارير</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportCategories.map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-4">
                    <div className={`${category.gradient} text-white p-3 rounded-xl shadow-lg`}>
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {category.title}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {category.reports.map((report) => (
                      <div 
                        key={report.id} 
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{report.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full gap-2 group-hover:bg-primary/90"
                    onClick={() => navigate(category.path)}
                  >
                    عرض التقارير
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* مميزات نظام التقارير */}
      <motion.div variants={fadeInUp}>
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              مميزات نظام التقارير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg shrink-0">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold">رسوم بيانية تفاعلية</h4>
                  <p className="text-sm text-muted-foreground">
                    عرض البيانات بطرق مرئية متنوعة
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg shrink-0">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold">تصدير متعدد</h4>
                  <p className="text-sm text-muted-foreground">
                    تصدير إلى PDF و Excel و CSV
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg shrink-0">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold">تحليل الاتجاهات</h4>
                  <p className="text-sm text-muted-foreground">
                    مقارنات زمنية وتحليل النمو
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg shrink-0">
                  <Wallet className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold">فلاتر متقدمة</h4>
                  <p className="text-sm text-muted-foreground">
                    تخصيص التقارير حسب الفترة
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* روابط سريعة */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">روابط سريعة للتقارير الأكثر استخداماً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/reports/financial')}
                className="gap-2"
              >
                <DollarSign className="h-4 w-4" />
                الملخص المالي
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/reports/sales')}
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                تقرير المبيعات
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/reports/inventory')}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                تقرير المخزون
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/reports/customers')}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                ديون العملاء
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/reports/cashflow')}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                التدفق النقدي
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
