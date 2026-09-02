<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class ZawszeNotification extends Model { protected $table='zawsze_notifications'; protected $fillable=['user_id','actor_id','type','message','data','read_at']; protected function casts():array{return ['data'=>'array','read_at'=>'datetime'];} public function user():BelongsTo{return $this->belongsTo(User::class);} public function actor():BelongsTo{return $this->belongsTo(User::class,'actor_id');} }
