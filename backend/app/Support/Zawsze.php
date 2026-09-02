<?php
namespace App\Support;
use App\Models\Space;
use App\Models\User;
use App\Models\ZawszeNotification;
use Illuminate\Support\Facades\URL;
class Zawsze { public static function unlocked(User $user,Space $space):bool{if(!$space->pin_hash)return true; return $user->pin_unlocked_until&&$user->pin_unlocked_until->isFuture();} public static function notifyPartner(Space $space,User $actor,string $type,string $message,array $data=[]):void{$space->users()->where('users.id','!=',$actor->id)->get()->each(function(User $recipient)use($actor,$type,$message,$data){ZawszeNotification::create(['user_id'=>$recipient->id,'actor_id'=>$actor->id,'type'=>$type,'message'=>$message,'data'=>$data?:null]);});} public static function signed(string $route,array $parameters,int $minutes=20):string{return URL::temporarySignedRoute($route,now()->addMinutes($minutes),$parameters);} }
