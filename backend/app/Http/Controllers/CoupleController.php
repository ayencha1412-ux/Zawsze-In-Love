<?php

namespace App\Http\Controllers;

use App\Support\Zawsze;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CoupleController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:100'],
            'relationshipStart' => ['nullable', 'date'],
        ]);

        $space = $request->attributes->get('zawsze_space');
        if (array_key_exists('name', $validated)) {
            $space->name = trim($validated['name']);
        }
        if (array_key_exists('relationshipStart', $validated)) {
            $space->relationship_start = $validated['relationshipStart'] ?: null;
        }
        $space->save();

        Zawsze::notifyPartner($space, $request->user(), 'couple.updated', $request->user()->name.' updated your relationship settings.');
        return response()->json(['ok' => true]);
    }

    public function pin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin' => ['present', 'nullable', 'regex:/^$|^[0-9]{4,8}$/'],
        ]);
        $space = $request->attributes->get('zawsze_space');
        $pin = (string) ($validated['pin'] ?? '');
        $space->pin_hash = $pin === '' ? null : Hash::make($pin);
        $space->save();

        if ($pin === '') {
            \App\Models\User::whereIn('id', $space->users()->pluck('users.id'))->update(['pin_unlocked_until' => null]);
        }

        return response()->json(['ok' => true, 'hasPin' => (bool) $space->pin_hash]);
    }

    public function unlock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin' => ['required', 'string'],
        ]);
        $space = $request->attributes->get('zawsze_space');

        if (! $space->pin_hash || ! Hash::check($validated['pin'], $space->pin_hash)) {
            throw ValidationException::withMessages(['pin' => ['That PIN is incorrect.']]);
        }

        $user = $request->user();
        $user->pin_unlocked_until = now()->addMinutes(15);
        $user->save();
        return response()->json(['ok' => true, 'unlockedUntil' => $user->pin_unlocked_until->toISOString()]);
    }

    public function lock(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->pin_unlocked_until = null;
        $user->save();
        return response()->json(['ok' => true]);
    }
}
