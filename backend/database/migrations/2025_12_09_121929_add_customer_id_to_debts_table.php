<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('debts', function (Blueprint $table) {
            // إضافة customer_id
            $table->foreignId('customer_id')->nullable()->after('id')->constrained('customers')->onDelete('cascade');
            
            // إضافة paid_amount كعمود فعلي (كان accessor فقط)
            $table->decimal('paid_amount', 10, 2)->default(0)->after('remaining_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('debts', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn(['customer_id', 'paid_amount']);
        });
    }
};
