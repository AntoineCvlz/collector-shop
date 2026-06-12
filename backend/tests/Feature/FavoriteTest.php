<?php

use App\Models\Article;
use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    foreach (Role::names() as $name) {
        Role::create(['name' => $name]);
    }
});

function buyerActor(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::BUYER);
    Passport::actingAs($user, ['*'], 'api');

    return $user;
}

// ─────────────────────────────────────────────
// INTERESTS
// ─────────────────────────────────────────────

test('a buyer starts with no interests', function () {
    buyerActor();

    $this->getJson(route('interests.index'))
        ->assertStatus(200)
        ->assertJsonCount(0, 'data');
});

test('a buyer can set their favourite categories', function () {
    $a = Category::factory()->create();
    $b = Category::factory()->create();
    $user = buyerActor();

    $this->putJson(route('interests.sync'), ['category_ids' => [$a->id, $b->id]])
        ->assertStatus(200)
        ->assertJsonCount(2, 'data');

    expect($user->favoriteCategories()->count())->toBe(2);
});

test('syncing interests replaces the previous selection', function () {
    $a = Category::factory()->create();
    $b = Category::factory()->create();
    $user = buyerActor();
    $user->favoriteCategories()->sync([$a->id]);

    $this->putJson(route('interests.sync'), ['category_ids' => [$b->id]])
        ->assertStatus(200)
        ->assertJsonCount(1, 'data');

    expect($user->favoriteCategories()->pluck('categories.id')->all())->toBe([$b->id]);
});

test('clearing interests with an empty array works', function () {
    $a = Category::factory()->create();
    $user = buyerActor();
    $user->favoriteCategories()->sync([$a->id]);

    $this->putJson(route('interests.sync'), ['category_ids' => []])
        ->assertStatus(200)
        ->assertJsonCount(0, 'data');
});

test('syncing interests rejects unknown categories', function () {
    buyerActor();

    $this->putJson(route('interests.sync'), ['category_ids' => [9999]])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['category_ids.0']);
});

test('a non-buyer cannot set interests', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::SELLER);
    Passport::actingAs($user, ['*'], 'api');

    $this->putJson(route('interests.sync'), ['category_ids' => []])
        ->assertStatus(403);
});

// ─────────────────────────────────────────────
// RECOMMENDATIONS
// ─────────────────────────────────────────────

test('recommendations are limited to the buyer interests', function () {
    $liked = Category::factory()->create();
    $other = Category::factory()->create();
    Article::factory()->published()->count(2)->create(['category_id' => $liked->id]);
    Article::factory()->published()->count(3)->create(['category_id' => $other->id]);

    $user = buyerActor();
    $user->favoriteCategories()->sync([$liked->id]);

    $this->getJson(route('recommendations'))
        ->assertStatus(200)
        ->assertJsonCount(2, 'data');
});

test('recommendations fall back to latest published when no interest is set', function () {
    Article::factory()->published()->count(3)->create();
    Article::factory()->count(2)->create(); // pending — excluded

    buyerActor();

    $this->getJson(route('recommendations'))
        ->assertStatus(200)
        ->assertJsonCount(3, 'data');
});

// ─────────────────────────────────────────────
// WISHLIST
// ─────────────────────────────────────────────

test('a user can add an article to their wishlist', function () {
    $article = Article::factory()->published()->create();
    $user = buyerActor();

    $this->postJson(route('favorites.store', $article))->assertStatus(200);

    expect($user->favoriteArticles()->count())->toBe(1);
});

test('adding the same article twice does not duplicate it', function () {
    $article = Article::factory()->published()->create();
    $user = buyerActor();

    $this->postJson(route('favorites.store', $article))->assertStatus(200);
    $this->postJson(route('favorites.store', $article))->assertStatus(200);

    expect($user->favoriteArticles()->count())->toBe(1);
});

test('a user can remove an article from their wishlist', function () {
    $article = Article::factory()->published()->create();
    $user = buyerActor();
    $user->favoriteArticles()->attach($article->id);

    $this->deleteJson(route('favorites.destroy', $article))->assertStatus(200);

    expect($user->favoriteArticles()->count())->toBe(0);
});

test('a user only sees their own wishlist', function () {
    $article = Article::factory()->published()->create();
    $user = buyerActor();
    $user->favoriteArticles()->attach($article->id);
    Article::factory()->published()->create(); // not favourited

    $this->getJson(route('favorites.index'))
        ->assertStatus(200)
        ->assertJsonPath('data.total', 1);
});

test('the wishlist requires authentication', function () {
    $article = Article::factory()->published()->create();

    $this->postJson(route('favorites.store', $article))->assertStatus(401);
});

// ─────────────────────────────────────────────
// ERROR HANDLING (catch block → 500)
// ─────────────────────────────────────────────

test('syncing interests returns 500 when persistence fails', function () {
    $category = Category::factory()->create();
    buyerActor();

    // Drop the pivot so sync() raises a QueryException → catch block.
    \Illuminate\Support\Facades\Schema::drop('category_user');

    $this->putJson(route('interests.sync'), ['category_ids' => [$category->id]])
        ->assertStatus(500);
});
