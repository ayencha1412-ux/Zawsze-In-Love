<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Memory extends Model { protected $fillable=['space_id','album_id','uploaded_by_user_id','media_type','storage_disk','storage_path','thumbnail_path','original_name','mime_type','size_bytes','caption','description','location','is_locked','taken_at']; protected function casts():array{return ['taken_at'=>'datetime','size_bytes'=>'integer','is_locked'=>'boolean'];} public function space():BelongsTo{return $this->belongsTo(Space::class);} public function album():BelongsTo{return $this->belongsTo(Album::class);} public function uploader():BelongsTo{return $this->belongsTo(User::class,'uploaded_by_user_id');} public function comments():HasMany{return $this->hasMany(Comment::class)->oldest();} public function favorites():BelongsToMany{return $this->belongsToMany(User::class,'memory_favorites')->withTimestamps();} }
