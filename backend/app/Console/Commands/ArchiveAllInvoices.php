<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\Supplier;
use App\Models\ActivityLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ArchiveAllInvoices extends Command
{
    protected $signature = 'invoices:archive-all';
    protected $description = 'أرشفة جميع الفواتير الحالية واستبعادها من الحسابات المالية';

    public function handle()
    {
        $this->info('بدء أرشفة جميع الفواتير...');

        $updated = DB::table('invoices')
            ->where('is_archived', false)
            ->update([
                'is_archived' => true,
                'archived_at' => now(),
            ]);

        $this->info("تمت أرشفة {$updated} فاتورة بنجاح.");

        $this->info('إعادة حساب أرصدة الموردين...');
        $this->call('suppliers:recalculate-balances');

        ActivityLog::log('update', 'invoices', "أرشفة جماعية لكافة الفواتير الحالية ({$updated} فاتورة)");

        $this->newLine();
        $this->info('اكتملت العملية بنجاح. أصبحت جميع الفواتير الآن في قسم الأرشيف وخارج كافة الحسابات المالية.');

        return Command::SUCCESS;
    }
}
