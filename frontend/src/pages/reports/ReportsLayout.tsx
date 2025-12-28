// تخطيط صفحات التقارير

import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  BarChart3,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  description?: string;
}

const navItems: NavItem[] = [
  {
    title: 'نظرة عامة',
    path: '/reports',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'لوحة التقارير الرئيسية',
  },
  {
    title: 'التقارير المالية',
    path: '/reports/financial',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'الإيرادات، المصروفات، الأرباح',
  },
  {
    title: 'تقارير المبيعات',
    path: '/reports/sales',
    icon: <ShoppingCart className="h-5 w-5" />,
    description: 'المبيعات، العملاء، المنتجات',
  },
  {
    title: 'تقارير المخزون',
    path: '/reports/inventory',
    icon: <Package className="h-5 w-5" />,
    description: 'المخزون، الحركات، التقييم',
  },
  {
    title: 'تقارير العملاء',
    path: '/reports/customers',
    icon: <Users className="h-5 w-5" />,
    description: 'العملاء، الديون، التحصيل',
  },
  {
    title: 'التدفق النقدي',
    path: '/reports/cashflow',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'التدفقات، الأرصدة، السيولة',
  },
];

export const ReportsLayout: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/reports') {
      return currentPath === '/reports';
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className="flex h-full" dir="rtl">
      {/* الشريط الجانبي */}
      <aside className="w-64 border-l bg-card hidden lg:block">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">مركز التقارير</h2>
              <p className="text-xs text-muted-foreground">تحليلات شاملة</p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <nav className="p-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.icon}
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className={cn(
                      'text-xs',
                      isActive(item.path) ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {item.description}
                    </p>
                  )}
                </div>
                <ChevronLeft className="h-4 w-4 opacity-50" />
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 overflow-auto">
        {/* التنقل للموبايل */}
        <div className="lg:hidden border-b p-2 overflow-x-auto">
          <div className="flex gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? 'default' : 'outline'}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {item.icon}
                  <span className="mr-2">{item.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* محتوى الصفحة */}
        <motion.div
          key={currentPath}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default ReportsLayout;
