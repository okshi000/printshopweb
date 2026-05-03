<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoicePayment;
use App\Models\ItemCost;
use App\Models\SupplierPayment;
use App\Models\Expense;
use App\Models\Withdrawal;
use App\Models\CashMovement;
use App\Models\CashBalance;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Debt;
use App\Models\DebtRepayment;
use App\Models\ActivityLog;
use App\Models\Supplier;

class CleanDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:clean-full';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean all transactions while keeping core data (Users, Products, Suppliers, Customers)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->warn('!!! WARNING: THIS WILL DELETE ALL TRANSACTIONS, INVOICES, EXPENSES, AND FINANCIAL HISTORY !!!');
        $this->warn('Core data (Users, Products, Suppliers, Customers) will be preserved.');
        
        if (!$this->confirm('Are you absolutely sure you want to proceed?')) {
            $this->info('Operation cancelled.');
            return;
        }

        $this->info('Starting database cleanup...');

        DB::beginTransaction();

        try {
            // Disable foreign key checks for truncation
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // 1. Clear Invoices and related
            InvoiceItem::truncate();
            InvoicePayment::truncate();
            Invoice::truncate();
            $this->line('✓ Invoices and payments cleared.');

            // 2. Clear Supplier related transactions
            ItemCost::truncate();
            SupplierPayment::truncate();
            $this->line('✓ Supplier transactions cleared.');

            // 3. Clear Expenses and Withdrawals
            Expense::truncate();
            Withdrawal::truncate();
            $this->line('✓ Expenses and withdrawals cleared.');

            // 4. Clear Cash History
            CashMovement::truncate();
            $this->line('✓ Cash movements cleared.');

            // 5. Reset Cash Balance
            $balance = CashBalance::first();
            if ($balance) {
                $balance->update(['cash_balance' => 0, 'bank_balance' => 0]);
            } else {
                CashBalance::create(['cash_balance' => 0, 'bank_balance' => 0]);
            }
            $this->line('✓ Cash balance reset to 0.');

            // 6. Clear Inventory History
            InventoryMovement::truncate();
            $this->line('✓ Inventory movements cleared.');

            // 7. Reset Inventory Quantities (materials)
            InventoryItem::query()->update(['current_quantity' => 0]);
            $this->line('✓ Inventory items quantity reset to 0.');

            // 8. Clear Debts (Non-invoice debts)
            DebtRepayment::truncate();
            Debt::truncate();
            $this->line('✓ Debts cleared.');

            // 9. Clear Logs
            ActivityLog::truncate();
            $this->line('✓ Activity logs cleared.');

            // 10. Recalculate Supplier Balances (Should be 0 now)
            foreach (Supplier::all() as $supplier) {
                $supplier->update(['total_debt' => 0]);
            }
            $this->line('✓ Supplier balances reset to 0.');

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            DB::commit();
            $this->info('Database cleaned successfully! Core data preserved.');

        } catch (\Exception $e) {
            DB::rollBack();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            $this->error('An error occurred: ' . $e->getMessage());
        }
    }
}
