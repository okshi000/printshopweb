<?php

namespace App\Console\Commands;

use App\Models\Supplier;
use Illuminate\Console\Command;

class RecalculateSupplierBalances extends Command
{
    protected $signature = 'suppliers:recalculate-balances';
    protected $description = 'إعادة حساب أرصدة جميع الموردين';

    public function handle()
    {
        $this->info('بدء إعادة حساب أرصدة الموردين...');
        
        $suppliers = Supplier::all();
        $bar = $this->output->createProgressBar($suppliers->count());
        
        foreach ($suppliers as $supplier) {
            $supplier->recalculateBalance();
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        $this->info('تم إعادة حساب أرصدة ' . $suppliers->count() . ' مورد بنجاح!');
        
        return Command::SUCCESS;
    }
}
