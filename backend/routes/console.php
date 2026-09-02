<?php
use Illuminate\Support\Facades\Artisan;
Artisan::command('zawsze:info',function(){$this->info('Zawsze in Love backend is ready.');})->purpose('Show Zawsze backend status');
