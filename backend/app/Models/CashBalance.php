<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashBalance extends Model
{
    protected $table = 'cash_balance';

    protected $fillable = [
        'drawer_balance',
        'vault_balance',
        'bank_balance',
        'cash_balance',
    ];

    protected $casts = [
        'drawer_balance' => 'decimal:2',
        'vault_balance' => 'decimal:2',
        'bank_balance' => 'decimal:2',
        'cash_balance' => 'decimal:2',
    ];

    public static function getBalance(): self
    {
        $balance = static::firstOrCreate(['id' => 1], [
            'drawer_balance' => 0,
            'vault_balance' => 0,
            'bank_balance' => 0,
            'cash_balance' => 0,
        ]);

        // Keep cash_balance in sync (drawer + vault)
        $totalCash = (float)($balance->drawer_balance ?? 0) + (float)($balance->vault_balance ?? 0);
        if (abs((float)($balance->cash_balance ?? 0) - $totalCash) > 0.001) {
            $balance->cash_balance = $totalCash;
            $balance->save();
        }

        return $balance;
    }

    public static function updateBalance(string $method, float $amount): void
    {
        $balance = static::getBalance();
        
        switch ($method) {
            case 'drawer':
                $balance->drawer_balance = (float)($balance->drawer_balance ?? 0) + $amount;
                break;
            case 'vault':
                $balance->vault_balance = (float)($balance->vault_balance ?? 0) + $amount;
                break;
            case 'bank':
                $balance->bank_balance = (float)($balance->bank_balance ?? 0) + $amount;
                break;
            case 'cash':
            default:
                // Legacy cash default maps to office drawer
                $balance->drawer_balance = (float)($balance->drawer_balance ?? 0) + $amount;
                break;
        }
        
        $balance->cash_balance = (float)($balance->drawer_balance ?? 0) + (float)($balance->vault_balance ?? 0);
        $balance->save();
    }

    public static function transfer(string $from, string $to, float $amount, ?string $notes = null): void
    {
        $balance = static::getBalance();
        
        // Deduct from source
        switch ($from) {
            case 'drawer':
            case 'cash':
                $balance->drawer_balance = (float)($balance->drawer_balance ?? 0) - $amount;
                break;
            case 'vault':
                $balance->vault_balance = (float)($balance->vault_balance ?? 0) - $amount;
                break;
            case 'bank':
                $balance->bank_balance = (float)($balance->bank_balance ?? 0) - $amount;
                break;
        }

        // Add to destination
        switch ($to) {
            case 'drawer':
            case 'cash':
                $balance->drawer_balance = (float)($balance->drawer_balance ?? 0) + $amount;
                break;
            case 'vault':
                $balance->vault_balance = (float)($balance->vault_balance ?? 0) + $amount;
                break;
            case 'bank':
                $balance->bank_balance = (float)($balance->bank_balance ?? 0) + $amount;
                break;
        }

        $balance->cash_balance = (float)($balance->drawer_balance ?? 0) + (float)($balance->vault_balance ?? 0);
        $balance->save();

        $fromLabel = match($from) {
            'drawer', 'cash' => 'درج المكتب',
            'vault' => 'الخزينة الرئيسية',
            'bank' => 'حساب البنك',
            default => $from,
        };

        $toLabel = match($to) {
            'drawer', 'cash' => 'درج المكتب',
            'vault' => 'الخزينة الرئيسية',
            'bank' => 'حساب البنك',
            default => $to,
        };

        $description = "تحويل داخلي من {$fromLabel} إلى {$toLabel}";
        if ($notes) {
            $description .= " - {$notes}";
        }

        CashMovement::create([
            'movement_type' => 'transfer',
            'source' => $from,
            'destination' => $to,
            'amount' => $amount,
            'description' => $description,
            'movement_date' => now(),
        ]);
    }
}
