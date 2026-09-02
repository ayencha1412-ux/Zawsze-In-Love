<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('zawsze:about', function () {
    $this->info('Zawsze in Love API is ready.');
})->purpose('Show a small Zawsze backend status message');
