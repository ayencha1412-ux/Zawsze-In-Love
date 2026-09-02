<?php

namespace App\Services;

use App\Models\Memory;
use Illuminate\Support\Facades\Storage;
use Throwable;

class MediaPreviewService
{
    public function ensurePreview(Memory $memory): ?string
    {
        $disk = Storage::disk($memory->storage_disk);

        if ($memory->thumbnail_path && $disk->exists($memory->thumbnail_path)) {
            return $memory->thumbnail_path;
        }

        if ($memory->media_type !== 'image') {
            return null;
        }

        $maxSourceBytes = (int) config('zawsze.preview_max_source_kb', 131072) * 1024;
        if ($memory->size_bytes > $maxSourceBytes) {
            return null;
        }

        if (! function_exists('imagecreatefromstring')) {
            return null;
        }

        try {
            $contents = $disk->get($memory->storage_path);
            $source = @imagecreatefromstring($contents);
            unset($contents);

            if (! $source) {
                return null;
            }

            $sourceWidth = imagesx($source);
            $sourceHeight = imagesy($source);
            if ($sourceWidth < 1 || $sourceHeight < 1) {
                imagedestroy($source);
                return null;
            }

            $maxEdge = max(320, (int) config('zawsze.preview_max_edge', 960));
            $scale = min(1, $maxEdge / max($sourceWidth, $sourceHeight));
            $targetWidth = max(1, (int) round($sourceWidth * $scale));
            $targetHeight = max(1, (int) round($sourceHeight * $scale));

            $target = imagecreatetruecolor($targetWidth, $targetHeight);
            imagealphablending($target, false);
            imagesavealpha($target, true);
            $transparent = imagecolorallocatealpha($target, 0, 0, 0, 127);
            imagefill($target, 0, 0, $transparent);
            imagecopyresampled(
                $target,
                $source,
                0,
                0,
                0,
                0,
                $targetWidth,
                $targetHeight,
                $sourceWidth,
                $sourceHeight,
            );
            imagedestroy($source);

            $useWebp = function_exists('imagewebp');
            $extension = $useWebp ? 'webp' : 'jpg';
            $previewPath = "spaces/{$memory->space_id}/previews/{$memory->id}.{$extension}";

            ob_start();
            if ($useWebp) {
                imagewebp($target, null, (int) config('zawsze.preview_quality', 78));
            } else {
                imagealphablending($target, true);
                imagejpeg($target, null, 82);
            }
            $previewBytes = ob_get_clean();
            imagedestroy($target);

            if (! is_string($previewBytes) || $previewBytes === '') {
                return null;
            }

            $disk->put($previewPath, $previewBytes);
            $memory->forceFill(['thumbnail_path' => $previewPath])->saveQuietly();

            return $previewPath;
        } catch (Throwable) {
            return null;
        }
    }
}
