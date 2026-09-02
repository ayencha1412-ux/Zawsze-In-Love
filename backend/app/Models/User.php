<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
class User extends Authenticatable { use HasApiTokens,HasFactory,Notifiable; protected $fillable=['name','email','password','avatar_path','pin_unlocked_until']; protected $hidden=['password','remember_token']; protected function casts():array{return ['email_verified_at'=>'datetime','password'=>'hashed','pin_unlocked_until'=>'datetime'];} public function spaces():BelongsToMany{return $this->belongsToMany(Space::class)->withPivot('joined_at')->withTimestamps();} }
