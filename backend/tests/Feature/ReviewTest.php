<?php

use App\Models\Order;
use App\Models\Review;
use App\Models\Role;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    foreach (Role::names() as $name) {
        Role::create(['name' => $name]);
    }
});

/**
 * Build a paid order between a fresh buyer and seller.
 *
 * @return array{order: Order, buyer: User, seller: User}
 */
function transaction(): array
{
    $buyer = User::factory()->create();
    $buyer->assignRole(Role::BUYER);
    $seller = User::factory()->create();
    $seller->assignRole(Role::SELLER);

    $order = Order::factory()->create([
        'buyer_id' => $buyer->id,
        'seller_id' => $seller->id,
    ]);

    return ['order' => $order, 'buyer' => $buyer, 'seller' => $seller];
}

test('a buyer can review the seller after a transaction', function () {
    ['order' => $order, 'buyer' => $buyer, 'seller' => $seller] = transaction();
    Passport::actingAs($buyer, ['*'], 'api');

    $this->postJson(route('reviews.store', $order), [
        'rating' => 5,
        'comment' => 'Great seller, fast shipping!',
    ])
        ->assertStatus(201)
        ->assertJsonPath('data.type', Review::TYPE_OF_SELLER)
        ->assertJsonPath('data.subject_id', $seller->id)
        ->assertJsonPath('data.rating', 5);
});

test('a seller can review the buyer after a transaction', function () {
    ['order' => $order, 'buyer' => $buyer, 'seller' => $seller] = transaction();
    Passport::actingAs($seller, ['*'], 'api');

    $this->postJson(route('reviews.store', $order), ['rating' => 4])
        ->assertStatus(201)
        ->assertJsonPath('data.type', Review::TYPE_OF_BUYER)
        ->assertJsonPath('data.subject_id', $buyer->id);
});

test('both parties can review the same transaction independently', function () {
    ['order' => $order, 'buyer' => $buyer, 'seller' => $seller] = transaction();

    Passport::actingAs($buyer, ['*'], 'api');
    $this->postJson(route('reviews.store', $order), ['rating' => 5])->assertStatus(201);

    Passport::actingAs($seller, ['*'], 'api');
    $this->postJson(route('reviews.store', $order), ['rating' => 3])->assertStatus(201);

    expect($order->reviews()->count())->toBe(2);
});

test('a stranger cannot review a transaction they were not part of', function () {
    ['order' => $order] = transaction();
    $outsider = User::factory()->create();
    $outsider->assignRole(Role::BUYER);
    Passport::actingAs($outsider, ['*'], 'api');

    $this->postJson(route('reviews.store', $order), ['rating' => 1])
        ->assertStatus(403);
});

test('a user cannot review the same transaction twice', function () {
    ['order' => $order, 'buyer' => $buyer] = transaction();
    Passport::actingAs($buyer, ['*'], 'api');

    $this->postJson(route('reviews.store', $order), ['rating' => 5])->assertStatus(201);
    $this->postJson(route('reviews.store', $order), ['rating' => 4])->assertStatus(409);
});

test('reviewing requires authentication', function () {
    ['order' => $order] = transaction();

    $this->postJson(route('reviews.store', $order), ['rating' => 5])
        ->assertStatus(401);
});

test('the rating is required', function () {
    ['order' => $order, 'buyer' => $buyer] = transaction();
    Passport::actingAs($buyer, ['*'], 'api');

    $this->postJson(route('reviews.store', $order), [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['rating']);
});

test('the rating must be between 1 and 5', function () {
    ['order' => $order, 'buyer' => $buyer] = transaction();
    Passport::actingAs($buyer, ['*'], 'api');

    $this->postJson(route('reviews.store', $order), ['rating' => 6])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['rating']);
});

test('anyone can see the reviews and average rating of a user', function () {
    $seller = User::factory()->create();
    $seller->assignRole(Role::SELLER);
    Review::factory()->create(['subject_id' => $seller->id, 'rating' => 4]);
    Review::factory()->create(['subject_id' => $seller->id, 'rating' => 5]);

    $this->getJson(route('reviews.user', $seller))
        ->assertStatus(200)
        ->assertJsonPath('meta.total_reviews', 2)
        ->assertJsonPath('meta.average_rating', 4.5);
});

test('a user with no reviews has a null average', function () {
    $seller = User::factory()->create();

    $this->getJson(route('reviews.user', $seller))
        ->assertStatus(200)
        ->assertJsonPath('meta.total_reviews', 0)
        ->assertJsonPath('meta.average_rating', null);
});

test('review creation returns 500 when persistence fails', function () {
    ['order' => $order, 'buyer' => $buyer] = transaction();
    Passport::actingAs($buyer, ['*'], 'api');

    Review::creating(fn () => throw new \RuntimeException('boom'));

    $this->postJson(route('reviews.store', $order), ['rating' => 5])
        ->assertStatus(500);
});
