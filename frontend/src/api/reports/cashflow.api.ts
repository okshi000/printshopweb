// API تقارير التدفق النقدي

import api from '../index';
import type { ReportFilters } from '@/types/reports/common.types';
import type {
  CashFlowSummary,
  CashFlowByCategory,
  CashFlowTrend,
  CashMovement,
  DetailedCashFlowReport,
  CashFlowForecast,
  LiquidityAnalysis,
  CashBalanceBySource,
  CashFlowComparison,
} from '@/types/reports/cashflow.types';

const BASE_URL = '/reports/cash-flow';

export const cashflowApi = {
  /**
   * الحصول على ملخص التدفق النقدي
   */
  getSummary: (filters?: ReportFilters) =>
    api.get<CashFlowSummary>(`${BASE_URL}/summary`, { params: filters }),

  /**
   * الحصول على التدفق النقدي حسب الفئة
   */
  getByCategory: (filters?: ReportFilters) =>
    api.get<CashFlowByCategory[]>(`${BASE_URL}/by-category`, { params: filters }),

  /**
   * الحصول على اتجاه التدفق النقدي
   */
  getTrend: (filters?: ReportFilters) =>
    api.get<CashFlowTrend[]>(`${BASE_URL}/trend`, { params: filters }),

  /**
   * الحصول على الحركات النقدية
   */
  getMovements: (filters?: ReportFilters) =>
    api.get<CashMovement[]>(`${BASE_URL}/movements`, { params: filters }),

  /**
   * الحصول على التقرير التفصيلي
   */
  getDetailedReport: (filters?: ReportFilters) =>
    api.get<DetailedCashFlowReport>(`${BASE_URL}/detailed`, { params: filters }),

  /**
   * الحصول على توقعات التدفق النقدي
   */
  getForecast: (filters?: ReportFilters) =>
    api.get<CashFlowForecast[]>(`${BASE_URL}/forecast`, { params: filters }),

  /**
   * الحصول على تحليل السيولة
   */
  getLiquidityAnalysis: () =>
    api.get<LiquidityAnalysis>(`${BASE_URL}/liquidity`),

  /**
   * الحصول على أرصدة الخزائن
   */
  getBalanceBySource: () =>
    api.get<CashBalanceBySource[]>(`${BASE_URL}/balance-by-source`),

  /**
   * الحصول على مقارنة التدفق النقدي
   */
  getComparison: (filters?: ReportFilters) =>
    api.get<CashFlowComparison>(`${BASE_URL}/comparison`, { params: filters }),

  /**
   * الحصول على رسم بياني للتدفق النقدي
   */
  getChart: (filters?: ReportFilters) =>
    api.get<{ labels: string[]; inflows: number[]; outflows: number[]; balance: number[] }>(
      `${BASE_URL}/chart`,
      { params: filters }
    ),

  /**
   * تصدير تقرير التدفق النقدي
   */
  export: (type: 'summary' | 'detailed' | 'trend', format: 'pdf' | 'excel', filters?: ReportFilters) =>
    api.get(`${BASE_URL}/export/${type}`, {
      params: { format, ...filters },
      responseType: 'blob',
    }),
};

export default cashflowApi;
