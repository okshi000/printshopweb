<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('action_type', ['create', 'update', 'delete', 'view', 'login', 'logout', 'print', 'export', 'payment', 'other']);
            $table->string('module', 50)->comment('القسم: invoices, customers, expenses, etc.');
            $table->unsignedBigInteger('record_id')->nullable()->comment('معرف السجل المتأثر');
            $table->text('description')->comment('وصف العملية');
            $table->json('old_values')->nullable()->comment('القيم القديمة قبل التعديل');
            $table->json('new_values')->nullable()->comment('القيم الجديدة بعد التعديل');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamps();

            $table->index('action_type');
            $table->index('module');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_log');
    }
};
