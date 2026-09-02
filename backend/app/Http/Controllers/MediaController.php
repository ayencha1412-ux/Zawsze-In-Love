<?php

namespace App\Http\Controllers;

use App\Models\Memory;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function show(Memory $memory)
    {
        $disk = Storage::disk($memory->disk);
        abort_unless($disk->exists($memory->storage_path), 404);

        return response()->file($disk->path($memory->storage_path), [
            'Content-Type' => $memory->mime_type ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="'.addslashes($memory->original_name).'"',
            'Cache-Control' => 'private, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
