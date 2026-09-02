<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Album extends Model { protected $fillable=['space_id','name','description']; public function space():BelongsTo{return $this->belongsTo(Space::class);} public function memories():HasMany{return $this->hasMany(Memory::class);} }
