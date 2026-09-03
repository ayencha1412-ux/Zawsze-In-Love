<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

Artisan::command('zawsze:info', function () {
    $this->info('Zawsze in Love backend is ready.');
})->purpose('Show Zawsze backend status');

Artisan::command('zawsze:storage-check', function () {
    $diskName = (string) config('zawsze.media_disk', 'media');
    $disk = Storage::disk($diskName);
    $path = 'healthchecks/'.Str::uuid().'.txt';
    $payload = 'zawsze-storage-check '.now()->toIso8601String();

    try {
        $disk->put($path, $payload);

        if (! $disk->exists($path) || $disk->get($path) !== $payload) {
            throw new RuntimeException('Write succeeded but the probe could not be read back correctly.');
        }

        $disk->delete($path);
        $this->info("Media storage [{$diskName}] is writable, readable, and deletable.");

        return 0;
    } catch (Throwable $exception) {
        try {
            $disk->delete($path);
        } catch (Throwable) {
            // Ignore cleanup errors so the original storage failure is reported.
        }

        $this->error("Media storage [{$diskName}] failed: {$exception->getMessage()}");

        return 1;
    }
})->purpose('Verify the configured Zawsze media disk, including Cloudflare R2');
