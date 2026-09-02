<?php

$mediaDriver = env('MEDIA_DISK_DRIVER', 'local');

return [
    'default' => env('FILESYSTEM_DISK', 'private'),

    'disks' => [
        'private' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => false,
            'throw' => false,
            'report' => false,
        ],

        'media' => $mediaDriver === 's3'
            ? [
                'driver' => 's3',
                'key' => env('MEDIA_ACCESS_KEY_ID'),
                'secret' => env('MEDIA_SECRET_ACCESS_KEY'),
                'region' => env('MEDIA_REGION', 'auto'),
                'bucket' => env('MEDIA_BUCKET'),
                'url' => env('MEDIA_URL'),
                'endpoint' => env('MEDIA_ENDPOINT'),
                'use_path_style_endpoint' => (bool) env('MEDIA_PATH_STYLE', false),
                'visibility' => 'private',
                'throw' => false,
                'report' => false,
            ]
            : [
                'driver' => 'local',
                'root' => storage_path('app/private'),
                'serve' => false,
                'throw' => false,
                'report' => false,
            ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],
    ],

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],
];
