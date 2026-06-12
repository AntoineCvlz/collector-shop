<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArticleRequest;
use App\Http\Requests\UpdateArticleRequest;
use App\Models\Article;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ArticleController extends Controller
{
    /**
     * Public catalogue — only published articles. Supports optional
     * filtering by category and a free-text search on the title.
     */
    public function index(Request $request): JsonResponse
    {
        $articles = Article::published()
            ->with(['images', 'category', 'seller:id,name'])
            ->when(
                $request->filled('category_id'),
                fn ($query) => $query->where('category_id', $request->integer('category_id'))
            )
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where('title', 'like', '%'.$request->string('search')->value().'%')
            )
            ->latest('published_at')
            ->paginate(12);

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched catalogue successfully',
            'data' => $articles,
        ]);
    }

    /**
     * Public single article — only if published.
     */
    public function show(Article $article): JsonResponse
    {
        if (! $article->isPublished()) {
            return response()->json([
                'response_code' => 404,
                'status' => 'error',
                'message' => 'Article not found',
            ], 404);
        }

        $article->load(['images', 'category', 'seller:id,name']);

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched article successfully',
            'data' => $article,
        ]);
    }

    /**
     * The authenticated seller's own articles (any status).
     */
    public function mine(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $articles = Article::where('user_id', $user->getKey())
            ->with(['images', 'category'])
            ->latest()
            ->paginate(12);

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched your articles successfully',
            'data' => $articles,
        ]);
    }

    /**
     * Create a listing. Starts as "pending" until moderation.
     */
    public function store(StoreArticleRequest $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();

            $article = Article::create([
                'user_id' => $user->getKey(),
                'category_id' => $request->integer('category_id'),
                'title' => $request->string('title')->value(),
                'description' => $request->string('description')->value(),
                'price' => $request->float('price'),
                'shipping_cost' => $request->float('shipping_cost'),
                'status' => Article::STATUS_PENDING,
            ]);

            $this->storeImages($request, $article);

            return response()->json([
                'response_code' => 201,
                'status' => 'success',
                'message' => 'Article submitted and awaiting review',
                'data' => $article->load('images'),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Article Create Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to create article',
            ], 500);
        }
    }

    /**
     * Update an own article. Any edit sends it back to "pending".
     */
    public function update(UpdateArticleRequest $request, Article $article): JsonResponse
    {
        try {
            /** @var array<string, mixed> $attributes */
            $attributes = $request->only([
                'category_id', 'title', 'description', 'price', 'shipping_cost',
            ]);
            $article->fill($attributes);
            // Re-moderate after any edit.
            $article->status = Article::STATUS_PENDING;
            $article->published_at = null;
            $article->save();

            $this->storeImages($request, $article);

            return response()->json([
                'response_code' => 200,
                'status' => 'success',
                'message' => 'Article updated and awaiting review',
                'data' => $article->load('images'),
            ]);
        } catch (\Exception $e) {
            Log::error('Article Update Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to update article',
            ], 500);
        }
    }

    /**
     * Delete an own article.
     */
    public function destroy(Request $request, Article $article): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof User || $article->user_id !== $user->getKey()) {
            return response()->json([
                'response_code' => 403,
                'status' => 'error',
                'message' => 'This action is unauthorized.',
            ], 403);
        }

        try {
            foreach ($article->images as $image) {
                Storage::disk('public')->delete($image->path);
            }
            $article->delete();

            return response()->json([
                'response_code' => 200,
                'status' => 'success',
                'message' => 'Article deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Article Delete Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to delete article',
            ], 500);
        }
    }

    /**
     * Moderation queue — pending articles (admin/moderator).
     */
    public function pending(): JsonResponse
    {
        $articles = Article::where('status', Article::STATUS_PENDING)
            ->with(['images', 'category', 'seller:id,name'])
            ->latest()
            ->paginate(12);

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched pending articles successfully',
            'data' => $articles,
        ]);
    }

    /**
     * Approve an article — make it public (admin/moderator).
     */
    public function approve(Article $article): JsonResponse
    {
        $article->status = Article::STATUS_PUBLISHED;
        $article->published_at = now();
        $article->save();

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Article published',
            'data' => $article,
        ]);
    }

    /**
     * Reject an article (admin/moderator).
     */
    public function reject(Article $article): JsonResponse
    {
        $article->status = Article::STATUS_REJECTED;
        $article->published_at = null;
        $article->save();

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Article rejected',
            'data' => $article,
        ]);
    }

    /**
     * Persist uploaded images for an article on the public disk.
     */
    private function storeImages(Request $request, Article $article): void
    {
        $images = $request->file('images');

        if (! is_array($images)) {
            return;
        }

        $maxPosition = $article->images()->max('position');
        $position = is_numeric($maxPosition) ? (int) $maxPosition : 0;

        /** @var UploadedFile $image */
        foreach ($images as $image) {
            $path = $image->store('articles', 'public');

            $article->images()->create([
                'path' => $path,
                'position' => ++$position,
            ]);
        }
    }
}
