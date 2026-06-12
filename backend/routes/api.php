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

    // ------------------ Public catalogue -----------------//
    Route::get('categories', 'CategoryController@index')->name('categories.index');
    Route::get('categories/{category}', 'CategoryController@show')->name('categories.show')->whereNumber('category');

    Route::get('articles', 'ArticleController@index')->name('articles.index');
    Route::get('articles/{article}', 'ArticleController@show')->name('articles.show')->whereNumber('article');

    // ------------------ Authenticated -------------------//
    Route::middleware('auth:api')->group(function () {
        // Current user profile (own data only).
        Route::get('me', 'AuthenticationController@me')->name('me');
        Route::put('profile', 'AuthenticationController@updateProfile')->name('profile.update');
        Route::post('logout', 'AuthenticationController@logOut')->name('logout');

        // --------------------- Seller -------------------//
        Route::get('my/articles', 'ArticleController@mine')->name('articles.mine')->middleware('role:seller');
        Route::post('articles', 'ArticleController@store')->name('articles.store')->middleware('role:seller');
        Route::put('articles/{article}', 'ArticleController@update')->name('articles.update')->whereNumber('article');
        Route::delete('articles/{article}', 'ArticleController@destroy')->name('articles.destroy')->whereNumber('article');

        // ---------------- Admin / Moderation ------------//
        Route::middleware('role:admin')->group(function () {
            Route::get('users', 'AuthenticationController@usersList')->name('users.index');

            Route::post('categories', 'CategoryController@store')->name('categories.store');
            Route::put('categories/{category}', 'CategoryController@update')->name('categories.update')->whereNumber('category');
            Route::delete('categories/{category}', 'CategoryController@destroy')->name('categories.destroy')->whereNumber('category');
        });

        Route::middleware('role:admin,moderator')->group(function () {
            Route::get('moderation/articles', 'ArticleController@pending')->name('articles.pending');
            Route::patch('articles/{article}/approve', 'ArticleController@approve')->name('articles.approve')->whereNumber('article');
            Route::patch('articles/{article}/reject', 'ArticleController@reject')->name('articles.reject')->whereNumber('article');
        });
    });
});
