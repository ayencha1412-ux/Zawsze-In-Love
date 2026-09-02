<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Support\Zawsze;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');

        Note::where('space_id', $space->id)
            ->whereNotNull('open_at')
            ->where('open_at', '<=', now())
            ->whereNull('opened_notified_at')
            ->with('author:id,name')
            ->get()
            ->each(function (Note $due) use ($space) {
                if ($due->author) {
                    Zawsze::notifyPartner($space, $due->author, 'note.opened', 'A sealed letter from '.$due->author->name.' is ready to open.', ['noteId' => $due->id]);
                }
                $due->opened_notified_at = now();
                $due->save();
            });

        $notes = Note::where('space_id', $space->id)
            ->with('author:id,name')
            ->withCount('reactions')
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($notes->map(fn (Note $note) => $this->payload($request, $note))->values());
    }

    public function store(Request $request): JsonResponse
    {
        $space = $request->attributes->get('zawsze_space');
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:3000'],
            'openAt' => ['nullable', 'date'],
            'isPinned' => ['nullable', 'boolean'],
            'isFavorite' => ['nullable', 'boolean'],
            'isLocked' => ['nullable', 'boolean'],
        ]);

        $note = Note::create([
            'space_id' => $space->id,
            'author_id' => $request->user()->id,
            'body' => trim($validated['body']),
            'open_at' => ! empty($validated['openAt']) ? Carbon::parse($validated['openAt']) : null,
            'is_pinned' => (bool) ($validated['isPinned'] ?? false),
            'is_locked' => (bool) ($validated['isLocked'] ?? false),
        ]);
        if (! empty($validated['isFavorite'])) $note->favorites()->attach($request->user()->id);

        $message = $note->open_at && $note->open_at->isFuture()
            ? $request->user()->name.' left you a sealed letter for later.'
            : $request->user()->name.' wrote a love note.';
        Zawsze::notifyPartner($space, $request->user(), 'note.created', $message, ['noteId' => $note->id]);

        return response()->json($this->payload($request, $note->load('author:id,name')->loadCount('reactions')), 201);
    }

    public function update(Request $request, Note $note): JsonResponse
    {
        $this->authorizeNote($request, $note);
        abort_unless((int) $note->author_id === (int) $request->user()->id || $this->onlyFavoriteToggle($request), 403, 'Only the author can edit this note.');

        $validated = $request->validate([
            'body' => ['sometimes', 'string', 'max:3000'],
            'openAt' => ['sometimes', 'nullable', 'date'],
            'isPinned' => ['sometimes', 'boolean'],
            'isFavorite' => ['sometimes', 'boolean'],
            'isLocked' => ['sometimes', 'boolean'],
        ]);

        if ((int) $note->author_id === (int) $request->user()->id) {
            if (array_key_exists('body', $validated)) $note->body = trim($validated['body']);
            if (array_key_exists('openAt', $validated)) $note->open_at = $validated['openAt'] ? Carbon::parse($validated['openAt']) : null;
            if (array_key_exists('isPinned', $validated)) $note->is_pinned = $validated['isPinned'];
            if (array_key_exists('isLocked', $validated)) $note->is_locked = $validated['isLocked'];
            $note->save();
        }

        if (array_key_exists('isFavorite', $validated)) {
            if ($validated['isFavorite']) $note->favorites()->syncWithoutDetaching([$request->user()->id]);
            else $note->favorites()->detach($request->user()->id);
        }

        return response()->json($this->payload($request, $note->fresh('author:id,name')->loadCount('reactions')));
    }

    public function heart(Request $request, Note $note): JsonResponse
    {
        $this->authorizeNote($request, $note);
        $space = $request->attributes->get('zawsze_space');
        abort_if($note->is_locked && ! Zawsze::unlocked($request->user(), $space), 423, 'Unlock private notes first.');
        abort_if($note->open_at && $note->open_at->isFuture() && (int) $note->author_id !== (int) $request->user()->id, 423, 'This letter is still sealed.');
        $exists = $note->reactions()->where('users.id', $request->user()->id)->exists();
        if ($exists) $note->reactions()->detach($request->user()->id);
        else $note->reactions()->attach($request->user()->id);
        return response()->json(['hearted' => ! $exists, 'heartCount' => $note->reactions()->count()]);
    }

    public function destroy(Request $request, Note $note): JsonResponse
    {
        $this->authorizeNote($request, $note);
        abort_unless((int) $note->author_id === (int) $request->user()->id, 403);
        $note->delete();
        return response()->json(['ok' => true]);
    }

    public function archivePayload(Request $request, Note $note): array
    {
        return $this->payload($request, $note);
    }

    private function authorizeNote(Request $request, Note $note): void
    {
        $space = $request->attributes->get('zawsze_space');
        abort_unless((int) $note->space_id === (int) $space->id, 404);
    }

    private function onlyFavoriteToggle(Request $request): bool
    {
        $keys = array_keys($request->all());
        return count($keys) === 1 && $keys[0] === 'isFavorite';
    }

    private function payload(Request $request, Note $note): array
    {
        $space = $request->attributes->get('zawsze_space');
        $locked = $note->is_locked && ! Zawsze::unlocked($request->user(), $space);
        $sealed = $note->open_at && $note->open_at->isFuture() && (int) $note->author_id !== (int) $request->user()->id;

        return [
            'id' => $note->id,
            'authorId' => $note->author_id,
            'authorName' => $note->author->name,
            'body' => ($locked || $sealed) ? null : $note->body,
            'sealed' => (bool) $sealed,
            'openAt' => optional($note->open_at)->toISOString(),
            'isPinned' => (bool) $note->is_pinned,
            'isLocked' => (bool) $note->is_locked,
            'locked' => (bool) $locked,
            'isFavorite' => $note->favorites()->where('users.id', $request->user()->id)->exists(),
            'heartedByMe' => $note->reactions()->where('users.id', $request->user()->id)->exists(),
            'heartCount' => (int) ($note->reactions_count ?? $note->reactions()->count()),
            'createdAt' => optional($note->created_at)->toISOString(),
        ];
    }
}
