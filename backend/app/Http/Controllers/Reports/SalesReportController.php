<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * تقارير المبيعات
 * 
 * يتضمن: ملخص المبيعات، حسب العميل، حسب المنتج، الأكثر مبيعاً
 */
class SalesReportController extends Controller
{
    /**
     * ملخص المبيعات
     */
    public function summary(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $invoices = Invoice::whereBetween('invoice_date', [$startDate, $endDate]);
        
        $totalSales = $invoices->sum('total');
        $totalInvoices = $invoices->count();
        $averageInvoice = $invoices->avg('total') ?? 0;
        $paidAmount = $invoices->sum('paid_amount');
        $pendingAmount = $invoices->sum('remaining_amount');
        $discountAmount = $invoices->sum('discount');

        // مقارنة مع الفترة السابقة
        $periodLength = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate));
        $prevStartDate = Carbon::parse($startDate)->subDays($periodLength)->format('Y-m-d');
        $prevEndDate = Carbon::parse($startDate)->subDay()->format('Y-m-d');

        $prevSales = Invoice::whereBetween('invoice_date', [$prevStartDate, $prevEndDate])
            ->sum('total');

        $salesGrowth = $prevSales > 0 
            ? round((($totalSales - $prevSales) / $prevSales) * 100, 2) 
            : 0;

        // عدد العملاء النشطين
        $activeCustomers = Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->distinct('customer_id')
            ->count('customer_id');

        return response()->json([
            'total_sales' => (float) $totalSales,
            'total_invoices' => $totalInvoices,
            'average_invoice_value' => round((float) $averageInvoice, 2),
            'paid_amount' => (float) $paidAmount,
            'pending_amount' => (float) $pendingAmount,
            'discount_amount' => (float) $discountAmount,
            'sales_growth' => $salesGrowth,
            'growth_rate' => $salesGrowth,
            'active_customers' => $activeCustomers,
            'period' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ]);
    }

    /**
     * المبيعات حسب العميل
     */
    public function byCustomer(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));
        $limit = $request->input('limit', 50);

        $data = Customer::select(
                'customers.id as customer_id',
                'customers.name as customer_name',
                'customers.phone as customer_phone',
                DB::raw('SUM(invoices.total) as total_purchases'),
                DB::raw('SUM(invoices.paid_amount) as total_paid'),
                DB::raw('SUM(invoices.remaining_amount) as total_debt'),
                DB::raw('COUNT(invoices.id) as invoice_count'),
                DB::raw('MAX(invoices.invoice_date) as last_purchase_date'),
                DB::raw('AVG(invoices.total) as average_order_value')
            )
            ->join('invoices', 'customers.id', '=', 'invoices.customer_id')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->groupBy('customers.id', 'customers.name', 'customers.phone')
            ->orderByDesc('total_purchases')
            ->limit($limit)
            ->get();

        $total = $data->sum('total_purchases');

        $result = $data->map(function ($item) use ($total) {
            return array_merge($item->toArray(), [
                'percentage' => $total > 0 ? round(($item->total_purchases / $total) * 100, 2) : 0
            ]);
        });

        return response()->json($result);
    }

    /**
     * المبيعات حسب المنتج
     */
    public function byProduct(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));
        $limit = $request->input('limit', 50);

        $data = Product::select(
                'products.id as product_id',
                'products.name as product_name',
                DB::raw('SUM(invoice_items.quantity) as quantity_sold'),
                DB::raw('SUM(invoice_items.quantity * invoice_items.unit_price) as total_revenue'),
                DB::raw('AVG(invoice_items.unit_price) as average_price'),
                DB::raw('COUNT(DISTINCT invoices.id) as order_count')
            )
            ->join('invoice_items', 'products.id', '=', 'invoice_items.product_id')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->whereBetween('invoices.invoice_date', [$startDate, $endDate])
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_revenue')
            ->limit($limit)
            ->get();

        $totalRevenue = $data->sum('total_revenue');

        $result = $data->map(function ($item) use ($totalRevenue) {
            return array_merge($item->toArray(), [
                'percentage' => $totalRevenue > 0 ? round(($item->total_revenue / $totalRevenue) * 100, 2) : 0
            ]);
        });

        return response()->json($result);
    }

    /**
     * أفضل المنتجات مبيعاً
     */
    public function topProducts(Request $request)
    {
        $limit = $request->input('limit', 10);
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));
        $sortBy = $request->input('sort_by', 'quantity'); // quantity or revenue

        $orderColumn = $sortBy === 'revenue' ? 'total_revenue' : 'quantity_sold';

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
            ->orderByDesc($orderColumn)
            ->limit($limit)
            ->get();

        // إضافة الترتيب
        $result = $data->map(function ($item, $index) {
            return array_merge($item->toArray(), [
                'rank' => $index + 1
            ]);
        });

        return response()->json($result);
    }

    /**
     * اتجاه المبيعات
     */
    public function trend(Request $request)
    {
        $period = $request->input('period', 'monthly');
        $startDate = $request->input('start_date', Carbon::now()->subMonths(6)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $format = $this->getDateFormat($period);

        $data = Invoice::selectRaw("
                DATE_FORMAT(invoice_date, '$format') as period,
                SUM(total) as sales,
                COUNT(*) as invoice_count,
                COUNT(DISTINCT customer_id) as customer_count,
                AVG(total) as average_sale
            ")
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json($data);
    }

    /**
     * إحصائيات سريعة
     */
    public function quickStats(Request $request)
    {
        $today = Carbon::today();
        $thisWeek = Carbon::now()->startOfWeek();
        $thisMonth = Carbon::now()->startOfMonth();

        $todaySales = Invoice::whereDate('invoice_date', $today)->sum('total');
        $weekSales = Invoice::whereBetween('invoice_date', [$thisWeek, $today])->sum('total');
        $monthSales = Invoice::whereBetween('invoice_date', [$thisMonth, $today])->sum('total');

        $todayInvoices = Invoice::whereDate('invoice_date', $today)->count();
        $weekInvoices = Invoice::whereBetween('invoice_date', [$thisWeek, $today])->count();
        $monthInvoices = Invoice::whereBetween('invoice_date', [$thisMonth, $today])->count();

        return response()->json([
            'today' => [
                'sales' => (float) $todaySales,
                'invoices' => $todayInvoices
            ],
            'this_week' => [
                'sales' => (float) $weekSales,
                'invoices' => $weekInvoices
            ],
            'this_month' => [
                'sales' => (float) $monthSales,
                'invoices' => $monthInvoices
            ]
        ]);
    }

    /**
     * تصدير التقرير
     */
    public function export(Request $request, string $type, string $format)
    {
        return response()->json(['message' => 'Export functionality coming soon']);
    }

    /**
     * دالة مساعدة لتنسيق التاريخ
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
