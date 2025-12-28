<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Expense;
use App\Models\CashBalance;
use App\Models\Debt;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * التقارير المالية
 * 
 * يتضمن: الملخص المالي، الإيرادات، المصروفات، الأرباح والخسائر
 */
class FinancialReportController extends Controller
{
    /**
     * ملخص مالي شامل
     */
    public function summary(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        // إجمالي الإيرادات
        $totalRevenue = Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->sum('total');

        // إجمالي المصروفات
        $totalExpenses = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        // صافي الربح (الإيرادات - تكلفة البضاعة المباعة - المصروفات التشغيلية)
        $totalCOGS = Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->sum('total_cost');
        $netProfit = $totalRevenue - $totalCOGS - $totalExpenses;

        // إجمالي الديون المعلقة
        $totalDebts = Debt::where('is_paid', false)
            ->sum('remaining_amount');

        // الرصيد النقدي
        $cashBalance = CashBalance::first();
        $totalCash = $cashBalance ? $cashBalance->cash_balance + $cashBalance->bank_balance : 0;

        // حساب هامش الربح
        $profitMargin = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0;

        // مقارنة مع الفترة السابقة
        $periodLength = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate));
        $prevStartDate = Carbon::parse($startDate)->subDays($periodLength)->format('Y-m-d');
        $prevEndDate = Carbon::parse($startDate)->subDay()->format('Y-m-d');

        $prevRevenue = Invoice::whereBetween('invoice_date', [$prevStartDate, $prevEndDate])
            ->sum('total');
        
        $revenueGrowth = $prevRevenue > 0 
            ? round((($totalRevenue - $prevRevenue) / $prevRevenue) * 100, 2) 
            : 0;

        return response()->json([
            'total_revenue' => (float) $totalRevenue,
            'total_expenses' => (float) $totalExpenses,
            'net_profit' => (float) $netProfit,
            'profit_margin' => $profitMargin,
            'total_debts' => (float) $totalDebts,
            'total_cash' => (float) $totalCash,
            'revenue_growth' => $revenueGrowth,
            'period' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ]);
    }

    /**
     * الإيرادات حسب الفترة الزمنية
     */
    public function revenueByPeriod(Request $request)
    {
        $period = $request->input('period', 'monthly');
        $startDate = $request->input('start_date', Carbon::now()->subMonths(6)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $format = $this->getDateFormat($period);

        $revenues = Invoice::selectRaw(
                "strftime('" . $this->getSQLiteDateFormat($period) . "', invoice_date) as period,
                SUM(total) as revenue,
                COUNT(*) as invoice_count"
            )
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->keyBy('period');

        $expenses = Expense::selectRaw(
                "strftime('" . $this->getSQLiteDateFormat($period) . "', expense_date) as period,
                SUM(amount) as expenses"
            )
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        // دمج البيانات
        $allPeriods = $revenues->keys()->merge($expenses->keys())->unique()->sort();
        
        $result = $allPeriods->map(function ($periodKey) use ($revenues, $expenses) {
            $revenue = $revenues->get($periodKey);
            $expense = $expenses->get($periodKey);
            
            $revenueAmount = $revenue ? (float) $revenue->revenue : 0;
            $expenseAmount = $expense ? (float) $expense->expenses : 0;
            
            return [
                'period' => $periodKey,
                'date' => $periodKey,
                'revenue' => $revenueAmount,
                'expenses' => $expenseAmount,
                'profit' => $revenueAmount - $expenseAmount,
                'invoice_count' => $revenue ? $revenue->invoice_count : 0
            ];
        })->values();

        return response()->json($result);
    }

    /**
     * تفصيل المصروفات حسب النوع
     */
    public function expenseBreakdown(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $data = Expense::select(
                'expense_types.name as category',
                'expense_types.id as category_id',
                DB::raw('SUM(expenses.amount) as amount'),
                DB::raw('COUNT(*) as count')
            )
            ->join('expense_types', 'expenses.expense_type_id', '=', 'expense_types.id')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy('expense_types.id', 'expense_types.name')
            ->orderByDesc('amount')
            ->get();

        $total = $data->sum('amount');

        $result = $data->map(function ($item) use ($total) {
            return [
                'category' => $item->category,
                'category_id' => $item->category_id,
                'amount' => (float) $item->amount,
                'percentage' => $total > 0 ? round(($item->amount / $total) * 100, 2) : 0,
                'count' => $item->count
            ];
        });

        return response()->json($result);
    }

    /**
     * قائمة الدخل (الأرباح والخسائر)
     */
    public function profitLoss(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        // إجمالي الإيرادات
        $totalRevenue = Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->sum('total');

        // تكلفة البضاعة المباعة
        $costOfGoodsSold = InvoiceItem::join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->sum('invoice_items.total_cost');

        // إجمالي الربح
        $grossProfit = $totalRevenue - $costOfGoodsSold;

        // المصروفات التشغيلية
        $operatingExpenses = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        // صافي الربح
        $netProfit = $grossProfit - $operatingExpenses;

        // هوامش الربح
        $grossMargin = $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 2) : 0;
        $netMargin = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0;

        // مقارنة مع الفترة السابقة
        $periodLength = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate));
        $prevStartDate = Carbon::parse($startDate)->subDays($periodLength)->format('Y-m-d');
        $prevEndDate = Carbon::parse($startDate)->subDay()->format('Y-m-d');

        $prevNetProfit = Invoice::whereBetween('invoice_date', [$prevStartDate, $prevEndDate])->sum('total')
            - Expense::whereBetween('expense_date', [$prevStartDate, $prevEndDate])->sum('amount');

        $profitGrowth = $prevNetProfit != 0 
            ? round((($netProfit - $prevNetProfit) / abs($prevNetProfit)) * 100, 2) 
            : 0;

        return response()->json([
            'period' => [
                'start' => $startDate,
                'end' => $endDate
            ],
            'total_revenue' => (float) $totalRevenue,
            'cost_of_goods_sold' => (float) $costOfGoodsSold,
            'gross_profit' => (float) $grossProfit,
            'gross_margin' => $grossMargin,
            'operating_expenses' => (float) $operatingExpenses,
            'net_profit' => (float) $netProfit,
            'net_margin' => $netMargin,
            'profit_growth' => $profitGrowth
        ]);
    }

    /**
     * قائمة الدخل (Income Statement)
     */
    public function incomeStatement(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        // إجمالي الإيرادات
        $revenue = Invoice::whereBetween('invoice_date', [$startDate, $endDate])->sum('total');

        // تكلفة المبيعات
        $costOfSales = InvoiceItem::join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->sum('invoice_items.total_cost');

        // إجمالي الربح
        $grossProfit = $revenue - $costOfSales;

        // المصروفات التشغيلية
        $operatingExpenses = Expense::whereBetween('expense_date', [$startDate, $endDate])->sum('amount');

        // الدخل التشغيلي
        $operatingIncome = $grossProfit - $operatingExpenses;

        // صافي الدخل (نفس الدخل التشغيلي في هذه الحالة البسيطة)
        $netIncome = $operatingIncome;

        return response()->json([
            'period' => "{$startDate} - {$endDate}",
            'revenue' => (float) $revenue,
            'cost_of_sales' => (float) $costOfSales,
            'gross_profit' => (float) $grossProfit,
            'operating_expenses' => (float) $operatingExpenses,
            'operating_income' => (float) $operatingIncome,
            'other_income' => 0.0,
            'other_expenses' => 0.0,
            'net_income' => (float) $netIncome
        ]);
    }

    /**
     * الميزانية العمومية (Balance Sheet)
     */
    public function balanceSheet(Request $request)
    {
        $date = $request->input('date', Carbon::now()->format('Y-m-d'));

        // الأصول المتداولة
        $cashBalance = CashBalance::first();
        $cash = $cashBalance ? $cashBalance->cash_balance + $cashBalance->bank_balance : 0;
        $receivables = Debt::where('is_paid', false)->sum('remaining_amount');
        $inventoryValue = \App\Models\InventoryItem::selectRaw('SUM(current_quantity * COALESCE(unit_cost, 0)) as total')->value('total') ?? 0;
        
        $currentAssets = $cash + $receivables + $inventoryValue;

        // الأصول الثابتة (يمكن إضافتها لاحقاً)
        $fixedAssets = 0;
        
        $totalAssets = $currentAssets + $fixedAssets;

        // المطلوبات (الديون المستحقة للموردين)
        $payables = \App\Models\SupplierPayment::whereNull('payment_date')->sum('amount') ?? 0;
        $totalLiabilities = $payables;

        // حقوق الملكية
        $equity = $totalAssets - $totalLiabilities;

        return response()->json([
            'date' => $date,
            'assets' => [
                'current' => [
                    'cash' => (float) $cash,
                    'receivables' => (float) $receivables,
                    'inventory' => (float) $inventoryValue,
                    'total' => (float) $currentAssets
                ],
                'fixed' => [
                    'equipment' => 0.0,
                    'other' => 0.0,
                    'total' => (float) $fixedAssets
                ],
                'total' => (float) $totalAssets
            ],
            'liabilities' => [
                'current' => [
                    'payables' => (float) $payables,
                    'debts' => 0.0,
                    'total' => (float) $totalLiabilities
                ],
                'total' => (float) $totalLiabilities
            ],
            'equity' => [
                'capital' => 0.0,
                'retained_earnings' => (float) $equity,
                'total' => (float) $equity
            ]
        ]);
    }

    /**
     * اتجاه الأرباح على مدى فترة زمنية
     */
    public function profitTrend(Request $request)
    {
        $period = $request->input('period', 'monthly');
        $startDate = $request->input('start_date', Carbon::now()->subMonths(12)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $format = $this->getDateFormat($period);

        $revenues = Invoice::selectRaw(
                "DATE_FORMAT(invoice_date, '" . $format . "') as period,
                SUM(total) as revenue"
            )
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        $expenses = Expense::selectRaw(
                "strftime('" . $this->getSQLiteDateFormat($period) . "', expense_date) as period,
                SUM(amount) as expenses"
            )
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        $allPeriods = $revenues->keys()->merge($expenses->keys())->unique()->sort();

        $result = $allPeriods->map(function ($periodKey) use ($revenues, $expenses) {
            $revenue = $revenues->get($periodKey);
            $expense = $expenses->get($periodKey);
            
            $revenueAmount = $revenue ? (float) $revenue->revenue : 0;
            $expenseAmount = $expense ? (float) $expense->expenses : 0;
            $profit = $revenueAmount - $expenseAmount;
            $margin = $revenueAmount > 0 ? round(($profit / $revenueAmount) * 100, 2) : 0;
            
            return [
                'period' => $periodKey,
                'revenue' => $revenueAmount,
                'expenses' => $expenseAmount,
                'profit' => $profit,
                'margin' => $margin
            ];
        })->values();

        return response()->json($result);
    }

    /**
     * تصدير التقرير
     */
    public function export(Request $request, string $type, string $format)
    {
        // سيتم تنفيذها لاحقاً مع خدمة التصدير
        return response()->json(['message' => 'Export functionality coming soon']);
    }

    /**
     * دالة مساعدة لتنسيق التاريخ
     */
    private function getSQLiteDateFormat($period)
    {
        return match($period) {
            'daily' => '%Y-%m-%d',
            'weekly' => '%Y-%W',
            'monthly' => '%Y-%m',
            'quarterly' => '%Y-%m', // Will handle quarterly in PHP
            'yearly' => '%Y',
            default => '%Y-%m'
        };
    }

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
