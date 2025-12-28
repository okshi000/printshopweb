<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * تقارير المخزون
 * 
 * يتضمن: ملخص المخزون، تفاصيل الأصناف، الحركات، التقييم
 */
class InventoryReportController extends Controller
{
    /**
     * ملخص المخزون
     */
    public function summary(Request $request)
    {
        $lowStockThreshold = $request->input('low_stock_threshold', 10);

        $items = InventoryItem::where('is_active', true)->get();

        $totalItems = $items->count();
        $totalValue = $items->sum(function ($item) {
            return $item->current_quantity * ($item->unit_cost ?? 0);
        });
        $lowStockItems = $items->filter(function ($item) use ($lowStockThreshold) {
            return $item->current_quantity > 0 && $item->current_quantity <= ($item->minimum_quantity ?? $lowStockThreshold);
        })->count();
        $outOfStockItems = $items->where('current_quantity', 0)->count();
        $averageStockValue = $totalItems > 0 ? $totalValue / $totalItems : 0;

        // إجمالي الكميات
        $totalQuantity = $items->sum('current_quantity');

        return response()->json([
            'total_items' => $totalItems,
            'total_value' => round((float) $totalValue, 2),
            'total_quantity' => (int) $totalQuantity,
            'low_stock_items' => $lowStockItems,
            'out_of_stock_items' => $outOfStockItems,
            'in_stock_items' => $totalItems - $lowStockItems - $outOfStockItems,
            'average_stock_value' => round((float) $averageStockValue, 2),
            'average_item_value' => round((float) $averageStockValue, 2),
            'categories_count' => 0 // No categories in inventory_items table
        ]);
    }

    /**
     * تفاصيل أصناف المخزون
     */
    public function details(Request $request)
    {
        $status = $request->input('status'); // all, in_stock, low_stock, out_of_stock
        $search = $request->input('search');
        $limit = $request->input('limit', 100);

        $query = InventoryItem::select(
            'inventory_items.id as item_id',
            'inventory_items.name as item_name',
            'inventory_items.unit',
            'inventory_items.current_quantity',
            'inventory_items.unit_cost',
            DB::raw('inventory_items.current_quantity * COALESCE(inventory_items.unit_cost, 0) as total_value'),
            'inventory_items.minimum_quantity',
            'inventory_items.updated_at as last_restock_date'
        );

        // البحث
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('inventory_items.name', 'like', "%{$search}%");
            });
        }

        $data = $query->limit($limit)->get();

        // تحديد حالة كل صنف
        $result = $data->map(function ($item) {
            $status = 'in_stock';
            if ($item->current_quantity == 0) {
                $status = 'out_of_stock';
            } elseif ($item->current_quantity <= ($item->minimum_quantity ?? 10)) {
                $status = 'low_stock';
            }
            
            return array_merge($item->toArray(), [
                'status' => $status,
                'reorder_level' => $item->minimum_quantity ?? 10
            ]);
        });

        // تصفية حسب الحالة
        if ($status && $status !== 'all') {
            $result = $result->filter(function ($item) use ($status) {
                return $item['status'] === $status;
            })->values();
        }

        return response()->json($result);
    }

    /**
     * حركات المخزون
     */
    public function movements(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));
        $movementType = $request->input('type'); // in, out, adjustment
        $itemId = $request->input('item_id');
        $limit = $request->input('limit', 100);

        $query = InventoryMovement::select(
            'inventory_movements.id',
            'inventory_movements.movement_date as date',
            'inventory_items.name as item_name',
            'inventory_movements.movement_type',
            'inventory_movements.quantity',
            'inventory_movements.unit_cost as cost_per_unit',
            DB::raw('inventory_movements.quantity * inventory_movements.unit_cost as total_cost'),
            'inventory_movements.notes as reference'
        )
        ->join('inventory_items', 'inventory_movements.inventory_item_id', '=', 'inventory_items.id')
        ->whereBetween('movement_date', [$startDate, $endDate]);

        if ($movementType) {
            $query->where('movement_type', $movementType);
        }

        if ($itemId) {
            $query->where('inventory_item_id', $itemId);
        }

        $data = $query->orderBy('movement_date', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($data);
    }

    /**
     * تقييم المخزون - ملخص عام بدون تصنيف
     * نظراً لعدم وجود category_id في جدول inventory_items
     */
    public function valuation(Request $request)
    {
        // الحصول على جميع الأصناف النشطة
        $items = InventoryItem::where('is_active', true)->get();

        // حساب الإجمالي
        $totalItems = $items->count();
        $totalQuantity = $items->sum('current_quantity');
        $totalValue = $items->sum(function ($item) {
            return $item->current_quantity * ($item->unit_cost ?? 0);
        });
        $averageCost = $totalQuantity > 0 ? $totalValue / $totalQuantity : 0;

        // إرجاع فئة واحدة تحتوي على جميع الأصناف
        $result = [
            [
                'category_id' => 1,
                'category' => 'جميع الأصناف',
                'item_count' => $totalItems,
                'total_quantity' => (float) $totalQuantity,
                'total_value' => round((float) $totalValue, 2),
                'average_cost' => round((float) $averageCost, 2),
                'percentage' => 100
            ]
        ];

        return response()->json($result);
    }

    /**
     * الأصناف منخفضة المخزون
     */
    public function lowStock(Request $request)
    {
        $threshold = $request->input('threshold', 10);

        $data = InventoryItem::select(
            'inventory_items.id as item_id',
            'inventory_items.name as item_name',
            'inventory_items.current_quantity',
            'inventory_items.minimum_quantity',
            'inventory_items.unit_cost',
            'inventory_items.unit as unit'
        )
        ->where(function ($query) use ($threshold) {
            $query->whereRaw('inventory_items.current_quantity <= COALESCE(inventory_items.minimum_quantity, ?)', [$threshold])
                  ->where('inventory_items.current_quantity', '>', 0);
        })
        ->orWhere('inventory_items.current_quantity', 0)
        ->orderBy('inventory_items.current_quantity')
        ->get()
        ->map(function ($item) {
            $minQty = $item->minimum_quantity ?? 10;
            return array_merge($item->toArray(), [
                'status' => $item->current_quantity == 0 ? 'out_of_stock' : 'low_stock',
                'shortage' => max(0, $minQty - $item->current_quantity),
                'reorder_level' => $minQty
            ]);
        });

        return response()->json($data);
    }

    /**
     * ملخص حركات المخزون
     */
    public function movementSummary(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->format('Y-m-d'));

        $movements = InventoryMovement::whereBetween('movement_date', [$startDate, $endDate]);

        $inMovements = (clone $movements)->where('movement_type', 'in');
        $outMovements = (clone $movements)->where('movement_type', 'out');

        $totalInValue = (clone $inMovements)->sum(DB::raw('quantity * COALESCE(unit_cost, 0)'));
        $totalOutValue = (clone $outMovements)->sum(DB::raw('quantity * COALESCE(unit_cost, 0)'));
        $totalInQty = (clone $inMovements)->sum('quantity');
        $totalOutQty = (clone $outMovements)->sum('quantity');
        $inCount = (clone $inMovements)->count();
        $outCount = (clone $outMovements)->count();

        return response()->json([
            'period' => [
                'start' => $startDate,
                'end' => $endDate
            ],
            'total_in' => (float) $totalInQty,
            'total_out' => (float) $totalOutQty,
            'total_in_value' => (float) $totalInValue,
            'total_out_value' => (float) $totalOutValue,
            'net_change' => (float) ($totalInQty - $totalOutQty),
            'movement_count' => $inCount + $outCount,
            'by_type' => [
                [
                    'type' => 'in',
                    'count' => $inCount,
                    'quantity' => (float) $totalInQty,
                    'value' => (float) $totalInValue
                ],
                [
                    'type' => 'out',
                    'count' => $outCount,
                    'quantity' => (float) $totalOutQty,
                    'value' => (float) $totalOutValue
                ]
            ]
        ]);
    }

    /**
     * تصدير التقرير
     */
    public function export(Request $request, string $type, string $format)
    {
        return response()->json(['message' => 'Export functionality coming soon']);
    }
}
