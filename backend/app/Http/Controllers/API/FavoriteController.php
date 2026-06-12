<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\SyncInterestsRequest;
use App\Models\Article;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class FavoriteController extends Controller
{
    /**
     * The authenticated user's favourite categories (interests).
     */
    public function interests(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched interests successfully',
            'data' => $user->favoriteCategories()->select(['categories.id', 'name', 'slug'])->get(),
        ]);
    }

    /**
     * Replace the user's interests with the given category ids.
     */
    public function syncInterests(SyncInterestsRequest $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();

            /** @var list<int> $ids */
            $ids = $request->input('category_ids', []);
            $user->favoriteCategories()->sync($ids);

            return response()->json([
                'response_code' => 200,
                'status' => 'success',
                'message' => 'Interests updated',
                'data' => $user->favoriteCategories()->select(['categories.id', 'name', 'slug'])->get(),
            ]);
        } catch (\Exception $e) {
            Log::error('Sync Interests Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to update interests',
            ], 500);
        }
    }

    /**
     * Articles recommended from the user's interests (published only).
     * Falls back to the latest published articles when no interest is set.
     */
    public function recommendations(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $categoryIds = $user->favoriteCategories()->pluck('categories.id')->all();

        $articles = Article::published()
            ->with(['images', 'category', 'seller:id,name'])
            ->when($categoryIds !== [], fn ($query) => $query->whereIn('category_id', $categoryIds))
            ->latest('published_at')
            ->limit(12)
            ->get();

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched recommendations successfully',
            'data' => $articles,
        ]);
    }

    /**
     * The authenticated user's saved articles (wishlist).
     */
    public function favorites(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $articles = $user->favoriteArticles()
            ->with(['images', 'category', 'seller:id,name'])
            ->paginate(12);

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched favourites successfully',
            'data' => $articles,
        ]);
    }

    /**
     * Add an article to the wishlist.
     */
    public function store(Article $article): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $user->favoriteArticles()->syncWithoutDetaching([$article->getKey()]);

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Added to favourites',
        ]);
    }

    /**
     * Remove an article from the wishlist.
     */
    public function destroy(Article $article): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $user->favoriteArticles()->detach($article->getKey());

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Removed from favourites',
        ]);
    }
}
