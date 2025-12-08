// أنواع التقارير المالية
export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalDebts: number;
  totalCash: number;
  period: string;
}

export interface RevenueByPeriod {
  period: string;
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

// تقارير المبيعات
export interface SalesReport {
  totalSales: number;
  totalInvoices: number;
  averageInvoiceValue: number;
  paidAmount: number;
  pendingAmount: number;
  discountAmount: number;
}

export interface SalesByCustomer {
  customerId: number;
  customerName: string;
  totalPurchases: number;
  invoiceCount: number;
  lastPurchaseDate: string;
  averageOrderValue: number;
}

export interface SalesByProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  profitMargin: number;
}

export interface SalesByPeriod {
  period: string;
  date: string;
  totalSales: number;
  invoiceCount: number;
  averageValue: number;
}

export interface TopSellingProducts {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
  rank: number;
}

// تقارير المخزون
export interface InventoryReport {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  averageStockValue: number;
}

export interface InventoryItemDetail {
  itemId: number;
  itemName: string;
  currentQuantity: number;
  unitCost: number;
  totalValue: number;
  reorderLevel: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastRestockDate: string;
}

export interface InventoryMovementReport {
  date: string;
  itemName: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  reference: string;
}

export interface StockValuation {
  category: string;
  itemCount: number;
  totalQuantity: number;
  totalValue: number;
  percentage: number;
}

// تقارير الموردين
export interface SupplierReport {
  supplierId: number;
  supplierName: string;
  totalPurchases: number;
  totalPaid: number;
  totalPending: number;
  orderCount: number;
  lastOrderDate: string;
}

export interface SupplierPerformance {
  supplierId: number;
  supplierName: string;
  onTimeDeliveryRate: number;
  qualityRating: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface PurchasesBySupplier {
  period: string;
  date: string;
  supplierId: number;
  supplierName: string;
  amount: number;
  orderCount: number;
}

// تقارير العملاء
export interface CustomerReport {
  customerId: number;
  customerName: string;
  totalPurchases: number;
  totalPaid: number;
  totalDebt: number;
  invoiceCount: number;
  lastPurchaseDate: string;
  customerSince: string;
}

export interface CustomerSegmentation {
  segment: string;
  customerCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  percentage: number;
}

export interface CustomerActivity {
  customerId: number;
  customerName: string;
  lastActivity: string;
  activityType: string;
  frequency: number;
  status: 'active' | 'inactive' | 'at_risk';
}

// تقارير الديون
export interface DebtReport {
  totalDebts: number;
  totalRepaid: number;
  totalPending: number;
  debtorCount: number;
  averageDebtAge: number;
}

export interface DebtByCustomer {
  customerId: number;
  customerName: string;
  totalDebt: number;
  paidAmount: number;
  remainingAmount: number;
  daysOverdue: number;
  status: 'current' | 'overdue' | 'critical';
}

export interface DebtAging {
  ageRange: string;
  debtCount: number;
  totalAmount: number;
  percentage: number;
}

// تقارير التدفق النقدي
export interface CashFlowReport {
  openingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  closingBalance: number;
  netCashFlow: number;
}

export interface CashFlowByCategory {
  category: string;
  type: 'inflow' | 'outflow';
  amount: number;
  transactionCount: number;
  percentage: number;
}

export interface CashFlowTrend {
  period: string;
  date: string;
  inflows: number;
  outflows: number;
  netFlow: number;
  balance: number;
}

// تقارير المصروفات
export interface ExpenseReport {
  totalExpenses: number;
  expenseCount: number;
  averageExpense: number;
  categoryCount: number;
  topCategory: string;
}

export interface ExpenseByType {
  typeId: number;
  typeName: string;
  totalAmount: number;
  expenseCount: number;
  percentage: number;
  averageAmount: number;
}

export interface ExpenseTrend {
  period: string;
  date: string;
  amount: number;
  count: number;
  category: string;
}

// تقارير الأرباح والخسائر
export interface ProfitLossReport {
  period: string;
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  profitMargin: number;
}

export interface ProfitByProduct {
  productId: number;
  productName: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  quantitySold: number;
}

export interface ProfitTrend {
  period: string;
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

// فلاتر التقارير
export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  customer_id?: number;
  customerId?: number;
  supplier_id?: number;
  supplierId?: number;
  product_id?: number;
  productId?: number;
  category_id?: number;
  categoryId?: number;
  status?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  limit?: number;
}

// بيانات الرسوم البيانية
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  fill?: boolean;
}

// نوع عام للتقرير
export interface Report<T> {
  data: T;
  summary: Record<string, any>;
  metadata: {
    generatedAt: string;
    period: string;
    filters: ReportFilters;
  };
}

// تقارير الأداء
export interface PerformanceMetrics {
  kpi: string;
  value: number;
  target: number;
  achievement: number;
  trend: 'up' | 'down' | 'stable';
  previousPeriod: number;
  change: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalInvoices: number;
  pendingPayments: number;
  lowStockItems: number;
  activeCustomers: number;
  revenueGrowth: number;
  profitMargin: number;
}

// تقارير المقارنة
export interface ComparisonReport {
  current: any;
  previous: any;
  change: number;
  changePercentage: number;
  trend: 'improving' | 'declining' | 'stable';
}
