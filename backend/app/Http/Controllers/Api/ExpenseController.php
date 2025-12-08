<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseType;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Expense::with('expenseType');

        if ($request->has('expense_type_id')) {
            $query->where('expense_type_id', $request->expense_type_id);
        }

        if ($request->has('date_from')) {
            $query->whereDate('expense_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('expense_date', '<=', $request->date_to);
        }

        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        $expenses = $query->orderBy('expense_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($expenses);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'expense_type_id' => 'required|exists:expense_types,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank',
            'expense_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $expense = Expense::create($validated);

        ActivityLog::log('create', 'expenses', "إضافة مصروف: {$expense->amount}", $expense->id);

        return response()->json($expense->load('expenseType'), 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        return response()->json($expense->load('expenseType'));
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $amount = $expense->amount;
        $expense->delete();

        ActivityLog::log('delete', 'expenses', "حذف مصروف بمبلغ: {$amount}");

        return response()->json(['message' => 'تم حذف المصروف بنجاح']);
    }

    // Expense Types
    public function types(): JsonResponse
    {
        return response()->json(ExpenseType::active()->get());
    }

    public function storeType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $type = ExpenseType::create($validated);

        return response()->json($type, 201);
    }
}
