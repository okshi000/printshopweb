// أنواع تقارير العملاء والديون

import type { TrendInfo, TimeSeriesData } from './common.types';

// ملخص العملاء
export interface CustomerSummary {
  total_customers: number;
  active_customers: number;
  new_customers: number;
  inactive_customers: number;
  total_revenue: number;
  average_customer_value: number;
}

// تقرير العميل
export interface CustomerReport {
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  total_purchases: number;
  total_paid: number;
  total_debt: number;
  invoice_count: number;
  last_purchase_date: string;
  first_purchase_date: string;
  average_order_value: number;
  payment_reliability: 'excellent' | 'good' | 'fair' | 'poor';
}

// تصنيف العملاء
export interface CustomerSegmentation {
  segment: 'vip' | 'regular' | 'occasional' | 'new' | 'inactive';
  segment_name: string;
  customer_count: number;
  total_revenue: number;
  average_order_value: number;
  percentage: number;
  color: string;
}

// نشاط العميل
export interface CustomerActivity {
  customer_id: number;
  customer_name: string;
  last_activity_date: string;
  activity_type: string;
  purchase_frequency: number;
  days_since_last_purchase: number;
  status: 'active' | 'at_risk' | 'inactive' | 'churned';
}

// ملخص الديون
export interface DebtSummary {
  total_debts: number;
  total_repaid: number;
  total_pending: number;
  debtor_count: number;
  average_debt: number;
  overdue_amount: number;
  overdue_count: number;
}

// بطاقات ملخص الديون
export interface DebtSummaryCards {
  totalDebts: {
    value: number;
    trend: TrendInfo;
  };
  pendingAmount: {
    value: number;
    trend: TrendInfo;
  };
  overdueAmount: {
    value: number;
    trend: TrendInfo;
  };
  collectionRate: {
    value: number;
    trend: TrendInfo;
  };
}

// ديون العميل
export interface CustomerDebt {
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  total_debt: number;
  paid_amount: number;
  remaining_amount: number;
  oldest_debt_date?: string;
  days_overdue: number;
  invoice_count: number;
  last_payment_date?: string;
  status: 'current' | 'overdue' | 'critical' | 'written_off';
}

// تقادم الديون
export interface DebtAging {
  age_range: string;
  range_label: string;
  debt_count: number;
  customer_count: number;
  total_amount: number;
  percentage: number;
  color: string;
}

// سجل سداد الديون
export interface DebtRepaymentHistory {
  repayment_id: number;
  customer_name: string;
  debt_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  remaining_after: number;
  notes?: string;
}

// اتجاه الديون
export interface DebtTrend extends TimeSeriesData {
  new_debts: number;
  repayments: number;
  net_change: number;
  total_outstanding: number;
}

// تحليل التحصيل
export interface CollectionAnalysis {
  period: string;
  total_due: number;
  total_collected: number;
  collection_rate: number;
  average_days_to_collect: number;
  by_age_group: DebtAging[];
}

// عميل معرض للمخاطر
export interface AtRiskCustomer {
  customer_id: number;
  customer_name: string;
  total_debt: number;
  days_overdue: number;
  last_contact_date?: string;
  risk_score: number;
  recommended_action: string;
}

// بيانات الرسم البياني للعملاء
export interface CustomerChartData {
  labels: string[];
  datasets: {
    customers: number[];
    revenue: number[];
    debts: number[];
  };
}

// إحصائيات القيمة الدائمة للعميل
export interface CustomerLifetimeValue {
  customer_id: number;
  customer_name: string;
  total_revenue: number;
  purchase_count: number;
  average_order_value: number;
  customer_age_days: number;
  estimated_ltv: number;
  ltv_segment: 'high' | 'medium' | 'low';
}
