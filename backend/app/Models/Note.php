<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
class Note extends Model { protected $fillable=['space_id','author_id','body','open_at','opened_notified_at','is_pinned','is_locked']; protected function casts():array{return ['open_at'=>'datetime','opened_notified_at'=>'datetime','is_pinned'=>'boolean','is_locked'=>'boolean'];} public function author():BelongsTo{return $this->belongsTo(User::class,'author_id');} public function reactions():BelongsToMany{return $this->belongsToMany(User::class,'note_reactions')->withTimestamps();} public function favorites():BelongsToMany{return $this->belongsToMany(User::class,'note_favorites')->withTimestamps();} }
