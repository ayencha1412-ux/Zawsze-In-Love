<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Memory;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function store(Request $request, Memory $memory)
    {
        $this->ensureMemoryAccess($request, $memory);
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $comment = $memory->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);
        $comment->load('user:id,name');

        return response()->json([
            'comment' => [
                'id' => $comment->id,
                'author' => $comment->user->name,
                'body' => $comment->body,
                'createdAt' => $comment->created_at->toIso8601String(),
                'user_id' => $comment->user_id,
            ],
        ], 201);
    }

    public function destroy(Request $request, Memory $memory, Comment $comment)
    {
        $this->ensureMemoryAccess($request, $memory);
        abort_unless((int) $comment->memory_id === (int) $memory->id, 404);
        abort_unless((int) $comment->user_id === (int) $request->user()->id, 403, 'You can only delete your own comments.');
        $comment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }

    private function ensureMemoryAccess(Request $request, Memory $memory): void
    {
        $space = $request->user()->spaces()->first();
        abort_unless($space && (int) $memory->space_id === (int) $space->id, 403);
    }
}
