<?php

use App\Models\Role;
use App\Models\User;

// ─────────────────────────────────────────────
// MODÈLE & RELATIONS
// ─────────────────────────────────────────────

test('roles table exists with correct columns', function () {
    expect(\Illuminate\Support\Facades\Schema::hasTable('roles'))->toBeTrue();
    expect(\Illuminate\Support\Facades\Schema::hasColumns('roles', ['id', 'name']))->toBeTrue();
});

test('role_user pivot table exists', function () {
    expect(\Illuminate\Support\Facades\Schema::hasTable('role_user'))->toBeTrue();
});

test('user can be assigned a role', function () {
    Role::create(['name' => Role::BUYER]);
    $user = User::factory()->create();

    $user->assignRole(Role::BUYER);

    expect($user->hasRole(Role::BUYER))->toBeTrue();
});

test('user can have multiple roles simultaneously', function () {
    Role::create(['name' => Role::BUYER]);
    Role::create(['name' => Role::SELLER]);
    $user = User::factory()->create();

    $user->assignRole(Role::BUYER);
    $user->assignRole(Role::SELLER);

    expect($user->hasRole(Role::BUYER))->toBeTrue();
    expect($user->hasRole(Role::SELLER))->toBeTrue();
    expect($user->hasRole(Role::ADMIN))->toBeFalse();
});

test('assigning the same role twice does not duplicate the pivot entry', function () {
    Role::create(['name' => Role::BUYER]);
    $user = User::factory()->create();

    $user->assignRole(Role::BUYER);
    $user->assignRole(Role::BUYER);

    expect($user->roles()->count())->toBe(1);
});

test('hasRole returns false for a role the user does not have', function () {
    Role::create(['name' => Role::ADMIN]);
    $user = User::factory()->create();

    expect($user->hasRole(Role::ADMIN))->toBeFalse();
});

test('roles relationship is accessible on the user model', function () {
    $role = Role::create(['name' => Role::SELLER]);
    $user = User::factory()->create();
    $user->roles()->attach($role);

    expect($user->fresh()->roles)->toHaveCount(1);
    expect($user->fresh()->roles->first()->name)->toBe(Role::SELLER);
});

test('deleting a user cascades to role_user pivot', function () {
    Role::create(['name' => Role::BUYER]);
    $user = User::factory()->create();
    $user->assignRole(Role::BUYER);

    $userId = $user->id;
    $user->delete();

    expect(\Illuminate\Support\Facades\DB::table('role_user')->where('user_id', $userId)->exists())->toBeFalse();
});

// ─────────────────────────────────────────────
// ROLE SEEDER
// ─────────────────────────────────────────────

test('role seeder creates the default roles', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);

    expect(Role::where('name', Role::BUYER)->exists())->toBeTrue();
    expect(Role::where('name', Role::SELLER)->exists())->toBeTrue();
    expect(Role::where('name', Role::ADMIN)->exists())->toBeTrue();
    expect(Role::where('name', Role::MODERATOR)->exists())->toBeTrue();
});

test('role seeder is idempotent and does not create duplicates', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);
    $this->seed(\Database\Seeders\RoleSeeder::class);

    expect(Role::count())->toBe(count(Role::names()));
});
