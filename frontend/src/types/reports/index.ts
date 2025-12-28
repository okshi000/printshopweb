// تصدير جميع أنواع التقارير

// الأنواع المشتركة
export * from './common.types';

// التقارير المالية
export * from './financial.types';

// تقارير المبيعات
export * from './sales.types';

// تقارير المخزون
export * from './inventory.types';

// تقارير العملاء والديون
export * from './customers.types';

// تقارير التدفق النقدي
export * from './cashflow.types';

// إعادة تصدير للتوافق مع الكود القديم
export type {
  ReportFilters,
  DateRange,
  ReportPeriod,
  TrendDirection,
  TrendInfo,
  ChartDataPoint,
  ExportOptions,
} from './common.types';

export type {
  FinancialSummary,
  RevenueByPeriod,
  ExpenseBreakdown,
  ProfitLossReport,
} from './financial.types';

export type {
  SalesSummary,
  SalesByCustomer,
  SalesByProduct,
  TopSellingProduct,
} from './sales.types';

export type {
  InventorySummary,
  InventoryItemDetail,
  InventoryMovement,
  StockValuation,
} from './inventory.types';

export type {
  CustomerReport,
  CustomerDebt,
  DebtSummary,
  DebtAging,
} from './customers.types';

export type {
  CashFlowSummary,
  CashFlowTrend,
  CashFlowByCategory,
} from './cashflow.types';
