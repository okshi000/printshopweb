<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('cost_type', 100)->comment('نوع العملية: طباعة، تصميم، تقطيع، إلخ');
            $table->decimal('amount', 10, 2);
            $table->boolean('is_internal')->default(false)->comment('هل التكلفة داخلية أم خارجية');
            $table->text('notes')->nullable();
            $table->boolean('is_paid')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_costs');
    }
};
