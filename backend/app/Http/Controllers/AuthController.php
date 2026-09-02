<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Zawsze;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', mb_strtolower($credentials['email']))->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->spaces()->exists()) {
            abort(403, 'This account is not connected to the Zawsze shared space.');
        }

        $user->tokens()->where('name', 'zawsze-web')->delete();
        $token = $user->createToken('zawsze-web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $space = $request->attributes->get('zawsze_space');
        $space->load('users');
        $ownerId = $space->users->min('id');

        return response()->json([
            'user' => $this->userPayload($user),
            'couple' => [
                'id' => $space->id,
                'name' => $space->name,
                'relationshipStart' => optional($space->relationship_start)->format('Y-m-d'),
                'hasPin' => (bool) $space->pin_hash,
                'unlocked' => Zawsze::unlocked($user, $space),
                'members' => $space->users->map(fn (User $member) => $this->userPayload($member))->values(),
            ],
            'role' => (int) $user->id === (int) $ownerId ? 'owner' : 'partner',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['ok' => true]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatarUrl' => $user->avatar_path
                ? Zawsze::signed('api.avatar', ['user' => $user->id])
                : null,
        ];
    }
}
