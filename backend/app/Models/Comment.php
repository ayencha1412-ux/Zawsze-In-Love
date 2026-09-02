<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Comment extends Model { protected $fillable=['memory_id','user_id','body']; public function memory():BelongsTo{return $this->belongsTo(Memory::class);} public function user():BelongsTo{return $this->belongsTo(User::class);} }
