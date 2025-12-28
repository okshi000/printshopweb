<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashBalance;
use App\Models\CashMovement;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CashController extends Controller
{
    public function balance(): JsonResponse
    {
        $balance = CashBalance::getBalance();

        return response()->json([
            'cash_balance' => $balance->cash_balance,
            'bank_balance' => $balance->bank_balance,
            'total_balance' => $balance->cash_balance + $balance->bank_balance,
        ]);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = CashMovement::query();

        if ($request->has('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        if ($request->has('source')) {
            $query->where('source', $request->source);
        }

        if ($request->has('date_from')) {
            $query->whereDate('movement_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('movement_date', '<=', $request->date_to);
        }

        $movements = $query->orderBy('movement_date', 'desc')
            ->paginate($request->per_page ?? 10);

        return response()->json($movements);
    }

    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => 'required|in:cash,bank',
            'to' => 'required|in:cash,bank|different:from',
            'amount' => 'required|numeric|min:0.01',
        ]);

        CashBalance::transfer($validated['from'], $validated['to'], $validated['amount']);

        ActivityLog::log(
            'other',
            'cash',
            "تحويل {$validated['amount']} من {$validated['from']} إلى {$validated['to']}"
        );

        return response()->json([
            'message' => 'تم التحويل بنجاح',
            'balance' => CashBalance::getBalance(),
        ]);
    }

    public function setInitial(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cash_balance' => 'required|numeric|min:0',
            'bank_balance' => 'required|numeric|min:0',
        ]);

        $balance = CashBalance::getBalance();
        $balance->update($validated);

        CashMovement::create([
            'movement_type' => 'initial',
            'source' => 'cash',
            'amount' => $validated['cash_balance'],
            'description' => 'تعيين الرصيد الافتتاحي للصندوق',
        ]);

        CashMovement::create([
            'movement_type' => 'initial',
            'source' => 'bank',
            'amount' => $validated['bank_balance'],
            'description' => 'تعيين الرصيد الافتتاحي للبنك',
        ]);

        ActivityLog::log('other', 'cash', 'تعيين الأرصدة الافتتاحية');

        return response()->json([
            'message' => 'تم تعيين الأرصدة بنجاح',
            'balance' => $balance->fresh(),
        ]);
    }

    public function adjust(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source' => 'required|in:cash,bank',
            'amount' => 'required|numeric',
            'description' => 'required|string',
        ]);

        CashBalance::updateBalance($validated['source'], $validated['amount']);

        $movementType = $validated['amount'] >= 0 ? 'income' : 'expense';
        CashMovement::create([
            'movement_type' => $movementType,
            'source' => $validated['source'],
            'amount' => $validated['amount'], // Keep original sign for tracking
            'description' => "تسوية: {$validated['description']}",
        ]);

        ActivityLog::log('other', 'cash', "تسوية الرصيد: {$validated['description']}");

        return response()->json([
            'message' => 'تم تسوية الرصيد بنجاح',
            'balance' => CashBalance::getBalance(),
        ]);
    }
}
