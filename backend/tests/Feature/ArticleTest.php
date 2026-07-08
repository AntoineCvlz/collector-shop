<?php

use App\Models\Article;
use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;

beforeEach(function () {
    foreach (Role::names() as $name) {
        Role::create(['name' => $name]);
    }
    Storage::fake('public');
});

function makeUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function actAs(string $role): User
{
    $user = makeUser($role);
    Passport::actingAs($user, ['*'], 'api');

    return $user;
}

test('the public catalogue lists only published articles', function () {
    Article::factory()->published()->count(2)->create();
    Article::factory()->count(3)->create(); // pending
    Article::factory()->rejected()->create();

    $this->getJson(route('articles.index'))
        ->assertStatus(200)
        ->assertJsonPath('data.total', 2);
});

test('the catalogue is accessible without authentication', function () {
    Article::factory()->published()->create();

    $this->getJson(route('articles.index'))->assertStatus(200);
});

test('the catalogue can be filtered by category', function () {
    $catA = Category::factory()->create();
    $catB = Category::factory()->create();
    Article::factory()->published()->create(['category_id' => $catA->id]);
    Article::factory()->published()->create(['category_id' => $catB->id]);

    $this->getJson(route('articles.index', ['category_id' => $catA->id]))
        ->assertStatus(200)
        ->assertJsonPath('data.total', 1);
});

test('the catalogue can be searched by title', function () {
    Article::factory()->published()->create(['title' => 'Vintage Rolex Watch']);
    Article::factory()->published()->create(['title' => 'Old Vinyl Record']);

    $this->getJson(route('articles.index', ['search' => 'Rolex']))
        ->assertStatus(200)
        ->assertJsonPath('data.total', 1);
});

test('a published article can be viewed publicly', function () {
    $article = Article::factory()->published()->create();

    $this->getJson(route('articles.show', $article))
        ->assertStatus(200)
        ->assertJsonPath('data.id', $article->id);
});

test('a pending article is hidden from the public show endpoint', function () {
    $article = Article::factory()->create(); // pending

    $this->getJson(route('articles.show', $article))->assertStatus(404);
});

test('a seller can create an article which starts as pending', function () {
    $category = Category::factory()->create();
    actAs(Role::SELLER);

    $this->postJson(route('articles.store'), [
        'category_id' => $category->id,
        'title' => 'My collectible',
        'description' => 'A very fine collectible item.',
        'price' => 120.50,
        'shipping_cost' => 5,
    ])
        ->assertStatus(201)
        ->assertJsonPath('data.status', Article::STATUS_PENDING);

    $this->assertDatabaseHas('articles', [
        'title' => 'My collectible',
        'status' => Article::STATUS_PENDING,
    ]);
});

test('a seller can upload images when creating an article', function () {
    $category = Category::factory()->create();
    actAs(Role::SELLER);

    $this->postJson(route('articles.store'), [
        'category_id' => $category->id,
        'title' => 'With photos',
        'description' => 'Comes with nice photos attached.',
        'price' => 50,
        'images' => [
            UploadedFile::fake()->create('a.jpg', 100, 'image/jpeg'),
            UploadedFile::fake()->create('b.png', 100, 'image/png'),
        ],
    ])->assertStatus(201)
        ->assertJsonCount(2, 'data.images');

    $article = Article::firstOrFail();
    expect($article->images)->toHaveCount(2);
    Storage::disk('public')->assertExists($article->images->first()->path);
});

test('a buyer cannot create an article', function () {
    $category = Category::factory()->create();
    actAs(Role::BUYER);

    $this->postJson(route('articles.store'), [
        'category_id' => $category->id,
        'title' => 'Nope',
        'description' => 'Should not be allowed at all.',
        'price' => 10,
    ])->assertStatus(403);
});

test('creating an article validates required fields', function () {
    actAs(Role::SELLER);

    $this->postJson(route('articles.store'), [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['category_id', 'title', 'description', 'price']);
});

test('creating an article rejects non-image uploads', function () {
    $category = Category::factory()->create();
    actAs(Role::SELLER);

    $this->postJson(route('articles.store'), [
        'category_id' => $category->id,
        'title' => 'Bad upload',
        'description' => 'Trying to upload a PDF as an image.',
        'price' => 10,
        'images' => [UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')],
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['images.0']);
});

test('a seller can update their own article and it returns to pending', function () {
    $seller = actAs(Role::SELLER);
    $article = Article::factory()->published()->create(['user_id' => $seller->id]);

    $this->putJson(route('articles.update', $article), ['title' => 'Updated title'])
        ->assertStatus(200)
        ->assertJsonPath('data.status', Article::STATUS_PENDING)
        ->assertJsonPath('data.title', 'Updated title');
});

test('a seller cannot update another sellers article', function () {
    $other = makeUser(Role::SELLER);
    $article = Article::factory()->create(['user_id' => $other->id]);
    actAs(Role::SELLER);

    $this->putJson(route('articles.update', $article), ['title' => 'Hijack'])
        ->assertStatus(403);
});

test('a seller can delete their own article and its images are removed', function () {
    $seller = actAs(Role::SELLER);
    $article = Article::factory()->create(['user_id' => $seller->id]);
    $path = UploadedFile::fake()->create('x.jpg', 100, 'image/jpeg')->store('articles', 'public');
    $article->images()->create(['path' => $path, 'position' => 1]);

    $this->deleteJson(route('articles.destroy', $article))->assertStatus(200);

    $this->assertDatabaseMissing('articles', ['id' => $article->id]);
    Storage::disk('public')->assertMissing($path);
});

test('a seller cannot delete another sellers article', function () {
    $other = makeUser(Role::SELLER);
    $article = Article::factory()->create(['user_id' => $other->id]);
    actAs(Role::SELLER);

    $this->deleteJson(route('articles.destroy', $article))->assertStatus(403);
});

test('a seller only sees their own articles in the my-articles endpoint', function () {
    $seller = actAs(Role::SELLER);
    Article::factory()->count(2)->create(['user_id' => $seller->id]);
    Article::factory()->count(3)->create(); // other sellers

    $this->getJson(route('articles.mine'))
        ->assertStatus(200)
        ->assertJsonPath('data.total', 2);
});

test('a moderator can list pending articles', function () {
    Article::factory()->count(2)->create(); // pending
    Article::factory()->published()->create();
    actAs(Role::MODERATOR);

    $this->getJson(route('articles.pending'))
        ->assertStatus(200)
        ->assertJsonPath('data.total', 2);
});

test('an admin can approve a pending article', function () {
    $article = Article::factory()->create();
    actAs(Role::ADMIN);

    $this->patchJson(route('articles.approve', $article))
        ->assertStatus(200)
        ->assertJsonPath('data.status', Article::STATUS_PUBLISHED);

    expect($article->fresh()->published_at)->not->toBeNull();
});

test('a moderator can reject a pending article', function () {
    $article = Article::factory()->create();
    actAs(Role::MODERATOR);

    $this->patchJson(route('articles.reject', $article))
        ->assertStatus(200)
        ->assertJsonPath('data.status', Article::STATUS_REJECTED);
});

test('a seller cannot access the moderation queue', function () {
    actAs(Role::SELLER);

    $this->getJson(route('articles.pending'))->assertStatus(403);
});

test('a buyer cannot approve an article', function () {
    $article = Article::factory()->create();
    actAs(Role::BUYER);

    $this->patchJson(route('articles.approve', $article))->assertStatus(403);
});

test('approving requires authentication', function () {
    $article = Article::factory()->create();

    $this->patchJson(route('articles.approve', $article))->assertStatus(401);
});

test('store returns 500 when persistence fails', function () {
    $category = Category::factory()->create();
    actAs(Role::SELLER);

    Article::creating(fn () => throw new \RuntimeException('boom'));

    $this->postJson(route('articles.store'), [
        'category_id' => $category->id,
        'title' => 'Boom article',
        'description' => 'This should blow up on save.',
        'price' => 10,
    ])->assertStatus(500);
});

test('update returns 500 when persistence fails', function () {
    $seller = actAs(Role::SELLER);
    $article = Article::factory()->create(['user_id' => $seller->id]);

    Article::saving(fn () => throw new \RuntimeException('boom'));

    $this->putJson(route('articles.update', $article), ['title' => 'Updated title'])
        ->assertStatus(500);
});

test('destroy returns 500 when deletion fails', function () {
    $seller = actAs(Role::SELLER);
    $article = Article::factory()->create(['user_id' => $seller->id]);

    Article::deleting(fn () => throw new \RuntimeException('boom'));

    $this->deleteJson(route('articles.destroy', $article))->assertStatus(500);
});
