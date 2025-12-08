<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\ItemCost;
use App\Models\InvoicePayment;
use App\Models\ActivityLog;
use App\Models\CashBalance;
use App\Models\CashMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with('customer');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('date_from')) {
            $query->whereDate('invoice_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('invoice_date', '<=', $request->date_to);
        }

        $invoices = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($invoices);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'invoice_date' => 'nullable|date',
            'delivery_date' => 'nullable|date',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'nullable|string|max:200',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.costs' => 'nullable|array',
            'items.*.costs.*.supplier_id' => 'nullable|exists:suppliers,id',
            'items.*.costs.*.cost_type' => 'nullable|string|max:100',
            'items.*.costs.*.amount' => 'required|numeric|min:0',
            'items.*.costs.*.is_internal' => 'boolean',
            'items.*.costs.*.notes' => 'nullable|string',
        ]);

        $invoice = DB::transaction(function () use ($validated) {
            $invoice = Invoice::create([
                'invoice_number' => Invoice::generateInvoiceNumber(),
                'customer_id' => $validated['customer_id'] ?? null,
                'invoice_date' => $validated['invoice_date'] ?? now()->toDateString(),
                'delivery_date' => $validated['delivery_date'] ?? null,
                'discount' => $validated['discount'] ?? 0,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $itemData) {
                $totalPrice = $itemData['quantity'] * $itemData['unit_price'];
                
                // Get product name from database if product_id is provided
                $productName = $itemData['product_name'] ?? null;
                if (empty($productName) && !empty($itemData['product_id'])) {
                    $product = \App\Models\Product::find($itemData['product_id']);
                    $productName = $product ? $product->name : 'منتج غير محدد';
                }
                
                $item = $invoice->items()->create([
                    'product_id' => $itemData['product_id'] ?? null,
                    'product_name' => $productName ?? 'منتج غير محدد',
                    'description' => $itemData['description'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $totalPrice,
                ]);

                $totalCost = 0;
                if (!empty($itemData['costs'])) {
                    foreach ($itemData['costs'] as $costData) {
                        $item->costs()->create([
                            'supplier_id' => $costData['supplier_id'] ?? null,
                            'cost_type' => $costData['cost_type'] ?? 'تكلفة عامة',
                            'amount' => $costData['amount'],
                            'is_internal' => $costData['is_internal'] ?? false,
                            'notes' => $costData['notes'] ?? null,
                            'is_paid' => false, // تأكد من تعيين is_paid كـ false افتراضياً
                        ]);
                        $totalCost += $costData['amount']; // التكلفة الإجمالية مباشرة بدون ضرب في الكمية
                    }
                }

                $item->update([
                    'total_cost' => $totalCost,
                    'profit' => $totalPrice - $totalCost,
                ]);
            }

            $invoice->recalculateTotals();

            return $invoice;
        });

        ActivityLog::log('create', 'invoices', "إنشاء فاتورة جديدة: {$invoice->invoice_number}", $invoice->id);

        return response()->json($invoice->load(['customer', 'items.costs', 'payments']), 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $invoice->load([
            'customer',
            'items.product',
            'items.costs.supplier',
            'payments',
        ]);

        return response()->json($invoice);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'invoice_date' => 'nullable|date',
            'delivery_date' => 'nullable|date',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'status' => 'nullable|in:new,in_progress,ready,delivered,cancelled',
            'items' => 'nullable|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'nullable|string|max:200',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required_with:items|numeric|min:0.01',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
            'items.*.costs' => 'nullable|array',
            'items.*.costs.*.supplier_id' => 'nullable|exists:suppliers,id',
            'items.*.costs.*.cost_type' => 'nullable|string|max:100',
            'items.*.costs.*.amount' => 'required|numeric|min:0',
            'items.*.costs.*.is_internal' => 'boolean',
            'items.*.costs.*.notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $invoice) {
            $oldValues = $invoice->toArray();
            
            // Update basic invoice data
            $invoice->update([
                'customer_id' => $validated['customer_id'] ?? $invoice->customer_id,
                'invoice_date' => $validated['invoice_date'] ?? $invoice->invoice_date,
                'delivery_date' => $validated['delivery_date'] ?? $invoice->delivery_date,
                'discount' => $validated['discount'] ?? $invoice->discount,
                'notes' => $validated['notes'] ?? $invoice->notes,
                'status' => $validated['status'] ?? $invoice->status,
            ]);

            // If items are provided, update them
            if (isset($validated['items'])) {
                // Delete old items and their costs (using each to trigger events)
                foreach ($invoice->items as $item) {
                    // Delete costs one by one to trigger the 'deleted' event
                    $item->costs->each(function ($cost) {
                        $cost->delete(); // This triggers the event to update supplier balance
                    });
                    $item->delete();
                }

                // Create new items
                foreach ($validated['items'] as $itemData) {
                    $totalPrice = $itemData['quantity'] * $itemData['unit_price'];
                    
                    $productName = $itemData['product_name'] ?? null;
                    if (empty($productName) && !empty($itemData['product_id'])) {
                        $product = \App\Models\Product::find($itemData['product_id']);
                        $productName = $product ? $product->name : 'منتج غير محدد';
                    }
                    
                    $item = $invoice->items()->create([
                        'product_id' => $itemData['product_id'] ?? null,
                        'product_name' => $productName ?? 'منتج غير محدد',
                        'description' => $itemData['description'] ?? null,
                        'quantity' => $itemData['quantity'],
                        'unit_price' => $itemData['unit_price'],
                        'total_price' => $totalPrice,
                    ]);

                    $totalCost = 0;
                    if (!empty($itemData['costs'])) {
                        foreach ($itemData['costs'] as $costData) {
                            $item->costs()->create([
                                'supplier_id' => $costData['supplier_id'] ?? null,
                                'cost_type' => $costData['cost_type'] ?? 'تكلفة عامة',
                                'amount' => $costData['amount'],
                                'is_internal' => $costData['is_internal'] ?? false,
                                'notes' => $costData['notes'] ?? null,
                                'is_paid' => false,
                            ]);
                            $totalCost += $costData['amount'];
                        }
                    }

                    $item->update([
                        'total_cost' => $totalCost,
                        'profit' => $totalPrice - $totalCost,
                    ]);
                }
            }

            $invoice->recalculateTotals();

            ActivityLog::log(
                'update',
                'invoices',
                "تعديل الفاتورة: {$invoice->invoice_number}",
                $invoice->id,
                $oldValues,
                $invoice->toArray()
            );

            return response()->json($invoice->load(['customer', 'items.costs', 'payments']));
        });
    }

    public function updateStatus(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:new,in_progress,ready,delivered,cancelled',
        ]);

        $oldStatus = $invoice->status;
        $invoice->update(['status' => $validated['status']]);

        ActivityLog::log(
            'update',
            'invoices',
            "تغيير حالة الفاتورة {$invoice->invoice_number} من {$oldStatus} إلى {$validated['status']}",
            $invoice->id
        );

        return response()->json($invoice);
    }

    public function addPayment(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank',
            'payment_type' => 'required|in:deposit,partial,full',
            'payment_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        // Set payment_date to current time if not provided
        if (!isset($validated['payment_date'])) {
            $validated['payment_date'] = now();
        }

        $payment = $invoice->payments()->create($validated);

        ActivityLog::log(
            'payment',
            'invoices',
            "دفعة للفاتورة {$invoice->invoice_number} بمبلغ {$validated['amount']}",
            $invoice->id
        );

        return response()->json([
            'payment' => $payment,
            'invoice' => $invoice->fresh(['customer', 'items', 'payments']),
        ], 201);
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        // Check if invoice has any payments
        if ($invoice->payments()->count() > 0) {
            return response()->json([
                'message' => 'لا يمكن حذف فاتورة تحتوي على دفعات. يرجى إلغاء الدفعات أولاً أو استخدام ميزة الإلغاء.'
            ], 422);
        }

        $invoiceNumber = $invoice->invoice_number;

        DB::transaction(function () use ($invoice) {
            // Delete related records first
            $invoice->payments()->delete();
            $invoice->items()->delete();

            // Delete the invoice itself
            $invoice->delete();
        });

        ActivityLog::log('delete', 'invoices', "حذف الفاتورة: {$invoiceNumber}");

        return response()->json(['message' => 'تم حذف الفاتورة بنجاح']);
    }
}
