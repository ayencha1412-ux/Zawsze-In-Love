<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\MemoryController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::get('/media/{memory}', [MediaController::class, 'show'])->middleware('signed')->name('memories.media');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/memories', [MemoryController::class, 'index']);
    Route::post('/memories/bulk', [MemoryController::class, 'bulkStore']);
    Route::patch('/memories/{memory}', [MemoryController::class, 'update']);
    Route::delete('/memories/{memory}', [MemoryController::class, 'destroy']);

    Route::post('/memories/{memory}/comments', [CommentController::class, 'store']);
    Route::delete('/memories/{memory}/comments/{comment}', [CommentController::class, 'destroy']);
});
