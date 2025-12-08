import api from './index';
import type {
  FinancialSummary,
  RevenueByPeriod,
  ExpenseBreakdown,
  SalesReport,
  SalesByCustomer,
  SalesByProduct,
  TopSellingProducts,
  InventoryReport,
  InventoryItemDetail,
  InventoryMovementReport,
  StockValuation,
  SupplierReport,
  CustomerReport,
  DebtReport,
  DebtByCustomer,
  CashFlowReport,
  CashFlowTrend,
  ProfitLossReport,
  DashboardMetrics,
  ReportFilters,
} from '@/types/reports';

const API_BASE = '/reports-v2';

// Financial Reports
export const financialReportsApi = {
  getSummary: (filters?: ReportFilters) =>
    api.get<FinancialSummary>(`${API_BASE}/financial/summary`, { params: filters }),

  getRevenueByPeriod: (filters?: ReportFilters) =>
    api.get<RevenueByPeriod[]>(`${API_BASE}/financial/revenue-by-period`, { params: filters }),

  getExpenseBreakdown: (filters?: ReportFilters) =>
    api.get<ExpenseBreakdown[]>(`${API_BASE}/financial/expense-breakdown`, { params: filters }),

  getProfitLoss: (filters?: ReportFilters) =>
    api.get<ProfitLossReport>(`${API_BASE}/financial/profit-loss`, { params: filters }),
};

// Sales Reports
export const salesReportsApi = {
  getSummary: (filters?: ReportFilters) =>
    api.get<SalesReport>(`${API_BASE}/sales/summary`, { params: filters }),

  getByCustomer: (filters?: ReportFilters) =>
    api.get<SalesByCustomer[]>(`${API_BASE}/sales/by-customer`, { params: filters }),

  getByProduct: (filters?: ReportFilters) =>
    api.get<SalesByProduct[]>(`${API_BASE}/sales/by-product`, { params: filters }),

  getTopProducts: (filters?: ReportFilters & { limit?: number }) =>
    api.get<TopSellingProducts[]>(`${API_BASE}/sales/top-products`, { params: filters }),
};

// Inventory Reports
export const inventoryReportsApi = {
  getSummary: (filters?: ReportFilters) =>
    api.get<InventoryReport>(`${API_BASE}/inventory/summary`, { params: filters }),

  getDetails: (filters?: ReportFilters) =>
    api.get<InventoryItemDetail[]>(`${API_BASE}/inventory/details`, { params: filters }),

  getMovements: (filters?: ReportFilters) =>
    api.get<InventoryMovementReport[]>(`${API_BASE}/inventory/movements`, { params: filters }),

  getValuation: (filters?: ReportFilters) =>
    api.get<StockValuation[]>(`${API_BASE}/inventory/valuation`, { params: filters }),
};

// Supplier Reports
export const supplierReportsApi = {
  getSummary: (filters?: ReportFilters) =>
    api.get<SupplierReport[]>(`${API_BASE}/suppliers/summary`, { params: filters }),
};

// Customer Reports
export const customerReportsApi = {
  getSummary: (filters?: ReportFilters) =>
    api.get<CustomerReport[]>(`${API_BASE}/customers/summary`, { params: filters }),
};

// Debt Reports
export const debtReportsApi = {
  getSummary: (filters?: ReportFilters) =>
    api.get<DebtReport>(`${API_BASE}/debts/summary`, { params: filters }),

  getByCustomer: (filters?: ReportFilters) =>
    api.get<DebtByCustomer[]>(`${API_BASE}/debts/by-customer`, { params: filters }),
};

// Cash Flow Reports
export const cashFlowReportsApi = {
  getSummary: (filters?: ReportFilters) =>
    api.get<CashFlowReport>(`${API_BASE}/cash-flow/summary`, { params: filters }),

  getTrend: (filters?: ReportFilters) =>
    api.get<CashFlowTrend[]>(`${API_BASE}/cash-flow/trend`, { params: filters }),
};

// Dashboard Reports
export const dashboardReportsApi = {
  getMetrics: () =>
    api.get<DashboardMetrics>(`${API_BASE}/dashboard/metrics`),
};

// Consolidated export
export const reportsApi = {
  financial: financialReportsApi,
  sales: salesReportsApi,
  inventory: inventoryReportsApi,
  suppliers: supplierReportsApi,
  customers: customerReportsApi,
  debts: debtReportsApi,
  cashFlow: cashFlowReportsApi,
  dashboard: dashboardReportsApi,
};
