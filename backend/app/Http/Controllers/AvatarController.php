<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\MediaResponseService;
use Symfony\Component\HttpFoundation\Response;

class AvatarController extends Controller
{
    public function show(User $user, MediaResponseService $media): Response
    {
        abort_unless($user->avatar_path, 404);
        $storageDisk = (string) config('zawsze.media_disk', 'media');

        return $media->inline(
            $storageDisk,
            $user->avatar_path,
            'image/*',
            'avatar-'.$user->id,
            1200,
        );
    }
}
