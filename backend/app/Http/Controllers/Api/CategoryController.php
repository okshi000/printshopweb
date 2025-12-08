<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Category::withCount('products');

        if ($request->has('active_only') && $request->active_only) {
            $query->active();
        }

        $categories = $query->orderBy('name')->get();

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $category = Category::create($validated);

        ActivityLog::log('create', 'categories', "إضافة تصنيف جديد: {$category->name}", $category->id);

        return response()->json($category, 201);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json($category->load('products'));
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        ActivityLog::log('update', 'categories', "تعديل التصنيف: {$category->name}", $category->id);

        return response()->json($category);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->update(['is_active' => false]);

        ActivityLog::log('delete', 'categories', "حذف التصنيف: {$category->name}", $category->id);

        return response()->json(['message' => 'تم حذف التصنيف بنجاح']);
    }
}
