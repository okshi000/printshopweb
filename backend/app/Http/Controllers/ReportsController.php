<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Supplier;
use App\Models\Debt;
use App\Models\CashMovement;
use App\Models\CashBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportsController extends Controller
{
    /**
     * تقرير ملخص مالي
     */
    public function financialSummary(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        // إجمالي الإيرادات
        $totalRevenue = Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->sum('total');

        // إجمالي المصروفات
        $totalExpenses = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        // صافي الربح
        $netProfit = $totalRevenue - $totalExpenses;

        // إجمالي الديون
        $totalDebts = Debt::where('status', 'pending')
            ->sum('remaining_amount');

        // الرصيد النقدي
        $totalCash = CashBalance::sum('balance');

        // حساب هامش الربح
        $profitMargin = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0;

        return response()->json([
            'total_revenue' => (float) $totalRevenue,
            'total_expenses' => (float) $totalExpenses,
            'net_profit' => (float) $netProfit,
            'profit_margin' => $profitMargin,
            'total_debts' => (float) $totalDebts,
            'total_cash' => (float) $totalCash,
            'period' => "$startDate to $endDate"
        ]);
    }

    /**
     * تقرير الإيرادات حسب الفترة
     */
    public function revenueByPeriod(Request $request)
    {
        $period = $request->input('period', 'monthly'); // daily, weekly, monthly, yearly
        $startDate = $request->input('start_date', Carbon::now()->subMonths(6)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $format = $this->getDateFormat($period);

        $data = Invoice::selectRaw("
                DATE_FORMAT(invoice_date, '$format') as period,
                SUM(total) as revenue,
                COUNT(*) as invoice_count
            ")
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        // جلب المصروفات لنفس الفترة
        $expenses = Expense::selectRaw("
                DATE_FORMAT(expense_date, '$format') as period,
                SUM(amount) as expenses
            ")
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        // دمج البيانات
        $result = $data->map(function ($item) use ($expenses) {
            $expense = $expenses->get($item->period);
            $expenseAmount = $expense ? $expense->expenses : 0;
            
            return [
                'period' => $item->period,
                'date' => $item->period,
                'revenue' => (float) $item->revenue,
                'expenses' => (float) $expenseAmount,
                'profit' => (float) ($item->revenue - $expenseAmount)
            ];
        });

        return response()->json($result);
    }

    /**
     * تقرير المصروفات حسب النوع
     */
    public function expenseBreakdown(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $data = Expense::select('expense_types.name as category', 
                DB::raw('SUM(expenses.amount) as amount'),
                DB::raw('COUNT(*) as count'))
            ->join('expense_types', 'expenses.expense_type_id', '=', 'expense_types.id')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy('expense_types.id', 'expense_types.name')
            ->get();

        $total = $data->sum('amount');

        $result = $data->map(function ($item) use ($total) {
            return [
                'category' => $item->category,
                'amount' => (float) $item->amount,
                'percentage' => $total > 0 ? round(($item->amount / $total) * 100, 2) : 0,
                'count' => $item->count
            ];
        });

        return response()->json($result);
    }

    /**
     * تقرير المبيعات
     */
    public function salesReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $invoices = Invoice::whereBetween('invoice_date', [$startDate, $endDate]);

        return response()->json([
            'total_sales' => (float) $invoices->sum('total'),
            'total_invoices' => $invoices->count(),
            'average_invoice_value' => (float) $invoices->avg('total'),
            'paid_amount' => (float) $invoices->sum('paid_amount'),
            'pending_amount' => (float) $invoices->sum('remaining_amount'),
            'discount_amount' => (float) $invoices->sum('discount')
        ]);
    }

    /**
     * المبيعات حسب العميل
     */
    public function salesByCustomer(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $data = Customer::select(
                'customers.id as customer_id',
                'customers.name as customer_name',
                DB::raw('SUM(invoices.total) as total_purchases'),
                DB::raw('COUNT(invoices.id) as invoice_count'),
                DB::raw('MAX(invoices.invoice_date) as last_purchase_date'),
                DB::raw('AVG(invoices.total) as average_order_value')
            )
            ->join('invoices', 'customers.id', '=', 'invoices.customer_id')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->groupBy('customers.id', 'customers.name')
            ->orderByDesc('total_purchases')
            ->get();

        return response()->json($data);
    }

    /**
     * المبيعات حسب المنتج
     */
    public function salesByProduct(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $data = Product::select(
                'products.id as product_id',
                'products.name as product_name',
                DB::raw('SUM(invoice_items.quantity) as quantity_sold'),
                DB::raw('SUM(invoice_items.quantity * invoice_items.unit_price) as total_revenue'),
                DB::raw('AVG(invoice_items.unit_price) as average_price')
            )
            ->join('invoice_items', 'products.id', '=', 'invoice_items.product_id')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('quantity_sold')
            ->get();

        return response()->json($data);
    }

    /**
     * أفضل المنتجات مبيعاً
     */
    public function topSellingProducts(Request $request)
    {
        $limit = $request->input('limit', 10);
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $data = Product::select(
                'products.id as product_id',
                'products.name as product_name',
                DB::raw('SUM(invoice_items.quantity) as quantity_sold'),
                DB::raw('SUM(invoice_items.quantity * invoice_items.unit_price) as revenue')
            )
            ->join('invoice_items', 'products.id', '=', 'invoice_items.product_id')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('quantity_sold')
            ->limit($limit)
            ->get();

        // إضافة الترتيب
        $result = $data->map(function ($item, $index) {
            return array_merge($item->toArray(), ['rank' => $index + 1]);
        });

        return response()->json($result);
    }

    /**
     * تقرير المخزون
     */
    public function inventoryReport(Request $request)
    {
        $lowStockThreshold = 10;

        $items = InventoryItem::all();

        return response()->json([
            'total_items' => $items->count(),
            'total_value' => $items->sum(function ($item) {
                return $item->quantity * $item->unit_cost;
            }),
            'low_stock_items' => $items->where('quantity', '<=', $lowStockThreshold)->count(),
            'out_of_stock_items' => $items->where('quantity', 0)->count(),
            'average_stock_value' => $items->avg(function ($item) {
                return $item->quantity * $item->unit_cost;
            })
        ]);
    }

    /**
     * تفاصيل المخزون
     */
    public function inventoryItemDetails(Request $request)
    {
        $data = InventoryItem::select(
                'id as item_id',
                'name as item_name',
                'quantity as current_quantity',
                'unit_cost',
                DB::raw('quantity * unit_cost as total_value'),
                'reorder_level',
                'updated_at as last_restock_date'
            )
            ->get()
            ->map(function ($item) {
                $status = 'in_stock';
                if ($item->current_quantity == 0) {
                    $status = 'out_of_stock';
                } elseif ($item->current_quantity <= $item->reorder_level) {
                    $status = 'low_stock';
                }
                
                return array_merge($item->toArray(), ['status' => $status]);
            });

        return response()->json($data);
    }

    /**
     * حركة المخزون
     */
    public function inventoryMovementReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $data = InventoryMovement::select(
                'inventory_movements.movement_date as date',
                'inventory_items.name as item_name',
                'inventory_movements.movement_type',
                'inventory_movements.quantity',
                'inventory_movements.cost_per_unit',
                DB::raw('inventory_movements.quantity * inventory_movements.cost_per_unit as total_cost'),
                'inventory_movements.reference'
            )
            ->join('inventory_items', 'inventory_movements.inventory_item_id', '=', 'inventory_items.id')
            ->whereBetween('movement_date', [$startDate, $endDate])
            ->orderBy('movement_date', 'desc')
            ->get();

        return response()->json($data);
    }

    /**
     * تقييم المخزون
     */
    public function stockValuation(Request $request)
    {
        $data = InventoryItem::select(
                'categories.name as category',
                DB::raw('COUNT(inventory_items.id) as item_count'),
                DB::raw('SUM(inventory_items.quantity) as total_quantity'),
                DB::raw('SUM(inventory_items.quantity * inventory_items.unit_cost) as total_value')
            )
            ->leftJoin('categories', 'inventory_items.category_id', '=', 'categories.id')
            ->groupBy('categories.id', 'categories.name')
            ->get();

        $total = $data->sum('total_value');

        $result = $data->map(function ($item) use ($total) {
            return array_merge($item->toArray(), [
                'percentage' => $total > 0 ? round(($item->total_value / $total) * 100, 2) : 0
            ]);
        });

        return response()->json($result);
    }

    /**
     * تقرير الموردين
     */
    public function supplierReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        // هنا نفترض وجود جدول للمشتريات، إذا لم يكن موجوداً يمكن استخدام InventoryMovement
        $data = Supplier::select('suppliers.*')
            ->get()
            ->map(function ($supplier) use ($startDate, $endDate) {
                $movements = InventoryMovement::where('supplier_id', $supplier->id)
                    ->where('movement_type', 'in')
                    ->whereBetween('movement_date', [$startDate, $endDate])
                    ->get();

                $totalPurchases = $movements->sum(function ($m) {
                    return $m->quantity * $m->cost_per_unit;
                });

                return [
                    'supplier_id' => $supplier->id,
                    'supplier_name' => $supplier->name,
                    'total_purchases' => $totalPurchases,
                    'order_count' => $movements->count(),
                    'last_order_date' => $movements->max('movement_date')
                ];
            });

        return response()->json($data);
    }

    /**
     * تقرير العملاء
     */
    public function customerReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfYear()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $data = Customer::select(
                'customers.id as customer_id',
                'customers.name as customer_name',
                'customers.created_at as customer_since',
                DB::raw('SUM(invoices.total_amount) as total_purchases'),
                DB::raw('SUM(invoices.paid_amount) as total_paid'),
                DB::raw('COUNT(invoices.id) as invoice_count'),
                DB::raw('MAX(invoices.invoice_date) as last_purchase_date')
            )
            ->leftJoin('invoices', function($join) use ($startDate, $endDate) {
                $join->on('customers.id', '=', 'invoices.customer_id')
                     ->whereBetween('invoices.invoice_date', [$startDate, $endDate]);
            })
            ->groupBy('customers.id', 'customers.name', 'customers.created_at')
            ->get();

        // إضافة الديون
        $result = $data->map(function ($customer) {
            $totalDebt = Debt::where('customer_id', $customer->customer_id)
                ->where('status', 'pending')
                ->sum('remaining_amount');
            
            return array_merge($customer->toArray(), [
                'total_debt' => $totalDebt
            ]);
        });

        return response()->json($result);
    }

    /**
     * تقرير الديون
     */
    public function debtReport(Request $request)
    {
        $totalDebts = Debt::sum('amount');
        $totalRepaid = Debt::sum('paid_amount');
        $totalPending = Debt::where('status', 'pending')->sum('remaining_amount');
        $debtorCount = Debt::where('status', 'pending')
            ->distinct('customer_id')
            ->count('customer_id');

        // متوسط عمر الديون
        $averageDebtAge = Debt::where('status', 'pending')
            ->selectRaw('AVG(DATEDIFF(NOW(), debt_date)) as avg_age')
            ->value('avg_age');

        return response()->json([
            'total_debts' => $totalDebts,
            'total_repaid' => $totalRepaid,
            'total_pending' => $totalPending,
            'debtor_count' => $debtorCount,
            'average_debt_age' => round($averageDebtAge ?? 0, 0)
        ]);
    }

    /**
     * الديون حسب العميل
     */
    public function debtByCustomer(Request $request)
    {
        $data = Debt::select(
                'customers.id as customer_id',
                'customers.name as customer_name',
                DB::raw('SUM(debts.amount) as total_debt'),
                DB::raw('SUM(debts.paid_amount) as paid_amount'),
                DB::raw('SUM(debts.remaining_amount) as remaining_amount'),
                DB::raw('MAX(DATEDIFF(NOW(), debts.due_date)) as days_overdue')
            )
            ->join('customers', 'debts.customer_id', '=', 'customers.id')
            ->where('debts.status', 'pending')
            ->groupBy('customers.id', 'customers.name')
            ->get();

        $result = $data->map(function ($item) {
            $status = 'current';
            if ($item->days_overdue > 90) {
                $status = 'critical';
            } elseif ($item->days_overdue > 30) {
                $status = 'overdue';
            }
            
            return array_merge($item->toArray(), ['status' => $status]);
        });

        return response()->json($result);
    }

    /**
     * تقرير التدفق النقدي
     */
    public function cashFlowReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $inflows = CashMovement::where('movement_type', 'in')
            ->whereBetween('movement_date', [$startDate, $endDate])
            ->sum('amount');

        $outflows = CashMovement::where('movement_type', 'out')
            ->whereBetween('movement_date', [$startDate, $endDate])
            ->sum('amount');

        $openingBalance = CashBalance::sum('balance'); // يمكن تحسين هذا
        $closingBalance = $openingBalance + $inflows - $outflows;

        return response()->json([
            'opening_balance' => $openingBalance,
            'total_inflows' => $inflows,
            'total_outflows' => $outflows,
            'closing_balance' => $closingBalance,
            'net_cash_flow' => $inflows - $outflows
        ]);
    }

    /**
     * التدفق النقدي حسب الفترة
     */
    public function cashFlowTrend(Request $request)
    {
        $period = $request->input('period', 'monthly');
        $startDate = $request->input('start_date', Carbon::now()->subMonths(6)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $format = $this->getDateFormat($period);

        $data = CashMovement::selectRaw("
                DATE_FORMAT(movement_date, '$format') as period,
                SUM(CASE WHEN movement_type = 'in' THEN amount ELSE 0 END) as inflows,
                SUM(CASE WHEN movement_type = 'out' THEN amount ELSE 0 END) as outflows
            ")
            ->whereBetween('movement_date', [$startDate, $endDate])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $balance = CashBalance::sum('balance');
        
        $result = $data->map(function ($item) use (&$balance) {
            $netFlow = $item->inflows - $item->outflows;
            $balance += $netFlow;
            
            return [
                'period' => $item->period,
                'date' => $item->period,
                'inflows' => (float) $item->inflows,
                'outflows' => (float) $item->outflows,
                'net_flow' => $netFlow,
                'balance' => $balance
            ];
        });

        return response()->json($result);
    }

    /**
     * تقرير الأرباح والخسائر
     */
    public function profitLossReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $totalRevenue = Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->sum('total_amount');

        // تكلفة البضاعة المباعة
        $costOfGoodsSold = InvoiceItem::join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->sum(DB::raw('invoice_items.quantity * products.cost'));

        $grossProfit = $totalRevenue - $costOfGoodsSold;

        $operatingExpenses = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        $netProfit = $grossProfit - $operatingExpenses;

        $profitMargin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0;

        return response()->json([
            'period' => "$startDate to $endDate",
            'total_revenue' => $totalRevenue,
            'cost_of_goods_sold' => $costOfGoodsSold,
            'gross_profit' => $grossProfit,
            'operating_expenses' => $operatingExpenses,
            'net_profit' => $netProfit,
            'profit_margin' => round($profitMargin, 2)
        ]);
    }

    /**
     * مقاييس الأداء
     */
    public function dashboardMetrics(Request $request)
    {
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        $totalRevenue = Invoice::whereMonth('invoice_date', $currentMonth)
            ->whereYear('invoice_date', $currentYear)
            ->sum('total_amount');

        $totalExpenses = Expense::whereMonth('expense_date', $currentMonth)
            ->whereYear('expense_date', $currentYear)
            ->sum('amount');

        $netProfit = $totalRevenue - $totalExpenses;

        $totalInvoices = Invoice::whereMonth('invoice_date', $currentMonth)
            ->whereYear('invoice_date', $currentYear)
            ->count();

        $pendingPayments = Invoice::whereMonth('invoice_date', $currentMonth)
            ->whereYear('invoice_date', $currentYear)
            ->sum(DB::raw('total_amount - paid_amount'));

        $lowStockItems = InventoryItem::where('quantity', '<=', 10)->count();

        $activeCustomers = Invoice::whereMonth('invoice_date', $currentMonth)
            ->whereYear('invoice_date', $currentYear)
            ->distinct('customer_id')
            ->count('customer_id');

        // نمو الإيرادات مقارنة بالشهر السابق
        $previousMonthRevenue = Invoice::whereMonth('invoice_date', $currentMonth - 1)
            ->whereYear('invoice_date', $currentYear)
            ->sum('total_amount');

        $revenueGrowth = $previousMonthRevenue > 0 
            ? (($totalRevenue - $previousMonthRevenue) / $previousMonthRevenue) * 100 
            : 0;

        $profitMargin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0;

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
            'total_invoices' => $totalInvoices,
            'pending_payments' => $pendingPayments,
            'low_stock_items' => $lowStockItems,
            'active_customers' => $activeCustomers,
            'revenue_growth' => round($revenueGrowth, 2),
            'profit_margin' => round($profitMargin, 2)
        ]);
    }

    /**
     * دالة مساعدة لتنسيق التاريخ حسب الفترة
     */
    private function getDateFormat($period)
    {
        return match($period) {
            'daily' => '%Y-%m-%d',
            'weekly' => '%Y-%u',
            'monthly' => '%Y-%m',
            'quarterly' => '%Y-Q%q',
            'yearly' => '%Y',
            default => '%Y-%m'
        };
    }
}
