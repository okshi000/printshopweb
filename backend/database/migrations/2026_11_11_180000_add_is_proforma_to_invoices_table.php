<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->boolean('is_proforma')->default(false)->after('is_archived')->index();
            $table->string('proforma_number', 50)->nullable()->after('is_proforma');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['is_proforma']);
            $table->dropColumn(['is_proforma', 'proforma_number']);
        });
    }
};

