<?php

use App\Models\Article;
use App\Models\ArticleImage;
use App\Models\Order;
use App\Models\Review;
use App\Models\Role;
use App\Models\User;

beforeEach(function () {
    foreach (Role::names() as $name) {
        Role::create(['name' => $name]);
    }
});

test('an article exposes its orders relation', function () {
    $seller = User::factory()->create();
    $seller->assignRole(Role::SELLER);
    $buyer = User::factory()->create();
    $buyer->assignRole(Role::BUYER);

    $article = Article::factory()->published()->create(['user_id' => $seller->id]);
    $order = Order::factory()->create([
        'article_id' => $article->id,
        'buyer_id' => $buyer->id,
        'seller_id' => $seller->id,
    ]);

    expect($article->orders)->toHaveCount(1);
    expect($article->orders->first()->is($order))->toBeTrue();
});

test('a review exposes its order and subject relations', function () {
    $seller = User::factory()->create();
    $seller->assignRole(Role::SELLER);
    $buyer = User::factory()->create();
    $buyer->assignRole(Role::BUYER);

    $order = Order::factory()->create([
        'buyer_id' => $buyer->id,
        'seller_id' => $seller->id,
    ]);

    $review = Review::factory()->create([
        'order_id' => $order->id,
        'author_id' => $buyer->id,
        'subject_id' => $seller->id,
        'type' => Review::TYPE_OF_SELLER,
    ]);

    expect($review->order->is($order))->toBeTrue();
    expect($review->subject->is($seller))->toBeTrue();
});

test('a role exposes its users relation', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::BUYER);

    $role = Role::where('name', Role::BUYER)->firstOrFail();

    expect($role->users)->toHaveCount(1);
    expect($role->users->first()->is($user))->toBeTrue();
});

test('an article image exposes its article relation', function () {
    $article = Article::factory()->published()->create();
    $image = ArticleImage::factory()->create(['article_id' => $article->id]);

    expect($image->article->is($article))->toBeTrue();
});
