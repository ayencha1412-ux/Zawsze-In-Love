<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class TimelineFile extends Model { protected $fillable=['timeline_event_id','storage_disk','storage_path','original_name','mime_type','size_bytes']; public function event():BelongsTo{return $this->belongsTo(TimelineEvent::class,'timeline_event_id');} }
