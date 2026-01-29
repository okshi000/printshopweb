<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AccountantController extends Controller
{
    /**
     * لوحة القيادة - المحاسب الآلي
     */
    public function dashboard(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));

        // الفترة السابقة للمقارنة
        $daysDiff = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1;
        $prevStartDate = Carbon::parse($startDate)->subDays($daysDiff)->format('Y-m-d');
        $prevEndDate = Carbon::parse($startDate)->subDay()->format('Y-m-d');

        // 1. الأصول (Assets)
        $cashBalance = DB::table('cash_balance')->first();
        $total_cash = $cashBalance ? ($cashBalance->cash_balance + $cashBalance->bank_balance) : 0;

        $inventory_value = DB::table('inventory_items')
            ->where('is_active', true)
            ->sum(DB::raw('current_quantity * unit_cost'));

        $customer_debts = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->sum('remaining_amount');

        $other_debts = DB::table('debts')
            ->where('is_paid', false)
            ->sum('remaining_amount');

        $total_assets = $total_cash + $inventory_value + $customer_debts + $other_debts;

        // 2. الخصوم (Liabilities)
        $supplier_debts = DB::table('suppliers')
            ->where('is_active', true)
            ->sum('total_debt');

        $total_liabilities = $supplier_debts;

        // 3. حقوق الملكية (Equity)
        $equity = $total_assets - $total_liabilities;

        // 4. الإيرادات للفترة المحددة
        $total_revenue = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->sum('total');

        $prev_revenue = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->whereBetween('invoice_date', [$prevStartDate, $prevEndDate])
            ->sum('total');

        // 5. تكلفة البضاعة المباعة
        $total_cogs = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->sum('total_cost');

        // 6. المصروفات للفترة المحددة
        $total_expenses = DB::table('expenses')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        $prev_expenses = DB::table('expenses')
            ->whereBetween('expense_date', [$prevStartDate, $prevEndDate])
            ->sum('amount');

        // 7. حسابات الربح
        $gross_profit = $total_revenue - $total_cogs;
        $net_profit = $gross_profit - $total_expenses;

        $prev_cogs = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->whereBetween('invoice_date', [$prevStartDate, $prevEndDate])
            ->sum('total_cost');
        $prev_net_profit = ($prev_revenue - $prev_cogs) - $prev_expenses;

        // حساب نسب التغيير
        $revenue_change = $prev_revenue > 0 ? round((($total_revenue - $prev_revenue) / $prev_revenue) * 100, 1) : 0;
        $expenses_change = $prev_expenses > 0 ? round((($total_expenses - $prev_expenses) / $prev_expenses) * 100, 1) : 0;
        $profit_change = $prev_net_profit != 0 ? round((($net_profit - $prev_net_profit) / abs($prev_net_profit)) * 100, 1) : 0;

        // 8. عدد الفواتير غير المدفوعة
        $unpaid_invoices = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->where('remaining_amount', '>', 0)
            ->count();

        // حساب نسب المستحقات والمطلوبات
        $receivables_percentage = $total_revenue > 0 ? min(100, round(($customer_debts / $total_revenue) * 100, 1)) : 0;
        $payables_percentage = $total_expenses > 0 ? min(100, round(($supplier_debts / $total_expenses) * 100, 1)) : 0;

        // 9. مؤشرات الأداء الرئيسية (KPIs)
        $gross_profit_margin = $total_revenue > 0 ? round(($gross_profit / $total_revenue) * 100, 2) : 0;
        $net_profit_margin = $total_revenue > 0 ? round(($net_profit / $total_revenue) * 100, 2) : 0;
        $operating_expense_ratio = $total_revenue > 0 ? round(($total_expenses / $total_revenue) * 100, 2) : 0;
        
        // نسب السيولة
        $current_ratio = $total_liabilities > 0 ? round($total_assets / $total_liabilities, 2) : 0;
        $quick_ratio = $total_liabilities > 0 ? round(($total_cash + $customer_debts) / $total_liabilities, 2) : 0;
        
        // متوسط أيام الجمع (DPO - Days Payable Outstanding)
        $avg_daily_revenue = $daysDiff > 0 ? $total_revenue / $daysDiff : 0;
        $dpo = $avg_daily_revenue > 0 ? round($customer_debts / $avg_daily_revenue, 2) : 0;

        // عدد الفواتير المدفوعة
        $paid_invoices = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->where('remaining_amount', '=', 0)
            ->count();

        // متوسط قيمة الفاتورة
        $avg_invoice_value = (($paid_invoices + $unpaid_invoices) > 0) 
            ? round($total_revenue / ($paid_invoices + $unpaid_invoices), 2)
            : 0;

        // عدد الموردين النشطين
        $active_suppliers = DB::table('suppliers')
            ->where('is_active', true)
            ->count();

        // عدد العملاء الذين لديهم ديون
        $customers_with_receivables = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->where('remaining_amount', '>', 0)
            ->distinct('customer_id')
            ->count();

        return response()->json([
            // البيانات الأساسية للـ Frontend
            'total_revenue' => $total_revenue,
            'total_expenses' => $total_expenses,
            'net_profit' => $net_profit,
            'available_cash' => $total_cash,
            'revenue_change' => $revenue_change,
            'expenses_change' => $expenses_change,
            'profit_change' => $profit_change,

            // بيانات المستحقات
            'customer_receivables' => $customer_debts,
            'unpaid_invoices' => $unpaid_invoices,
            'paid_invoices' => $paid_invoices,
            'receivables_percentage' => $receivables_percentage,
            'customers_with_receivables' => $customers_with_receivables,

            // بيانات المطلوبات
            'supplier_payables' => $supplier_debts,
            'outstanding_debts' => $other_debts,
            'payables_percentage' => $payables_percentage,
            'active_suppliers' => $active_suppliers,

            // بيانات النقد
            'cash_balance' => $cashBalance->cash_balance ?? 0,
            'bank_balance' => $cashBalance->bank_balance ?? 0,
            'total_cash' => $total_cash,

            // مؤشرات الأداء الرئيسية (KPIs)
            'kpis' => [
                'gross_profit_margin' => $gross_profit_margin,
                'net_profit_margin' => $net_profit_margin,
                'operating_expense_ratio' => $operating_expense_ratio,
                'current_ratio' => $current_ratio,
                'quick_ratio' => $quick_ratio,
                'days_payable_outstanding' => $dpo,
                'avg_invoice_value' => $avg_invoice_value,
                'cogs_percentage' => $total_revenue > 0 ? round(($total_cogs / $total_revenue) * 100, 2) : 0,
            ],

            // بيانات تفصيلية
            'assets' => [
                'cash_balance' => $cashBalance->cash_balance ?? 0,
                'bank_balance' => $cashBalance->bank_balance ?? 0,
                'total_cash' => $total_cash,
                'inventory_value' => $inventory_value,
                'customer_debts' => $customer_debts,
                'other_debts' => $other_debts,
                'total' => $total_assets,
            ],
            'liabilities' => [
                'supplier_debts' => $supplier_debts,
                'total' => $total_liabilities,
            ],
            'equity' => $equity,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'days' => $daysDiff,
            ],
        ]);
    }

    /**
     * قائمة الدخل (تقرير الأرباح)
     */
    public function incomeStatement(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));

        // 1. الإيرادات
        $salesData = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->selectRaw('COUNT(*) as count, SUM(subtotal) as subtotal, SUM(discount) as discount, SUM(total) as total')
            ->first();

        $total_revenue = $salesData->total ?? 0;

        // 2. تكلفة البضاعة المباعة
        $cogsDetails = DB::table('item_costs')
            ->join('invoice_items', 'item_costs.invoice_item_id', '=', 'invoice_items.id')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->where('invoices.status', '!=', 'cancelled')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->groupBy('item_costs.cost_type')
            ->selectRaw('item_costs.cost_type, SUM(item_costs.amount) as amount')
            ->orderByDesc('amount')
            ->get();

        $total_cogs = $cogsDetails->sum('amount');
        $gross_profit = $total_revenue - $total_cogs;

        // 3. المصروفات التشغيلية
        $expensesDetails = DB::table('expenses')
            ->leftJoin('expense_types', 'expenses.expense_type_id', '=', 'expense_types.id')
            ->whereBetween('expenses.expense_date', [$startDate, $endDate])
            ->groupBy('expense_types.name')
            ->selectRaw('expense_types.name as type_name, SUM(expenses.amount) as amount')
            ->orderByDesc('amount')
            ->get();

        $total_expenses = $expensesDetails->sum('amount');
        $net_profit = $gross_profit - $total_expenses;

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'revenue' => [
                'invoices_count' => $salesData->count ?? 0,
                'subtotal' => $salesData->subtotal ?? 0,
                'discount' => $salesData->discount ?? 0,
                'total' => $total_revenue,
            ],
            'cogs' => [
                'details' => $cogsDetails,
                'total' => $total_cogs,
            ],
            'gross_profit' => $gross_profit,
            'expenses' => [
                'details' => $expensesDetails,
                'total' => $total_expenses,
            ],
            'net_profit' => $net_profit,
        ]);
    }

    /**
     * الميزانية العمومية (المركز المالي)
     */
    public function balanceSheet(Request $request)
    {
        $asOfDate = $request->get('date', Carbon::now()->format('Y-m-d'));

        // الأصول المتداولة
        $cashBalance = DB::table('cash_balance')->first();
        $cash_on_hand = $cashBalance->cash_balance ?? 0;
        $cash_at_bank = $cashBalance->bank_balance ?? 0;

        $inventory_value = DB::table('inventory_items')
            ->where('is_active', true)
            ->sum(DB::raw('current_quantity * unit_cost'));

        $accounts_receivable = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->sum('remaining_amount');

        $other_receivables = DB::table('debts')
            ->where('is_paid', false)
            ->sum('remaining_amount');

        $total_current_assets = $cash_on_hand + $cash_at_bank + $inventory_value + $accounts_receivable + $other_receivables;
        $fixed_assets = 0;
        $total_assets = $total_current_assets + $fixed_assets;

        // الخصوم
        $accounts_payable = DB::table('suppliers')
            ->where('is_active', true)
            ->sum('total_debt');

        $total_current_liabilities = $accounts_payable;
        $long_term_liabilities = 0;
        $total_liabilities = $total_current_liabilities + $long_term_liabilities;

        // حقوق الملكية
        $total_equity = $total_assets - $total_liabilities;

        return response()->json([
            'as_of_date' => $asOfDate,
            'assets' => [
                'current' => [
                    'cash_on_hand' => $cash_on_hand,
                    'cash_at_bank' => $cash_at_bank,
                    'inventory' => $inventory_value,
                    'accounts_receivable' => $accounts_receivable,
                    'other_receivables' => $other_receivables,
                    'total' => $total_current_assets,
                ],
                'fixed' => [
                    'total' => $fixed_assets,
                ],
                'total' => $total_assets,
            ],
            'liabilities' => [
                'current' => [
                    'accounts_payable' => $accounts_payable,
                    'total' => $total_current_liabilities,
                ],
                'long_term' => [
                    'total' => $long_term_liabilities,
                ],
                'total' => $total_liabilities,
            ],
            'equity' => [
                'total' => $total_equity,
            ],
            'balance_check' => $total_assets == ($total_liabilities + $total_equity),
        ]);
    }

    /**
     * رسم بياني للإيرادات والمصروفات
     */
    public function revenueChart(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

        // جلب الإيرادات حسب التاريخ
        $revenues = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->groupBy('date')
            ->selectRaw('DATE(invoice_date) as date, SUM(total) as revenue')
            ->orderBy('date')
            ->pluck('revenue', 'date')
            ->toArray();

        // جلب المصروفات حسب التاريخ
        $expenses = DB::table('expenses')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy('date')
            ->selectRaw('DATE(expense_date) as date, SUM(amount) as expenses')
            ->orderBy('date')
            ->pluck('expenses', 'date')
            ->toArray();

        // دمج البيانات
        $allDates = array_unique(array_merge(array_keys($revenues), array_keys($expenses)));
        sort($allDates);

        $data = array_map(function ($date) use ($revenues, $expenses) {
            return [
                'date' => $date,
                'revenue' => (float) ($revenues[$date] ?? 0),
                'expenses' => (float) ($expenses[$date] ?? 0),
                'profit' => (float) (($revenues[$date] ?? 0) - ($expenses[$date] ?? 0)),
            ];
        }, $allDates);

        return response()->json($data);
    }

    /**
     * رسم بياني للمصروفات
     */
    public function expenseChart(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

        $data = DB::table('expenses')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy('date')
            ->selectRaw('DATE(expense_date) as date, SUM(amount) as amount')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'amount' => (float) $item->amount,
                ];
            });

        // مجموع حسب النوع
        $byType = DB::table('expenses')
            ->leftJoin('expense_types', 'expenses.expense_type_id', '=', 'expense_types.id')
            ->whereBetween('expenses.expense_date', [$startDate, $endDate])
            ->groupBy('expense_types.name')
            ->selectRaw('COALESCE(expense_types.name, "غير مصنف") as type, SUM(expenses.amount) as amount')
            ->orderByDesc('amount')
            ->get();

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'data' => $data,
            'by_type' => $byType,
        ]);
    }

    /**
     * تحليل تفصيلي للأداء
     */
    public function analyticsReport(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));

        // البيانات الأساسية
        $daysDiff = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1;

        // جودة العملاء
        $topCustomers = DB::table('invoices')
            ->selectRaw('customer_id, customers.name, COUNT(*) as invoice_count, SUM(total) as total_amount, SUM(remaining_amount) as outstanding')
            ->leftJoin('customers', 'invoices.customer_id', '=', 'customers.id')
            ->where('invoices.status', '!=', 'cancelled')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->groupBy('customer_id', 'customers.name')
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get();

        // تحليل المنتجات
        $topProducts = DB::table('invoice_items')
            ->selectRaw('product_id, products.name, SUM(quantity) as quantity_sold, SUM(price * quantity) as revenue, SUM(cost * quantity) as cost')
            ->leftJoin('products', 'invoice_items.product_id', '=', 'products.id')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->where('invoices.status', '!=', 'cancelled')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->groupBy('product_id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        // تحليل المصروفات
        $expenseAnalysis = DB::table('expenses')
            ->selectRaw('expense_types.name, COUNT(*) as count, SUM(amount) as total_amount, AVG(amount) as avg_amount')
            ->leftJoin('expense_types', 'expenses.expense_type_id', '=', 'expense_types.id')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy('expense_types.name')
            ->orderByDesc('total_amount')
            ->get();

        // الاتجاهات الأسبوعية
        $weeklyTrend = DB::table('invoices')
            ->selectRaw('YEARWEEK(invoice_date) as week, SUM(total) as revenue, COUNT(*) as invoice_count')
            ->where('status', '!=', 'cancelled')
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->groupBy('week')
            ->orderBy('week')
            ->get();

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'days' => $daysDiff,
            ],
            'top_customers' => $topCustomers,
            'top_products' => $topProducts,
            'expense_analysis' => $expenseAnalysis,
            'weekly_trend' => $weeklyTrend,
        ]);
    }

    /**
     * مؤشرات الصحة المالية
     */
    public function financialHealth(Request $request)
    {
        $cashBalance = DB::table('cash_balance')->first();
        $total_cash = $cashBalance ? ($cashBalance->cash_balance + $cashBalance->bank_balance) : 0;

        // الفترة الحالية والسابقة
        $currentMonth = now()->month;
        $currentYear = now()->year;
        
        $prevMonth = $currentMonth == 1 ? 12 : $currentMonth - 1;
        $prevYear = $currentMonth == 1 ? $currentYear - 1 : $currentYear;

        // المؤشرات
        $currentRevenue = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->whereMonth('invoice_date', $currentMonth)
            ->whereYear('invoice_date', $currentYear)
            ->sum('total');

        $prevRevenue = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->whereMonth('invoice_date', $prevMonth)
            ->whereYear('invoice_date', $prevYear)
            ->sum('total');

        $currentExpenses = DB::table('expenses')
            ->whereMonth('expense_date', $currentMonth)
            ->whereYear('expense_date', $currentYear)
            ->sum('amount');

        $prevExpenses = DB::table('expenses')
            ->whereMonth('expense_date', $prevMonth)
            ->whereYear('expense_date', $prevYear)
            ->sum('amount');

        // الصحة المالية
        $health_score = 0;
        $warnings = [];
        $recommendations = [];

        // 1. النقدية
        $current_ratio = DB::table('invoices')->where('status', '!=', 'cancelled')->sum('remaining_amount') > 0 
            ? $total_cash / DB::table('invoices')->where('status', '!=', 'cancelled')->sum('remaining_amount')
            : 0;

        if ($current_ratio > 2) {
            $health_score += 20;
        } elseif ($current_ratio > 1.5) {
            $health_score += 15;
        } elseif ($current_ratio < 1) {
            $warnings[] = 'النقدية غير كافية لتغطية الالتزامات';
            $recommendations[] = 'يجب زيادة النقدية أو تقليل الالتزامات';
        }

        // 2. نمو الإيرادات
        $revenue_growth = $prevRevenue > 0 ? (($currentRevenue - $prevRevenue) / $prevRevenue) * 100 : 0;
        if ($revenue_growth > 10) {
            $health_score += 25;
        } elseif ($revenue_growth > 0) {
            $health_score += 15;
        } else {
            $warnings[] = 'تراجع في الإيرادات مقارنة بالشهر السابق';
            $recommendations[] = 'زيادة جهود المبيعات والتسويق';
        }

        // 3. تحكم في المصروفات
        $expense_ratio = $currentRevenue > 0 ? ($currentExpenses / $currentRevenue) * 100 : 0;
        if ($expense_ratio < 20) {
            $health_score += 25;
        } elseif ($expense_ratio < 30) {
            $health_score += 15;
        } else {
            $warnings[] = 'المصروفات مرتفعة جداً مقارنة بالإيرادات';
            $recommendations[] = 'مراجعة وتقليل المصروفات غير الضرورية';
        }

        // 4. الديون المستحقة
        $uncollected_amount = DB::table('invoices')
            ->where('status', '!=', 'cancelled')
            ->where('remaining_amount', '>', 0)
            ->sum('remaining_amount');

        $collection_rate = $currentRevenue > 0 ? (($currentRevenue - $uncollected_amount) / $currentRevenue) * 100 : 100;
        if ($collection_rate > 90) {
            $health_score += 25;
        } elseif ($collection_rate > 75) {
            $health_score += 15;
        } else {
            $warnings[] = 'معدل تحصيل منخفض';
            $recommendations[] = 'تقوية عملية المتابعة مع العملاء';
        }

        // 5. الحد الأدنى
        $health_score = max(0, min(100, $health_score));

        return response()->json([
            'health_score' => $health_score,
            'status' => $health_score >= 75 ? 'ممتاز' : ($health_score >= 50 ? 'جيد' : 'يحتاج تحسين'),
            'metrics' => [
                'current_ratio' => round($current_ratio, 2),
                'revenue_growth' => round($revenue_growth, 2),
                'expense_ratio' => round($expense_ratio, 2),
                'collection_rate' => round($collection_rate, 2),
            ],
            'warnings' => $warnings,
            'recommendations' => $recommendations,
        ]);
    }
}

