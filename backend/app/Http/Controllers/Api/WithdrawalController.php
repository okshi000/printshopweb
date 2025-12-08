<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WithdrawalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Withdrawal::query();

        if ($request->has('date_from')) {
            $query->whereDate('withdrawal_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('withdrawal_date', '<=', $request->date_to);
        }

        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        $withdrawals = $query->orderBy('withdrawal_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($withdrawals);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'withdrawn_by' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank',
            'withdrawal_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $withdrawal = Withdrawal::create($validated);

        ActivityLog::log(
            'create',
            'withdrawals',
            "سحب شخصي بواسطة {$validated['withdrawn_by']} بمبلغ {$validated['amount']}",
            $withdrawal->id
        );

        return response()->json($withdrawal, 201);
    }

    public function show(Withdrawal $withdrawal): JsonResponse
    {
        return response()->json($withdrawal);
    }

    public function destroy(Withdrawal $withdrawal): JsonResponse
    {
        ActivityLog::log(
            'delete',
            'withdrawals',
            "حذف سحب شخصي بمبلغ {$withdrawal->amount}",
            $withdrawal->id
        );

        $withdrawal->delete();

        return response()->json(['message' => 'تم حذف السحب بنجاح']);
    }
}
