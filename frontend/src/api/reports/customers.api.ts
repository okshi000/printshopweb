// API تقارير العملاء والديون

import api from '../index';
import type { ReportFilters } from '@/types/reports/common.types';
import type {
  CustomerSummary,
  CustomerReport,
  CustomerSegmentation,
  CustomerActivity,
  DebtSummary,
  CustomerDebt,
  DebtAging,
  DebtRepaymentHistory,
  DebtTrend,
  CollectionAnalysis,
  AtRiskCustomer,
  CustomerLifetimeValue,
} from '@/types/reports/customers.types';

const CUSTOMERS_URL = '/reports/customers';
const DEBTS_URL = '/reports/debts';

export const customersReportApi = {
  /**
   * الحصول على ملخص العملاء
   */
  getSummary: (filters?: ReportFilters) =>
    api.get<CustomerSummary>(`${CUSTOMERS_URL}/summary`, { params: filters }),

  /**
   * الحصول على قائمة تقارير العملاء
   */
  getReport: (filters?: ReportFilters) =>
    api.get<CustomerReport[]>(`${CUSTOMERS_URL}/report`, { params: filters }),

  /**
   * الحصول على تصنيف العملاء
   */
  getSegmentation: (filters?: ReportFilters) =>
    api.get<CustomerSegmentation[]>(`${CUSTOMERS_URL}/segmentation`, { params: filters }),

  /**
   * الحصول على نشاط العملاء
   */
  getActivity: (filters?: ReportFilters) =>
    api.get<CustomerActivity[]>(`${CUSTOMERS_URL}/activity`, { params: filters }),

  /**
   * الحصول على القيمة الدائمة للعملاء
   */
  getLifetimeValue: (filters?: ReportFilters) =>
    api.get<CustomerLifetimeValue[]>(`${CUSTOMERS_URL}/lifetime-value`, { params: filters }),

  /**
   * تصدير تقرير العملاء
   */
  export: (type: 'summary' | 'details', format: 'pdf' | 'excel', filters?: ReportFilters) =>
    api.get(`${CUSTOMERS_URL}/export/${type}`, {
      params: { format, ...filters },
      responseType: 'blob',
    }),
};

export const debtsReportApi = {
  /**
   * الحصول على ملخص الديون
   */
  getSummary: (filters?: ReportFilters) =>
    api.get<DebtSummary>(`${DEBTS_URL}/summary`, { params: filters }),

  /**
   * الحصول على ديون العملاء
   */
  getByCustomer: (filters?: ReportFilters) =>
    api.get<CustomerDebt[]>(`${DEBTS_URL}/by-customer`, { params: filters }),

  /**
   * الحصول على تقادم الديون
   */
  getAging: (filters?: ReportFilters) =>
    api.get<DebtAging[]>(`${DEBTS_URL}/aging`, { params: filters }),

  /**
   * الحصول على سجل السداد
   */
  getRepaymentHistory: (filters?: ReportFilters) =>
    api.get<DebtRepaymentHistory[]>(`${DEBTS_URL}/repayment-history`, { params: filters }),

  /**
   * الحصول على اتجاه الديون
   */
  getTrend: (filters?: ReportFilters) =>
    api.get<DebtTrend[]>(`${DEBTS_URL}/trend`, { params: filters }),

  /**
   * الحصول على تحليل التحصيل
   */
  getCollectionAnalysis: (filters?: ReportFilters) =>
    api.get<CollectionAnalysis>(`${DEBTS_URL}/collection-analysis`, { params: filters }),

  /**
   * الحصول على العملاء المعرضين للمخاطر
   */
  getAtRiskCustomers: (filters?: ReportFilters) =>
    api.get<AtRiskCustomer[]>(`${DEBTS_URL}/at-risk`, { params: filters }),

  /**
   * تصدير تقرير الديون
   */
  export: (type: 'summary' | 'by-customer' | 'aging', format: 'pdf' | 'excel', filters?: ReportFilters) =>
    api.get(`${DEBTS_URL}/export/${type}`, {
      params: { format, ...filters },
      responseType: 'blob',
    }),
};

export { customersReportApi as default };
