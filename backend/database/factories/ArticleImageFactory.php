<?php

namespace Database\Factories;

use App\Models\Article;
use App\Models\ArticleImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ArticleImage>
 */
class ArticleImageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'article_id' => Article::factory(),
            'path' => 'articles/'.fake()->uuid().'.jpg',
            'position' => 0,
        ];
    }
}
