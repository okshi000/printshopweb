<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DebtAccount;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DebtAccountController extends Controller
{
    /**
     * Display a listing of debt accounts
     */
    public function index(Request $request): JsonResponse
    {
        $query = DebtAccount::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active === 'true');
        }

        $accounts = $query->withCount(['debts', 'debts as active_debts_count' => function ($q) {
            $q->where('is_paid', false);
        }])
        ->orderBy('name')
        ->paginate($request->per_page ?? 10);

        return response()->json($accounts);
    }

    /**
     * Get all active accounts for dropdown
     */
    public function all(): JsonResponse
    {
        $accounts = DebtAccount::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

        return response()->json($accounts);
    }

    /**
     * Store a newly created debt account
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);

        $account = DebtAccount::create($validated);

        ActivityLog::log(
            'create',
            'debt_accounts',
            "إنشاء حساب دين جديد: {$validated['name']}",
            $account->id
        );

        return response()->json($account, 201);
    }

    /**
     * Display the specified debt account with its debts
     */
    public function show(DebtAccount $debtAccount): JsonResponse
    {
        $debtAccount->load(['debts' => function ($query) {
            $query->orderBy('debt_date', 'desc');
        }, 'debts.repayments']);

        return response()->json($debtAccount);
    }

    /**
     * Update the specified debt account
     */
    public function update(Request $request, DebtAccount $debtAccount): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $debtAccount->update($validated);

        ActivityLog::log(
            'update',
            'debt_accounts',
            "تحديث حساب دين: {$debtAccount->name}",
            $debtAccount->id
        );

        return response()->json($debtAccount);
    }

    /**
     * Remove the specified debt account
     */
    public function destroy(DebtAccount $debtAccount): JsonResponse
    {
        // Check if account has unpaid debts
        if ($debtAccount->debts()->where('is_paid', false)->exists()) {
            return response()->json([
                'message' => 'لا يمكن حذف الحساب لوجود ديون غير مسددة'
            ], 422);
        }

        $accountName = $debtAccount->name;
        $debtAccount->delete();

        ActivityLog::log('delete', 'debt_accounts', "حذف حساب دين: {$accountName}");

        return response()->json(['message' => 'تم حذف الحساب بنجاح']);
    }
}
