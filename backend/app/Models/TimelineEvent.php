<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
class TimelineEvent extends Model { protected $fillable=['space_id','created_by_user_id','title','event_date','event_type','description','is_locked']; protected function casts():array{return ['event_date'=>'date','is_locked'=>'boolean'];} public function creator():BelongsTo{return $this->belongsTo(User::class,'created_by_user_id');} public function files():HasMany{return $this->hasMany(TimelineFile::class);} public function favorites():BelongsToMany{return $this->belongsToMany(User::class,'timeline_favorites')->withTimestamps();} }
