<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_balance', function (Blueprint $table) {
            $table->id();
            $table->decimal('cash_balance', 10, 2)->default(0.00);
            $table->decimal('bank_balance', 10, 2)->default(0.00);
            $table->timestamps();
        });

        // Insert default row
        DB::table('cash_balance')->insert([
            'id' => 1,
            'cash_balance' => 0.00,
            'bank_balance' => 0.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_balance');
    }
};
