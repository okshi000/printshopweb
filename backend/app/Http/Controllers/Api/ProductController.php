<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category');

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('active_only') && $request->active_only) {
            $query->active();
        }

        $products = $query->orderBy('name')
            ->paginate($request->per_page ?? 15);

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'default_price' => 'nullable|numeric|min:0',
        ]);

        $product = Product::create($validated);

        ActivityLog::log('create', 'products', "إضافة منتج جديد: {$product->name}", $product->id);

        return response()->json($product->load('category'), 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load('category'));
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'default_price' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $oldValues = $product->toArray();
        $product->update($validated);

        ActivityLog::log(
            'update',
            'products',
            "تعديل المنتج: {$product->name}",
            $product->id,
            $oldValues,
            $product->toArray()
        );

        return response()->json($product->load('category'));
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->update(['is_active' => false]);

        ActivityLog::log('delete', 'products', "حذف المنتج: {$product->name}", $product->id);

        return response()->json(['message' => 'تم حذف المنتج بنجاح']);
    }
}
