<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = InventoryItem::query();

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->has('low_stock') && $request->low_stock) {
            $query->lowStock();
        }

        if ($request->has('active_only') && $request->active_only) {
            $query->active();
        }

        $items = $query->orderBy('name')
            ->paginate($request->per_page ?? 10);

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'unit' => 'required|string|max:20',
            'current_quantity' => 'nullable|numeric|min:0',
            'minimum_quantity' => 'nullable|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $item = InventoryItem::create($validated);

        ActivityLog::log('create', 'inventory', "إضافة صنف مخزون: {$item->name}", $item->id);

        return response()->json($item, 201);
    }

    public function show(InventoryItem $inventory): JsonResponse
    {
        $inventory->load(['movements' => function ($q) {
            $q->latest()->limit(20);
        }]);

        return response()->json($inventory);
    }

    public function update(Request $request, InventoryItem $inventory): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'unit' => 'required|string|max:20',
            'minimum_quantity' => 'nullable|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $inventory->update($validated);

        ActivityLog::log('update', 'inventory', "تعديل صنف مخزون: {$inventory->name}", $inventory->id);

        return response()->json($inventory);
    }

    public function destroy(InventoryItem $inventory): JsonResponse
    {
        $inventory->update(['is_active' => false]);

        ActivityLog::log('delete', 'inventory', "حذف صنف مخزون: {$inventory->name}", $inventory->id);

        return response()->json(['message' => 'تم حذف الصنف بنجاح']);
    }

    public function addStock(Request $request, InventoryItem $inventory): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $inventory->addStock(
            $validated['quantity'],
            $validated['unit_cost'] ?? null,
            $validated['notes'] ?? null
        );

        ActivityLog::log(
            'update',
            'inventory',
            "إضافة كمية {$validated['quantity']} من {$inventory->name}",
            $inventory->id
        );

        return response()->json($inventory->fresh());
    }

    public function removeStock(Request $request, InventoryItem $inventory): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01|max:' . $inventory->current_quantity,
            'notes' => 'nullable|string',
        ]);

        $inventory->removeStock($validated['quantity'], $validated['notes'] ?? null);

        ActivityLog::log(
            'update',
            'inventory',
            "صرف كمية {$validated['quantity']} من {$inventory->name}",
            $inventory->id
        );

        return response()->json($inventory->fresh());
    }

    public function movements(Request $request): JsonResponse
    {
        $query = InventoryMovement::with('inventoryItem');

        if ($request->has('inventory_item_id')) {
            $query->where('inventory_item_id', $request->inventory_item_id);
        }

        if ($request->has('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        if ($request->has('date_from')) {
            $query->whereDate('movement_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('movement_date', '<=', $request->date_to);
        }

        $movements = $query->orderBy('movement_date', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($movements);
    }

    public function storeMovement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'movement_type' => 'required|in:in,out',
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $item = InventoryItem::findOrFail($validated['inventory_item_id']);

        if ($validated['movement_type'] === 'in') {
            $item->addStock(
                $validated['quantity'],
                $validated['unit_cost'] ?? null,
                $validated['notes'] ?? null
            );
        } else {
            if ($validated['quantity'] > $item->current_quantity) {
                return response()->json(['message' => 'الكمية المطلوبة أكبر من المتوفر'], 422);
            }
            $item->removeStock($validated['quantity'], $validated['notes'] ?? null);
        }

        $actionType = $validated['movement_type'] === 'in' ? 'إضافة' : 'صرف';
        ActivityLog::log(
            'update',
            'inventory',
            "{$actionType} كمية {$validated['quantity']} من {$item->name}",
            $item->id
        );

        return response()->json($item->fresh(), 201);
    }
}
