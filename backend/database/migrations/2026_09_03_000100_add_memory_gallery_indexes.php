<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('memories', function (Blueprint $table): void {
            $table->index(['space_id', 'taken_at', 'id'], 'memories_space_taken_id_index');
            $table->index(['space_id', 'album_id', 'taken_at'], 'memories_space_album_taken_index');
            $table->index(['space_id', 'is_locked', 'taken_at'], 'memories_space_locked_taken_index');
        });
    }

    public function down(): void
    {
        Schema::table('memories', function (Blueprint $table): void {
            $table->dropIndex('memories_space_taken_id_index');
            $table->dropIndex('memories_space_album_taken_index');
            $table->dropIndex('memories_space_locked_taken_index');
        });
    }
};
