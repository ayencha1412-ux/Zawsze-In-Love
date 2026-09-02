<?php

namespace App\Services;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class MediaResponseService
{
    public function inline(
        string $diskName,
        string $path,
        string $mimeType,
        string $filename,
        int $maxAge = 21600,
    ): Response {
        return $this->respond($diskName, $path, $mimeType, $filename, false, $maxAge);
    }

    public function download(
        string $diskName,
        string $path,
        string $mimeType,
        string $filename,
    ): Response {
        return $this->respond($diskName, $path, $mimeType, $filename, true, 0);
    }

    private function respond(
        string $diskName,
        string $path,
        string $mimeType,
        string $filename,
        bool $download,
        int $maxAge,
    ): Response {
        $disk = Storage::disk($diskName);
        abort_unless($disk->exists($path), 404);

        if ($this->isRemoteDisk($diskName)) {
            $redirect = $this->temporaryRedirect($disk, $path, $mimeType, $filename, $download);
            if ($redirect) {
                return $redirect;
            }
        }

        try {
            $localPath = $disk->path($path);
            if (is_file($localPath)) {
                $headers = $this->headers($mimeType, $filename, $download, $maxAge);
                return response()->file($localPath, $headers);
            }
        } catch (Throwable) {
            // Non-local disks do not expose a filesystem path. Fall through to streaming.
        }

        $stream = $disk->readStream($path);
        abort_unless(is_resource($stream), 404);

        return response()->stream(function () use ($stream): void {
            fpassthru($stream);
            fclose($stream);
        }, 200, $this->headers($mimeType, $filename, $download, $maxAge));
    }

    private function temporaryRedirect(
        FilesystemAdapter $disk,
        string $path,
        string $mimeType,
        string $filename,
        bool $download,
    ): ?Response {
        try {
            $disposition = $download ? 'attachment' : 'inline';
            $url = $disk->temporaryUrl($path, now()->addMinutes(30), [
                'ResponseContentType' => $mimeType,
                'ResponseContentDisposition' => $disposition.'; filename="'.addslashes($filename).'"',
            ]);

            return redirect()->away($url);
        } catch (Throwable) {
            return null;
        }
    }

    private function isRemoteDisk(string $diskName): bool
    {
        return config("filesystems.disks.{$diskName}.driver") !== 'local';
    }

    private function headers(
        string $mimeType,
        string $filename,
        bool $download,
        int $maxAge,
    ): array {
        $disposition = $download ? 'attachment' : 'inline';

        return [
            'Content-Type' => $mimeType,
            'Cache-Control' => $download ? 'private, no-store' : "private, max-age={$maxAge}",
            'Content-Disposition' => $disposition.'; filename="'.addslashes($filename).'"',
            'X-Content-Type-Options' => 'nosniff',
        ];
    }
}
