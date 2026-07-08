<?php

use App\Models\Article;
use App\Models\Order;
use App\Models\Role;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    foreach (Role::names() as $name) {
        Role::create(['name' => $name]);
    }
});

function buyer(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::BUYER);

    return $user;
}

function sellerUser(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::SELLER);

    return $user;
}

/**
 * @return array<string, mixed>
 */
function validCard(): array
{
    return [
        'card_number' => '4242424242424242', // passes Luhn
        'card_name' => 'Jane Buyer',
        'expiry_month' => 12,
        'expiry_year' => (int) date('Y') + 2,
        'cvv' => '123',
    ];
}


test('a buyer can purchase a published article', function () {
    $article = Article::factory()->published()->create([
        'price' => 100,
        'shipping_cost' => 20,
    ]);
    Passport::actingAs(buyer(), ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), validCard())
        ->assertStatus(201)
        ->assertJsonPath('data.amount', '120.00')
        ->assertJsonPath('data.status', Order::STATUS_PAID);

    $this->assertDatabaseHas('orders', ['article_id' => $article->id]);
});

test('the 5 percent commission is computed on price plus shipping', function () {
    $article = Article::factory()->published()->create([
        'price' => 200,
        'shipping_cost' => 50,
    ]);
    Passport::actingAs(buyer(), ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), validCard())
        ->assertStatus(201)
        ->assertJsonPath('data.commission', '12.50')
        ->assertJsonPath('data.seller_payout', '237.50');
});

test('purchasing marks the article as sold and removes it from the catalogue', function () {
    $article = Article::factory()->published()->create();
    Passport::actingAs(buyer(), ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), validCard())->assertStatus(201);

    expect($article->fresh()->status)->toBe(Article::STATUS_SOLD);
    $this->getJson(route('articles.index'))->assertJsonPath('data.total', 0);
});

test('the order stores only the last four digits of the card', function () {
    $article = Article::factory()->published()->create();
    Passport::actingAs(buyer(), ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), validCard())
        ->assertJsonPath('data.card_last4', '4242');

    $this->assertDatabaseMissing('orders', ['card_last4' => '4242424242424242']);
});


test('a seller cannot buy their own article', function () {
    $seller = User::factory()->create();
    $seller->assignRole(Role::SELLER);
    $seller->assignRole(Role::BUYER);
    $article = Article::factory()->published()->create(['user_id' => $seller->id]);
    Passport::actingAs($seller, ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), validCard())
        ->assertStatus(422);
});

test('a pending article cannot be purchased', function () {
    $article = Article::factory()->create(); // pending
    Passport::actingAs(buyer(), ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), validCard())
        ->assertStatus(409);
});

test('an already sold article cannot be purchased again', function () {
    $article = Article::factory()->create(['status' => Article::STATUS_SOLD]);
    Passport::actingAs(buyer(), ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), validCard())
        ->assertStatus(409);
});


test('checkout rejects a card number that fails the Luhn check', function () {
    $article = Article::factory()->published()->create();
    Passport::actingAs(buyer(), ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), [
        ...validCard(),
        'card_number' => '1234567812345678',
    ])->assertStatus(422)->assertJsonValidationErrors(['card_number']);
});

test('checkout rejects an expired card', function () {
    $article = Article::factory()->published()->create();
    Passport::actingAs(buyer(), ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), [
        ...validCard(),
        'expiry_month' => 1,
        'expiry_year' => (int) date('Y') - 1,
    ])->assertStatus(422)->assertJsonValidationErrors(['expiry_month']);
});

test('checkout rejects an invalid cvv', function () {
    $article = Article::factory()->published()->create();
    Passport::actingAs(buyer(), ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), [
        ...validCard(),
        'cvv' => 'ab',
    ])->assertStatus(422)->assertJsonValidationErrors(['cvv']);
});

test('checkout validates required card fields', function () {
    $article = Article::factory()->published()->create();
    Passport::actingAs(buyer(), ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['card_number', 'card_name', 'expiry_month', 'expiry_year', 'cvv']);
});


test('a non-buyer cannot check out', function () {
    $article = Article::factory()->published()->create();
    Passport::actingAs(sellerUser(), ['*'], 'api');

    $this->postJson(route('orders.checkout', $article), validCard())
        ->assertStatus(403);
});

test('checkout requires authentication', function () {
    $article = Article::factory()->published()->create();

    $this->postJson(route('orders.checkout', $article), validCard())
        ->assertStatus(401);
});


test('a buyer sees their own orders', function () {
    $user = buyer();
    Order::factory()->count(2)->create(['buyer_id' => $user->id]);
    Order::factory()->count(3)->create(); // other buyers
    Passport::actingAs($user, ['*'], 'api');

    $this->getJson(route('orders.mine'))
        ->assertStatus(200)
        ->assertJsonPath('data.total', 2);
});

test('a seller sees their own sales', function () {
    $user = sellerUser();
    Order::factory()->count(2)->create(['seller_id' => $user->id]);
    Order::factory()->count(4)->create(); // other sellers
    Passport::actingAs($user, ['*'], 'api');

    $this->getJson(route('orders.sales'))
        ->assertStatus(200)
        ->assertJsonPath('data.total', 2);
});

test('the commission helper rounds to the cent', function () {
    expect(Order::commissionFor(33.33))->toBe(1.67);
});


test('checkout returns 500 when persistence fails', function () {
    $article = Article::factory()->published()->create();
    Passport::actingAs(buyer(), ['*'], 'api');

    Order::creating(fn () => throw new \RuntimeException('boom'));

    $this->postJson(route('orders.checkout', $article), validCard())
        ->assertStatus(500);
});
