<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('debts', function (Blueprint $table) {
            $table->id();
            $table->string('debtor_name', 100)->comment('Name of the person who owes money');
            $table->decimal('amount', 10, 2)->comment('Total debt amount');
            $table->decimal('remaining_amount', 10, 2)->comment('Amount left to pay');
            $table->date('debt_date');
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_paid')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('debts');
    }
};
