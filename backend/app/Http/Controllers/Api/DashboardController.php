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
        $todayStats['profit'] = $todayStats['sales'] - $todayStats['expenses'];

        // This month's stats
        $monthStats = [
            'sales' => Invoice::where('invoice_date', '>=', $thisMonth)->sum('total'),
            'profit' => Invoice::where('invoice_date', '>=', $thisMonth)->sum('profit'),
            'expenses' => Expense::where('expense_date', '>=', $thisMonth)->sum('amount'),
            'invoices_count' => Invoice::where('invoice_date', '>=', $thisMonth)->count(),
        ];

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

        return response()->json([
            'today' => $todayStats,
            'month' => $monthStats,
            'cash_balance' => $cashBalance,
            'debts' => $debts,
            'invoice_status' => $invoiceStatus,
            'low_stock_items' => $lowStockItems,
            'recent_invoices' => $recentInvoices,
        ]);
    }

    public function charts(Request $request): JsonResponse
    {
        $days = $request->days ?? 30;
        $startDate = Carbon::now()->subDays($days);

        // Daily sales for chart
        $dailySales = Invoice::selectRaw('DATE(invoice_date) as date, SUM(total) as total, SUM(profit) as profit')
            ->where('invoice_date', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Monthly comparison
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $comparison = [
            'this_month' => [
                'sales' => Invoice::where('invoice_date', '>=', $thisMonth)->sum('total'),
                'expenses' => Expense::where('expense_date', '>=', $thisMonth)->sum('amount'),
            ],
            'last_month' => [
                'sales' => Invoice::whereBetween('invoice_date', [$lastMonth, $thisMonth])->sum('total'),
                'expenses' => Expense::whereBetween('expense_date', [$lastMonth, $thisMonth])->sum('amount'),
            ],
        ];

        return response()->json([
            'daily_sales' => $dailySales,
            'comparison' => $comparison,
        ]);
    }
}
