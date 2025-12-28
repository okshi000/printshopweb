// أنواع تقارير التدفق النقدي

import type { TrendInfo, TimeSeriesData } from './common.types';

// ملخص التدفق النقدي
export interface CashFlowSummary {
  opening_balance: number;
  total_inflows: number;
  total_outflows: number;
  net_cash_flow: number;
  closing_balance: number;
  period: string;
}

// بطاقات ملخص التدفق النقدي
export interface CashFlowSummaryCards {
  openingBalance: {
    value: number;
    trend: TrendInfo;
  };
  totalInflows: {
    value: number;
    trend: TrendInfo;
  };
  totalOutflows: {
    value: number;
    trend: TrendInfo;
  };
  closingBalance: {
    value: number;
    trend: TrendInfo;
  };
}

// التدفق النقدي حسب الفئة
export interface CashFlowByCategory {
  category: string;
  category_id?: number;
  type: 'inflow' | 'outflow';
  amount: number;
  transaction_count: number;
  percentage: number;
  color?: string;
}

// اتجاه التدفق النقدي
export interface CashFlowTrend extends TimeSeriesData {
  inflows: number;
  outflows: number;
  net_flow: number;
  balance: number;
}

// حركة نقدية
export interface CashMovement {
  movement_id: number;
  type: 'inflow' | 'outflow' | 'transfer';
  category: string;
  amount: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: number;
  description?: string;
  payment_method?: string;
  created_by?: string;
  created_at: string;
}

// تفاصيل التدفقات الداخلة
export interface CashInflow {
  source: string;
  amount: number;
  transaction_count: number;
  percentage: number;
  details: {
    type: string;
    amount: number;
    count: number;
  }[];
}

// تفاصيل التدفقات الخارجة
export interface CashOutflow {
  destination: string;
  amount: number;
  transaction_count: number;
  percentage: number;
  details: {
    type: string;
    amount: number;
    count: number;
  }[];
}

// تقرير التدفق النقدي التفصيلي
export interface DetailedCashFlowReport {
  period: string;
  start_date: string;
  end_date: string;
  
  // الأنشطة التشغيلية
  operating_activities: {
    cash_from_customers: number;
    cash_to_suppliers: number;
    cash_for_expenses: number;
    net_operating_cash: number;
  };
  
  // الأنشطة الاستثمارية
  investing_activities: {
    equipment_purchases: number;
    equipment_sales: number;
    net_investing_cash: number;
  };
  
  // الأنشطة التمويلية
  financing_activities: {
    loans_received: number;
    loans_paid: number;
    withdrawals: number;
    net_financing_cash: number;
  };
  
  // الملخص
  summary: {
    opening_balance: number;
    net_change: number;
    closing_balance: number;
  };
}

// توقعات التدفق النقدي
export interface CashFlowForecast {
  period: string;
  date: string;
  expected_inflows: number;
  expected_outflows: number;
  expected_net_flow: number;
  projected_balance: number;
  confidence_level: 'high' | 'medium' | 'low';
}

// تحليل السيولة
export interface LiquidityAnalysis {
  current_balance: number;
  average_daily_outflow: number;
  days_of_cash: number;
  minimum_required_balance: number;
  liquidity_status: 'healthy' | 'adequate' | 'warning' | 'critical';
  recommendations: string[];
}

// أرصدة الخزائن
export interface CashBalanceBySource {
  source_id: number;
  source_name: string;
  balance: number;
  percentage: number;
  last_transaction_date?: string;
  transaction_count: number;
}

// بيانات الرسم البياني للتدفق النقدي
export interface CashFlowChartData {
  labels: string[];
  datasets: {
    inflows: number[];
    outflows: number[];
    netFlow: number[];
    balance: number[];
  };
}

// مقارنة التدفق النقدي
export interface CashFlowComparison {
  current_period: CashFlowSummary;
  previous_period: CashFlowSummary;
  changes: {
    inflows_change: number;
    outflows_change: number;
    net_flow_change: number;
    balance_change: number;
  };
}
