<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Memory extends Model
{
    use HasFactory;

    protected $fillable = [
        'space_id',
        'uploaded_by_user_id',
        'media_type',
        'disk',
        'storage_path',
        'original_name',
        'mime_type',
        'size_bytes',
        'caption',
        'description',
        'taken_at',
    ];

    protected function casts(): array
    {
        return [
            'taken_at' => 'datetime',
            'size_bytes' => 'integer',
        ];
    }

    public function space()
    {
        return $this->belongsTo(Space::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class)->latest();
    }
}
