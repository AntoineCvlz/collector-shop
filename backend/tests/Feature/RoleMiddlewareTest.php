<?php

use App\Models\Role;
use App\Models\User;
use Laravel\Passport\Passport;

beforeEach(function () {
    foreach (Role::names() as $name) {
        Role::create(['name' => $name]);
    }
});

// ─────────────────────────────────────────────
// ROLE ISOLATION — admin-only route (users.index)
// ─────────────────────────────────────────────

test('an admin can access an admin-only route', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::ADMIN);
    Passport::actingAs($admin, ['*'], 'api');

    $this->getJson(route('users.index'))
        ->assertStatus(200)
        ->assertJsonStructure([
            'data_user_list' => ['data', 'current_page', 'total'],
        ]);
});

test('a buyer is forbidden from an admin-only route', function () {
    $buyer = User::factory()->create();
    $buyer->assignRole(Role::BUYER);
    Passport::actingAs($buyer, ['*'], 'api');

    $this->getJson(route('users.index'))
        ->assertStatus(403)
        ->assertJson([
            'response_code' => 403,
            'status' => 'error',
        ]);
});

test('a seller is forbidden from an admin-only route', function () {
    $seller = User::factory()->create();
    $seller->assignRole(Role::SELLER);
    Passport::actingAs($seller, ['*'], 'api');

    $this->getJson(route('users.index'))->assertStatus(403);
});

test('a user with no role is forbidden from an admin-only route', function () {
    Passport::actingAs(User::factory()->create(), ['*'], 'api');

    $this->getJson(route('users.index'))->assertStatus(403);
});

test('an unauthenticated request to an admin route is rejected by auth first', function () {
    $this->getJson(route('users.index'))->assertStatus(401);
});

test('an admin who is also a buyer still passes the admin gate', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::BUYER);
    $user->assignRole(Role::ADMIN);
    Passport::actingAs($user, ['*'], 'api');

    $this->getJson(route('users.index'))->assertStatus(200);
});

test('users list returns 500 when the query fails', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::ADMIN);
    Passport::actingAs($admin, ['*'], 'api');

    // hasRole() (middleware) only runs an exists() check and never hydrates a
    // Role model, so failing on Role::retrieved only breaks usersList()'s
    // eager-loaded with('roles'), which happens after the middleware passes.
    Role::retrieved(fn () => throw new \RuntimeException('boom'));

    $this->getJson(route('users.index'))
        ->assertStatus(500)
        ->assertJson([
            'response_code' => 500,
            'status' => 'error',
            'message' => 'Failed to fetch user list',
        ]);
});
