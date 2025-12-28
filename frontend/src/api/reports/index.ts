// تصدير موحد لجميع APIs التقارير

import { financialApi } from './financial.api';
import { salesApi } from './sales.api';
import { inventoryReportApi } from './inventory.api';
import { customersReportApi, debtsReportApi } from './customers.api';
import { cashflowApi } from './cashflow.api';

// تصدير APIs منفردة
export { financialApi } from './financial.api';
export { salesApi } from './sales.api';
export { inventoryReportApi } from './inventory.api';
export { customersReportApi, debtsReportApi } from './customers.api';
export { cashflowApi } from './cashflow.api';

// تصدير موحد
export const reportsApi = {
  financial: financialApi,
  sales: salesApi,
  inventory: inventoryReportApi,
  customers: customersReportApi,
  debts: debtsReportApi,
  cashflow: cashflowApi,
};

export default reportsApi;
