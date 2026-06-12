<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    /**
     * List sellers with their ban status (admin/moderator).
     */
    public function sellers(): JsonResponse
    {
        $sellers = User::whereHas('roles', fn ($q) => $q->where('name', Role::SELLER))
            ->withCount('articles')
            ->select(['id', 'name', 'email', 'banned_at'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched sellers successfully',
            'data' => $sellers,
        ]);
    }

    /**
     * Ban a seller. Their published articles drop out of the catalogue and
     * their tokens are revoked.
     */
    public function ban(User $user): JsonResponse
    {
        /** @var User $actor */
        $actor = Auth::user();

        if ($user->getKey() === $actor->getKey()) {
            return response()->json([
                'response_code' => 422,
                'status' => 'error',
                'message' => 'You cannot ban yourself',
            ], 422);
        }

        if ($user->hasRole(Role::ADMIN)) {
            return response()->json([
                'response_code' => 422,
                'status' => 'error',
                'message' => 'Administrators cannot be banned',
            ], 422);
        }

        try {
            $user->ban();

            return response()->json([
                'response_code' => 200,
                'status' => 'success',
                'message' => 'Seller banned',
                'data' => ['id' => $user->id, 'banned_at' => $user->banned_at],
            ]);
        } catch (\Exception $e) {
            Log::error('Ban Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to ban the seller',
            ], 500);
        }
    }

    /**
     * Lift a ban.
     */
    public function unban(User $user): JsonResponse
    {
        try {
            $user->unban();

            return response()->json([
                'response_code' => 200,
                'status' => 'success',
                'message' => 'Seller unbanned',
                'data' => ['id' => $user->id, 'banned_at' => null],
            ]);
        } catch (\Exception $e) {
            Log::error('Unban Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to unban the seller',
            ], 500);
        }
    }

    /**
     * Remove any article from the platform (moderation).
     */
    public function destroyArticle(Article $article): JsonResponse
    {
        try {
            foreach ($article->images as $image) {
                Storage::disk('public')->delete($image->path);
            }
            $article->delete();

            return response()->json([
                'response_code' => 200,
                'status' => 'success',
                'message' => 'Article removed',
            ]);
        } catch (\Exception $e) {
            Log::error('Admin Article Delete Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to remove the article',
            ], 500);
        }
    }
}
