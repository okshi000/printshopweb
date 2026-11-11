<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashBalance;
use App\Models\CashMovement;
use App\Models\Custody;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CashController extends Controller
{
    public function balance(): JsonResponse
    {
        $balance = CashBalance::getBalance();
        
        $openCustodiesTotal = (float) Custody::where('status', 'open')->sum('amount');
        $openCustodiesCount = (int) Custody::where('status', 'open')->count();

        $drawer = (float) ($balance->drawer_balance ?? 0);
        $vault = (float) ($balance->vault_balance ?? 0);
        $bank = (float) ($balance->bank_balance ?? 0);
        $cash = $drawer + $vault;
        $total = $cash + $bank;

        return response()->json([
            'drawer_balance' => $drawer,
            'vault_balance' => $vault,
            'bank_balance' => $bank,
            'cash_balance' => $cash,
            'total_balance' => $total,
            'open_custodies_total' => $openCustodiesTotal,
            'open_custodies_count' => $openCustodiesCount,
        ]);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = CashMovement::query();

        if ($request->filled('movement_type') && $request->movement_type !== 'all') {
            $query->where('movement_type', $request->movement_type);
        }

        if ($request->filled('source') && $request->source !== 'all') {
            if ($request->source === 'cash') {
                $query->whereIn('source', ['cash', 'drawer', 'vault']);
            } else {
                $query->where(function ($q) use ($request) {
                    $q->where('source', $request->source)
                      ->orWhere('destination', $request->source);
                });
            }
        }

        if ($request->filled('date_from')) {
            $query->whereDate('movement_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('movement_date', '<=', $request->date_to);
        }

        $movements = $query->orderBy('movement_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($movements);
    }

    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => 'required|in:drawer,vault,bank,cash',
            'to' => 'required|in:drawer,vault,bank,cash|different:from',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:500',
        ]);

        $from = $validated['from'] === 'cash' ? 'drawer' : $validated['from'];
        $to = $validated['to'] === 'cash' ? 'drawer' : $validated['to'];
        $amount = (float) $validated['amount'];
        $notes = $validated['notes'] ?? null;

        CashBalance::transfer($from, $to, $amount, $notes);

        $fromLabel = match($from) {
            'drawer' => 'درج المكتب',
            'vault' => 'الخزينة الرئيسية',
            'bank' => 'حساب البنك',
            default => $from,
        };
        $toLabel = match($to) {
            'drawer' => 'درج المكتب',
            'vault' => 'الخزينة الرئيسية',
            'bank' => 'حساب البنك',
            default => $to,
        };

        ActivityLog::log(
            'other',
            'cash',
            "تحويل داخلي بقيمة {$amount} د.ل من {$fromLabel} إلى {$toLabel}" . ($notes ? " ({$notes})" : '')
        );

        return response()->json([
            'message' => 'تم التحويل الداخلي بنجاح',
            'balance' => CashBalance::getBalance(),
        ]);
    }

    public function setInitial(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'drawer_balance' => 'nullable|numeric|min:0',
            'vault_balance' => 'nullable|numeric|min:0',
            'bank_balance' => 'nullable|numeric|min:0',
            'cash_balance' => 'nullable|numeric|min:0',
        ]);

        $drawer = isset($validated['drawer_balance']) ? (float)$validated['drawer_balance'] : (float)($validated['cash_balance'] ?? 0);
        $vault = isset($validated['vault_balance']) ? (float)$validated['vault_balance'] : 0;
        $bank = isset($validated['bank_balance']) ? (float)$validated['bank_balance'] : 0;

        $balance = CashBalance::getBalance();
        $balance->update([
            'drawer_balance' => $drawer,
            'vault_balance' => $vault,
            'bank_balance' => $bank,
            'cash_balance' => $drawer + $vault,
        ]);

        CashMovement::create([
            'movement_type' => 'initial',
            'source' => 'drawer',
            'amount' => $drawer,
            'description' => 'تعيين الرصيد الافتتاحي لدرج المكتب',
            'movement_date' => now(),
        ]);

        CashMovement::create([
            'movement_type' => 'initial',
            'source' => 'vault',
            'amount' => $vault,
            'description' => 'تعيين الرصيد الافتتاحي للخزينة الرئيسية',
            'movement_date' => now(),
        ]);

        CashMovement::create([
            'movement_type' => 'initial',
            'source' => 'bank',
            'amount' => $bank,
            'description' => 'تعيين الرصيد الافتتاحي للبنك',
            'movement_date' => now(),
        ]);

        ActivityLog::log('other', 'cash', 'تعيين الأرصدة الافتتاحية للخزينة والدرج والبنك');

        return response()->json([
            'message' => 'تم تعيين الأرصدة الافتتاحية بنجاح',
            'balance' => $balance->fresh(),
        ]);
    }

    public function adjust(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source' => 'required|in:drawer,vault,bank,cash',
            'amount' => 'required|numeric',
            'description' => 'required|string|max:500',
        ]);

        $source = $validated['source'] === 'cash' ? 'drawer' : $validated['source'];
        $amount = (float) $validated['amount'];
        $description = $validated['description'];

        CashBalance::updateBalance($source, $amount);

        $movementType = $amount >= 0 ? 'income' : 'expense';
        
        $sourceLabel = match($source) {
            'drawer' => 'درج المكتب',
            'vault' => 'الخزينة الرئيسية',
            'bank' => 'حساب البنك',
            default => $source,
        };

        CashMovement::create([
            'movement_type' => $movementType,
            'source' => $source,
            'amount' => abs($amount),
            'description' => "تسوية ({$sourceLabel}): {$description}",
            'movement_date' => now(),
        ]);

        ActivityLog::log('other', 'cash', "تسوية رصيد {$sourceLabel}: {$description} بمبلغ {$amount}");

        return response()->json([
            'message' => 'تم تسوية الرصيد بنجاح',
            'balance' => CashBalance::getBalance(),
        ]);
    }
}
