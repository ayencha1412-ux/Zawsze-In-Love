<?php

namespace App\Http\Controllers;

use App\Models\Album;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AlbumController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        $albums = Album::where('space_id', $space->id)->withCount('memories')->orderBy('name')->get();

        return response()->json($albums->map(fn (Album $album) => [
            'id' => $album->id,
            'name' => $album->name,
            'description' => $album->description,
            'memoryCount' => $album->memories_count,
        ])->values());
    }

    public function store(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('albums')->where('space_id', $space->id)],
            'description' => ['nullable', 'string', 'max:600'],
        ]);

        $album = Album::create([
            'space_id' => $space->id,
            'name' => trim($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json(['id' => $album->id, 'name' => $album->name], 201);
    }

    public function update(Request $request, Album $album): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        abort_unless((int) $album->space_id === (int) $space->id, 404);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', Rule::unique('albums')->where('space_id', $space->id)->ignore($album->id)],
            'description' => ['sometimes', 'nullable', 'string', 'max:600'],
        ]);

        $album->fill($validated)->save();
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, Album $album): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        abort_unless((int) $album->space_id === (int) $space->id, 404);
        $album->memories()->update(['album_id' => null]);
        $album->delete();
        return response()->json(['ok' => true]);
    }
}
