<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // API token auth is handled by Laravel Sanctum on protected routes.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Keep Laravel's normal JSON exception rendering for API requests.
    })->create();
