<?php
return [
 'upload_max_files'=>(int)env('ZAWSZE_UPLOAD_MAX_FILES',50),
 'upload_max_kb'=>(int)env('ZAWSZE_UPLOAD_MAX_KB',51200),
 'allowed_mimes'=>array_values(array_filter(array_map('trim',explode(',',(string)env('ZAWSZE_ALLOWED_MIMES','image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/quicktime,video/webm'))))),
];
