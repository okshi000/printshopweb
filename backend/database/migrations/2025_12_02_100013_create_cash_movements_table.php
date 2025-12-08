<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_movements', function (Blueprint $table) {
            $table->id();
            $table->enum('movement_type', ['income', 'expense', 'transfer', 'withdrawal', 'initial']);
            $table->enum('source', ['cash', 'bank']);
            $table->enum('destination', ['cash', 'bank'])->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('reference_type', 50)->nullable()->comment('invoice_payment, expense, withdrawal, etc.');
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('description')->nullable();
            $table->timestamp('movement_date')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_movements');
    }
};
