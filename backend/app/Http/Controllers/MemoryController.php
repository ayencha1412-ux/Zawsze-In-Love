<?php

namespace App\Http\Controllers;

use App\Models\Memory;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MemoryController extends Controller
{
    public function index(Request $request)
    {
        $space = $this->spaceFor($request);
        $filter = $request->string('type')->toString();
        $sort = $request->string('sort', 'newest')->toString();

        $query = Memory::query()
            ->with(['uploader:id,name', 'comments.user:id,name'])
            ->where('space_id', $space->id);

        if (in_array($filter, ['image', 'video'], true)) {
            $query->where('media_type', $filter);
        }

        $direction = $sort === 'oldest' ? 'asc' : 'desc';
        $memories = $query
            ->orderByRaw('CASE WHEN taken_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('taken_at', $direction)
            ->orderBy('id', $direction)
            ->get()
            ->map(fn (Memory $memory) => $this->payload($memory));

        return response()->json(['memories' => $memories]);
    }

    public function bulkStore(Request $request)
    {
        $space = $this->spaceFor($request);

        $validated = $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:100'],
            'files.*' => ['required', 'file', 'max:512000'],
            'file_dates' => ['nullable', 'array'],
            'file_dates.*' => ['nullable', 'date'],
            'caption' => ['nullable', 'string', 'max:500'],
            'fallback_date' => ['nullable', 'date'],
        ]);

        $files = $request->file('files', []);
        $fileDates = $request->input('file_dates', []);
        $storedPaths = [];

        try {
            $created = DB::transaction(function () use ($request, $space, $validated, $files, $fileDates, &$storedPaths) {
                $items = collect();

                foreach ($files as $index => $file) {
                    $mime = (string) $file->getMimeType();
                    $mediaType = str_starts_with($mime, 'video/') ? 'video' : (str_starts_with($mime, 'image/') ? 'image' : null);

                    if (! $mediaType) {
                        throw ValidationException::withMessages([
                            "files.$index" => ['Only image and video files are supported.'],
                        ]);
                    }

                    $extension = $file->guessExtension() ?: $file->getClientOriginalExtension() ?: 'bin';
                    $folder = 'memories/'.now()->format('Y/m');
                    $filename = Str::uuid().'.'.strtolower($extension);
                    $path = $folder.'/'.$filename;
                    Storage::disk('private')->putFileAs($folder, $file, $filename);
                    $storedPaths[] = $path;

                    $dateValue = $fileDates[$index] ?? ($validated['fallback_date'] ?? null);
                    $takenAt = $dateValue ? Carbon::parse($dateValue) : now();

                    $memory = Memory::create([
                        'space_id' => $space->id,
                        'uploaded_by_user_id' => $request->user()->id,
                        'media_type' => $mediaType,
                        'disk' => 'private',
                        'storage_path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $mime,
                        'size_bytes' => $file->getSize(),
                        'caption' => $validated['caption'] ?? null,
                        'taken_at' => $takenAt,
                    ]);

                    $items->push($memory->load(['uploader:id,name', 'comments.user:id,name']));
                }

                return $items;
            });
        } catch (\Throwable $e) {
            foreach ($storedPaths as $path) {
                Storage::disk('private')->delete($path);
            }
            throw $e;
        }

        return response()->json([
            'memories' => $created->map(fn (Memory $memory) => $this->payload($memory)),
        ], 201);
    }

    public function update(Request $request, Memory $memory)
    {
        $this->ensureMemoryAccess($request, $memory);

        $validated = $request->validate([
            'caption' => ['sometimes', 'nullable', 'string', 'max:500'],
            'taken_at' => ['sometimes', 'nullable', 'date'],
        ]);

        $memory->update($validated);
        $memory->load(['uploader:id,name', 'comments.user:id,name']);

        return response()->json(['memory' => $this->payload($memory)]);
    }

    public function destroy(Request $request, Memory $memory)
    {
        $this->ensureMemoryAccess($request, $memory);
        Storage::disk($memory->disk)->delete($memory->storage_path);
        $memory->delete();

        return response()->json(['message' => 'Memory deleted.']);
    }

    private function spaceFor(Request $request)
    {
        $space = $request->user()->spaces()->first();
        abort_unless($space, 403, 'This account is not attached to a Zawsze space.');
        return $space;
    }

    private function ensureMemoryAccess(Request $request, Memory $memory): void
    {
        $space = $this->spaceFor($request);
        abort_unless((int) $memory->space_id === (int) $space->id, 403);
    }

    private function payload(Memory $memory): array
    {
        return [
            'id' => $memory->id,
            'type' => $memory->media_type,
            'title' => $memory->caption ?: pathinfo($memory->original_name, PATHINFO_FILENAME),
            'caption' => $memory->caption,
            'date' => optional($memory->taken_at)->toDateString(),
            'taken_at' => optional($memory->taken_at)->toIso8601String(),
            'original_name' => $memory->original_name,
            'mime_type' => $memory->mime_type,
            'size_bytes' => $memory->size_bytes,
            'uploaded_by' => $memory->uploader ? ['id' => $memory->uploader->id, 'name' => $memory->uploader->name] : null,
            'src' => URL::temporarySignedRoute('memories.media', now()->addMinutes(60), ['memory' => $memory->id]),
            'comments' => $memory->comments->map(fn ($comment) => [
                'id' => $comment->id,
                'author' => $comment->user?->name,
                'body' => $comment->body,
                'createdAt' => $comment->created_at?->toIso8601String(),
                'user_id' => $comment->user_id,
            ])->values(),
        ];
    }
}
