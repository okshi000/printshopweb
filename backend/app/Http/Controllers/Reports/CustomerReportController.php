<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Debt;
use App\Models\DebtRepayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * تقارير العملاء والديون
 * 
 * يتضمن: ملخص العملاء، تقارير العملاء، الديون، تقادم الديون
 */
class CustomerReportController extends Controller
{
    /**
     * ملخص العملاء
     */
    public function summary(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfYear()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $totalCustomers = Customer::count();
        
        // العملاء النشطين (لديهم فواتير في الفترة)
        $activeCustomers = Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->distinct('customer_id')
            ->count('customer_id');

        // العملاء الجدد في الفترة
        $newCustomers = Customer::whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // إجمالي إيرادات العملاء
        $totalRevenue = Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->sum('total');

        // متوسط قيمة العميل
        $averageCustomerValue = $activeCustomers > 0 ? $totalRevenue / $activeCustomers : 0;

        // العملاء المدينين
        $customersWithDebt = Debt::where('is_paid', false)
            ->distinct('customer_id')
            ->count('customer_id');

        return response()->json([
            'total_customers' => $totalCustomers,
            'active_customers' => $activeCustomers,
            'new_customers' => $newCustomers,
            'total_revenue' => round((float) $totalRevenue, 2),
            'average_customer_value' => round((float) $averageCustomerValue, 2),
            'customers_with_debt' => $customersWithDebt
        ]);
    }

    /**
     * تقرير العملاء التفصيلي
     */
    public function report(Request $request)
    {
        try {
            $startDate = $request->input('start_date', Carbon::now()->startOfYear()->format('Y-m-d'));
            $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));
            $limit = $request->input('limit', 100);

        $data = Customer::select(
                'customers.id as customer_id',
                'customers.name as customer_name',
                'customers.phone as customer_phone',
                'customers.created_at as customer_since'
            )
            ->get()
            ->map(function ($customer) use ($startDate, $endDate) {
                // فواتير العميل
                $invoices = Invoice::where('customer_id', $customer->customer_id)
                    ->whereBetween('invoice_date', [$startDate, $endDate]);
                
                $totalPurchases = $invoices->sum('total');
                $totalPaid = $invoices->sum('paid_amount');
                $invoiceCount = $invoices->count();
                $lastPurchase = $invoices->max('invoice_date');

                // الديون
                $totalDebt = Debt::where('customer_id', $customer->customer_id)
                    ->where('is_paid', false)
                    ->sum('remaining_amount');

                return array_merge($customer->toArray(), [
                    'total_purchases' => (float) $totalPurchases,
                    'total_paid' => (float) $totalPaid,
                    'total_debt' => (float) $totalDebt,
                    'invoice_count' => $invoiceCount,
                    'last_purchase_date' => $lastPurchase
                ]);
            })
            ->sortByDesc('total_purchases')
            ->take($limit)
            ->values();

        return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * ملخص الديون
     */
    public function debtSummary(Request $request)
    {
        try {
            $totalDebts = Debt::sum('amount');
            $totalRepaid = Debt::sum('paid_amount');
            $totalPending = Debt::where('is_paid', false)->sum('remaining_amount');
            $debtorCount = Debt::where('is_paid', false)
                ->distinct('customer_id')
                ->count('customer_id');

        // الديون المتأخرة
        $overdueAmount = Debt::where('is_paid', false)
            ->where('due_date', '<', Carbon::now())
            ->sum('remaining_amount');

        // متوسط عمر الديون
        $averageDebtAge = Debt::where('is_paid', false)
            ->selectRaw('AVG(DATEDIFF(NOW(), debt_date)) as avg_age')
            ->value('avg_age');

        // عدد الديون المتأخرة
        $overdueCount = Debt::where('is_paid', false)
            ->where('due_date', '<', Carbon::now())
            ->count();

        return response()->json([
            'total_debts' => (float) $totalDebts,
            'total_repaid' => (float) $totalRepaid,
            'total_pending' => (float) $totalPending,
            'overdue_amount' => (float) $overdueAmount,
            'debtor_count' => $debtorCount,
            'overdue_count' => $overdueCount,
            'average_debt_age' => round($averageDebtAge ?? 0, 0),
            'collection_rate' => $totalDebts > 0 ? round(($totalRepaid / $totalDebts) * 100, 2) : 0
        ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * الديون حسب العميل
     */
    public function debtByCustomer(Request $request)
    {
        try {
            $status = $request->input('status'); // all, current, overdue, critical
            $limit = $request->input('limit', 100);

            $data = Debt::select(
                    'debts.customer_id',
                    DB::raw('SUM(debts.amount) as total_debt'),
                    DB::raw('SUM(debts.paid_amount) as paid_amount'),
                    DB::raw('SUM(debts.remaining_amount) as remaining_amount'),
                    DB::raw('COUNT(debts.id) as debt_count'),
                    DB::raw('MAX(debts.debt_date) as last_debt_date'),
                    DB::raw('MAX(DATEDIFF(NOW(), debts.due_date)) as days_overdue')
                )
                ->with('customer:id,name,phone')
                ->where('debts.is_paid', false)
                ->whereNotNull('debts.customer_id')
                ->groupBy('debts.customer_id')
                ->orderByDesc('remaining_amount')
                ->limit($limit)
                ->get();

            $result = $data->map(function ($item) {
                $daysOverdue = max(0, $item->days_overdue ?? 0);
                $status = 'current';
                if ($daysOverdue > 90) {
                    $status = 'critical';
                } elseif ($daysOverdue > 30) {
                    $status = 'overdue';
                }
                
                return [
                    'customer_id' => $item->customer_id,
                    'customer_name' => $item->customer->name ?? 'غير معروف',
                    'customer_phone' => $item->customer->phone ?? '',
                    'total_debt' => (float) $item->total_debt,
                    'paid_amount' => (float) $item->paid_amount,
                    'remaining_amount' => (float) $item->remaining_amount,
                    'debt_count' => $item->debt_count,
                    'last_debt_date' => $item->last_debt_date,
                    'days_overdue' => $daysOverdue,
                    'status' => $status,
                ];
            });        // تصفية حسب الحالة
        if ($status && $status !== 'all') {
            $result = $result->filter(fn($item) => $item['status'] === $status)->values();
        }

        return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * تقادم الديون (Aging Report)
     */
    public function debtAging(Request $request)
    {
        try {
            // تعريف فترات التقادم
            $ranges = [
            ['min' => 0, 'max' => 30, 'label' => '0-30 يوم'],
            ['min' => 31, 'max' => 60, 'label' => '31-60 يوم'],
            ['min' => 61, 'max' => 90, 'label' => '61-90 يوم'],
            ['min' => 91, 'max' => 180, 'label' => '91-180 يوم'],
            ['min' => 181, 'max' => 365, 'label' => '181-365 يوم'],
            ['min' => 366, 'max' => 99999, 'label' => 'أكثر من سنة'],
        ];

        $result = collect($ranges)->map(function ($range) {
            $debts = Debt::where('is_paid', false)
                ->whereRaw('DATEDIFF(NOW(), debt_date) >= ?', [$range['min']])
                ->whereRaw('DATEDIFF(NOW(), debt_date) <= ?', [$range['max']]);

            $totalAmount = (clone $debts)->sum('remaining_amount');
            $debtCount = (clone $debts)->count();
            $customerCount = (clone $debts)->whereNotNull('customer_id')->distinct('customer_id')->count('customer_id');

            return [
                'age_range' => "{$range['min']}-{$range['max']}",
                'range_label' => $range['label'],
                'total_amount' => (float) $totalAmount,
                'debt_count' => $debtCount,
                'customer_count' => $customerCount
            ];
        });

        return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * سجل السداد
     */
    public function repaymentHistory(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));
        $customerId = $request->input('customer_id');
        $limit = $request->input('limit', 100);

        $query = DebtRepayment::select(
            'debt_repayments.id',
            'debt_repayments.payment_date',
            'debt_repayments.amount',
            'debt_repayments.payment_method',
            'customers.name as customer_name',
            'debts.amount as original_debt'
        )
        ->join('debts', 'debt_repayments.debt_id', '=', 'debts.id')
        ->join('customers', 'debts.customer_id', '=', 'customers.id')
        ->whereBetween('payment_date', [$startDate, $endDate]);

        if ($customerId) {
            $query->where('debts.customer_id', $customerId);
        }

        $data = $query->orderBy('payment_date', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($data);
    }

    /**
     * تصدير التقرير
     */
    public function export(Request $request, string $type, string $format)
    {
        return response()->json(['message' => 'Export functionality coming soon']);
    }
}
