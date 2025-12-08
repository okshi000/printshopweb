<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\WithdrawalController;
use App\Http\Controllers\Api\CashController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AccountantController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\ReportsController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/charts', [DashboardController::class, 'charts']);

    // Customers
    Route::apiResource('customers', CustomerController::class);
    Route::get('/customers/{customer}/transactions', [CustomerController::class, 'transactions']);

    // Suppliers
    Route::apiResource('suppliers', SupplierController::class);
    Route::post('/suppliers/{supplier}/payments', [SupplierController::class, 'addPayment']);
    Route::get('/suppliers/{supplier}/transactions', [SupplierController::class, 'transactions']);

    // Categories
    Route::apiResource('categories', CategoryController::class);

    // Products
    Route::apiResource('products', ProductController::class);

    // Invoices
    Route::apiResource('invoices', InvoiceController::class);
    Route::patch('/invoices/{invoice}/status', [InvoiceController::class, 'updateStatus']);
    Route::post('/invoices/{invoice}/payments', [InvoiceController::class, 'addPayment']);

    // Expenses
    Route::apiResource('expenses', ExpenseController::class)->except(['update']);
    Route::get('/expense-types', [ExpenseController::class, 'types']);
    Route::post('/expense-types', [ExpenseController::class, 'storeType']);

    // Withdrawals
    Route::apiResource('withdrawals', WithdrawalController::class)->except(['update']);
    Route::post('/inventory-movements', [InventoryController::class, 'storeMovement']);

    // Cash Management
    Route::get('/cash/balance', [CashController::class, 'balance']);
    Route::get('/cash/movements', [CashController::class, 'movements']);
    Route::post('/cash/transfer', [CashController::class, 'transfer']);
    Route::post('/cash/set-initial', [CashController::class, 'setInitial']);
    Route::post('/cash/adjust', [CashController::class, 'adjust']);

    // Inventory
    Route::apiResource('inventory', InventoryController::class);
    Route::post('/inventory/{inventory}/add-stock', [InventoryController::class, 'addStock']);
    Route::post('/inventory/{inventory}/remove-stock', [InventoryController::class, 'removeStock']);
    Route::get('/inventory-movements', [InventoryController::class, 'movements']);

    // Debts
    Route::apiResource('debts', DebtController::class)->except(['update']);
    Route::post('/debts/{debt}/repay', [DebtController::class, 'repay']);

    // Activity Log
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::get('/activity-logs/{activityLog}', [ActivityLogController::class, 'show']);

    // Reports
    Route::get('/reports/income-statement', [ReportController::class, 'incomeStatement']);
    Route::get('/reports/balance-sheet', [ReportController::class, 'balanceSheet']);
    Route::get('/reports/cash-flow', [ReportController::class, 'cashFlow']);
    Route::get('/reports/sales-by-customer', [ReportController::class, 'salesByCustomer']);
    Route::get('/reports/sales-by-product', [ReportController::class, 'salesByProduct']);
    Route::get('/reports/stats', [ReportController::class, 'getStats']);
    Route::get('/reports/sales-chart', [ReportController::class, 'getSalesChart']);
    Route::get('/reports/top-products', [ReportController::class, 'getTopProducts']);
    Route::get('/reports/expenses-chart', [ReportController::class, 'getExpensesChart']);

    // Accountant - المحاسب الآلي
    Route::get('/accountant/dashboard', [AccountantController::class, 'dashboard']);
    Route::get('/accountant/revenue-chart', [AccountantController::class, 'revenueChart']);
    Route::get('/accountant/expense-chart', [AccountantController::class, 'expenseChart']);
    Route::get('/accountant/income-statement', [AccountantController::class, 'incomeStatement']);
    Route::get('/accountant/balance-sheet', [AccountantController::class, 'balanceSheet']);

    // Users Management - إدارة المستخدمين
    Route::apiResource('users', UserController::class);
    Route::get('/roles', [UserController::class, 'roles']);
    Route::post('/roles', [UserController::class, 'createRole']);
    Route::put('/roles/{role}', [UserController::class, 'updateRole']);
    Route::delete('/roles/{role}', [UserController::class, 'deleteRole']);
    Route::get('/permissions', [UserController::class, 'permissions']);

    // Advanced Reports - التقارير التفصيلية
    Route::prefix('reports-v2')->group(function () {
        // Financial Reports
        Route::get('/financial/summary', [ReportsController::class, 'financialSummary']);
        Route::get('/financial/revenue-by-period', [ReportsController::class, 'revenueByPeriod']);
        Route::get('/financial/expense-breakdown', [ReportsController::class, 'expenseBreakdown']);
        Route::get('/financial/profit-loss', [ReportsController::class, 'profitLossReport']);
        
        // Sales Reports
        Route::get('/sales/summary', [ReportsController::class, 'salesReport']);
        Route::get('/sales/by-customer', [ReportsController::class, 'salesByCustomer']);
        Route::get('/sales/by-product', [ReportsController::class, 'salesByProduct']);
        Route::get('/sales/top-products', [ReportsController::class, 'topSellingProducts']);
        
        // Inventory Reports
        Route::get('/inventory/summary', [ReportsController::class, 'inventoryReport']);
        Route::get('/inventory/details', [ReportsController::class, 'inventoryItemDetails']);
        Route::get('/inventory/movements', [ReportsController::class, 'inventoryMovementReport']);
        Route::get('/inventory/valuation', [ReportsController::class, 'stockValuation']);
        
        // Supplier Reports
        Route::get('/suppliers/summary', [ReportsController::class, 'supplierReport']);
        
        // Customer Reports
        Route::get('/customers/summary', [ReportsController::class, 'customerReport']);
        
        // Debt Reports
        Route::get('/debts/summary', [ReportsController::class, 'debtReport']);
        Route::get('/debts/by-customer', [ReportsController::class, 'debtByCustomer']);
        
        // Cash Flow Reports
        Route::get('/cash-flow/summary', [ReportsController::class, 'cashFlowReport']);
        Route::get('/cash-flow/trend', [ReportsController::class, 'cashFlowTrend']);
        
        // Dashboard Metrics
        Route::get('/dashboard/metrics', [ReportsController::class, 'dashboardMetrics']);
    });
});
