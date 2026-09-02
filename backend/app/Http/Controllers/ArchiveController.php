<?php

namespace App\Http\Controllers;

use App\Models\Memory;
use App\Models\Note;
use App\Models\TimelineEvent;
use App\Models\ZawszeNotification;
use App\Support\Zawsze;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class ArchiveController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        $user = $request->user();
        $start = $space->relationship_start ? Carbon::parse($space->relationship_start)->startOfDay() : null;
        $relationshipDays = $start ? $start->diffInDays(now()->startOfDay()) : null;
        $nextAnniversaryDays = null;

        if ($start) {
            $candidate = $this->anniversaryForYear($start, now()->year);
            if ($candidate->lt(now()->startOfDay())) $candidate = $this->anniversaryForYear($start, now()->year + 1);
            $nextAnniversaryDays = now()->startOfDay()->diffInDays($candidate);
        }

        $favoriteMemories = Memory::where('space_id', $space->id)->whereHas('favorites', fn ($q) => $q->where('users.id', $user->id))->count();
        $favoriteNotes = Note::where('space_id', $space->id)->whereHas('favorites', fn ($q) => $q->where('users.id', $user->id))->count();
        $favoriteTimeline = TimelineEvent::where('space_id', $space->id)->whereHas('favorites', fn ($q) => $q->where('users.id', $user->id))->count();

        return response()->json([
            'relationshipDays' => $relationshipDays,
            'nextAnniversaryDays' => $nextAnniversaryDays,
            'stats' => [
                'memories' => Memory::where('space_id', $space->id)->count(),
                'notes' => Note::where('space_id', $space->id)->count(),
                'timeline' => TimelineEvent::where('space_id', $space->id)->count(),
                'favorites' => $favoriteMemories + $favoriteNotes + $favoriteTimeline,
            ],
            'unreadNotifications' => ZawszeNotification::where('user_id', $user->id)->whereNull('read_at')->count(),
        ]);
    }

    public function onThisDay(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        $month = now()->month;
        $day = now()->day;
        $year = now()->year;

        $memories = Memory::where('space_id', $space->id)
            ->whereMonth('taken_at', $month)->whereDay('taken_at', $day)->whereYear('taken_at', '<', $year)
            ->with(['uploader:id,name', 'album:id,name'])->withCount('comments')->latest('taken_at')->limit(12)->get();

        $timeline = TimelineEvent::where('space_id', $space->id)
            ->whereMonth('event_date', $month)->whereDay('event_date', $day)->whereYear('event_date', '<', $year)
            ->with(['creator:id,name', 'files'])->latest('event_date')->limit(12)->get();

        $memoryController = app(MemoryController::class);
        $timelineController = app(TimelineController::class);

        return response()->json([
            'memories' => $memories->map(fn (Memory $memory) => $memoryController->archivePayload($request, $memory))->values(),
            'timeline' => $timeline->map(fn (TimelineEvent $event) => $timelineController->payload($request, $event))->values(),
        ]);
    }

    public function favorites(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        $user = $request->user();

        $memories = Memory::where('space_id', $space->id)
            ->whereHas('favorites', fn ($q) => $q->where('users.id', $user->id))
            ->with(['uploader:id,name', 'album:id,name'])->withCount('comments')->latest('taken_at')->get();
        $notes = Note::where('space_id', $space->id)
            ->whereHas('favorites', fn ($q) => $q->where('users.id', $user->id))
            ->with('author:id,name')->withCount('reactions')->latest()->get();
        $timeline = TimelineEvent::where('space_id', $space->id)
            ->whereHas('favorites', fn ($q) => $q->where('users.id', $user->id))
            ->with(['creator:id,name', 'files'])->orderByDesc('event_date')->get();

        $memoryController = app(MemoryController::class);
        $noteController = app(NoteController::class);
        $timelineController = app(TimelineController::class);

        return response()->json([
            'memories' => $memories->map(fn (Memory $memory) => $memoryController->archivePayload($request, $memory))->values(),
            'notes' => $notes->map(fn (Note $note) => $noteController->archivePayload($request, $note))->values(),
            'timeline' => $timeline->map(fn (TimelineEvent $event) => $timelineController->payload($request, $event))->values(),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        $validated = $request->validate(['q' => ['required', 'string', 'min:2', 'max:120']]);
        $needle = trim($validated['q']);
        $term = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $needle).'%';
        $unlocked = Zawsze::unlocked($request->user(), $space);

        $memories = Memory::where('space_id', $space->id)
            ->when(! $unlocked, fn ($q) => $q->where('is_locked', false))
            ->where(function ($q) use ($term) {
                $q->where('caption', 'like', $term)->orWhere('location', 'like', $term);
            })->with(['uploader:id,name', 'album:id,name'])->withCount('comments')->limit(20)->get();

        $notes = Note::where('space_id', $space->id)
            ->when(! $unlocked, fn ($q) => $q->where('is_locked', false))
            ->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)->orWhere('body', 'like', $term);
            })->with('author:id,name')->withCount('reactions')->limit(20)->get();

        $timeline = TimelineEvent::where('space_id', $space->id)
            ->when(! $unlocked, fn ($q) => $q->where('is_locked', false))
            ->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)->orWhere('description', 'like', $term)->orWhere('location', 'like', $term);
            })->with(['creator:id,name', 'files'])->limit(20)->get();

        return response()->json([
            'memories' => $memories->map(fn ($m) => app(MemoryController::class)->archivePayload($request, $m))->values(),
            'notes' => $notes->map(fn ($n) => app(NoteController::class)->archivePayload($request, $n))->values(),
            'timeline' => $timeline->map(fn ($t) => app(TimelineController::class)->payload($request, $t))->values(),
        ]);
    }

    public function export(Request $request)
    {
        abort_unless(class_exists(ZipArchive::class), 501, 'PHP zip extension is required for archive export.');
        $space = $request->attributes->get('zawsze_space');
        $space->load('users:id,name,email');
        $memories = Memory::where('space_id', $space->id)->with(['uploader:id,name', 'album:id,name', 'comments.user:id,name'])->get();
        $notes = Note::where('space_id', $space->id)->with('author:id,name')->get();
        $timeline = TimelineEvent::where('space_id', $space->id)->with(['creator:id,name', 'files'])->get();
        $path = storage_path('app/zawsze-export-'.now()->format('Ymd-His').'.zip');
        $zip = new ZipArchive();
        abort_unless($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true, 500, 'Could not create backup.');
        $manifest = [
            'exportedAt' => now()->toISOString(),
            'space' => $space->only(['id', 'name', 'relationship_start']),
            'members' => $space->users->toArray(),
            'memories' => $memories->toArray(),
            'notes' => $notes->toArray(),
            'timeline' => $timeline->toArray(),
        ];
        $zip->addFromString('zawsze-data.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        foreach ($memories as $memory) {
            if ($memory->storage_path && Storage::disk('private')->exists($memory->storage_path)) {
                $zip->addFile(Storage::disk('private')->path($memory->storage_path), 'memories/'.$memory->id.'-'.$this->safeName($memory->original_name ?: basename($memory->storage_path)));
            }
        }
        foreach ($timeline as $event) {
            foreach ($event->files as $file) {
                if (Storage::disk('private')->exists($file->storage_path)) {
                    $zip->addFile(Storage::disk('private')->path($file->storage_path), 'timeline/'.$event->id.'-'.$file->id.'-'.$this->safeName($file->original_name));
                }
            }
        }
        $zip->close();
        return response()->download($path, 'zawsze-backup-'.now()->format('Y-m-d').'.zip')->deleteFileAfterSend(true);
    }

    private function anniversaryForYear(Carbon $start, int $year): Carbon
    {
        $day = min($start->day, Carbon::create($year, $start->month, 1)->daysInMonth);
        return Carbon::create($year, $start->month, $day)->startOfDay();
    }

    private function safeName(string $name): string
    {
        return preg_replace('/[^A-Za-z0-9._-]+/', '_', $name) ?: 'file';
    }
}
