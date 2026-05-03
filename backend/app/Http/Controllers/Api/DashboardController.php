<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\CashBalance;
use App\Models\InventoryItem;
use App\Models\Debt;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();
        $thisYear = Carbon::now()->startOfYear();

        // Today's stats
        $todayStats = [
            'sales' => Invoice::whereDate('invoice_date', $today)->sum('total'),
            'payments_received' => Invoice::whereDate('invoice_date', $today)->sum('paid_amount'),
            'expenses' => Expense::whereDate('expense_date', $today)->sum('amount'),
        ];
        $todayStats['profit'] = ($request->user()->hasPermissionTo('invoices.view_costs')) 
            ? $todayStats['sales'] - $todayStats['expenses'] 
            : 0;

        // This month's stats
        $monthStats = [
            'sales' => Invoice::where('invoice_date', '>=', $thisMonth)->sum('total'),
            'invoices_count' => Invoice::where('invoice_date', '>=', $thisMonth)->count(),
        ];

        if ($request->user()->hasPermissionTo('invoices.view_costs')) {
            $monthStats['profit'] = Invoice::where('invoice_date', '>=', $thisMonth)->sum('profit');
            $monthStats['expenses'] = Expense::where('expense_date', '>=', $thisMonth)->sum('amount');
        }

        // Cash balance
        $balance = CashBalance::getBalance();
        $cashBalance = [
            'cash' => $balance->cash_balance,
            'bank' => $balance->bank_balance,
            'total' => $balance->cash_balance + $balance->bank_balance,
        ];

        // Debts summary
        $debts = [
            'customers_debt' => Customer::withSum('invoices', 'remaining_amount')
                ->get()
                ->sum('invoices_sum_remaining_amount'),
            'our_debt' => Debt::where('is_paid', false)->sum('remaining_amount'),
        ];

        // Invoice status counts
        $invoiceStatus = [
            'new' => Invoice::where('status', 'new')->count(),
            'in_progress' => Invoice::where('status', 'in_progress')->count(),
            'ready' => Invoice::where('status', 'ready')->count(),
            'delivered' => Invoice::where('status', 'delivered')->count(),
        ];

        // Low stock items
        $lowStockItems = InventoryItem::lowStock()->active()->get(['id', 'name', 'current_quantity', 'minimum_quantity']);

        // Recent invoices
        $recentInvoices = Invoice::with('customer')
            ->latest()
            ->limit(5)
            ->get(['id', 'invoice_number', 'customer_id', 'total', 'status', 'created_at']);

        $response = [
            'today' => $todayStats,
            'month' => $monthStats,
            'cash_balance' => $cashBalance,
            'debts' => $debts,
            'invoice_status' => $invoiceStatus,
            'low_stock_items' => $lowStockItems,
            'recent_invoices' => $recentInvoices,
        ];

        // Clean up sensitive data if no permission
        if (!$request->user()->hasPermissionTo('invoices.view_costs')) {
            unset($response['today']['expenses']);
            unset($response['today']['profit']);
            // profit and expenses already handled in $monthStats
        }

        return response()->json($response);
    }

    public function charts(Request $request): JsonResponse
    {
        $days = $request->days ?? 30;
        $startDate = Carbon::now()->subDays($days);

        $dailySalesQuery = Invoice::selectRaw('DATE(invoice_date) as date, SUM(total) as total')
            ->where('invoice_date', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date');

        if ($request->user()->hasPermissionTo('invoices.view_costs')) {
            $dailySalesQuery->selectRaw('SUM(profit) as profit');
        }

        $dailySales = $dailySalesQuery->get();

        // Monthly comparison
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $comparison = [
            'this_month' => [
                'sales' => Invoice::where('invoice_date', '>=', $thisMonth)->sum('total'),
            ],
            'last_month' => [
                'sales' => Invoice::whereBetween('invoice_date', [$lastMonth, $thisMonth])->sum('total'),
            ],
        ];

        if ($request->user()->hasPermissionTo('invoices.view_costs')) {
            $comparison['this_month']['expenses'] = Expense::where('expense_date', '>=', $thisMonth)->sum('amount');
            $comparison['last_month']['expenses'] = Expense::whereBetween('expense_date', [$lastMonth, $thisMonth])->sum('amount');
        }

        return response()->json([
            'daily_sales' => $dailySales,
            'comparison' => $comparison,
        ]);
    }
}
