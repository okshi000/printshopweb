<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('phone2', 'like', "%{$search}%");
            });
        }

        if ($request->has('active_only') && $request->active_only) {
            $query->active();
        }

        if ($request->boolean('all')) {
            $customers = $query->orderBy('name')->get();
            return response()->json($customers);
        }

        $customers = $query->withCount('invoices')
            ->withSum('invoices', 'remaining_amount')
            ->orderBy('name')
            ->paginate($request->per_page ?? 10);

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'phone2' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::create($validated);

        ActivityLog::log('create', 'customers', "إضافة عميل جديد: {$customer->name}", $customer->id);

        return response()->json($customer, 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['invoices' => function ($q) {
            $q->latest()->limit(10);
        }]);
        
        $customer->loadCount('invoices');
        
        // Calculate statistics
        $totalAmount = $customer->invoices()->sum('total');
        $paidAmount = $customer->invoices()->sum('paid_amount');
        $remainingAmount = $customer->invoices()->sum('remaining_amount');
        
        $customer->total_invoices = $customer->invoices_count;
        $customer->total_amount = $totalAmount;
        $customer->paid_amount = $paidAmount;
        $customer->remaining_amount = $remainingAmount;
        $customer->total_debt = $remainingAmount; // For backward compatibility

        return response()->json($customer);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'phone2' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $oldValues = $customer->toArray();
        $customer->update($validated);

        ActivityLog::log(
            'update',
            'customers',
            "تعديل بيانات العميل: {$customer->name}",
            $customer->id,
            $oldValues,
            $customer->toArray()
        );

        return response()->json($customer);
    }

    public function destroy(Customer $customer): JsonResponse
    {
        // Soft delete by deactivating
        $customer->update(['is_active' => false]);

        ActivityLog::log('delete', 'customers', "حذف العميل: {$customer->name}", $customer->id);

        return response()->json(['message' => 'تم حذف العميل بنجاح']);
    }

    public function transactions(Customer $customer): JsonResponse
    {
        $invoices = $customer->invoices()
            ->select('id', 'invoice_number', 'total as amount', 'status', 'created_at')
            ->get()
            ->map(function ($invoice) {
                $invoice->type = 'invoice';
                $invoice->description = "فاتورة رقم {$invoice->invoice_number}";
                return $invoice;
            });

        $payments = $customer->invoices()
            ->with('payments:id,invoice_id,amount,payment_method,created_at')
            ->get()
            ->pluck('payments')
            ->flatten()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'type' => 'payment',
                    'amount' => $payment->amount,
                    'payment_method' => $payment->payment_method,
                    'description' => 'دفعة',
                    'created_at' => $payment->created_at,
                ];
            });

        $transactions = collect($invoices)
            ->concat($payments)
            ->sortByDesc('created_at')
            ->values();

        return response()->json(['data' => $transactions]);
    }
}
