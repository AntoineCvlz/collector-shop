<?php

namespace App\Http\Controllers\API;

use App\Exceptions\ArticleUnavailableException;
use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Models\Article;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    /**
     * Simulate a card payment for an article and record the order.
     * The 5% platform commission is computed and stored automatically.
     */
    public function checkout(CheckoutRequest $request, Article $article): JsonResponse
    {
        /** @var User $buyer */
        $buyer = $request->user();

        if ($article->user_id === $buyer->getKey()) {
            return response()->json([
                'response_code' => 422,
                'status' => 'error',
                'message' => 'You cannot buy your own article',
            ], 422);
        }

        try {
            $order = DB::transaction(function () use ($article, $buyer, $request): Order {
                // Lock the row so two buyers can't purchase the same article.
                $fresh = Article::where('id', $article->getKey())
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! $fresh->isAvailable()) {
                    throw new ArticleUnavailableException;
                }

                $amount = (float) $fresh->price + (float) $fresh->shipping_cost;
                $commission = Order::commissionFor($amount);

                $order = Order::create([
                    'article_id' => $fresh->getKey(),
                    'buyer_id' => $buyer->getKey(),
                    'seller_id' => $fresh->user_id,
                    'amount' => $amount,
                    'commission' => $commission,
                    'seller_payout' => round($amount - $commission, 2),
                    'status' => Order::STATUS_PAID,
                    'card_last4' => $this->lastFour($request->string('card_number')->value()),
                    'paid_at' => now(),
                ]);

                $fresh->status = Article::STATUS_SOLD;
                $fresh->save();

                return $order;
            });

            return response()->json([
                'response_code' => 201,
                'status' => 'success',
                'message' => 'Payment successful',
                'data' => $order,
            ], 201);
        } catch (ArticleUnavailableException) {
            return response()->json([
                'response_code' => 409,
                'status' => 'error',
                'message' => 'This article is no longer available',
            ], 409);
        } catch (\Exception $e) {
            Log::error('Checkout Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Payment failed',
            ], 500);
        }
    }

    /**
     * Orders placed by the authenticated buyer.
     */
    public function myOrders(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $orders = Order::where('buyer_id', $user->getKey())
            ->with(['article:id,title', 'seller:id,name'])
            ->latest()
            ->paginate(12);

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched your orders successfully',
            'data' => $orders,
        ]);
    }

    /**
     * Sales made by the authenticated seller.
     */
    public function mySales(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $sales = Order::where('seller_id', $user->getKey())
            ->with(['article:id,title', 'buyer:id,name'])
            ->latest()
            ->paginate(12);

        return response()->json([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched your sales successfully',
            'data' => $sales,
        ]);
    }

    private function lastFour(string $cardNumber): string
    {
        $digits = preg_replace('/\D+/', '', $cardNumber) ?? '';

        return substr($digits, -4);
    }
}
