// API تقارير المبيعات

import api from '../index';
import type { ReportFilters } from '@/types/reports/common.types';
import type {
  SalesSummary,
  SalesByCustomer,
  SalesByProduct,
  SalesByPeriod,
  TopSellingProduct,
  TopCustomer,
  SalesByCategory,
  InvoiceReportItem,
  SalesAnalysis,
  DailySalesReport,
} from '@/types/reports/sales.types';

const BASE_URL = '/reports/sales';

export const salesApi = {
  /**
   * الحصول على ملخص المبيعات
   */
  getSummary: (filters?: ReportFilters) =>
    api.get<SalesSummary>(`${BASE_URL}/summary`, { params: filters }),

  /**
   * الحصول على المبيعات حسب العميل
   */
  getByCustomer: (filters?: ReportFilters) =>
    api.get<SalesByCustomer[]>(`${BASE_URL}/by-customer`, { params: filters }),

  /**
   * الحصول على المبيعات حسب المنتج
   */
  getByProduct: (filters?: ReportFilters) =>
    api.get<SalesByProduct[]>(`${BASE_URL}/by-product`, { params: filters }),

  /**
   * الحصول على المبيعات حسب الفترة
   */
  getByPeriod: (filters?: ReportFilters) =>
    api.get<SalesByPeriod[]>(`${BASE_URL}/by-period`, { params: filters }),

  /**
   * الحصول على أفضل المنتجات مبيعاً
   */
  getTopProducts: (filters?: ReportFilters & { limit?: number }) =>
    api.get<TopSellingProduct[]>(`${BASE_URL}/top-products`, { params: filters }),

  /**
   * الحصول على أفضل العملاء
   */
  getTopCustomers: (filters?: ReportFilters & { limit?: number }) =>
    api.get<TopCustomer[]>(`${BASE_URL}/top-customers`, { params: filters }),

  /**
   * الحصول على المبيعات حسب الفئة
   */
  getByCategory: (filters?: ReportFilters) =>
    api.get<SalesByCategory[]>(`${BASE_URL}/by-category`, { params: filters }),

  /**
   * الحصول على قائمة الفواتير
   */
  getInvoices: (filters?: ReportFilters) =>
    api.get<InvoiceReportItem[]>(`${BASE_URL}/invoices`, { params: filters }),

  /**
   * الحصول على تحليل المبيعات
   */
  getAnalysis: (filters?: ReportFilters) =>
    api.get<SalesAnalysis>(`${BASE_URL}/analysis`, { params: filters }),

  /**
   * الحصول على تقرير المبيعات اليومي
   */
  getDailyReport: (date?: string) =>
    api.get<DailySalesReport>(`${BASE_URL}/daily`, { params: { date } }),

  /**
   * الحصول على رسم بياني للمبيعات
   */
  getChart: (filters?: ReportFilters) =>
    api.get<{ labels: string[]; data: number[] }>(`${BASE_URL}/chart`, { params: filters }),

  /**
   * تصدير تقرير المبيعات
   */
  export: (type: 'summary' | 'by-customer' | 'by-product', format: 'pdf' | 'excel', filters?: ReportFilters) =>
    api.get(`${BASE_URL}/export/${type}`, {
      params: { format, ...filters },
      responseType: 'blob',
    }),
};

export default salesApi;
