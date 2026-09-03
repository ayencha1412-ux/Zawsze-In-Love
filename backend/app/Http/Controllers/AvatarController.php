<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\MediaResponseService;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class AvatarController extends Controller
{
    public function show(User $user, MediaResponseService $media): Response
    {
        abort_unless($user->avatar_path, 404);
        $storageDisk = (string) config('zawsze.media_disk', 'media');
        $mimeType = Storage::disk($storageDisk)->mimeType($user->avatar_path) ?: 'image/jpeg';

        return $media->inline(
            $storageDisk,
            $user->avatar_path,
            $mimeType,
            'avatar-'.$user->id,
            1200,
        );
    }
}
