<?php

use App\Models\User;

test('user has the expected fillable attributes', function () {
    $user = new User;

    expect($user->getFillable())->toBe(['name', 'email', 'password']);
});

test('user hides sensitive attributes', function () {
    $user = new User;

    expect($user->getHidden())->toContain('password', 'remember_token');
});

test('user casts the password as hashed and email_verified_at as datetime', function () {
    $user = new User;
    $casts = $user->getCasts();

    expect($casts['password'])->toBe('hashed');
    expect($casts['email_verified_at'])->toBe('datetime');
});
