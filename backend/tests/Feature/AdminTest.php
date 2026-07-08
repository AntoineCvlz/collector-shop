<?php

use App\Models\Article;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Passport\Passport;

beforeEach(function () {
    foreach (Role::names() as $name) {
        Role::create(['name' => $name]);
    }
    $this->artisan('passport:client', [
        '--personal' => true,
        '--name' => 'Test Personal Access Client',
        '--no-interaction' => true,
    ]);
});

function withRole(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function asRole(string $role): User
{
    $user = withRole($role);
    Passport::actingAs($user, ['*'], 'api');

    return $user;
}


test('a banned user cannot log in', function () {
    $user = User::factory()->create([
        'email' => 'banned@example.com',
        'password' => Hash::make('password123'),
        'banned_at' => now(),
    ]);
    $user->assignRole(Role::SELLER);

    $this->postJson(route('login'), [
        'email' => 'banned@example.com',
        'password' => 'password123',
    ])->assertStatus(403)
        ->assertJson(['message' => 'This account has been banned']);
});

test("a banned seller's articles disappear from the catalogue", function () {
    $seller = withRole(Role::SELLER);
    Article::factory()->published()->count(2)->create(['user_id' => $seller->id]);

    $this->getJson(route('articles.index'))->assertJsonPath('data.total', 2);

    $seller->ban();

    $this->getJson(route('articles.index'))->assertJsonPath('data.total', 0);
});

test("a banned seller's article returns 404 on the public show endpoint", function () {
    $seller = withRole(Role::SELLER);
    $article = Article::factory()->published()->create(['user_id' => $seller->id]);
    $seller->ban();

    $this->getJson(route('articles.show', $article))->assertStatus(404);
});


test('an admin can ban a seller', function () {
    $seller = withRole(Role::SELLER);
    asRole(Role::ADMIN);

    $this->patchJson(route('sellers.ban', $seller))
        ->assertStatus(200)
        ->assertJson(['message' => 'Seller banned']);

    expect($seller->fresh()->isBanned())->toBeTrue();
});

test('a moderator can ban a seller', function () {
    $seller = withRole(Role::SELLER);
    asRole(Role::MODERATOR);

    $this->patchJson(route('sellers.ban', $seller))->assertStatus(200);
    expect($seller->fresh()->isBanned())->toBeTrue();
});

test('an admin can unban a seller', function () {
    $seller = withRole(Role::SELLER);
    $seller->ban();
    asRole(Role::ADMIN);

    $this->patchJson(route('sellers.unban', $seller))->assertStatus(200);
    expect($seller->fresh()->isBanned())->toBeFalse();
});

test('banning revokes the seller active tokens', function () {
    $seller = withRole(Role::SELLER);
    $seller->createToken('authToken');
    expect($seller->tokens()->count())->toBeGreaterThan(0);

    asRole(Role::ADMIN);
    $this->patchJson(route('sellers.ban', $seller))->assertStatus(200);

    expect($seller->fresh()->tokens()->count())->toBe(0);
});

test('an admin cannot ban themselves', function () {
    $admin = asRole(Role::ADMIN);

    $this->patchJson(route('sellers.ban', $admin))->assertStatus(422);
});

test('an admin cannot be banned', function () {
    $target = withRole(Role::ADMIN);
    asRole(Role::ADMIN);

    $this->patchJson(route('sellers.ban', $target))->assertStatus(422);
});


test('a seller cannot ban another seller', function () {
    $target = withRole(Role::SELLER);
    asRole(Role::SELLER);

    $this->patchJson(route('sellers.ban', $target))->assertStatus(403);
});

test('a buyer cannot list sellers', function () {
    asRole(Role::BUYER);

    $this->getJson(route('sellers.index'))->assertStatus(403);
});

test('banning requires authentication', function () {
    $seller = withRole(Role::SELLER);

    $this->patchJson(route('sellers.ban', $seller))->assertStatus(401);
});


test('an admin can list sellers', function () {
    withRole(Role::SELLER);
    withRole(Role::SELLER);
    asRole(Role::ADMIN);

    $this->getJson(route('sellers.index'))
        ->assertStatus(200)
        ->assertJsonStructure(['data' => ['data', 'total']]);
});

test('a moderator can delete any article', function () {
    $article = Article::factory()->published()->create();
    asRole(Role::MODERATOR);

    $this->deleteJson(route('articles.moderate.destroy', $article))
        ->assertStatus(200);

    $this->assertDatabaseMissing('articles', ['id' => $article->id]);
});

test('a seller cannot use the moderation delete endpoint', function () {
    $article = Article::factory()->published()->create();
    asRole(Role::SELLER);

    $this->deleteJson(route('articles.moderate.destroy', $article))
        ->assertStatus(403);
});


test('ban returns 500 when persistence fails', function () {
    $seller = withRole(Role::SELLER);
    asRole(Role::ADMIN);

    User::saving(fn () => throw new \RuntimeException('boom'));

    $this->patchJson(route('sellers.ban', $seller))->assertStatus(500);
});

test('moderation delete returns 500 when deletion fails', function () {
    $article = Article::factory()->published()->create();
    asRole(Role::ADMIN);

    Article::deleting(fn () => throw new \RuntimeException('boom'));

    $this->deleteJson(route('articles.moderate.destroy', $article))
        ->assertStatus(500);
});

test('unban returns 500 when persistence fails', function () {
    $seller = withRole(Role::SELLER);
    $seller->ban();
    asRole(Role::ADMIN);

    User::saving(fn () => throw new \RuntimeException('boom'));

    $this->patchJson(route('sellers.unban', $seller))->assertStatus(500);
});

test('moderation delete removes the article images from storage', function () {
    \Illuminate\Support\Facades\Storage::fake('public');

    $article = Article::factory()->published()->create();
    $image = \App\Models\ArticleImage::factory()->create([
        'article_id' => $article->id,
        'path' => 'articles/test-image.jpg',
    ]);
    \Illuminate\Support\Facades\Storage::disk('public')->put($image->path, 'fake-content');
    asRole(Role::ADMIN);

    $this->deleteJson(route('articles.moderate.destroy', $article))->assertStatus(200);

    \Illuminate\Support\Facades\Storage::disk('public')->assertMissing($image->path);
});
