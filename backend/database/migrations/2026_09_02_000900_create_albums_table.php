<?php
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema;
return new class extends Migration { public function up():void { Schema::create('albums',function(Blueprint $table){$table->id();$table->foreignId('space_id')->constrained()->cascadeOnDelete();$table->string('name',100);$table->text('description')->nullable();$table->timestamps();$table->unique(['space_id','name']);}); } public function down():void { Schema::dropIfExists('albums'); } };
