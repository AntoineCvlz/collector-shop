<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::orderBy('name')->get();

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched categories successfully',
            'data' => $categories,
        ]);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched category successfully',
            'data' => $category,
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        try {
            $category = Category::create([
                'name' => $request->string('name')->value(),
            ]);

            return response()->json([
                'response_code' => 201,
                'status' => 'success',
                'message' => 'Category created successfully',
                'data' => $category,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Category Create Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to create category',
            ], 500);
        }
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        try {
            $category->name = $request->string('name')->value();
            $category->save();

            return response()->json([
                'response_code' => 200,
                'status' => 'success',
                'message' => 'Category updated successfully',
                'data' => $category,
            ]);
        } catch (\Exception $e) {
            Log::error('Category Update Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to update category',
            ], 500);
        }
    }

    public function destroy(Category $category): JsonResponse
    {
        try {
            $category->delete();

            return response()->json([
                'response_code' => 200,
                'status' => 'success',
                'message' => 'Category deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Category Delete Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to delete category',
            ], 500);
        }
    }
}
