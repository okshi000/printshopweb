<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kanban_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_item_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('item_name', 200);
            $table->text('description')->nullable();
            $table->decimal('quantity', 10, 2)->default(1);
            $table->enum('status', [
                'in_design',    // 1. في التصميم
                'in_printing',  // 2. في الطباعة
                'in_finishing', // 3. في التشطيب
                'in_office',    // 4. في المكتب
                'delivered'     // 5. تم التسليم
            ])->default('in_design');
            $table->integer('sort_order')->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'sort_order']);
            $table->index('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kanban_cards');
    }
};
