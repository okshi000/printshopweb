import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// الصفحات المتاحة بالترتيب الأفضل لكل مستخدم
const PAGE_PRIORITY: Array<{ permission: string; path: string }> = [
  { permission: 'dashboard.view',   path: '/dashboard' },
  { permission: 'invoices.view',    path: '/invoices' },
  { permission: 'customers.view',   path: '/customers' },
  { permission: 'products.view',    path: '/products' },
  { permission: 'suppliers.view',   path: '/suppliers' },
  { permission: 'expenses.view',    path: '/expenses' },
  { permission: 'cash.view',        path: '/cash' },
  { permission: 'debts.view',       path: '/debts' },
  { permission: 'inventory.view',   path: '/inventory' },
  { permission: 'reports.view',     path: '/reports' },
  { permission: 'activity.view',    path: '/activity' },
  { permission: 'users.view',       path: '/users' },
];

/**
 * يُعيد أول مسار متاح للمستخدم بناءً على صلاحياته.
 * المالك يذهب للـ dashboard مباشرةً.
 */
export function useFirstAllowedPath(): string {
  const { hasPermission, isOwner } = useAuth();

  if (isOwner) return '/dashboard';

  for (const page of PAGE_PRIORITY) {
    if (hasPermission(page.permission)) {
      return page.path;
    }
  }

  // لا توجد صلاحيات على الإطلاق
  return '/no-access';
}

/**
 * مكوّن يُعيد توجيه المستخدم لأول صفحة متاحة له.
 * يُستخدم كـ index route بدلاً من DashboardPage مباشرةً.
 */
export default function DefaultRedirect() {
  const firstPath = useFirstAllowedPath();
  return <Navigate to={firstPath} replace />;
}
