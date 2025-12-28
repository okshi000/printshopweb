// الأنواع المشتركة للتقارير

// فلاتر التقارير الأساسية
export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  category_id?: number;
  customer_id?: number;
  product_id?: number;
  supplier_id?: number;
  status?: string;
  limit?: number;
  page?: number;
}

// نطاق التاريخ
export interface DateRange {
  from: Date;
  to: Date;
}

// فترات التقارير
export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';

// حالة الاتجاه
export type TrendDirection = 'up' | 'down' | 'stable';

// معلومات الاتجاه
export interface TrendInfo {
  value: number;
  direction: TrendDirection;
  label?: string;
}

// بيانات الرسم البياني الأساسية
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// بيانات السلاسل الزمنية
export interface TimeSeriesData {
  date: string;
  period: string;
  value: number;
}

// بيانات المقارنة
export interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

// ملخص عام
export interface GeneralSummary {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: TrendInfo;
  icon?: string;
  color?: string;
}

// حالة تحميل التقرير
export interface ReportLoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}

// خيارات التصدير
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  filename?: string;
  title?: string;
  includeCharts?: boolean;
  orientation?: 'portrait' | 'landscape';
}

// استجابة API للتقارير
export interface ReportResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    last_page?: number;
  };
  summary?: Record<string, unknown>;
}

// عمود الجدول
export interface TableColumn<T = unknown> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string | number;
}

// خيارات الترتيب
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// خيارات التصفح
export interface PaginationOptions {
  page: number;
  perPage: number;
  total: number;
}

// ألوان الرسوم البيانية
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  orange: '#f97316',
} as const;

export const CHART_COLOR_ARRAY = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
];

// تنسيق العملة
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ar-LY', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0) + ' د.ل';
};

// تنسيق النسبة المئوية
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// تنسيق الأرقام
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ar-LY').format(value || 0);
};
