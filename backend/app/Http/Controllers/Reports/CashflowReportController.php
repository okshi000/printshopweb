<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\CashMovement;
use App\Models\CashBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * تقارير التدفق النقدي
 * 
 * يتضمن: ملخص التدفق، الاتجاهات، حسب الفئة، الأرصدة
 */
class CashflowReportController extends Controller
{
    /**
     * ملخص التدفق النقدي
     */
    public function summary(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        // الرصيد الافتتاحي - مجموع أرصدة بداية الفترة
        $cashBalanceRecord = CashBalance::first();
        $openingBalance = $cashBalanceRecord ? $cashBalanceRecord->cash_balance + $cashBalanceRecord->bank_balance : 0;
        
        // إجمالي الإيداعات
        $totalInflows = CashMovement::whereIn('movement_type', ['income', 'initial'])
            ->whereBetween('movement_date', [$startDate, $endDate])
            ->sum('amount');

        // إجمالي المسحوبات
        $totalOutflows = CashMovement::whereIn('movement_type', ['expense', 'withdrawal'])
            ->whereBetween('movement_date', [$startDate, $endDate])
            ->sum('amount');

        // صافي التدفق
        $netCashFlow = $totalInflows - $totalOutflows;

        // الرصيد الختامي
        $closingBalance = $openingBalance + $netCashFlow;

        // عدد الحركات
        $inflowCount = CashMovement::whereIn('movement_type', ['income', 'initial'])
            ->whereBetween('movement_date', [$startDate, $endDate])
            ->count();

        $outflowCount = CashMovement::whereIn('movement_type', ['expense', 'withdrawal'])
            ->whereBetween('movement_date', [$startDate, $endDate])
            ->count();

        return response()->json([
            'opening_balance' => (float) $openingBalance,
            'total_inflows' => (float) $totalInflows,
            'total_outflows' => (float) $totalOutflows,
            'net_cash_flow' => (float) $netCashFlow,
            'closing_balance' => (float) $closingBalance,
            'inflow_count' => $inflowCount,
            'outflow_count' => $outflowCount,
            'period' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ]);
    }

    /**
     * اتجاه التدفق النقدي
     */
    public function trend(Request $request)
    {
        $period = $request->input('period', 'monthly');
        $startDate = $request->input('start_date', Carbon::now()->subMonths(6)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $format = $this->getDateFormat($period);

        $data = CashMovement::selectRaw(
            $this->dateFormatExpr('movement_date', $period) . " as period,\n" .
            "SUM(CASE WHEN movement_type IN ('income', 'initial') THEN amount ELSE 0 END) as inflows,\n" .
            "SUM(CASE WHEN movement_type IN ('expense', 'withdrawal') THEN amount ELSE 0 END) as outflows,\n" .
            "COUNT(CASE WHEN movement_type IN ('income', 'initial') THEN 1 END) as inflow_count,\n" .
            "COUNT(CASE WHEN movement_type IN ('expense', 'withdrawal') THEN 1 END) as outflow_count"
            )
            ->whereBetween('movement_date', [$startDate, $endDate])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        // حساب الرصيد التراكمي
        $cashBalanceRecord = CashBalance::first();
        $balance = $cashBalanceRecord ? $cashBalanceRecord->cash_balance + $cashBalanceRecord->bank_balance : 0;
        
        $result = $data->map(function ($item) use (&$balance) {
            $netFlow = $item->inflows - $item->outflows;
            $balance += $netFlow;
            
            return [
                'period' => $item->period,
                'date' => $item->period,
                'inflows' => (float) $item->inflows,
                'outflows' => (float) $item->outflows,
                'net_flow' => (float) $netFlow,
                'balance' => (float) $balance,
                'inflow_count' => $item->inflow_count,
                'outflow_count' => $item->outflow_count
            ];
        });

        return response()->json($result);
    }

    /**
     * التدفق النقدي حسب الفئة
     */
    public function byCategory(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        // الإيداعات حسب المصدر
        $inflows = CashMovement::select(
                'reference_type as category',
                DB::raw('SUM(amount) as amount'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->whereIn('movement_type', ['income', 'initial'])
            ->whereBetween('movement_date', [$startDate, $endDate])
            ->groupBy('reference_type')
            ->orderByDesc('amount')
            ->get()
            ->map(function ($item) {
                return array_merge($item->toArray(), ['type' => 'inflow']);
            });

        // المسحوبات حسب الفئة
        $outflows = CashMovement::select(
                'reference_type as category',
                DB::raw('SUM(amount) as amount'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->whereIn('movement_type', ['expense', 'withdrawal'])
            ->whereBetween('movement_date', [$startDate, $endDate])
            ->groupBy('reference_type')
            ->orderByDesc('amount')
            ->get()
            ->map(function ($item) {
                return array_merge($item->toArray(), ['type' => 'outflow']);
            });

        // حساب النسب المئوية
        $totalInflows = $inflows->sum('amount');
        $totalOutflows = $outflows->sum('amount');

        $inflows = $inflows->map(function ($item) use ($totalInflows) {
            $item['percentage'] = $totalInflows > 0 ? round(($item['amount'] / $totalInflows) * 100, 2) : 0;
            return $item;
        });

        $outflows = $outflows->map(function ($item) use ($totalOutflows) {
            $item['percentage'] = $totalOutflows > 0 ? round(($item['amount'] / $totalOutflows) * 100, 2) : 0;
            return $item;
        });

        return response()->json($inflows->merge($outflows)->values());
    }

    /**
     * الحركات النقدية
     */
    public function movements(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));
        $type = $request->input('type'); // in, out
        $category = $request->input('category');
        $limit = $request->input('limit', 100);

        $query = CashMovement::select(
            'id',
            'movement_date as created_at',
            'movement_type as type',
            'reference_type as category',
            'amount',
            'description',
            'reference_id as reference'
        )
        ->whereBetween('movement_date', [$startDate, $endDate]);

        if ($type) {
            if ($type === 'in') {
                $query->whereIn('movement_type', ['income', 'initial']);
            } elseif ($type === 'out') {
                $query->whereIn('movement_type', ['expense', 'withdrawal']);
            } else {
                $query->where('movement_type', $type);
            }
        }

        if ($category) {
            $query->where('reference_type', $category);
        }

        $data = $query->orderBy('movement_date', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($data);
    }

    /**
     * أرصدة الخزائن/المصادر
     */
    public function balanceBySource(Request $request)
    {
        $cashBalanceRecord = CashBalance::first();
        
        if (!$cashBalanceRecord) {
            return response()->json([]);
        }

        $cashBalance = (float) $cashBalanceRecord->cash_balance;
        $bankBalance = (float) $cashBalanceRecord->bank_balance;
        $total = $cashBalance + $bankBalance;

        $cashTransactions = CashMovement::where('source', 'cash')->count();
        $bankTransactions = CashMovement::where('source', 'bank')->count();

        $result = [
            [
                'id' => 1,
                'source_name' => 'الصندوق (كاش)',
                'balance' => $cashBalance,
                'last_updated' => $cashBalanceRecord->updated_at,
                'percentage' => $total > 0 ? round(($cashBalance / $total) * 100, 2) : 0,
                'transaction_count' => $cashTransactions
            ],
            [
                'id' => 2,
                'source_name' => 'البنك',
                'balance' => $bankBalance,
                'last_updated' => $cashBalanceRecord->updated_at,
                'percentage' => $total > 0 ? round(($bankBalance / $total) * 100, 2) : 0,
                'transaction_count' => $bankTransactions
            ]
        ];

        return response()->json($result);
    }

    /**
     * ملخص يومي
     */
    public function dailySummary(Request $request)
    {
        $date = $request->input('date', Carbon::today()->format('Y-m-d'));

        $inflows = CashMovement::whereIn('movement_type', ['income', 'initial'])
            ->whereDate('movement_date', $date)
            ->sum('amount');

        $outflows = CashMovement::whereIn('movement_type', ['expense', 'withdrawal'])
            ->whereDate('movement_date', $date)
            ->sum('amount');

        $inflowCount = CashMovement::whereIn('movement_type', ['income', 'initial'])
            ->whereDate('movement_date', $date)
            ->count();

        $outflowCount = CashMovement::whereIn('movement_type', ['expense', 'withdrawal'])
            ->whereDate('movement_date', $date)
            ->count();

        $cashBalanceRecord = CashBalance::first();
        $currentBalance = $cashBalanceRecord ? $cashBalanceRecord->cash_balance + $cashBalanceRecord->bank_balance : 0;

        return response()->json([
            'date' => $date,
            'total_inflows' => (float) $inflows,
            'total_outflows' => (float) $outflows,
            'net_flow' => (float) ($inflows - $outflows),
            'inflow_count' => $inflowCount,
            'outflow_count' => $outflowCount,
            'current_balance' => (float) $currentBalance
        ]);
    }

    /**
     * توقعات التدفق النقدي
     */
    public function forecast(Request $request)
    {
        $days = $request->input('days', 30);

        // متوسط التدفق اليومي للشهر الماضي
        $lastMonth = Carbon::now()->subMonth();
        $avgDailyInflow = CashMovement::whereIn('movement_type', ['income', 'initial'])
            ->where('movement_date', '>=', $lastMonth)
            ->avg(DB::raw('amount'));

        $avgDailyOutflow = CashMovement::whereIn('movement_type', ['expense', 'withdrawal'])
            ->where('movement_date', '>=', $lastMonth)
            ->avg(DB::raw('amount'));

        $cashBalanceRecord = CashBalance::first();
        $currentBalance = $cashBalanceRecord ? $cashBalanceRecord->cash_balance + $cashBalanceRecord->bank_balance : 0;
        $avgNetFlow = ($avgDailyInflow ?? 0) - ($avgDailyOutflow ?? 0);

        $forecast = [];
        $balance = $currentBalance;

        for ($i = 1; $i <= $days; $i++) {
            $date = Carbon::now()->addDays($i)->format('Y-m-d');
            $balance += $avgNetFlow;
            
            $forecast[] = [
                'date' => $date,
                'projected_balance' => round($balance, 2),
                'projected_inflow' => round($avgDailyInflow ?? 0, 2),
                'projected_outflow' => round($avgDailyOutflow ?? 0, 2)
            ];
        }

        return response()->json([
            'current_balance' => (float) $currentBalance,
            'average_daily_net_flow' => round($avgNetFlow, 2),
            'forecast' => $forecast
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

    private function dateFormatExpr(string $column, string $period): string
    {
        $driver = DB::getDriverName();
        if ($driver === 'sqlite') {
            return "strftime('" . match($period) {
                'daily' => '%Y-%m-%d',
                'weekly' => '%Y-%W',
                'monthly' => '%Y-%m',
                'quarterly' => '%Y-%m',
                'yearly' => '%Y',
                default => '%Y-%m'
            } . "', $column)";
        }
        return "DATE_FORMAT($column, '" . $this->getDateFormat($period) . "')";
    }
}
