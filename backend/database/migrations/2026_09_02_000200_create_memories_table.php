<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('memories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('space_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('media_type', 20);
            $table->string('disk')->default('private');
            $table->string('storage_path')->unique();
            $table->string('original_name');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->string('caption', 500)->nullable();
            $table->text('description')->nullable();
            $table->dateTime('taken_at')->nullable()->index();
            $table->timestamps();
            $table->index(['space_id', 'media_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('memories');
    }
};
