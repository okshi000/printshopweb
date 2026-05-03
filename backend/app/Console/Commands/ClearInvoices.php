<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoicePayment;
use App\Models\CashMovement;
use App\Models\CashBalance;
use App\Models\InventoryMovement;
use App\Models\ActivityLog;

class ClearInvoices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoices:clear {--all : Also clear cash movements and reset balance}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all invoices and related data from the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->confirm('Are you sure you want to delete ALL invoices? This action cannot be undone!')) {
            $this->info('Operation cancelled.');
            return;
        }

        $this->info('Starting data cleanup...');

        DB::beginTransaction();

        try {
            // 1. Delete Invoice Items (Cascaded usually, but to be sure)
            InvoiceItem::query()->delete();
            $this->line('✓ Invoice items cleared.');

            // 2. Delete Invoice Payments (Cascaded usually)
            InvoicePayment::query()->delete();
            $this->line('✓ Invoice payments cleared.');

            // 3. Delete Invoices
            Invoice::query()->delete();
            $this->line('✓ Invoices cleared.');

            if ($this->option('all')) {
                // 4. Delete Cash Movements related to invoices
                CashMovement::where('reference_type', 'invoice_payment')->delete();
                $this->line('✓ Cash movements related to invoices cleared.');

                // 5. Reset Cash Balance to 0 (Optional, depends on user preference)
                $balance = CashBalance::first();
                if ($balance) {
                    $balance->update(['cash_balance' => 0, 'bank_balance' => 0]);
                    $this->line('✓ Cash balance reset to 0.');
                }

                // 6. Delete Inventory Movements related to invoices
                InventoryMovement::where('reference_type', 'invoice')->delete();
                $this->line('✓ Inventory movements related to invoices cleared.');
                
                // 7. Clear Activity Log
                ActivityLog::query()->delete();
                $this->line('✓ Activity logs cleared.');
            }

            DB::commit();
            $this->info('Cleanup completed successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('An error occurred: ' . $e->getMessage());
        }
    }
}
