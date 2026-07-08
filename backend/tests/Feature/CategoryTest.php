<?php

use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    foreach (Role::names() as $name) {
        Role::create(['name' => $name]);
    }
});

function actingAsRole(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);
    Passport::actingAs($user, ['*'], 'api');

    return $user;
}


test('anyone can list categories without authentication', function () {
    Category::factory()->count(3)->create();

    $this->getJson(route('categories.index'))
        ->assertStatus(200)
        ->assertJson([
            'response_code' => 200,
            'status' => 'success',
        ])
        ->assertJsonCount(3, 'data');
});

test('anyone can view a single category', function () {
    $category = Category::factory()->create();

    $this->getJson(route('categories.show', $category))
        ->assertStatus(200)
        ->assertJsonPath('data.id', $category->id)
        ->assertJsonPath('data.name', $category->name);
});

test('categories are returned sorted by name', function () {
    Category::factory()->create(['name' => 'Zeppelins', 'slug' => 'zeppelins']);
    Category::factory()->create(['name' => 'Anchors', 'slug' => 'anchors']);

    $response = $this->getJson(route('categories.index'))->assertStatus(200);

    $names = array_column($response->json('data'), 'name');
    expect($names)->toBe(['Anchors', 'Zeppelins']);
});


test('an admin can create a category and the slug is generated', function () {
    actingAsRole(Role::ADMIN);

    $this->postJson(route('categories.store'), ['name' => 'Vintage Watches'])
        ->assertStatus(201)
        ->assertJsonPath('data.name', 'Vintage Watches')
        ->assertJsonPath('data.slug', 'vintage-watches');

    $this->assertDatabaseHas('categories', [
        'name' => 'Vintage Watches',
        'slug' => 'vintage-watches',
    ]);
});

test('creating a category requires a unique name', function () {
    Category::factory()->create(['name' => 'Coins', 'slug' => 'coins']);
    actingAsRole(Role::ADMIN);

    $this->postJson(route('categories.store'), ['name' => 'Coins'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('creating a category validates the name', function () {
    actingAsRole(Role::ADMIN);

    $this->postJson(route('categories.store'), ['name' => 'A'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});


test('an admin can update a category', function () {
    $category = Category::factory()->create(['name' => 'Old', 'slug' => 'old']);
    actingAsRole(Role::ADMIN);

    $this->putJson(route('categories.update', $category), ['name' => 'New Name'])
        ->assertStatus(200)
        ->assertJsonPath('data.name', 'New Name')
        ->assertJsonPath('data.slug', 'new-name');

    $this->assertDatabaseHas('categories', ['id' => $category->id, 'slug' => 'new-name']);
});

test('a category can keep its own name when updating', function () {
    $category = Category::factory()->create(['name' => 'Stamps', 'slug' => 'stamps']);
    actingAsRole(Role::ADMIN);

    $this->putJson(route('categories.update', $category), ['name' => 'Stamps'])
        ->assertStatus(200);
});

test('an admin can delete a category', function () {
    $category = Category::factory()->create();
    actingAsRole(Role::ADMIN);

    $this->deleteJson(route('categories.destroy', $category))
        ->assertStatus(200);

    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
});


test('a buyer cannot create a category', function () {
    actingAsRole(Role::BUYER);

    $this->postJson(route('categories.store'), ['name' => 'Forbidden'])
        ->assertStatus(403);
});

test('a seller cannot update a category', function () {
    $category = Category::factory()->create();
    actingAsRole(Role::SELLER);

    $this->putJson(route('categories.update', $category), ['name' => 'Nope'])
        ->assertStatus(403);
});

test('a guest cannot delete a category', function () {
    $category = Category::factory()->create();

    $this->deleteJson(route('categories.destroy', $category))
        ->assertStatus(401);
});


test('store returns 500 when persistence fails', function () {
    actingAsRole(Role::ADMIN);

    Category::saving(function () {
        throw new \RuntimeException('boom');
    });

    $this->postJson(route('categories.store'), ['name' => 'Boom Category'])
        ->assertStatus(500)
        ->assertJson(['response_code' => 500, 'status' => 'error']);
});

test('update returns 500 when persistence fails', function () {
    $category = Category::factory()->create(['name' => 'Edit Me', 'slug' => 'edit-me']);
    actingAsRole(Role::ADMIN);

    Category::saving(function () {
        throw new \RuntimeException('boom');
    });

    $this->putJson(route('categories.update', $category), ['name' => 'New Name'])
        ->assertStatus(500)
        ->assertJson(['response_code' => 500, 'status' => 'error']);
});

test('destroy returns 500 when deletion fails', function () {
    $category = Category::factory()->create();
    actingAsRole(Role::ADMIN);

    Category::deleting(function () {
        throw new \RuntimeException('boom');
    });

    $this->deleteJson(route('categories.destroy', $category))
        ->assertStatus(500)
        ->assertJson(['response_code' => 500, 'status' => 'error']);
});
