<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Custody;
use App\Models\CashBalance;
use App\Models\CashMovement;
use App\Models\Expense;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CustodyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Custody::with(['user:id,name,full_name', 'expenseType:id,name', 'expense', 'creator:id,name', 'settler:id,name']);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('employee_name')) {
            $query->where('employee_name', 'like', "%{$request->employee_name}%");
        }

        if ($request->filled('date_from')) {
            $query->whereDate('disbursed_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('disbursed_at', '<=', $request->date_to);
        }

        $custodies = $query->orderBy('disbursed_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->per_page ?? 15);

        $summary = [
            'open_count' => Custody::where('status', 'open')->count(),
            'open_total' => (float) Custody::where('status', 'open')->sum('amount'),
            'settled_count' => Custody::where('status', 'settled')->count(),
            'settled_total' => (float) Custody::where('status', 'settled')->sum('amount'),
        ];

        return response()->json([
            'custodies' => $custodies,
            'summary' => $summary,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_name' => 'required|string|max:191',
            'user_id' => 'nullable|exists:users,id',
            'amount' => 'required|numeric|min:0.01',
            'source' => 'nullable|in:drawer,vault,bank,cash',
            'purpose' => 'nullable|string|max:1000',
            'disbursed_at' => 'nullable|date',
        ]);

        $source = ($validated['source'] ?? 'drawer') === 'cash' ? 'drawer' : ($validated['source'] ?? 'drawer');
        $amount = (float) $validated['amount'];
        $disbursedAt = $validated['disbursed_at'] ?? now();

        return DB::transaction(function () use ($validated, $source, $amount, $disbursedAt, $request) {
            // 1. الخصم فوراً من رصيد الحساب (الدرج)
            CashBalance::updateBalance($source, -$amount);

            // 2. إنشاء العهدة
            $custody = Custody::create([
                'employee_name' => $validated['employee_name'],
                'user_id' => $validated['user_id'] ?? null,
                'amount' => $amount,
                'spent_amount' => 0.00,
                'returned_amount' => 0.00,
                'status' => 'open',
                'source' => $source,
                'purpose' => $validated['purpose'] ?? null,
                'disbursed_at' => $disbursedAt,
                'created_by' => $request->user()?->id,
            ]);

            $sourceLabel = match($source) {
                'drawer' => 'درج المكتب',
                'vault' => 'الخزينة الرئيسية',
                'bank' => 'حساب البنك',
                default => $source,
            };

            // 3. تسجيل حركة الأموال كخروج عهدة
            CashMovement::create([
                'movement_type' => 'custody_out',
                'source' => $source,
                'amount' => $amount,
                'reference_type' => 'custody',
                'reference_id' => $custody->id,
                'description' => "صرف عهدة للموظف: {$custody->employee_name}" . ($custody->purpose ? " - {$custody->purpose}" : '') . " (من {$sourceLabel})",
                'movement_date' => $disbursedAt,
            ]);

            ActivityLog::log(
                'create',
                'cash',
                "صرف عهدة للموظف {$custody->employee_name} بقيمة {$amount} د.ل من {$sourceLabel}",
                $custody->id
            );

            return response()->json([
                'message' => 'تم صرف العهدة بنجاح وخصمها من رصيد الدرج',
                'custody' => $custody->load(['user:id,name,full_name']),
                'balance' => CashBalance::getBalance(),
            ], 201);
        });
    }

    public function settle(Request $request, Custody $custody): JsonResponse
    {
        if ($custody->status === 'settled') {
            return response()->json(['message' => 'هذه العهدة تمت تسويتها مسبقاً.'], 422);
        }

        $validated = $request->validate([
            'spent_amount' => 'required|numeric|min:0',
            'expense_type_id' => 'required|exists:expense_types,id',
            'settlement_notes' => 'nullable|string|max:1000',
            'receipt' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:5120',
        ]);

        $spentAmount = (float) $validated['spent_amount'];
        $returnedAmount = (float) $custody->amount - $spentAmount;
        $source = $custody->source ?: 'drawer';

        return DB::transaction(function () use ($validated, $custody, $spentAmount, $returnedAmount, $source, $request) {
            // رفع صورة الفاتورة/الإيصال إن وجدت
            $attachmentPath = null;
            if ($request->hasFile('receipt')) {
                $attachmentPath = $request->file('receipt')->store('receipts', 'public');
            }

            // 1. تسجيل المصروف رسمياً في المصروفات
            $expense = Expense::create([
                'expense_type_id' => $validated['expense_type_id'],
                'custody_id' => $custody->id,
                'amount' => $spentAmount,
                'payment_method' => $source,
                'expense_date' => now()->toDateString(),
                'notes' => "تسوية عهدة الموظف: {$custody->employee_name}" . ($validated['settlement_notes'] ?? '' ? " - {$validated['settlement_notes']}" : ''),
                'attachment' => $attachmentPath,
            ]);

            $sourceLabel = match($source) {
                'drawer' => 'درج المكتب',
                'vault' => 'الخزينة الرئيسية',
                'bank' => 'حساب البنك',
                default => $source,
            };

            // 2. معالجة الفارق مع رصيد الدرج:
            if ($returnedAmount > 0) {
                // الموظف أعاد الباقي: يُضاف تلقائياً إلى رصيد الدرج
                CashBalance::updateBalance($source, $returnedAmount);

                CashMovement::create([
                    'movement_type' => 'custody_return',
                    'source' => $source,
                    'amount' => $returnedAmount,
                    'reference_type' => 'custody',
                    'reference_id' => $custody->id,
                    'description' => "إرجاع متبقي عهدة الموظف: {$custody->employee_name} ({$returnedAmount} د.ل إلى {$sourceLabel})",
                    'movement_date' => now(),
                ]);
            } elseif ($returnedAmount < 0) {
                // الموظف صرف أكثر من العهدة: يُصرف الفارق له من الدرج
                $diff = abs($returnedAmount);
                CashBalance::updateBalance($source, -$diff);

                CashMovement::create([
                    'movement_type' => 'expense',
                    'source' => $source,
                    'amount' => $diff,
                    'reference_type' => 'custody',
                    'reference_id' => $custody->id,
                    'description' => "صرف فارق مصروف عهدة للموظف: {$custody->employee_name} ({$diff} د.ل من {$sourceLabel})",
                    'movement_date' => now(),
                ]);
            }

            // 3. تحديث بيانات العهدة وإغلاقها
            $custody->update([
                'spent_amount' => $spentAmount,
                'returned_amount' => max(0, $returnedAmount),
                'status' => 'settled',
                'settled_at' => now(),
                'expense_type_id' => $validated['expense_type_id'],
                'expense_id' => $expense->id,
                'settlement_notes' => $validated['settlement_notes'] ?? null,
                'receipt_attachment' => $attachmentPath,
                'settled_by' => $request->user()?->id,
            ]);

            ActivityLog::log(
                'update',
                'cash',
                "تسوية عهدة الموظف {$custody->employee_name}: تم صرف {$spentAmount} د.ل وإرجاع {$returnedAmount} د.ل",
                $custody->id
            );

            return response()->json([
                'message' => 'تم تسوية العهدة بنجاح، وتسجيل المصروف وتحديث رصيد الدرج بالمتبقي.',
                'custody' => $custody->fresh(['user:id,name,full_name', 'expenseType:id,name', 'expense']),
                'balance' => CashBalance::getBalance(),
            ]);
        });
    }

    public function destroy(Request $request, Custody $custody): JsonResponse
    {
        if ($custody->status === 'settled') {
            return response()->json(['message' => 'لا يمكن إلغاء عهدة تم تسويتها رسمياً.'], 422);
        }

        return DB::transaction(function () use ($custody, $request) {
            $source = $custody->source ?: 'drawer';
            $amount = (float) $custody->amount;

            // إرجاع المبلغ للدرج
            CashBalance::updateBalance($source, $amount);

            $sourceLabel = match($source) {
                'drawer' => 'درج المكتب',
                'vault' => 'الخزينة الرئيسية',
                'bank' => 'حساب البنك',
                default => $source,
            };

            CashMovement::create([
                'movement_type' => 'income',
                'source' => $source,
                'amount' => $amount,
                'description' => "إلغاء عهدة الموظف: {$custody->employee_name} وإعادة المبلغ بالكامل ({$amount} د.ل) إلى {$sourceLabel}",
                'movement_date' => now(),
            ]);

            ActivityLog::log(
                'delete',
                'cash',
                "إلغاء عهدة الموظف {$custody->employee_name} وإرجاع {$amount} د.ل إلى {$sourceLabel}",
                $custody->id
            );

            $custody->delete();

            return response()->json([
                'message' => 'تم إلغاء العهدة وإعادة المبلغ إلى الدرج بنجاح',
                'balance' => CashBalance::getBalance(),
            ]);
        });
    }
}

