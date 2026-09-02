<?php

return [
    'upload_max_files' => (int) env('ZAWSZE_UPLOAD_MAX_FILES', 50),
    'upload_max_kb' => (int) env('ZAWSZE_UPLOAD_MAX_KB', 51200),
    'allowed_mimes' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env(
            'ZAWSZE_ALLOWED_MIMES',
            'image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/quicktime,video/webm',
        )),
    ))),
    'media_disk' => env('ZAWSZE_MEDIA_DISK', 'media'),
    'preview_max_edge' => (int) env('ZAWSZE_PREVIEW_MAX_EDGE', 960),
    'preview_quality' => (int) env('ZAWSZE_PREVIEW_QUALITY', 78),
    'preview_max_source_kb' => (int) env('ZAWSZE_PREVIEW_MAX_SOURCE_KB', 131072),
    'gallery_page_size' => (int) env('ZAWSZE_GALLERY_PAGE_SIZE', 24),
];
