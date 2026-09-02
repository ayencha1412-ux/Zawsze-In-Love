<?php

namespace App\Http\Controllers;

use App\Support\Zawsze;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:60'],
            'currentPassword' => ['nullable', 'string'],
            'newPassword' => ['nullable', 'string', 'min:6', 'max:200'],
        ]);

        $user = $request->user();

        if (! empty($validated['newPassword'])) {
            if (! Hash::check((string) ($validated['currentPassword'] ?? ''), $user->password)) {
                throw ValidationException::withMessages([
                    'currentPassword' => ['Your current password is incorrect.'],
                ]);
            }
            $user->password = $validated['newPassword'];
        }

        if (array_key_exists('name', $validated)) {
            $user->name = trim($validated['name']);
        }

        $user->save();
        return response()->json(['ok' => true]);
    }

    public function avatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:8192'],
        ]);

        $user = $request->user();
        if ($user->avatar_path) {
            Storage::disk('private')->delete($user->avatar_path);
        }

        $user->avatar_path = $request->file('avatar')->store("avatars/{$user->id}", 'private');
        $user->save();

        return response()->json([
            'ok' => true,
            'avatarUrl' => Zawsze::signed('api.avatar', ['user' => $user->id]),
        ]);
    }
}
