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
use App\Http\Controllers\Api\DebtAccountController;
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
    Route::get('/invoices-statistics', [InvoiceController::class, 'statistics']);

    // Expenses
    Route::apiResource('expenses', ExpenseController::class)->except(['update']);
    Route::get('/expense-types', [ExpenseController::class, 'types']);
    Route::post('/expense-types', [ExpenseController::class, 'storeType']);
    Route::put('/expense-types/{expenseType}', [ExpenseController::class, 'updateType']);
    Route::delete('/expense-types/{expenseType}', [ExpenseController::class, 'destroyType']);

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

    // Debt Accounts
    Route::apiResource('debt-accounts', DebtAccountController::class);
    Route::get('/debt-accounts-all', [DebtAccountController::class, 'all']);

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
    Route::get('/accountant/analytics', [AccountantController::class, 'analyticsReport']);
    Route::get('/accountant/health', [AccountantController::class, 'financialHealth']);

    // Users Management - إدارة المستخدمين
    Route::apiResource('users', UserController::class);
    Route::get('/roles', [UserController::class, 'roles']);
    Route::post('/roles', [UserController::class, 'createRole']);
    Route::put('/roles/{role}', [UserController::class, 'updateRole']);
    Route::delete('/roles/{role}', [UserController::class, 'deleteRole']);
    Route::get('/permissions', [UserController::class, 'permissions']);

    // Reports - التقارير الجديدة
    Route::prefix('reports')->group(function () {
        // Financial Reports - تقارير مالية (توافق مع واجهة الفرونتэнд)
        Route::prefix('financial')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\FinancialReportController::class, 'summary']);
            Route::get('/revenue', [\App\Http\Controllers\Reports\FinancialReportController::class, 'revenueByPeriod']);
            Route::get('/expenses', [\App\Http\Controllers\Reports\FinancialReportController::class, 'expenseBreakdown']);
            Route::get('/profit-loss', [\App\Http\Controllers\Reports\FinancialReportController::class, 'profitLoss']);
            Route::get('/income-statement', [\App\Http\Controllers\Reports\FinancialReportController::class, 'incomeStatement']);
            Route::get('/balance-sheet', [\App\Http\Controllers\Reports\FinancialReportController::class, 'balanceSheet']);
        });
        // Sales Reports - تقارير المبيعات
        Route::prefix('sales')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\SalesReportController::class, 'summary']);
            Route::get('/by-customer', [\App\Http\Controllers\Reports\SalesReportController::class, 'byCustomer']);
            Route::get('/by-product', [\App\Http\Controllers\Reports\SalesReportController::class, 'byProduct']);
            Route::get('/by-period', [\App\Http\Controllers\Reports\SalesReportController::class, 'trend']);
            Route::get('/top-products', [\App\Http\Controllers\Reports\SalesReportController::class, 'topProducts']);
            Route::get('/invoices', [\App\Http\Controllers\Reports\SalesReportController::class, 'trend']);
            Route::get('/export/{type}', [\App\Http\Controllers\Reports\SalesReportController::class, 'export']);
        });
        
        // Inventory Reports - تقارير المخزون
        Route::prefix('inventory')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\InventoryReportController::class, 'summary']);
            Route::get('/details', [\App\Http\Controllers\Reports\InventoryReportController::class, 'details']);
            Route::get('/movements', [\App\Http\Controllers\Reports\InventoryReportController::class, 'movements']);
            Route::get('/movements/summary', [\App\Http\Controllers\Reports\InventoryReportController::class, 'movementSummary']);
            Route::get('/valuation', [\App\Http\Controllers\Reports\InventoryReportController::class, 'valuation']);
            Route::get('/low-stock', [\App\Http\Controllers\Reports\InventoryReportController::class, 'lowStock']);
            Route::get('/export/{type}', [\App\Http\Controllers\Reports\InventoryReportController::class, 'export']);
        });
        
        // Customer Reports - تقارير العملاء
        Route::prefix('customers')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\CustomerReportController::class, 'summary']);
            Route::get('/report', [\App\Http\Controllers\Reports\CustomerReportController::class, 'report']);
            Route::get('/export/{type}', [\App\Http\Controllers\Reports\CustomerReportController::class, 'export']);
        });

        // Debt Reports - تقارير الديون
        Route::prefix('debts')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\CustomerReportController::class, 'debtSummary']);
            Route::get('/by-customer', [\App\Http\Controllers\Reports\CustomerReportController::class, 'debtByCustomer']);
            Route::get('/aging', [\App\Http\Controllers\Reports\CustomerReportController::class, 'debtAging']);
            Route::get('/repayment-history', [\App\Http\Controllers\Reports\CustomerReportController::class, 'repaymentHistory']);
        });
        
        // Cash Flow Reports - تقارير التدفق النقدي
        Route::prefix('cash-flow')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\CashflowReportController::class, 'summary']);
            Route::get('/trend', [\App\Http\Controllers\Reports\CashflowReportController::class, 'trend']);
            Route::get('/by-category', [\App\Http\Controllers\Reports\CashflowReportController::class, 'byCategory']);
            Route::get('/movements', [\App\Http\Controllers\Reports\CashflowReportController::class, 'movements']);
            Route::get('/balance-by-source', [\App\Http\Controllers\Reports\CashflowReportController::class, 'balanceBySource']);
            Route::get('/daily-summary', [\App\Http\Controllers\Reports\CashflowReportController::class, 'dailySummary']);
            Route::get('/forecast', [\App\Http\Controllers\Reports\CashflowReportController::class, 'forecast']);
            Route::get('/export/{type}', [\App\Http\Controllers\Reports\CashflowReportController::class, 'export']);
        });
    });

    // Advanced Reports - التقارير التفصيلية (الإصدار الجديد)
    Route::prefix('reports-v2')->group(function () {
        // Financial Reports - التقارير المالية
        Route::prefix('financial')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\FinancialReportController::class, 'summary']);
            Route::get('/revenue-by-period', [\App\Http\Controllers\Reports\FinancialReportController::class, 'revenueByPeriod']);
            Route::get('/expense-breakdown', [\App\Http\Controllers\Reports\FinancialReportController::class, 'expenseBreakdown']);
            Route::get('/profit-loss', [\App\Http\Controllers\Reports\FinancialReportController::class, 'profitLoss']);
            Route::get('/profit-trend', [\App\Http\Controllers\Reports\FinancialReportController::class, 'profitTrend']);
            Route::get('/export/{type}/{format}', [\App\Http\Controllers\Reports\FinancialReportController::class, 'export']);
        });
        
        // Sales Reports - تقارير المبيعات
        Route::prefix('sales')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\SalesReportController::class, 'summary']);
            Route::get('/by-customer', [\App\Http\Controllers\Reports\SalesReportController::class, 'byCustomer']);
            Route::get('/by-product', [\App\Http\Controllers\Reports\SalesReportController::class, 'byProduct']);
            Route::get('/top-products', [\App\Http\Controllers\Reports\SalesReportController::class, 'topProducts']);
            Route::get('/trend', [\App\Http\Controllers\Reports\SalesReportController::class, 'trend']);
            Route::get('/quick-stats', [\App\Http\Controllers\Reports\SalesReportController::class, 'quickStats']);
            Route::get('/export/{type}/{format}', [\App\Http\Controllers\Reports\SalesReportController::class, 'export']);
        });
        
        // Inventory Reports - تقارير المخزون
        Route::prefix('inventory')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\InventoryReportController::class, 'summary']);
            Route::get('/details', [\App\Http\Controllers\Reports\InventoryReportController::class, 'details']);
            Route::get('/movements', [\App\Http\Controllers\Reports\InventoryReportController::class, 'movements']);
            Route::get('/valuation', [\App\Http\Controllers\Reports\InventoryReportController::class, 'valuation']);
            Route::get('/low-stock', [\App\Http\Controllers\Reports\InventoryReportController::class, 'lowStock']);
            Route::get('/movement-summary', [\App\Http\Controllers\Reports\InventoryReportController::class, 'movementSummary']);
            Route::get('/export/{type}/{format}', [\App\Http\Controllers\Reports\InventoryReportController::class, 'export']);
        });
        
        // Customer Reports - تقارير العملاء
        Route::prefix('customers')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\CustomerReportController::class, 'summary']);
            Route::get('/report', [\App\Http\Controllers\Reports\CustomerReportController::class, 'report']);
            Route::get('/export/{type}/{format}', [\App\Http\Controllers\Reports\CustomerReportController::class, 'export']);
        });

        // Debt Reports - تقارير الديون
        Route::prefix('debts')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\CustomerReportController::class, 'debtSummary']);
            Route::get('/by-customer', [\App\Http\Controllers\Reports\CustomerReportController::class, 'debtByCustomer']);
            Route::get('/aging', [\App\Http\Controllers\Reports\CustomerReportController::class, 'debtAging']);
            Route::get('/repayment-history', [\App\Http\Controllers\Reports\CustomerReportController::class, 'repaymentHistory']);
        });
        
        // Cash Flow Reports - تقارير التدفق النقدي
        Route::prefix('cashflow')->group(function () {
            Route::get('/summary', [\App\Http\Controllers\Reports\CashflowReportController::class, 'summary']);
            Route::get('/trend', [\App\Http\Controllers\Reports\CashflowReportController::class, 'trend']);
            Route::get('/by-category', [\App\Http\Controllers\Reports\CashflowReportController::class, 'byCategory']);
            Route::get('/movements', [\App\Http\Controllers\Reports\CashflowReportController::class, 'movements']);
            Route::get('/balance-by-source', [\App\Http\Controllers\Reports\CashflowReportController::class, 'balanceBySource']);
            Route::get('/daily-summary', [\App\Http\Controllers\Reports\CashflowReportController::class, 'dailySummary']);
            Route::get('/forecast', [\App\Http\Controllers\Reports\CashflowReportController::class, 'forecast']);
            Route::get('/export/{type}/{format}', [\App\Http\Controllers\Reports\CashflowReportController::class, 'export']);
        });
        
        // Legacy routes for backward compatibility (سيتم إزالتها لاحقاً)
        Route::get('/financial/summary', [\App\Http\Controllers\Reports\FinancialReportController::class, 'summary']);
        Route::get('/sales/summary', [\App\Http\Controllers\Reports\SalesReportController::class, 'summary']);
        Route::get('/inventory/summary', [\App\Http\Controllers\Reports\InventoryReportController::class, 'summary']);
        Route::get('/cash-flow/summary', [\App\Http\Controllers\Reports\CashflowReportController::class, 'summary']);
        Route::get('/cash-flow/trend', [\App\Http\Controllers\Reports\CashflowReportController::class, 'trend']);
        Route::get('/dashboard/metrics', [\App\Http\Controllers\Reports\FinancialReportController::class, 'summary']);
    });
});
