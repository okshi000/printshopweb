<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('active_only') && $request->active_only) {
            $query->active();
        }

        $suppliers = $query->orderBy('name')
            ->paginate($request->per_page ?? 10);

        return response()->json($suppliers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:printer,designer,service,material,other',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $supplier = Supplier::create($validated);

        ActivityLog::log('create', 'suppliers', "إضافة مورد جديد: {$supplier->name}", $supplier->id);

        return response()->json($supplier, 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        // جلب التكاليف غير المدفوعة مع تفاصيل الفواتير
        $costs = $supplier->costs()
            ->where('is_paid', false)
            ->with(['invoiceItem.invoice:id,invoice_number'])
            ->get()
            ->map(function ($cost) {
                return [
                    'id' => $cost->id,
                    'invoice_id' => $cost->invoiceItem->invoice->id ?? null,
                    'invoice_number' => $cost->invoiceItem->invoice->invoice_number ?? 'غير محدد',
                    'cost_type' => $cost->cost_type,
                    'amount' => $cost->amount,
                    'created_at' => $cost->created_at,
                ];
            });

        $supplier->load(['payments' => function ($q) {
            $q->latest()->limit(10);
        }]);
        
        // حساب الإجماليات
        $totalCosts = $supplier->costs()->where('is_paid', false)->sum('amount');
        $paidAmount = $supplier->payments()->sum('amount');
        $remainingAmount = $totalCosts - $paidAmount;

        return response()->json([
            'data' => array_merge($supplier->toArray(), [
                'costs' => $costs,
                'total_costs' => $totalCosts,
                'paid_amount' => $paidAmount,
                'remaining_amount' => $remainingAmount,
            ])
        ]);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:printer,designer,service,material,other',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $oldValues = $supplier->toArray();
        $supplier->update($validated);

        ActivityLog::log(
            'update',
            'suppliers',
            "تعديل بيانات المورد: {$supplier->name}",
            $supplier->id,
            $oldValues,
            $supplier->toArray()
        );

        return response()->json($supplier);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $supplier->update(['is_active' => false]);

        ActivityLog::log('delete', 'suppliers', "حذف المورد: {$supplier->name}", $supplier->id);

        return response()->json(['message' => 'تم حذف المورد بنجاح']);
    }

    public function addPayment(Request $request, Supplier $supplier): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank',
            'notes' => 'nullable|string',
        ]);

        $payment = $supplier->payments()->create($validated);

        ActivityLog::log(
            'payment',
            'suppliers',
            "دفعة للمورد {$supplier->name} بمبلغ {$validated['amount']}",
            $supplier->id
        );

        return response()->json([
            'payment' => $payment,
            'new_balance' => $supplier->fresh()->total_debt,
        ], 201);
    }

    public function transactions(Supplier $supplier): JsonResponse
    {
        $payments = $supplier->payments()
            ->select('id', 'amount', 'payment_method', 'notes as description', 'created_at')
            ->get()
            ->map(function ($payment) {
                $payment->type = 'payment';
                return $payment;
            });

        $costs = $supplier->costs()
            ->with(['invoiceItem.invoice:id,invoice_number'])
            ->where('is_paid', false)
            ->get()
            ->map(function ($cost) {
                return [
                    'id' => $cost->id,
                    'type' => 'cost',
                    'invoice_id' => $cost->invoiceItem->invoice->id ?? null,
                    'invoice_number' => $cost->invoiceItem->invoice->invoice_number ?? 'غير محدد',
                    'description' => $cost->cost_type,
                    'amount' => $cost->amount,
                    'created_at' => $cost->created_at,
                    'payment_method' => null,
                ];
            });

        $transactions = $payments->concat($costs)
            ->sortByDesc('created_at')
            ->values();

        return response()->json(['data' => $transactions]);
    }
}
