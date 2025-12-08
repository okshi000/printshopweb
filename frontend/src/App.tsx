import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import ProductsPage from './pages/ProductsPage';
import InvoicesPage from './pages/InvoicesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import ViewInvoicePage from './pages/ViewInvoicePage';
import PrintInvoicePage from './pages/PrintInvoicePage';
import ExpensesPage from './pages/ExpensesPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import CashPage from './pages/CashPage';
import DebtsPage from './pages/DebtsPage';
import ActivityPage from './pages/ActivityPage';
import InventoryPage from './pages/InventoryPage';
import AccountantDashboardPage from './pages/accountant/AccountantDashboardPage';
import IncomeStatementPage from './pages/accountant/IncomeStatementPage';
import BalanceSheetPage from './pages/accountant/BalanceSheetPage';
import UsersPage from './pages/users/UsersPage';
import CustomerViewPage from './pages/customers/CustomerViewPage';
import SupplierViewPage from './pages/suppliers/SupplierViewPage';
import {
  ReportsOverview,
  FinancialReports,
  SalesReports,
  InventoryReports,
} from './pages/reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="printshop-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="customers/:id" element={<CustomerViewPage />} />
                  <Route path="suppliers" element={<SuppliersPage />} />
                  <Route path="suppliers/:id" element={<SupplierViewPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="invoices/create" element={<CreateInvoicePage />} />
                  <Route path="invoices/:id" element={<ViewInvoicePage />} />
                  <Route path="invoices/:id/edit" element={<CreateInvoicePage />} />
                  <Route path="invoices/:id/print" element={<PrintInvoicePage />} />
                  <Route path="cash" element={<CashPage />} />
                  <Route path="expenses" element={<ExpensesPage />} />
                  <Route path="withdrawals" element={<WithdrawalsPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="debts" element={<DebtsPage />} />
                  <Route path="reports" element={<ReportsOverview />} />
                  <Route path="reports/financial" element={<FinancialReports />} />
                  <Route path="reports/sales" element={<SalesReports />} />
                  <Route path="reports/inventory" element={<InventoryReports />} />
                  <Route path="activity" element={<ActivityPage />} />
                  <Route path="accountant" element={<AccountantDashboardPage />} />
                  <Route path="accountant/income-statement" element={<IncomeStatementPage />} />
                  <Route path="accountant/balance-sheet" element={<BalanceSheetPage />} />
                  <Route path="users" element={<UsersPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
        <Toaster position="top-left" richColors closeButton />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
