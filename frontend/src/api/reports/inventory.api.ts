// API تقارير المخزون

import api from '../index';
import type { ReportFilters } from '@/types/reports/common.types';
import type {
  InventorySummary,
  InventoryItemDetail,
  InventoryMovement,
  StockValuation,
  InventoryByCategory,
  LowStockItem,
  InventoryTurnover,
  InventoryTrend,
  MovementSummary,
} from '@/types/reports/inventory.types';

const BASE_URL = '/reports/inventory';

export const inventoryReportApi = {
  /**
   * الحصول على ملخص المخزون
   */
  getSummary: (filters?: ReportFilters) =>
    api.get<InventorySummary>(`${BASE_URL}/summary`, { params: filters }),

  /**
   * الحصول على تفاصيل عناصر المخزون
   */
  getDetails: (filters?: ReportFilters) =>
    api.get<InventoryItemDetail[]>(`${BASE_URL}/details`, { params: filters }),

  /**
   * الحصول على حركات المخزون
   */
  getMovements: (filters?: ReportFilters) =>
    api.get<InventoryMovement[]>(`${BASE_URL}/movements`, { params: filters }),

  /**
   * الحصول على ملخص الحركات
   */
  getMovementsSummary: (filters?: ReportFilters) =>
    api.get<MovementSummary>(`${BASE_URL}/movements/summary`, { params: filters }),

  /**
   * الحصول على تقييم المخزون
   */
  getValuation: (filters?: ReportFilters) =>
    api.get<StockValuation[]>(`${BASE_URL}/valuation`, { params: filters }),

  /**
   * الحصول على المخزون حسب الفئة
   */
  getByCategory: (filters?: ReportFilters) =>
    api.get<InventoryByCategory[]>(`${BASE_URL}/by-category`, { params: filters }),

  /**
   * الحصول على العناصر منخفضة المخزون
   */
  getLowStock: (filters?: ReportFilters) =>
    api.get<LowStockItem[]>(`${BASE_URL}/low-stock`, { params: filters }),

  /**
   * الحصول على تحليل دوران المخزون
   */
  getTurnover: (filters?: ReportFilters) =>
    api.get<InventoryTurnover[]>(`${BASE_URL}/turnover`, { params: filters }),

  /**
   * الحصول على اتجاه المخزون
   */
  getTrend: (filters?: ReportFilters) =>
    api.get<InventoryTrend[]>(`${BASE_URL}/trend`, { params: filters }),

  /**
   * الحصول على رسم بياني للمخزون
   */
  getChart: (filters?: ReportFilters) =>
    api.get<{ labels: string[]; values: number[]; quantities: number[] }>(`${BASE_URL}/chart`, { params: filters }),

  /**
   * تصدير تقرير المخزون
   */
  export: (type: 'summary' | 'details' | 'movements' | 'valuation', format: 'pdf' | 'excel', filters?: ReportFilters) =>
    api.get(`${BASE_URL}/export/${type}`, {
      params: { format, ...filters },
      responseType: 'blob',
    }),
};

export default inventoryReportApi;
