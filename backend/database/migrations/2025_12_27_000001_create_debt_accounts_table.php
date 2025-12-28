<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create debt accounts table
        Schema::create('debt_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->comment('اسم صاحب الحساب');
            $table->string('phone', 20)->nullable()->comment('رقم الهاتف');
            $table->text('notes')->nullable()->comment('ملاحظات');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add new columns to debts table
        Schema::table('debts', function (Blueprint $table) {
            $table->foreignId('debt_account_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->enum('source', ['cash', 'bank'])->default('cash')->after('debtor_name')->comment('مصدر الدين: كاش أو بنك');
        });
    }

    public function down(): void
    {
        Schema::table('debts', function (Blueprint $table) {
            $table->dropForeign(['debt_account_id']);
            $table->dropColumn(['debt_account_id', 'source']);
        });

        Schema::dropIfExists('debt_accounts');
    }
};
