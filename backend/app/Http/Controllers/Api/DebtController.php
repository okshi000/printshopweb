<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Debt;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DebtController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Debt::query();

        if ($request->has('search')) {
            $query->where('debtor_name', 'like', "%{$request->search}%");
        }

        if ($request->has('is_paid')) {
            $query->where('is_paid', $request->is_paid === 'true');
        }

        $debts = $query->orderBy('debt_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($debts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'debtor_name' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01',
            'debt_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:debt_date',
            'notes' => 'nullable|string',
        ]);

        $validated['remaining_amount'] = $validated['amount'];

        $debt = Debt::create($validated);

        ActivityLog::log(
            'create',
            'debts',
            "إضافة دين من {$validated['debtor_name']} بمبلغ {$validated['amount']}",
            $debt->id
        );

        return response()->json($debt, 201);
    }

    public function show(Debt $debt): JsonResponse
    {
        $debt->load('repayments');

        return response()->json($debt);
    }

    public function repay(Request $request, Debt $debt): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $debt->remaining_amount,
            'payment_method' => 'required|in:cash,bank',
            'notes' => 'nullable|string',
        ]);

        $debt->addRepayment(
            $validated['amount'],
            $validated['payment_method'],
            $validated['notes'] ?? null
        );

        ActivityLog::log(
            'payment',
            'debts',
            "سداد دين من {$debt->debtor_name} بمبلغ {$validated['amount']}",
            $debt->id
        );

        return response()->json($debt->fresh('repayments'));
    }

    public function destroy(Debt $debt): JsonResponse
    {
        $debtorName = $debt->debtor_name;
        $debt->delete();

        ActivityLog::log('delete', 'debts', "حذف دين من: {$debtorName}");

        return response()->json(['message' => 'تم حذف الدين بنجاح']);
    }
}
