<?php

namespace Database\Factories;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Article>
 */
class ArticleFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'category_id' => Category::factory(),
            'title' => ucfirst(fake()->words(3, true)),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 5, 5000),
            'shipping_cost' => fake()->randomFloat(2, 0, 30),
            'status' => Article::STATUS_PENDING,
            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => Article::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => Article::STATUS_REJECTED,
        ]);
    }
}
