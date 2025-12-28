// أنواع تقارير المخزون

import type { TrendInfo } from './common.types';

// ملخص المخزون
export interface InventorySummary {
  total_items: number;
  total_value: number;
  total_quantity: number;
  low_stock_items: number;
  out_of_stock_items: number;
  categories_count: number;
  average_item_value: number;
}

// بطاقات ملخص المخزون
export interface InventorySummaryCards {
  totalItems: {
    value: number;
    trend: TrendInfo;
  };
  totalValue: {
    value: number;
    trend: TrendInfo;
  };
  lowStock: {
    value: number;
    trend: TrendInfo;
  };
  outOfStock: {
    value: number;
    trend: TrendInfo;
  };
}

// تفاصيل عنصر المخزون
export interface InventoryItemDetail {
  item_id: number;
  item_name: string;
  sku?: string;
  category_name?: string;
  current_quantity: number;
  unit: string;
  unit_cost: number;
  total_value: number;
  reorder_level: number;
  max_level?: number;
  last_restock_date?: string;
  last_movement_date?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  supplier_name?: string;
}

// حركة المخزون
export interface InventoryMovement {
  movement_id: number;
  item_id: number;
  item_name: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  unit_cost: number;
  total_cost: number;
  reference_type?: string;
  reference_id?: number;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

// تقييم المخزون
export interface StockValuation {
  category_id?: number;
  category_name: string;
  item_count: number;
  total_quantity: number;
  total_value: number;
  percentage: number;
  average_cost: number;
  color?: string;
}

// المخزون حسب الفئة
export interface InventoryByCategory {
  category_id: number;
  category_name: string;
  item_count: number;
  total_quantity: number;
  total_value: number;
  low_stock_count: number;
  percentage: number;
}

// العناصر منخفضة المخزون
export interface LowStockItem {
  item_id: number;
  item_name: string;
  current_quantity: number;
  reorder_level: number;
  shortage: number;
  estimated_reorder_quantity: number;
  supplier_name?: string;
  last_restock_date?: string;
  days_since_restock?: number;
}

// تحليل دوران المخزون
export interface InventoryTurnover {
  item_id: number;
  item_name: string;
  average_inventory: number;
  cost_of_goods_sold: number;
  turnover_ratio: number;
  days_to_sell: number;
  status: 'fast_moving' | 'normal' | 'slow_moving' | 'dead_stock';
}

// تقرير الجرد
export interface StockCountReport {
  count_date: string;
  total_items_counted: number;
  items_matched: number;
  items_with_variance: number;
  total_variance_value: number;
  variance_items: {
    item_id: number;
    item_name: string;
    system_quantity: number;
    counted_quantity: number;
    variance: number;
    variance_value: number;
  }[];
}

// اتجاه المخزون
export interface InventoryTrend {
  period: string;
  date: string;
  total_value: number;
  total_quantity: number;
  items_in: number;
  items_out: number;
  net_change: number;
}

// تقرير انتهاء الصلاحية
export interface ExpiryReport {
  item_id: number;
  item_name: string;
  batch_number?: string;
  quantity: number;
  expiry_date: string;
  days_to_expiry: number;
  status: 'expired' | 'expiring_soon' | 'valid';
  value: number;
}

// بيانات الرسم البياني للمخزون
export interface InventoryChartData {
  labels: string[];
  datasets: {
    value: number[];
    quantity: number[];
  };
}

// ملخص حركات المخزون
export interface MovementSummary {
  total_in: number;
  total_out: number;
  net_change: number;
  movement_count: number;
  by_type: {
    type: string;
    count: number;
    quantity: number;
    value: number;
  }[];
}
