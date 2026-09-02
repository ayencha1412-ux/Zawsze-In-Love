<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Memory extends Model
{
    protected $fillable = [
        'space_id',
        'album_id',
        'uploaded_by_user_id',
        'media_type',
        'storage_disk',
        'storage_path',
        'thumbnail_path',
        'original_name',
        'mime_type',
        'size_bytes',
        'caption',
        'description',
        'location',
        'is_locked',
        'taken_at',
    ];

    protected function casts(): array
    {
        return [
            'taken_at' => 'datetime',
            'size_bytes' => 'integer',
            'is_locked' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Memory $memory) {
            if (filled($memory->description)) {
                return;
            }

            $photoDescriptions = [
                'a little moment worth keeping forever ♡',
                'just us making an ordinary day feel special ♡',
                'one tiny memory, one very happy heart ♡',
                'a soft little moment from our story ♡',
                'proof that the sweetest memories can be simple ♡',
                'another small piece of us, saved with love ♡',
                'a cute little moment I never want to forget ♡',
                'one of those moments that quietly makes me smile ♡',
            ];

            $videoDescriptions = [
                'a tiny piece of our story, moving and alive ♡',
                'a few seconds of us that deserve to stay forever ♡',
                'one little moment, saved exactly as it happened ♡',
                'our memories are even sweeter when they move ♡',
                'a small clip from a moment worth replaying ♡',
                'a little piece of life with you, kept forever ♡',
                'just a few seconds, but a whole memory to keep ♡',
                'one of our little moments, saved with love ♡',
            ];

            $choices = $memory->media_type === 'video' ? $videoDescriptions : $photoDescriptions;
            $seedSource = (string) ($memory->original_name ?: $memory->caption ?: 'zawsze');
            $index = abs(crc32($seedSource)) % count($choices);
            $memory->description = $choices[$index];
        });
    }

    public function space(): BelongsTo
    {
        return $this->belongsTo(Space::class);
    }

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->oldest();
    }

    public function favorites(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'memory_favorites')->withTimestamps();
    }
}
