<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

class AvatarController extends Controller
{
    public function show(User $user)
    {
        abort_unless($user->avatar_path && Storage::disk('private')->exists($user->avatar_path), 404);
        return Storage::disk('private')->response($user->avatar_path, null, [
            'Cache-Control' => 'private, max-age=1200',
        ]);
    }
}
