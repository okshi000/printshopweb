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
            'receivables_percentage' => $receivables_percentage,

            // بيانات المطلوبات
            'supplier_payables' => $supplier_debts,
            'outstanding_debts' => $other_debts,
            'payables_percentage' => $payables_percentage,

            // بيانات النقد
            'cash_balance' => $cashBalance->cash_balance ?? 0,
            'bank_balance' => $cashBalance->bank_balance ?? 0,
            'total_cash' => $total_cash,

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
}
