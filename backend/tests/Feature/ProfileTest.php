<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Passport\Passport;

beforeEach(function () {
    Role::create(['name' => Role::BUYER]);
});

test('a user can update their name', function () {
    $user = User::factory()->create(['name' => 'Old Name']);
    Passport::actingAs($user, ['*'], 'api');

    $this->putJson(route('profile.update'), ['name' => 'New Name'])
        ->assertStatus(200)
        ->assertJson([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Profile updated successfully',
        ])
        ->assertJsonPath('user_info.name', 'New Name');

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'name' => 'New Name',
    ]);
});

test('a user can update their email', function () {
    $user = User::factory()->create(['email' => 'old@example.com']);
    Passport::actingAs($user, ['*'], 'api');

    $this->putJson(route('profile.update'), ['email' => 'new@example.com'])
        ->assertStatus(200)
        ->assertJsonPath('user_info.email', 'new@example.com');

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'email' => 'new@example.com',
    ]);
});

test('updating the password rehashes it', function () {
    $user = User::factory()->create(['password' => Hash::make('oldpassword')]);
    Passport::actingAs($user, ['*'], 'api');

    $this->putJson(route('profile.update'), ['password' => 'brandnewpassword'])
        ->assertStatus(200);

    $fresh = $user->fresh();
    expect(Hash::check('brandnewpassword', $fresh->password))->toBeTrue();
});

test('the profile response exposes the user roles', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::BUYER);
    Passport::actingAs($user, ['*'], 'api');

    $this->putJson(route('profile.update'), ['name' => 'Whatever'])
        ->assertStatus(200)
        ->assertJsonPath('user_info.roles', [Role::BUYER]);
});

test('a user cannot take another users email', function () {
    User::factory()->create(['email' => 'taken@example.com']);
    $user = User::factory()->create();
    Passport::actingAs($user, ['*'], 'api');

    $this->putJson(route('profile.update'), ['email' => 'taken@example.com'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('a user can keep their own email when updating other fields', function () {
    $user = User::factory()->create(['email' => 'mine@example.com']);
    Passport::actingAs($user, ['*'], 'api');

    $this->putJson(route('profile.update'), [
        'name' => 'Updated',
        'email' => 'mine@example.com',
    ])->assertStatus(200);
});

test('profile update validates a too-short name', function () {
    $user = User::factory()->create();
    Passport::actingAs($user, ['*'], 'api');

    $this->putJson(route('profile.update'), ['name' => 'ab'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('profile update is rejected when not authenticated', function () {
    $this->putJson(route('profile.update'), ['name' => 'Nope'])
        ->assertStatus(401);
});

test('profile update returns 500 when persistence fails', function () {
    $user = User::factory()->create();
    Passport::actingAs($user, ['*'], 'api');

    User::saving(fn () => throw new \RuntimeException('boom'));

    $this->putJson(route('profile.update'), ['name' => 'Crash'])
        ->assertStatus(500)
        ->assertJson([
            'response_code' => 500,
            'status' => 'error',
            'message' => 'Failed to update profile',
        ]);
});
