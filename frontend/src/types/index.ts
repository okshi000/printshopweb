export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  phone2: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  invoices_count?: number;
  invoices_sum_remaining_amount?: number;
  balance?: number;
}

export interface Supplier {
  id: number;
  name: string;
  type: 'printer' | 'designer' | 'service' | 'material' | 'other';
  phone: string | null;
  email?: string | null;
  address: string | null;
  notes: string | null;
  total_debt: number;
  total_purchases?: number;
  total_paid?: number;
  balance_due?: number;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  products_count?: number;
}

export interface Product {
  id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  default_price: number | null;
  unit?: string;
  unit_price?: number | string;
  cost_price?: number | string;
  min_stock?: number;
  current_stock?: number;
  is_active: boolean;
  category?: Category;
}

export interface ItemCost {
  id: number;
  invoice_item_id: number;
  supplier_id: number | null;
  cost_type: string;
  amount: number;
  is_internal: boolean;
  notes: string | null;
  is_paid: boolean;
  supplier?: Supplier;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number | null;
  product_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  total_cost: number;
  profit: number;
  product?: Product;
  costs?: ItemCost[];
}

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_method: 'cash' | 'bank';
  payment_type: 'deposit' | 'partial' | 'full';
  notes: string | null;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  invoice_date: string;
  delivery_date: string | null;
  status: 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled' | 'draft' | 'pending' | 'partial' | 'paid';
  subtotal: number;
  discount: number;
  total: number;
  total_cost: number;
  profit: number;
  paid_amount: number;
  remaining_amount: number;
  notes: string | null;
  created_at: string;
  customer?: Customer;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
}

export interface ExpenseType {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  expenses_count?: number;
}

export interface Expense {
  id: number;
  expense_type_id: number;
  amount: number;
  description?: string | null;
  payment_method: 'cash' | 'bank';
  expense_date: string;
  notes: string | null;
  created_at?: string;
  expense_type?: ExpenseType;
  user?: User;
}

export interface Withdrawal {
  id: number;
  user_id?: number;
  withdrawn_by: string;
  amount: number;
  source?: 'cash' | 'bank';
  reason?: string;
  payment_method: 'cash' | 'bank';
  withdrawal_date: string;
  notes: string | null;
  created_at?: string;
  user?: User;
}

export interface CashBalance {
  cash_balance: number;
  bank_balance: number;
  total_balance: number;
  cash?: number;
  bank?: number;
}

export interface CashMovement {
  id: number;
  movement_type: 'income' | 'expense' | 'transfer' | 'withdrawal' | 'initial' | 'invoice_payment' | 'supplier_payment' | 'debt_repayment' | 'debt_created';
  type?: string;
  source: 'cash' | 'bank';
  destination: 'cash' | 'bank' | null;
  amount: number;
  reference_type: string | null;
  reference_id: number | null;
  description: string | null;
  movement_date: string;
  created_at?: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  current_quantity: number;
  minimum_quantity: number;
  unit_cost: number | null;
  notes: string | null;
  is_active: boolean;
}

export interface InventoryMovement {
  id: number;
  inventory_item_id: number;
  movement_type: 'in' | 'out';
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  movement_date: string;
  notes: string | null;
  inventory_item?: InventoryItem;
}

export interface DebtAccount {
  id: number;
  name: string;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  total_debt: number;
  total_paid: number;
  balance: number;
  debts_count?: number;
  active_debts_count?: number;
  debts?: Debt[];
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: number;
  debt_account_id: number | null;
  debt_account?: DebtAccount;
  debtor_name: string;
  source: 'cash' | 'bank';
  source_label?: string;
  description?: string;
  amount: number;
  paid_amount?: number;
  remaining_amount: number;
  status?: 'pending' | 'partial' | 'paid';
  debt_date: string;
  due_date: string | null;
  notes: string | null;
  is_paid: boolean;
  repayments?: DebtRepayment[];
}

export interface DebtRepayment {
  id: number;
  debt_id: number;
  amount: number;
  payment_method: 'cash' | 'bank';
  payment_date: string;
  notes: string | null;
}

export interface User {
  id: number;
  name: string;
  full_name: string;
  email: string;
  role: 'owner' | 'employee';
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action?: string;
  action_type: string;
  entity_type?: string;
  module: string;
  record_id: number | null;
  description: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user?: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// تصدير أنواع التقارير
export * from './reports';
