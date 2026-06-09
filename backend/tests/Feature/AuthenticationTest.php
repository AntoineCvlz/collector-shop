<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Laravel\Passport\Passport;

// La base de test est réinitialisée à chaque test (RefreshDatabase) ;
// login() appelle $user->createToken() qui nécessite un personal access client.
beforeEach(function () {
    $this->artisan('passport:client', [
        '--personal' => true,
        '--name' => 'Test Personal Access Client',
        '--no-interaction' => true,
    ]);
});

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

test('register creates a new user and returns 201', function () {
    $response = $this->postJson(route('register'), [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'response_code' => 201,
            'status' => 'success',
            'message' => 'Successfully registered',
        ]);

    $this->assertDatabaseHas('users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);
});

test('register hashes the password', function () {
    $this->postJson(route('register'), [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'password123',
    ])->assertStatus(201);

    $user = User::where('email', 'jane@example.com')->first();

    expect($user)->not->toBeNull();
    expect($user->password)->not->toBe('password123');
    expect(Hash::check('password123', $user->password))->toBeTrue();
});

test('register fails validation with missing fields', function () {
    $this->postJson(route('register'), [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

test('register fails with a name shorter than 4 characters', function () {
    $this->postJson(route('register'), [
        'name' => 'Jo',
        'email' => 'jo@example.com',
        'password' => 'password123',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('register fails with an invalid email', function () {
    $this->postJson(route('register'), [
        'name' => 'John Doe',
        'email' => 'not-an-email',
        'password' => 'password123',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('register fails with a password shorter than 8 characters', function () {
    $this->postJson(route('register'), [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'short',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

test('register fails when the email is already taken', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson(route('register'), [
        'name' => 'John Doe',
        'email' => 'taken@example.com',
        'password' => 'password123',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

test('login succeeds with valid credentials and returns a token', function () {
    User::factory()->create([
        'email' => 'login@example.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->postJson(route('login'), [
        'email' => 'login@example.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Login successful',
        ])
        ->assertJsonStructure([
            'user_info' => ['id', 'name', 'email'],
            'token',
        ]);
});

test('login fails with an incorrect password', function () {
    User::factory()->create([
        'email' => 'login@example.com',
        'password' => Hash::make('password123'),
    ]);

    $this->postJson(route('login'), [
        'email' => 'login@example.com',
        'password' => 'wrong-password',
    ])->assertStatus(401)
        ->assertJson([
            'response_code' => 401,
            'status' => 'error',
            'message' => 'Unauthorized',
        ]);
});

test('login fails for a non-existent user', function () {
    $this->postJson(route('login'), [
        'email' => 'ghost@example.com',
        'password' => 'password123',
    ])->assertStatus(401);
});

test('login fails validation with missing fields', function () {
    $this->postJson(route('login'), [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'password']);
});

// ─────────────────────────────────────────────
// USER INFO (route protégée)
// ─────────────────────────────────────────────

test('user info returns the paginated user list when authenticated', function () {
    User::factory()->count(3)->create();
    Passport::actingAs(User::factory()->create(), ['*'], 'api');

    $response = $this->getJson(route('get-user'));

    $response->assertStatus(200)
        ->assertJson([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Fetched user list successfully',
        ])
        ->assertJsonStructure([
            'data_user_list' => ['data', 'current_page', 'total'],
        ]);
});

test('user info is rejected when not authenticated', function () {
    $this->getJson(route('get-user'))->assertStatus(401);
});

// ─────────────────────────────────────────────
// LOGOUT (route protégée)
// ─────────────────────────────────────────────

test('logout succeeds and revokes tokens when authenticated', function () {
    Passport::actingAs(User::factory()->create(), ['*'], 'api');

    $this->postJson(route('logout'))
        ->assertStatus(200)
        ->assertJson([
            'response_code' => 200,
            'status' => 'success',
            'message' => 'Successfully logged out',
        ]);
});

test('logout is rejected when not authenticated', function () {
    $this->postJson(route('logout'))->assertStatus(401);
});

// ─────────────────────────────────────────────
// ROUTE PUBLIQUE
// ─────────────────────────────────────────────

test('hello world endpoint returns a message', function () {
    $this->getJson('/api/hello-world')
        ->assertStatus(200)
        ->assertJson(['message' => 'Hello World']);
});

// ─────────────────────────────────────────────
// CAS D'ERREUR 500 (blocs catch)
// ─────────────────────────────────────────────

test('register returns 500 when an unexpected error occurs', function () {
    // Hash::make est appelé dans le try : on le force à lever une exception.
    Hash::shouldReceive('make')->andThrow(new \RuntimeException('boom'));

    $this->postJson(route('register'), [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'password123',
    ])->assertStatus(500)
        ->assertJson([
            'response_code' => 500,
            'status' => 'error',
            'message' => 'Registration failed',
        ]);
});

test('login returns 500 when an unexpected error occurs', function () {
    Auth::shouldReceive('attempt')->andThrow(new \RuntimeException('boom'));

    $this->postJson(route('login'), [
        'email' => 'login@example.com',
        'password' => 'password123',
    ])->assertStatus(500)
        ->assertJson([
            'response_code' => 500,
            'status' => 'error',
            'message' => 'Login failed',
        ]);
});

test('user info returns 500 when the query fails', function () {
    Passport::actingAs(User::factory()->create(), ['*'], 'api');

    // La table n'existe plus → User::latest()->paginate() lève une QueryException.
    Schema::drop('users');

    $this->getJson(route('get-user'))
        ->assertStatus(500)
        ->assertJson([
            'response_code' => 500,
            'status' => 'error',
            'message' => 'Failed to fetch user list',
        ]);
});

test('logout returns 500 when an unexpected error occurs', function () {
    Passport::actingAs(User::factory()->create(), ['*'], 'api');

    // $user->tokens()->delete() est appelé dans le try : sans la table des
    // tokens, la requête lève une QueryException → bloc catch (500).
    // (On ne mocke pas la façade Auth pour ne pas casser le middleware auth:api.)
    Schema::drop('oauth_access_tokens');

    $this->postJson(route('logout'))
        ->assertStatus(500)
        ->assertJson([
            'response_code' => 500,
            'status' => 'error',
            'message' => 'An error occurred during logout',
        ]);
});
