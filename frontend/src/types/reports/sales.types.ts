// أنواع تقارير المبيعات

import type { TrendInfo, TimeSeriesData } from './common.types';

// ملخص المبيعات
export interface SalesSummary {
  total_sales: number;
  total_invoices: number;
  average_invoice_value: number;
  paid_amount: number;
  pending_amount: number;
  discount_amount: number;
  return_amount: number;
  net_sales: number;
  growth_rate: number;
}

// بطاقات ملخص المبيعات
export interface SalesSummaryCards {
  totalSales: {
    value: number;
    trend: TrendInfo;
  };
  invoiceCount: {
    value: number;
    trend: TrendInfo;
  };
  averageValue: {
    value: number;
    trend: TrendInfo;
  };
  pendingPayments: {
    value: number;
    trend: TrendInfo;
  };
}

// المبيعات حسب العميل
export interface SalesByCustomer {
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  total_purchases: number;
  invoice_count: number;
  paid_amount: number;
  pending_amount: number;
  last_purchase_date: string;
  average_order_value: number;
  rank?: number;
}

// المبيعات حسب المنتج
export interface SalesByProduct {
  product_id: number;
  product_name: string;
  category_name?: string;
  quantity_sold: number;
  total_revenue: number;
  average_price: number;
  profit: number;
  profit_margin: number;
  rank?: number;
}

// المبيعات حسب الفترة
export interface SalesByPeriod extends TimeSeriesData {
  total_sales: number;
  invoice_count: number;
  average_value: number;
  growth_rate?: number;
}

// أفضل المنتجات مبيعاً
export interface TopSellingProduct {
  product_id: number;
  product_name: string;
  category_name?: string;
  quantity_sold: number;
  revenue: number;
  percentage: number;
  rank: number;
  color?: string;
}

// أفضل العملاء
export interface TopCustomer {
  customer_id: number;
  customer_name: string;
  total_purchases: number;
  invoice_count: number;
  percentage: number;
  rank: number;
}

// المبيعات حسب الفئة
export interface SalesByCategory {
  category_id: number;
  category_name: string;
  total_sales: number;
  product_count: number;
  quantity_sold: number;
  percentage: number;
  color?: string;
}

// تفاصيل الفاتورة للتقارير
export interface InvoiceReportItem {
  invoice_id: number;
  invoice_number: string;
  customer_name: string;
  invoice_date: string;
  due_date?: string;
  total: number;
  paid: number;
  remaining: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  items_count: number;
}

// تحليل المبيعات
export interface SalesAnalysis {
  period: string;
  current_period: {
    sales: number;
    invoices: number;
    average: number;
  };
  previous_period: {
    sales: number;
    invoices: number;
    average: number;
  };
  changes: {
    sales_change: number;
    invoices_change: number;
    average_change: number;
  };
  top_products: TopSellingProduct[];
  top_customers: TopCustomer[];
}

// معدل تحويل المبيعات
export interface SalesConversion {
  quotes_count: number;
  invoices_count: number;
  conversion_rate: number;
  average_time_to_convert: number;
}

// بيانات الرسم البياني للمبيعات
export interface SalesChartData {
  labels: string[];
  datasets: {
    sales: number[];
    invoices: number[];
    average: number[];
  };
}

// تقرير المبيعات اليومي
export interface DailySalesReport {
  date: string;
  total_sales: number;
  invoice_count: number;
  cash_sales: number;
  credit_sales: number;
  returns: number;
  net_sales: number;
}
