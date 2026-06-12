<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ReviewController extends Controller
{
    /**
     * Leave a review on a transaction. The buyer reviews the seller and the
     * seller reviews the buyer; the subject and type are derived from the
     * author's role in the order.
     */
    public function store(StoreReviewRequest $request, Order $order): JsonResponse
    {
        /** @var User $author */
        $author = $request->user();
        $authorId = $author->getKey();

        // Determine the author's side of the transaction.
        if ($authorId === $order->buyer_id) {
            $subjectId = $order->seller_id;
            $type = Review::TYPE_OF_SELLER;
        } elseif ($authorId === $order->seller_id) {
            $subjectId = $order->buyer_id;
            $type = Review::TYPE_OF_BUYER;
        } else {
            return response()->json([
                'response_code' => 403,
                'status' => 'error',
                'message' => 'You can only review your own transactions',
            ], 403);
        }

        if ($order->reviews()->where('author_id', $authorId)->exists()) {
            return response()->json([
                'response_code' => 409,
                'status' => 'error',
                'message' => 'You have already reviewed this transaction',
            ], 409);
        }

        try {
            $review = Review::create([
                'order_id' => $order->getKey(),
                'author_id' => $authorId,
                'subject_id' => $subjectId,
                'type' => $type,
                'rating' => $request->integer('rating'),
                'comment' => $request->input('comment'),
            ]);

            return response()->json([
                'response_code' => 201,
                'status' => 'success',
                'message' => 'Review submitted',
                'data' => $review,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Review Create Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to submit the review',
            ], 500);
        }
    }

    /**
     * Public list of reviews received by a user, with the average rating.
     */
    public function forUser(User $user): JsonResponse
    {
        $reviews = $user->reviewsReceived()
            ->with('author:id,name')
            ->latest()
            ->paginate(10);

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched reviews successfully',
            'data' => $reviews,
            'meta' => [
                'average_rating' => $user->averageRating(),
                'total_reviews' => $user->reviewsReceived()->count(),
            ],
        ]);
    }
}
