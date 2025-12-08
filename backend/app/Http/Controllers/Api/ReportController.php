<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Expense;
use App\Models\CashBalance;
use App\Models\CashMovement;
use App\Models\InvoiceItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function incomeStatement(Request $request): JsonResponse
    {
        $dateFrom = $request->date_from ?? Carbon::now()->startOfMonth()->toDateString();
        $dateTo = $request->date_to ?? Carbon::now()->endOfMonth()->toDateString();

        // Revenue
        $revenue = Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])
            ->sum('total');

        // Cost of goods sold
        $cogs = Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])
            ->sum('total_cost');

        // Gross profit
        $grossProfit = $revenue - $cogs;

        // Operating expenses by type
        $expenses = Expense::with('expenseType')
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->get()
            ->groupBy('expenseType.name')
            ->map(fn($group) => $group->sum('amount'));

        $totalExpenses = $expenses->sum();

        // Net profit
        $netProfit = $grossProfit - $totalExpenses;

        return response()->json([
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
            'revenue' => $revenue,
            'cost_of_goods_sold' => $cogs,
            'gross_profit' => $grossProfit,
            'gross_profit_margin' => $revenue > 0 ? round(($grossProfit / $revenue) * 100, 2) : 0,
            'operating_expenses' => $expenses,
            'total_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
            'net_profit_margin' => $revenue > 0 ? round(($netProfit / $revenue) * 100, 2) : 0,
        ]);
    }

    public function balanceSheet(): JsonResponse
    {
        $balance = CashBalance::getBalance();

        // Assets
        $assets = [
            'cash' => $balance->cash_balance,
            'bank' => $balance->bank_balance,
            'accounts_receivable' => Invoice::sum('remaining_amount'),
        ];

        // Liabilities
        $liabilities = [
            'accounts_payable' => \App\Models\Supplier::sum('total_debt'),
        ];

        // Equity (simplified)
        $equity = array_sum($assets) - array_sum($liabilities);

        return response()->json([
            'date' => Carbon::now()->toDateString(),
            'assets' => [
                'current_assets' => $assets,
                'total_assets' => array_sum($assets),
            ],
            'liabilities' => [
                'current_liabilities' => $liabilities,
                'total_liabilities' => array_sum($liabilities),
            ],
            'equity' => $equity,
        ]);
    }

    public function cashFlow(Request $request): JsonResponse
    {
        $dateFrom = $request->date_from ?? Carbon::now()->startOfMonth()->toDateString();
        $dateTo = $request->date_to ?? Carbon::now()->endOfMonth()->toDateString();

        $movements = CashMovement::whereBetween('movement_date', [$dateFrom, $dateTo])
            ->get()
            ->groupBy('movement_type')
            ->map(fn($group) => $group->sum('amount'));

        return response()->json([
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
            'inflows' => [
                'income' => $movements->get('income', 0),
                'initial' => $movements->get('initial', 0),
            ],
            'outflows' => [
                'expense' => $movements->get('expense', 0),
                'withdrawal' => $movements->get('withdrawal', 0),
            ],
            'net_cash_flow' => ($movements->get('income', 0) + $movements->get('initial', 0))
                - ($movements->get('expense', 0) + $movements->get('withdrawal', 0)),
        ]);
    }

    public function salesByCustomer(Request $request): JsonResponse
    {
        $dateFrom = $request->date_from ?? Carbon::now()->startOfYear()->toDateString();
        $dateTo = $request->date_to ?? Carbon::now()->endOfYear()->toDateString();

        $sales = Invoice::with('customer')
            ->whereBetween('invoice_date', [$dateFrom, $dateTo])
            ->get()
            ->groupBy('customer_id')
            ->map(function ($invoices) {
                return [
                    'customer' => $invoices->first()->customer,
                    'total_invoices' => $invoices->count(),
                    'total_sales' => $invoices->sum('total'),
                    'total_profit' => $invoices->sum('profit'),
                ];
            })
            ->sortByDesc('total_sales')
            ->values();

        return response()->json($sales);
    }

    public function salesByProduct(Request $request): JsonResponse
    {
        $dateFrom = $request->date_from ?? Carbon::now()->startOfYear()->toDateString();
        $dateTo = $request->date_to ?? Carbon::now()->endOfYear()->toDateString();

        $sales = \App\Models\InvoiceItem::whereHas('invoice', function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('invoice_date', [$dateFrom, $dateTo]);
            })
            ->selectRaw('product_name, SUM(quantity) as total_quantity, SUM(total_price) as total_sales, SUM(profit) as total_profit')
            ->groupBy('product_name')
            ->orderByDesc('total_sales')
            ->get();

        return response()->json($sales);
    }

    public function getStats(Request $request): JsonResponse
    {
        $dateFrom = $request->start_date ?? Carbon::now()->startOfMonth()->toDateString();
        $dateTo = $request->end_date ?? Carbon::now()->endOfMonth()->toDateString();

        // Current period stats
        $currentRevenue = Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])
            ->sum('total');

        $currentExpenses = Expense::whereBetween('expense_date', [$dateFrom, $dateTo])
            ->sum('amount');

        $currentProfit = Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])
            ->sum('profit');

        // Previous period for comparison
        $daysDiff = Carbon::parse($dateFrom)->diffInDays(Carbon::parse($dateTo)) + 1;
        $prevFrom = Carbon::parse($dateFrom)->subDays($daysDiff)->toDateString();
        $prevTo = Carbon::parse($dateFrom)->subDay()->toDateString();

        $prevRevenue = Invoice::whereBetween('invoice_date', [$prevFrom, $prevTo])
            ->sum('total');

        $prevExpenses = Expense::whereBetween('expense_date', [$prevFrom, $prevTo])
            ->sum('amount');

        $prevProfit = Invoice::whereBetween('invoice_date', [$prevFrom, $prevTo])
            ->sum('profit');

        // Calculate changes
        $revenueChange = $prevRevenue > 0 ? round((($currentRevenue - $prevRevenue) / $prevRevenue) * 100, 1) : 0;
        $expensesChange = $prevExpenses > 0 ? round((($currentExpenses - $prevExpenses) / $prevExpenses) * 100, 1) : 0;
        $profitChange = $prevProfit != 0 ? round((($currentProfit - $prevProfit) / abs($prevProfit)) * 100, 1) : 0;

        // Additional stats
        $newCustomers = \App\Models\Customer::whereBetween('created_at', [$dateFrom, $dateTo])->count();
        $completedInvoices = Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])
            ->where('status', 'delivered')->count();
        $receivables = Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])
            ->sum('remaining_amount');
        $avgInvoice = $currentRevenue > 0 ? round($currentRevenue / Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])->count(), 2) : 0;

        // Top customers
        $topCustomers = Invoice::with('customer')
            ->whereBetween('invoice_date', [$dateFrom, $dateTo])
            ->selectRaw('customer_id, SUM(total) as total')
            ->groupBy('customer_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(function ($invoice) {
                return [
                    'name' => $invoice->customer->name ?? 'غير محدد',
                    'total' => (float) $invoice->total,
                ];
            });

        return response()->json([
            'revenue' => $currentRevenue,
            'expenses' => $currentExpenses,
            'profit' => $currentProfit,
            'revenue_change' => $revenueChange,
            'expenses_change' => $expensesChange,
            'profit_change' => $profitChange,
            'new_customers' => $newCustomers,
            'completed_invoices' => $completedInvoices,
            'receivables' => $receivables,
            'avg_invoice' => $avgInvoice,
            'top_customers' => $topCustomers,
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
        ]);
    }

    public function getSalesChart(Request $request): JsonResponse
    {
        $dateFrom = $request->start_date ?? Carbon::now()->subDays(30)->toDateString();
        $dateTo = $request->end_date ?? Carbon::now()->toDateString();

        $sales = Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])
            ->selectRaw('DATE(invoice_date) as date, SUM(total) as sales, COUNT(*) as invoices')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'sales' => (float) $item->sales,
                    'invoices' => (int) $item->invoices,
                ];
            });

        return response()->json($sales);
    }

    public function getTopProducts(Request $request): JsonResponse
    {
        $dateFrom = $request->start_date ?? Carbon::now()->startOfMonth()->toDateString();
        $dateTo = $request->end_date ?? Carbon::now()->endOfMonth()->toDateString();

        $products = \App\Models\InvoiceItem::whereHas('invoice', function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('invoice_date', [$dateFrom, $dateTo]);
            })
            ->selectRaw('product_name, SUM(quantity) as quantity, SUM(total_price) as sales, SUM(profit) as profit')
            ->groupBy('product_name')
            ->orderByDesc('sales')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->product_name,
                    'quantity' => (int) $item->quantity,
                    'sales' => (float) $item->sales,
                    'profit' => (float) $item->profit,
                ];
            });

        return response()->json($products);
    }

    public function getExpensesChart(Request $request): JsonResponse
    {
        $dateFrom = $request->start_date ?? Carbon::now()->startOfMonth()->toDateString();
        $dateTo = $request->end_date ?? Carbon::now()->endOfMonth()->toDateString();

        $expenses = Expense::with('expenseType')
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->selectRaw('DATE(expense_date) as date, SUM(amount) as amount')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'amount' => (float) $item->amount,
                ];
            });

        // Expenses by type
        $byType = Expense::with('expenseType')
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->get()
            ->groupBy('expenseType.name')
            ->map(function ($group) {
                return $group->sum('amount');
            })
            ->sortDesc()
            ->take(10);

        return response()->json([
            'data' => $expenses,
            'by_type' => $byType,
        ]);
    }
}
