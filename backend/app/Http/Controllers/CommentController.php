<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Memory;
use App\Support\Zawsze;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Request $request, Memory $memory): JsonResponse
    {
        $this->authorizeMemory($request, $memory);
        $space = $request->attributes->get('zawsze_space');
        if ($memory->is_locked && ! Zawsze::unlocked($request->user(), $space)) {
            return response()->json([]);
        }

        $comments = $memory->comments()->with('user:id,name')->get();
        return response()->json($comments->map(fn (Comment $comment) => $this->payload($request, $comment))->values());
    }

    public function store(Request $request, Memory $memory): JsonResponse
    {
        $this->authorizeMemory($request, $memory);
        $space = $request->attributes->get('zawsze_space');
        abort_if($memory->is_locked && ! Zawsze::unlocked($request->user(), $space), 423, 'Unlock private memories first.');

        $validated = $request->validate(['body' => ['required', 'string', 'max:1500']]);
        $comment = $memory->comments()->create([
            'user_id' => $request->user()->id,
            'body' => trim($validated['body']),
        ])->load('user:id,name');

        Zawsze::notifyPartner($space, $request->user(), 'comment.created', $request->user()->name.' commented on a memory.', ['memoryId' => $memory->id]);
        return response()->json($this->payload($request, $comment), 201);
    }

    public function update(Request $request, Memory $memory, Comment $comment): JsonResponse
    {
        $this->authorizeMemory($request, $memory);
        abort_unless((int) $comment->memory_id === (int) $memory->id, 404);
        abort_unless((int) $comment->user_id === (int) $request->user()->id, 403);
        $validated = $request->validate(['body' => ['required', 'string', 'max:1500']]);
        $comment->body = trim($validated['body']);
        $comment->save();
        return response()->json($this->payload($request, $comment->load('user:id,name')));
    }

    public function destroy(Request $request, Memory $memory, Comment $comment): JsonResponse
    {
        $this->authorizeMemory($request, $memory);
        abort_unless((int) $comment->memory_id === (int) $memory->id, 404);
        abort_unless((int) $comment->user_id === (int) $request->user()->id, 403);
        $comment->delete();
        return response()->json(['ok' => true]);
    }

    private function authorizeMemory(Request $request, Memory $memory): void
    {
        $space = $request->attributes->get('zawsze_space');
        abort_unless((int) $memory->space_id === (int) $space->id, 404);
    }

    private function payload(Request $request, Comment $comment): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'createdAt' => optional($comment->created_at)->toISOString(),
            'authorId' => $comment->user_id,
            'authorName' => $comment->user->name,
            'mine' => (int) $comment->user_id === (int) $request->user()->id,
        ];
    }
}
