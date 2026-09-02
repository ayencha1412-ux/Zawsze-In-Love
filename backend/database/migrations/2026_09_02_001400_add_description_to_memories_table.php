<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('memories', 'description')) {
            Schema::table('memories', function (Blueprint $table) {
                $table->text('description')->nullable()->after('caption');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('memories', 'description')) {
            Schema::table('memories', function (Blueprint $table) {
                $table->dropColumn('description');
            });
        }
    }
};
