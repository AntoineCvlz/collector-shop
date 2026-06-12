<?php

namespace Database\Factories;

use App\Models\Article;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->randomFloat(2, 10, 2000);
        $commission = Order::commissionFor($amount);

        return [
            'article_id' => Article::factory(),
            'buyer_id' => User::factory(),
            'seller_id' => User::factory(),
            'amount' => $amount,
            'commission' => $commission,
            'seller_payout' => round($amount - $commission, 2),
            'status' => Order::STATUS_PAID,
            'card_last4' => (string) fake()->numberBetween(1000, 9999),
            'paid_at' => now(),
        ];
    }
}
