<?php

namespace App\Console\Commands;

use App\Models\Memory;
use App\Services\MediaPreviewService;
use Illuminate\Console\Command;

class BackfillMemoryPreviews extends Command
{
    protected $signature = 'zawsze:backfill-previews {--limit=0 : Stop after this many photos; 0 means all}';

    protected $description = 'Generate lightweight Gallery previews for existing photo memories.';

    public function handle(MediaPreviewService $previews): int
    {
        if (! function_exists('imagecreatefromstring')) {
            $this->error('PHP GD is not enabled. Enable the gd extension before running this command.');
            return self::FAILURE;
        }

        $limit = max(0, (int) $this->option('limit'));
        $generated = 0;
        $skipped = 0;
        $processed = 0;

        $query = Memory::query()
            ->where('media_type', 'image')
            ->whereNull('thumbnail_path')
            ->orderBy('id');

        $query->chunkById(25, function ($memories) use ($previews, $limit, &$generated, &$skipped, &$processed): bool {
            foreach ($memories as $memory) {
                if ($limit > 0 && $processed >= $limit) {
                    return false;
                }

                $processed++;
                $path = $previews->ensurePreview($memory);
                if ($path) {
                    $generated++;
                    $this->line("✓ Memory {$memory->id}");
                } else {
                    $skipped++;
                    $this->warn("Skipped memory {$memory->id}");
                }
            }

            return ! ($limit > 0 && $processed >= $limit);
        });

        $this->newLine();
        $this->info("Preview backfill finished: {$generated} generated, {$skipped} skipped.");

        return self::SUCCESS;
    }
}
