<?php

use Illuminate\Support\Facades\Route;

Route::get('/hello-world', function () {
    return response()->json([
        'message' => 'Hello World',
    ]);
});

Route::group(['namespace' => 'App\Http\Controllers\API'], function () {
    // --------------- Register and Login ----------------//
    Route::post('register', 'AuthenticationController@register')->name('register');
    Route::post('login', 'AuthenticationController@login')->name('login');

    // ------------------ Authenticated -------------------//
    Route::middleware('auth:api')->group(function () {
        // Current user profile (own data only).
        Route::get('me', 'AuthenticationController@me')->name('me');
        Route::put('profile', 'AuthenticationController@updateProfile')->name('profile.update');
        Route::post('logout', 'AuthenticationController@logOut')->name('logout');

        // --------------------- Admin --------------------//
        Route::middleware('role:admin')->group(function () {
            Route::get('users', 'AuthenticationController@usersList')->name('users.index');
        });
    });
});
