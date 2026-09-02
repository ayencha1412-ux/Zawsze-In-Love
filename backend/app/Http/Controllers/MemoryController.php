<?php

namespace App\Http\Controllers;

use App\Models\Album;
use App\Models\Memory;
use App\Services\MediaPreviewService;
use App\Services\MediaResponseService;
use App\Support\Zawsze;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class MemoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        $user = $request->user();
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'albumId' => ['nullable', 'integer'],
            'favorite' => ['nullable', 'boolean'],
            'type' => ['nullable', Rule::in(['all', 'image', 'video', 'photos', 'videos'])],
            'sort' => ['nullable', Rule::in(['newest', 'oldest'])],
            'perPage' => ['nullable', 'integer', 'min:12', 'max:48'],
            'cursor' => ['nullable', 'string', 'max:500'],
        ]);

        $query = Memory::query()
            ->with(['uploader:id,name', 'album:id,name'])
            ->withCount('comments')
            ->withExists([
                'favorites as is_favorite' => fn ($favoriteQuery) => $favoriteQuery->where('users.id', $user->id),
            ])
            ->where('space_id', $space->id);

        if (! empty($validated['q'])) {
            $term = '%'.str_replace(['%', '_'], ['\\%', '\\_'], trim($validated['q'])).'%';
            $query->where(fn ($q) => $q
                ->where('caption', 'like', $term)
                ->orWhere('description', 'like', $term)
                ->orWhere('location', 'like', $term));
        }

        if (! empty($validated['albumId'])) {
            $query->where('album_id', $validated['albumId']);
        }

        if ($request->boolean('favorite')) {
            $query->whereHas('favorites', fn ($q) => $q->where('users.id', $user->id));
        }

        $type = $validated['type'] ?? 'all';
        if (in_array($type, ['image', 'photos'], true)) {
            $query->where('media_type', 'image');
        }
        if (in_array($type, ['video', 'videos'], true)) {
            $query->where('media_type', 'video');
        }

        $direction = ($validated['sort'] ?? 'newest') === 'oldest' ? 'asc' : 'desc';
        $pageSize = (int) ($validated['perPage'] ?? config('zawsze.gallery_page_size', 24));
        $pageSize = max(12, min(48, $pageSize));

        $paginator = $query
            ->orderBy('taken_at', $direction)
            ->orderBy('id', $direction)
            ->cursorPaginate($pageSize, ['*'], 'cursor', $validated['cursor'] ?? null);

        return response()->json([
            'items' => $paginator->getCollection()
                ->map(fn (Memory $memory) => $this->payload($request, $memory))
                ->values(),
            'nextCursor' => $paginator->nextCursor()?->encode(),
            'hasMore' => $paginator->hasMorePages(),
        ]);
    }

    public function show(Request $request, Memory $memory): JsonResponse
    {
        $this->authorizeMemory($request, $memory);
        $memory->load(['uploader:id,name', 'album:id,name', 'comments.user:id,name']);
        $memory->loadCount('comments');

        return response()->json($this->payload($request, $memory, true));
    }

    public function store(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        $maxFiles = (int) config('zawsze.upload_max_files', 50);
        $maxKb = (int) config('zawsze.upload_max_kb', 51200);
        $allowedMimes = config('zawsze.allowed_mimes', []);
        $storageDisk = (string) config('zawsze.media_disk', 'media');

        $request->validate([
            'photos' => ['required', 'array', 'min:1', "max:{$maxFiles}"],
            'photos.*' => ['required', 'file', "max:{$maxKb}"],
            'previews' => ['nullable', 'array', "max:{$maxFiles}"],
            'previews.*' => ['nullable', 'file', 'max:3072', 'mimetypes:image/webp,image/jpeg,image/png'],
            'previewIndexes' => ['nullable', 'array', "max:{$maxFiles}"],
            'previewIndexes.*' => ['nullable', 'integer', 'min:0'],
            'fileDates' => ['nullable', 'array'],
            'fileDates.*' => ['nullable', 'date'],
            'caption' => ['nullable', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:2000'],
            'memoryDate' => ['nullable', 'date'],
            'location' => ['nullable', 'string', 'max:160'],
            'albumId' => ['nullable', 'integer'],
            'isFavorite' => ['nullable'],
            'isLocked' => ['nullable'],
        ]);

        $files = $request->file('photos', []);
        foreach ($files as $file) {
            if (! in_array($file->getMimeType(), $allowedMimes, true)) {
                throw ValidationException::withMessages([
                    'photos' => ["Unsupported media type: {$file->getMimeType()}"],
                ]);
            }
        }

        $albumId = $request->filled('albumId') ? (int) $request->input('albumId') : null;
        if ($albumId) {
            abort_unless(
                Album::where('space_id', $space->id)->whereKey($albumId)->exists(),
                422,
                'That album does not belong to this Zawsze space.',
            );
        }

        $previewFiles = $request->file('previews', []);
        $previewIndexes = $request->input('previewIndexes', []);
        $previewsByIndex = [];
        foreach ($previewFiles as $position => $previewFile) {
            $fileIndex = (int) ($previewIndexes[$position] ?? -1);
            if ($fileIndex >= 0 && array_key_exists($fileIndex, $files)) {
                $previewsByIndex[$fileIndex] = $previewFile;
            }
        }

        $fileDates = $request->input('fileDates', []);
        $favorite = filter_var($request->input('isFavorite', false), FILTER_VALIDATE_BOOLEAN);
        $locked = filter_var($request->input('isLocked', false), FILTER_VALIDATE_BOOLEAN);
        $fallbackDate = $request->filled('memoryDate')
            ? Carbon::parse($request->input('memoryDate'))
            : now();

        $created = DB::transaction(function () use (
            $request,
            $space,
            $files,
            $fileDates,
            $albumId,
            $favorite,
            $locked,
            $fallbackDate,
            $storageDisk,
            $previewsByIndex,
        ) {
            return collect($files)->map(function ($file, $index) use (
                $request,
                $space,
                $fileDates,
                $albumId,
                $favorite,
                $locked,
                $fallbackDate,
                $storageDisk,
                $previewsByIndex,
            ) {
                $mime = $file->getMimeType();
                $mediaType = str_starts_with($mime, 'video/') ? 'video' : 'image';
                $takenAt = ! empty($fileDates[$index])
                    ? Carbon::parse($fileDates[$index])
                    : $fallbackDate->copy();

                $path = $file->store("spaces/{$space->id}/memories", $storageDisk);
                $thumbnailPath = isset($previewsByIndex[$index])
                    ? $previewsByIndex[$index]->store("spaces/{$space->id}/previews", $storageDisk)
                    : null;

                $sourceKey = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $preset = config('memory_captions.'.$sourceKey, []);
                $captionInput = trim((string) $request->input('caption', ''));
                $descriptionInput = trim((string) $request->input('description', ''));
                $caption = $captionInput !== '' ? $captionInput : ($preset['title'] ?? $sourceKey);
                $description = $descriptionInput !== '' ? $descriptionInput : ($preset['description'] ?? null);

                $memory = Memory::create([
                    'space_id' => $space->id,
                    'album_id' => $albumId,
                    'uploaded_by_user_id' => $request->user()->id,
                    'media_type' => $mediaType,
                    'storage_disk' => $storageDisk,
                    'storage_path' => $path,
                    'thumbnail_path' => $thumbnailPath,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $mime,
                    'size_bytes' => $file->getSize(),
                    'caption' => $caption,
                    'description' => $description,
                    'location' => $request->input('location') ?: null,
                    'is_locked' => $locked,
                    'taken_at' => $takenAt,
                ]);

                if ($favorite) {
                    $memory->favorites()->attach($request->user()->id);
                }

                return $memory->load(['uploader:id,name', 'album:id,name'])->loadCount('comments');
            });
        });

        $count = $created->count();
        Zawsze::notifyPartner(
            $space,
            $request->user(),
            'memory.created',
            $request->user()->name.' added '.$count.' '.($count === 1 ? 'memory' : 'memories').'.',
        );

        return response()->json([
            'created' => $created
                ->map(fn ($memory) => $this->payload($request, $memory))
                ->values(),
        ], 201);
    }

    public function update(Request $request, Memory $memory): JsonResponse
    {
        $this->authorizeMemory($request, $memory);
        $space = $request->attributes->get('zawsze_space');
        $validated = $request->validate([
            'caption' => ['sometimes', 'nullable', 'string', 'max:180'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'memoryDate' => ['sometimes', 'nullable', 'date'],
            'taken_at' => ['sometimes', 'nullable', 'date'],
            'location' => ['sometimes', 'nullable', 'string', 'max:160'],
            'albumId' => ['sometimes', 'nullable', 'integer'],
            'isFavorite' => ['sometimes', 'boolean'],
            'isLocked' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('albumId', $validated) && $validated['albumId']) {
            abort_unless(
                Album::where('space_id', $space->id)->whereKey($validated['albumId'])->exists(),
                422,
            );
        }

        if (array_key_exists('caption', $validated)) {
            $memory->caption = $validated['caption'];
        }
        if (array_key_exists('description', $validated)) {
            $memory->description = $validated['description'];
        }
        if (array_key_exists('location', $validated)) {
            $memory->location = $validated['location'];
        }
        if (array_key_exists('albumId', $validated)) {
            $memory->album_id = $validated['albumId'] ?: null;
        }
        if (array_key_exists('isLocked', $validated)) {
            $memory->is_locked = $validated['isLocked'];
        }
        if (array_key_exists('memoryDate', $validated)) {
            $memory->taken_at = $validated['memoryDate']
                ? Carbon::parse($validated['memoryDate'])
                : now();
        }
        if (array_key_exists('taken_at', $validated)) {
            $memory->taken_at = $validated['taken_at']
                ? Carbon::parse($validated['taken_at'])
                : now();
        }
        $memory->save();

        if (array_key_exists('isFavorite', $validated)) {
            if ($validated['isFavorite']) {
                $memory->favorites()->syncWithoutDetaching([$request->user()->id]);
            } else {
                $memory->favorites()->detach($request->user()->id);
            }
        }

        return response()->json($this->payload(
            $request,
            $memory->fresh(['uploader:id,name', 'album:id,name'])->loadCount('comments'),
        ));
    }

    public function destroy(Request $request, Memory $memory): JsonResponse
    {
        $this->authorizeMemory($request, $memory);
        $disk = Storage::disk($memory->storage_disk);
        $disk->delete($memory->storage_path);
        if ($memory->thumbnail_path) {
            $disk->delete($memory->thumbnail_path);
        }
        $memory->delete();

        return response()->json(['ok' => true]);
    }

    public function media(Memory $memory, MediaResponseService $media): Response
    {
        return $media->inline(
            $memory->storage_disk,
            $memory->storage_path,
            $memory->mime_type,
            $memory->original_name,
            7200,
        );
    }

    public function preview(
        Memory $memory,
        MediaPreviewService $previews,
        MediaResponseService $media,
    ): Response {
        $previewPath = $previews->ensurePreview($memory);
        abort_unless($previewPath, 404);

        $mime = str_ends_with(strtolower($previewPath), '.webp') ? 'image/webp' : 'image/jpeg';

        return $media->inline(
            $memory->storage_disk,
            $previewPath,
            $mime,
            'preview-'.$memory->id.'.'.($mime === 'image/webp' ? 'webp' : 'jpg'),
            43200,
        );
    }

    public function download(Memory $memory, MediaResponseService $media): Response
    {
        return $media->download(
            $memory->storage_disk,
            $memory->storage_path,
            $memory->mime_type,
            $memory->original_name,
        );
    }

    public function archivePayload(Request $request, Memory $memory): array
    {
        return $this->payload($request, $memory, false);
    }

    private function authorizeMemory(Request $request, Memory $memory): void
    {
        $space = $request->attributes->get('zawsze_space');
        abort_unless((int) $memory->space_id === (int) $space->id, 404);
    }

    private function payload(Request $request, Memory $memory, bool $withComments = false): array
    {
        $space = $request->attributes->get('zawsze_space');
        $locked = $memory->is_locked && ! Zawsze::unlocked($request->user(), $space);
        $attributes = $memory->getAttributes();
        $favorite = array_key_exists('is_favorite', $attributes)
            ? (bool) $attributes['is_favorite']
            : $memory->favorites()->where('users.id', $request->user()->id)->exists();

        $previewAvailable = $memory->media_type === 'image' || filled($memory->thumbnail_path);
        $file = $locked ? null : [
            'id' => $memory->id,
            'url' => Zawsze::mediaSigned('api.memory.media', ['memory' => $memory->id], 2),
            'thumbnailUrl' => $previewAvailable
                ? Zawsze::mediaSigned('api.memory.preview', ['memory' => $memory->id], 12)
                : null,
            'downloadUrl' => Zawsze::mediaSigned('api.memory.download', ['memory' => $memory->id], 2),
            'mediaType' => $memory->media_type,
            'mimeType' => $memory->mime_type,
            'originalName' => $memory->original_name,
            'sizeBytes' => (int) $memory->size_bytes,
        ];

        $payload = [
            'id' => $memory->id,
            'caption' => $locked ? 'Locked memory' : $memory->caption,
            'description' => $locked ? null : $memory->description,
            'location' => $locked ? null : $memory->location,
            'memoryDate' => optional($memory->taken_at)->format('Y-m-d'),
            'memory_date' => optional($memory->taken_at)->format('Y-m-d'),
            'albumId' => $memory->album_id,
            'albumName' => $memory->album?->name,
            'isFavorite' => $favorite,
            'isLocked' => (bool) $memory->is_locked,
            'locked' => $locked,
            'mediaType' => $memory->media_type,
            'files' => $file ? [$file] : [],
            'commentsCount' => (int) ($memory->comments_count ?? $memory->comments()->count()),
            'uploadedBy' => $memory->uploader
                ? ['id' => $memory->uploader->id, 'name' => $memory->uploader->name]
                : null,
            'createdAt' => optional($memory->created_at)->toISOString(),
        ];

        if ($withComments) {
            $payload['comments'] = $locked ? [] : $memory->comments->map(fn ($comment) => [
                'id' => $comment->id,
                'body' => $comment->body,
                'createdAt' => optional($comment->created_at)->toISOString(),
                'authorId' => $comment->user_id,
                'authorName' => $comment->user->name,
                'mine' => (int) $comment->user_id === (int) $request->user()->id,
            ])->values();
        }

        return $payload;
    }
}
