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
        $query = Debt::with('debtAccount');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('debtor_name', 'like', "%{$search}%")
                  ->orWhereHas('debtAccount', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('is_paid')) {
            $query->where('is_paid', $request->is_paid === 'true');
        }

        if ($request->has('debt_account_id')) {
            $query->where('debt_account_id', $request->debt_account_id);
        }

        if ($request->has('source')) {
            $query->where('source', $request->source);
        }

        $debts = $query->orderBy('debt_date', 'desc')
            ->paginate($request->per_page ?? 10);

        return response()->json($debts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'debt_account_id' => 'nullable|exists:debt_accounts,id',
            'debtor_name' => 'required|string|max:100',
            'source' => 'required|in:cash,bank',
            'amount' => 'required|numeric|min:0.01',
            'debt_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:debt_date',
            'notes' => 'nullable|string',
        ]);

        $validated['remaining_amount'] = $validated['amount'];
        $validated['paid_amount'] = 0;

        $debt = Debt::create($validated);

        $sourceLabel = $validated['source'] === 'bank' ? 'البنك' : 'الكاش';
        ActivityLog::log(
            'create',
            'debts',
            "إضافة دين من {$validated['debtor_name']} بمبلغ {$validated['amount']} من {$sourceLabel}",
            $debt->id
        );

        return response()->json($debt->load('debtAccount'), 201);
    }

    public function show(Debt $debt): JsonResponse
    {
        $debt->load(['repayments', 'debtAccount']);

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

        return response()->json($debt->fresh(['repayments', 'debtAccount']));
    }

    public function destroy(Debt $debt): JsonResponse
    {
        $debtorName = $debt->debtor_name;
        $debt->delete();

        ActivityLog::log('delete', 'debts', "حذف دين من: {$debtorName}");

        return response()->json(['message' => 'تم حذف الدين بنجاح']);
    }
}
