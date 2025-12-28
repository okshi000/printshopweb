// أنواع التقارير المالية

import type { TrendInfo, TimeSeriesData } from './common.types';

// الملخص المالي
export interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  total_debts: number;
  total_cash: number;
  period: string;
}

// بطاقات الملخص المالي
export interface FinancialSummaryCards {
  revenue: {
    value: number;
    trend: TrendInfo;
  };
  expenses: {
    value: number;
    trend: TrendInfo;
  };
  profit: {
    value: number;
    trend: TrendInfo;
  };
  cash: {
    value: number;
    trend: TrendInfo;
  };
}

// الإيرادات حسب الفترة
export interface RevenueByPeriod extends TimeSeriesData {
  revenue: number;
  expenses: number;
  profit: number;
  invoice_count: number;
}

// تفصيل المصروفات
export interface ExpenseBreakdown {
  category: string;
  category_id: number;
  amount: number;
  percentage: number;
  count: number;
  average: number;
}

// المصروفات حسب النوع
export interface ExpenseByType {
  type_id: number;
  type_name: string;
  total_amount: number;
  expense_count: number;
  percentage: number;
  average_amount: number;
  color?: string;
}

// اتجاه المصروفات
export interface ExpenseTrend {
  period: string;
  date: string;
  amount: number;
  count: number;
  categories: ExpenseBreakdown[];
}

// تقرير الأرباح والخسائر
export interface ProfitLossReport {
  period: string;
  start_date: string;
  end_date: string;
  
  // الإيرادات
  revenue: {
    total: number;
    breakdown: {
      sales: number;
      services: number;
      other: number;
    };
  };
  
  // تكلفة المبيعات
  cost_of_goods_sold: number;
  
  // الربح الإجمالي
  gross_profit: number;
  gross_margin: number;
  
  // المصروفات التشغيلية
  operating_expenses: {
    total: number;
    breakdown: ExpenseBreakdown[];
  };
  
  // صافي الربح التشغيلي
  operating_profit: number;
  operating_margin: number;
  
  // صافي الربح
  net_profit: number;
  net_margin: number;
  
  // مقارنة بالفترة السابقة
  comparison?: {
    revenue_change: number;
    profit_change: number;
    expense_change: number;
  };
}

// قائمة الدخل
export interface IncomeStatement {
  period: string;
  revenue: number;
  cost_of_sales: number;
  gross_profit: number;
  operating_expenses: number;
  operating_income: number;
  other_income: number;
  other_expenses: number;
  net_income: number;
}

// الميزانية العمومية
export interface BalanceSheet {
  date: string;
  assets: {
    current: {
      cash: number;
      receivables: number;
      inventory: number;
      total: number;
    };
    fixed: {
      equipment: number;
      other: number;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      payables: number;
      debts: number;
      total: number;
    };
    total: number;
  };
  equity: {
    capital: number;
    retained_earnings: number;
    total: number;
  };
}

// مؤشرات الأداء المالي
export interface FinancialKPIs {
  profit_margin: number;
  return_on_assets: number;
  current_ratio: number;
  debt_ratio: number;
  revenue_growth: number;
  expense_ratio: number;
}

// بيانات الرسم البياني المالي
export interface FinancialChartData {
  labels: string[];
  datasets: {
    revenue: number[];
    expenses: number[];
    profit: number[];
  };
}
