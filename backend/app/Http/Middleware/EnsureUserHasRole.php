<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Ensure the authenticated user owns at least one of the given roles.
     *
     * Usage: ->middleware('role:admin') or ->middleware('role:seller,admin')
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $this->deny('Unauthenticated.', 401);
        }

        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        return $this->deny('This action is unauthorized.', 403);
    }

    private function deny(string $message, int $status): JsonResponse
    {
        return response()->json([
            'response_code' => $status,
            'status' => 'error',
            'message' => $message,
        ], $status);
    }
}
