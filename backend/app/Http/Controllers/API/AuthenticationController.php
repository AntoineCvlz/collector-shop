<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthenticationController extends Controller
{
    /**
     * Register a new account. Every new account is a buyer by default;
     * the seller role is granted later (see Feature 2).
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $user = new User;
            $user->name = $request->string('name')->value();
            $user->email = $request->string('email')->value();
            $user->password = Hash::make($request->string('password')->value());
            $user->save();

            Role::firstOrCreate(['name' => Role::DEFAULT]);
            $user->assignRole(Role::DEFAULT);

            return response()->json([
                'response_code' => 201,
                'status' => 'success',
                'message' => 'Successfully registered',
                'user_info' => $this->userPayload($user),
            ], 201);

        } catch (\Exception $e) {
            Log::error('Registration Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Registration failed',
            ], 500);
        }
    }

    /**
     * Login request.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $user = Auth::attempt(['email' => $request->email, 'password' => $request->password])
                ? Auth::user()
                : null;

            if ($user instanceof User) {
                if ($user->isBanned()) {
                    return response()->json([
                        'response_code' => 403,
                        'status' => 'error',
                        'message' => 'This account has been banned',
                    ], 403);
                }

                $accessToken = $user->createToken('authToken')->accessToken;

                return response()->json([
                    'response_code' => 200,
                    'status' => 'success',
                    'message' => 'Login successful',
                    'user_info' => $this->userPayload($user),
                    'token' => $accessToken,
                ]);
            }

            return response()->json([
                'response_code' => 401,
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);

        } catch (\Exception $e) {
            Log::error('Login Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Login failed',
            ], 500);
        }
    }

    /**
     * Return the currently authenticated user and their roles.
     */
    public function me(): JsonResponse
    {
        try {
            $user = Auth::user();

            if (! $user instanceof User) {
                return response()->json([
                    'response_code' => 401,
                    'status' => 'error',
                    'message' => 'User not authenticated',
                ], 401);
            }

            return response()->json([
                'response_code' => 200,
                'status' => 'success',
                'message' => 'Fetched current user successfully',
                'user_info' => $this->userPayload($user),
            ]);
        } catch (\Exception $e) {
            Log::error('Current User Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to fetch current user',
            ], 500);
        }
    }

    /**
     * Update the authenticated user's own profile.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();

            if ($request->has('name')) {
                $user->name = $request->string('name')->value();
            }
            if ($request->has('email')) {
                $user->email = $request->string('email')->value();
            }
            if ($request->has('password')) {
                $user->password = Hash::make($request->string('password')->value());
            }

            $user->save();

            return response()->json([
                'response_code' => 200,
                'status' => 'success',
                'message' => 'Profile updated successfully',
                'user_info' => $this->userPayload($user->fresh() ?? $user),
            ]);
        } catch (\Exception $e) {
            Log::error('Profile Update Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to update profile',
            ], 500);
        }
    }

    /**
     * Paginated list of all users (admin only).
     */
    public function usersList(): JsonResponse
    {
        try {
            $users = User::with('roles')->latest()->paginate(10);

            return response()->json([
                'response_code' => 200,
                'status' => 'success',
                'message' => 'Fetched user list successfully',
                'data_user_list' => $users,
            ]);
        } catch (\Exception $e) {
            Log::error('User List Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'Failed to fetch user list',
            ], 500);
        }
    }

    /**
     * Logout the user and revoke token.
     */
    public function logOut(): JsonResponse
    {
        try {
            $user = Auth::user();

            if ($user instanceof User) {
                $user->tokens()->delete();

                return response()->json([
                    'response_code' => 200,
                    'status' => 'success',
                    'message' => 'Successfully logged out',
                ]);
            }

            return response()->json([
                'response_code' => 401,
                'status' => 'error',
                'message' => 'User not authenticated',
            ], 401);
        } catch (\Exception $e) {
            Log::error('Logout Error: '.$e->getMessage());

            return response()->json([
                'response_code' => 500,
                'status' => 'error',
                'message' => 'An error occurred during logout',
            ], 500);
        }
    }

    /**
     * Public-safe representation of a user.
     *
     * @return array{id: int, name: string, email: string, roles: list<string>}
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->roleNames(),
        ];
    }
}
