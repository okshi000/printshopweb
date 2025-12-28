// API التقارير المالية

import api from '../index';
import type { ReportFilters } from '@/types/reports/common.types';
import type {
  FinancialSummary,
  RevenueByPeriod,
  ExpenseBreakdown,
  ProfitLossReport,
  IncomeStatement,
  BalanceSheet,
  FinancialKPIs,
} from '@/types/reports/financial.types';

const BASE_URL = '/reports/financial';

export const financialApi = {
  /**
   * الحصول على الملخص المالي
   */
  getSummary: (filters?: ReportFilters) =>
    api.get<FinancialSummary>(`${BASE_URL}/summary`, { params: filters }),

  /**
   * الحصول على الإيرادات حسب الفترة
   */
  getRevenueByPeriod: (filters?: ReportFilters) =>
    api.get<RevenueByPeriod[]>(`${BASE_URL}/revenue`, { params: filters }),

  /**
   * الحصول على تفصيل المصروفات
   */
  getExpenseBreakdown: (filters?: ReportFilters) =>
    api.get<ExpenseBreakdown[]>(`${BASE_URL}/expenses`, { params: filters }),

  /**
   * الحصول على تقرير الأرباح والخسائر
   */
  getProfitLoss: (filters?: ReportFilters) =>
    api.get<ProfitLossReport>(`${BASE_URL}/profit-loss`, { params: filters }),

  /**
   * الحصول على قائمة الدخل
   */
  getIncomeStatement: (filters?: ReportFilters) =>
    api.get<IncomeStatement>(`${BASE_URL}/income-statement`, { params: filters }),

  /**
   * الحصول على الميزانية العمومية
   */
  getBalanceSheet: (date?: string) =>
    api.get<BalanceSheet>(`${BASE_URL}/balance-sheet`, { params: { date } }),

  /**
   * الحصول على مؤشرات الأداء المالي
   */
  getKPIs: (filters?: ReportFilters) =>
    api.get<FinancialKPIs>(`${BASE_URL}/kpis`, { params: filters }),

  /**
   * تصدير التقرير المالي
   */
  export: (type: 'summary' | 'profit-loss' | 'income-statement', format: 'pdf' | 'excel', filters?: ReportFilters) =>
    api.get(`${BASE_URL}/export/${type}`, {
      params: { format, ...filters },
      responseType: 'blob',
    }),
};

export default financialApi;
