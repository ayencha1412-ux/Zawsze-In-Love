<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Space extends Model { protected $fillable=['name','relationship_start','pin_hash']; protected $hidden=['pin_hash']; protected function casts():array{return ['relationship_start'=>'date'];} public function users():BelongsToMany{return $this->belongsToMany(User::class)->withPivot('joined_at')->withTimestamps();} public function memories():HasMany{return $this->hasMany(Memory::class);} public function albums():HasMany{return $this->hasMany(Album::class);} public function notes():HasMany{return $this->hasMany(Note::class);} public function timelineEvents():HasMany{return $this->hasMany(TimelineEvent::class);} }
