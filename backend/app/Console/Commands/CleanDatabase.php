<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CleanDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:clean {--force : Force the operation without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean all database tables except users table';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('force')) {
            if (!$this->confirm('This will delete all data except users. Do you want to continue?')) {
                $this->info('Operation cancelled.');
                return;
            }
        }

        $this->info('Starting database cleanup...');

        // Get database driver
        $driver = DB::getDriverName();

        // Disable foreign key checks based on driver
        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys=OFF;');
        }

        // Get all tables based on driver
        if ($driver === 'mysql') {
            $tables = DB::select('SHOW TABLES');
            $databaseName = DB::getDatabaseName();
            $tableKey = "Tables_in_{$databaseName}";
        } elseif ($driver === 'sqlite') {
            $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            $tableKey = 'name';
        } else {
            $this->error("Unsupported database driver: {$driver}");
            return Command::FAILURE;
        }

        // Tables to skip
        $skipTables = [
            'users',
            'migrations',
            'cache',
            'cache_locks',
            'sessions',
            'jobs',
            'job_batches',
            'failed_jobs'
        ];

        $cleanedTables = [];

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;
            
            // Skip protected tables
            if (in_array($tableName, $skipTables)) {
                $this->warn("Skipped: {$tableName}");
                continue;
            }

            // Truncate table
            try {
                DB::table($tableName)->truncate();
                $cleanedTables[] = $tableName;
                $this->info("Cleaned: {$tableName}");
            } catch (\Exception $e) {
                $this->error("Error cleaning {$tableName}: " . $e->getMessage());
            }
        }

        // Re-enable foreign key checks based on driver
        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys=ON;');
        }

        $this->newLine();
        $this->info('Database cleanup completed!');
        $this->info('Total tables cleaned: ' . count($cleanedTables));
        $this->info('Users table preserved.');

        return Command::SUCCESS;
    }
}
