<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = ['memory_id', 'user_id', 'body'];

    public function memory()
    {
        return $this->belongsTo(Memory::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
