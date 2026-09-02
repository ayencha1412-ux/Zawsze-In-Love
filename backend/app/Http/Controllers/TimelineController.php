<?php

namespace App\Http\Controllers;

use App\Models\TimelineEvent;
use App\Models\TimelineFile;
use App\Support\Zawsze;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TimelineController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        $validated = $request->validate([
            'type' => ['nullable', 'string', 'max:40'],
            'favorite' => ['nullable', 'boolean'],
        ]);
        $query = TimelineEvent::where('space_id', $space->id)->with(['creator:id,name', 'files']);
        if (! empty($validated['type'])) $query->where('event_type', $validated['type']);
        if ($request->boolean('favorite')) $query->whereHas('favorites', fn ($q) => $q->where('users.id', $request->user()->id));
        $items = $query->orderByRaw('event_date IS NULL')->orderByDesc('event_date')->orderByDesc('id')->get();
        return response()->json($items->map(fn (TimelineEvent $event) => $this->payload($request, $event))->values());
    }

    public function store(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        $maxKb = (int) config('zawsze.upload_max_kb', 51200);
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:140'],
            'eventDate' => ['nullable', 'date'],
            'eventType' => ['nullable', Rule::in(['memory', 'first', 'date', 'trip', 'anniversary', 'achievement'])],
            'description' => ['nullable', 'string', 'max:1800'],
            'isFavorite' => ['nullable'],
            'isLocked' => ['nullable'],
            'photos' => ['nullable', 'array', 'max:20'],
            'photos.*' => ['file', "max:{$maxKb}"],
        ]);
        foreach ($request->file('photos', []) as $file) {
            if (! str_starts_with((string) $file->getMimeType(), 'image/')) throw ValidationException::withMessages(['photos' => ['Timeline attachments must be images.']]);
        }
        $event = DB::transaction(function () use ($request, $space, $validated) {
            $event = TimelineEvent::create([
                'space_id' => $space->id,
                'created_by_user_id' => $request->user()->id,
                'title' => trim($validated['title']),
                'event_date' => ! empty($validated['eventDate']) ? Carbon::parse($validated['eventDate']) : null,
                'event_type' => $validated['eventType'] ?? 'memory',
                'description' => $validated['description'] ?? null,
                'is_locked' => filter_var($request->input('isLocked', false), FILTER_VALIDATE_BOOLEAN),
            ]);
            foreach ($request->file('photos', []) as $file) {
                $path = $file->store("spaces/{$space->id}/timeline/{$event->id}", 'private');
                TimelineFile::create(['timeline_event_id' => $event->id, 'storage_disk' => 'private', 'storage_path' => $path, 'original_name' => $file->getClientOriginalName(), 'mime_type' => $file->getMimeType(), 'size_bytes' => $file->getSize()]);
            }
            if (filter_var($request->input('isFavorite', false), FILTER_VALIDATE_BOOLEAN)) $event->favorites()->attach($request->user()->id);
            return $event->load(['creator:id,name', 'files']);
        });
        Zawsze::notifyPartner($space, $request->user(), 'timeline.created', $request->user()->name.' added “'.$event->title.'” to your timeline.', ['timelineId' => $event->id]);
        return response()->json($this->payload($request, $event), 201);
    }

    public function update(Request $request, TimelineEvent $timeline): JsonResponse
    {
        $this->authorizeEvent($request, $timeline);
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:140'],
            'eventDate' => ['sometimes', 'nullable', 'date'],
            'eventType' => ['sometimes', Rule::in(['memory', 'first', 'date', 'trip', 'anniversary', 'achievement'])],
            'description' => ['sometimes', 'nullable', 'string', 'max:1800'],
            'isFavorite' => ['sometimes', 'boolean'],
            'isLocked' => ['sometimes', 'boolean'],
        ]);
        if (array_key_exists('title', $validated)) $timeline->title = trim($validated['title']);
        if (array_key_exists('eventDate', $validated)) $timeline->event_date = $validated['eventDate'] ? Carbon::parse($validated['eventDate']) : null;
        if (array_key_exists('eventType', $validated)) $timeline->event_type = $validated['eventType'];
        if (array_key_exists('description', $validated)) $timeline->description = $validated['description'];
        if (array_key_exists('isLocked', $validated)) $timeline->is_locked = $validated['isLocked'];
        $timeline->save();
        if (array_key_exists('isFavorite', $validated)) {
            if ($validated['isFavorite']) $timeline->favorites()->syncWithoutDetaching([$request->user()->id]);
            else $timeline->favorites()->detach($request->user()->id);
        }
        return response()->json($this->payload($request, $timeline->fresh(['creator:id,name', 'files'])));
    }

    public function destroy(Request $request, TimelineEvent $timeline): JsonResponse
    {
        $this->authorizeEvent($request, $timeline);
        foreach ($timeline->files as $file) Storage::disk($file->storage_disk)->delete($file->storage_path);
        $timeline->delete();
        return response()->json(['ok' => true]);
    }

    public function media(TimelineFile $file)
    {
        abort_unless(Storage::disk($file->storage_disk)->exists($file->storage_path), 404);
        return Storage::disk($file->storage_disk)->response($file->storage_path, $file->original_name, ['Content-Type' => $file->mime_type, 'Cache-Control' => 'private, max-age=1200']);
    }

    private function authorizeEvent(Request $request, TimelineEvent $timeline): void
    {
        $space = $request->attributes->get('zawsze_space');
        abort_unless((int) $timeline->space_id === (int) $space->id, 404);
    }

    public function payload(Request $request, TimelineEvent $event): array
    {
        $space = $request->attributes->get('zawsze_space');
        $locked = $event->is_locked && ! Zawsze::unlocked($request->user(), $space);
        return [
            'id' => $event->id,
            'title' => $locked ? 'Locked moment' : $event->title,
            'eventDate' => optional($event->event_date)->format('Y-m-d'),
            'event_date' => optional($event->event_date)->format('Y-m-d'),
            'eventType' => $event->event_type,
            'description' => $locked ? null : $event->description,
            'isLocked' => (bool) $event->is_locked,
            'locked' => $locked,
            'isFavorite' => $event->favorites()->where('users.id', $request->user()->id)->exists(),
            'createdBy' => $event->creator ? ['id' => $event->creator->id, 'name' => $event->creator->name] : null,
            'files' => $locked ? [] : $event->files->map(fn (TimelineFile $file) => ['id' => $file->id, 'url' => Zawsze::signed('api.timeline.media', ['file' => $file->id])])->values(),
            'createdAt' => optional($event->created_at)->toISOString(),
        ];
    }
}
