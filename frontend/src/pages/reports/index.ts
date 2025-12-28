// ملف تصدير صفحات التقارير

// الصفحة الرئيسية
export { ReportsOverview } from './ReportsOverview';
export { ReportsLayout } from './ReportsLayout';

// التقارير المالية
export { FinancialReportsPage } from './financial';

// تقارير المبيعات
export { SalesReportsPage } from './sales';

// تقارير المخزون
export { InventoryReportsPage } from './inventory';

// تقارير العملاء
export { CustomersReportsPage } from './customers';

// تقارير التدفق النقدي
export { CashflowReportsPage } from './cashflow';

// للتوافق الخلفي (سيتم إزالتها لاحقاً)
export { FinancialReportsPage as FinancialReports } from './financial';
export { SalesReportsPage as SalesReports } from './sales';
export { InventoryReportsPage as InventoryReports } from './inventory';
export { CustomersReportsPage as CustomersReports } from './customers';
export { CashflowReportsPage as CashflowReports } from './cashflow';
