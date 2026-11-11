<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update cash_balance table: add drawer_balance and vault_balance
        if (!Schema::hasColumn('cash_balance', 'drawer_balance')) {
            Schema::table('cash_balance', function (Blueprint $table) {
                $table->decimal('drawer_balance', 12, 2)->default(0.00)->after('id');
                $table->decimal('vault_balance', 12, 2)->default(0.00)->after('drawer_balance');
            });

            // Initialize drawer_balance with current cash_balance
            DB::statement('UPDATE cash_balance SET drawer_balance = cash_balance WHERE id = 1');
        }

        // 2. Modify enum columns to VARCHAR(50)
        DB::statement('ALTER TABLE cash_movements MODIFY source VARCHAR(50) NOT NULL');
        DB::statement('ALTER TABLE cash_movements MODIFY destination VARCHAR(50) NULL');
        DB::statement('ALTER TABLE cash_movements MODIFY movement_type VARCHAR(50) NOT NULL');

        DB::statement("ALTER TABLE invoice_payments MODIFY payment_method VARCHAR(50) NOT NULL DEFAULT 'drawer'");
        DB::statement("ALTER TABLE supplier_payments MODIFY payment_method VARCHAR(50) NOT NULL DEFAULT 'drawer'");
        DB::statement("ALTER TABLE expenses MODIFY payment_method VARCHAR(50) NOT NULL DEFAULT 'drawer'");
        DB::statement("ALTER TABLE withdrawals MODIFY payment_method VARCHAR(50) NOT NULL DEFAULT 'drawer'");
        DB::statement("ALTER TABLE debt_repayments MODIFY payment_method VARCHAR(50) NOT NULL DEFAULT 'drawer'");

        // 3. Add custody_id to expenses table if not exists
        if (!Schema::hasColumn('expenses', 'custody_id')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->unsignedBigInteger('custody_id')->nullable()->after('payment_method');
                $table->index('custody_id');
            });
        }

        // 4. Create custodies table
        if (!Schema::hasTable('custodies')) {
            Schema::create('custodies', function (Blueprint $table) {
                $table->id();
                $table->string('employee_name');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->decimal('amount', 12, 2);
                $table->decimal('spent_amount', 12, 2)->default(0.00);
                $table->decimal('returned_amount', 12, 2)->default(0.00);
                $table->string('status', 20)->default('open'); // 'open', 'settled'
                $table->string('source', 50)->default('drawer');
                $table->text('purpose')->nullable();
                $table->timestamp('disbursed_at')->useCurrent();
                $table->timestamp('settled_at')->nullable();
                $table->unsignedBigInteger('expense_type_id')->nullable();
                $table->unsignedBigInteger('expense_id')->nullable();
                $table->text('settlement_notes')->nullable();
                $table->string('receipt_attachment', 255)->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('settled_by')->nullable();
                $table->timestamps();

                $table->index('status');
                $table->index('employee_name');
                $table->index('user_id');
                $table->index('disbursed_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('custodies');
        if (Schema::hasColumn('expenses', 'custody_id')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->dropColumn('custody_id');
            });
        }
        if (Schema::hasColumn('cash_balance', 'drawer_balance')) {
            Schema::table('cash_balance', function (Blueprint $table) {
                $table->dropColumn(['drawer_balance', 'vault_balance']);
            });
        }
    }
};

