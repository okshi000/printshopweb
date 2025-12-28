import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  FileText,
  Wallet,
  Receipt,
  CreditCard,
  Coins,
  Warehouse,
  BarChart3,
  History,
  LogOut,
  ChevronDown,
  Plus,
  Calculator,
  UserCog,
  Printer,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
  color?: string;
  special?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'الرئيسية',
    items: [
      { icon: LayoutDashboard, label: 'لوحة التحكم', to: '/' },
      { icon: FileText, label: 'الفواتير', to: '/invoices' },
      { icon: Plus, label: 'فاتورة جديدة', to: '/invoices/create', color: 'success' },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { icon: Users, label: 'العملاء', to: '/customers' },
      { icon: Truck, label: 'الموردين / المطابع', to: '/suppliers' },
      { icon: Package, label: 'المنتجات', to: '/products' },
    ],
  },
  {
    title: 'المحاسب الآلي',
    items: [
      { 
        icon: Calculator, 
        label: 'المحاسب الآلي', 
        to: '/accountant', 
        color: 'warning',
        special: true 
      },
    ],
  },
  {
    title: 'المالية',
    items: [
      { icon: Wallet, label: 'الخزنة', to: '/cash' },
      { icon: Receipt, label: 'المصروفات', to: '/expenses' },
      { icon: CreditCard, label: 'السحوبات', to: '/withdrawals' },
      { icon: Coins, label: 'الديون والسلف', to: '/debts' },
    ],
  },
  {
    title: 'أخرى',
    items: [
      { icon: Warehouse, label: 'المخزون', to: '/inventory' },
      { icon: BarChart3, label: 'التقارير', to: '/reports' },
    ],
  },
  {
    title: 'الإعدادات',
    items: [
      { icon: UserCog, label: 'المستخدمين والصلاحيات', to: '/users' },
      { icon: History, label: 'سجل النشاط', to: '/activity' },
    ],
  },
];

// Sidebar Item Component
function SidebarItem({ item, isActive, collapsed }: { item: NavItem; isActive: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  
  const content = (
    <motion.div
      whileHover={{ x: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <NavLink to={item.to} className="block">
        {item.special ? (
          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
            'bg-gradient-to-r from-warning/20 to-warning/10 border border-warning/30',
            'hover:from-warning/30 hover:to-warning/20 hover:shadow-md',
            collapsed && 'justify-center px-2'
          )}>
            <div className="p-1.5 rounded-lg bg-warning/20">
              <Icon className="h-4 w-4 text-warning" />
            </div>
            {!collapsed && <span className="font-semibold text-warning">{item.label}</span>}
          </div>
        ) : (
          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
            isActive 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}>
            <div className={cn(
              'p-1.5 rounded-lg transition-colors',
              isActive ? 'bg-primary-foreground/20' : 'bg-transparent',
              item.color === 'success' && !isActive && 'bg-success/10'
            )}>
              <Icon className={cn(
                'h-4 w-4',
                item.color === 'success' && !isActive && 'text-success'
              )} />
            </div>
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </div>
        )}
      </NavLink>
    </motion.div>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="left" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-border',
        !sidebarOpen && 'justify-center px-2'
      )}>
        <motion.div
          whileHover={{ rotate: 10 }}
          className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md"
        >
          <Printer className="h-5 w-5" />
        </motion.div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-lg font-bold text-gradient"
            >
              نظام المطبعة
            </motion.h1>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <TooltipProvider>
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className="mb-6">
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {section.title}
                  </motion.p>
                )}
              </AnimatePresence>
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.to || 
                    (item.to !== '/' && location.pathname.startsWith(item.to));
                  
                  return (
                    <SidebarItem
                      key={item.to}
                      item={item}
                      isActive={isActive}
                      collapsed={!sidebarOpen}
                    />
                  );
                })}
              </div>
              
              {sectionIndex < navSections.length - 1 && sidebarOpen && (
                <Separator className="mt-4 opacity-50" />
              )}
            </div>
          ))}
        </TooltipProvider>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'flex items-center gap-3 w-full p-2 rounded-xl transition-colors hover:bg-accent',
              !sidebarOpen && 'justify-center'
            )}>
              <UserAvatar name={user?.full_name || user?.name || 'User'} size="sm" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 text-right"
                  >
                    <p className="text-sm font-medium truncate">{user?.full_name || user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {sidebarOpen && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col border-l border-border bg-card shadow-soft"
      >
        {sidebarContent}
      </motion.aside>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: 280 }}
              animate={{ x: 0 }}
              exit={{ x: 280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 h-full w-72 border-l border-border bg-card shadow-xl lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute left-4 top-4 p-2 rounded-lg hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 lg:px-6 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Desktop Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu (Mobile) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <UserAvatar name={user?.full_name || user?.name || 'User'} size="sm" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{user?.full_name || user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="ml-2 h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 lg:p-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
