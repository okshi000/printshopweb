<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashBalance extends Model
{
    protected $table = 'cash_balance';

    protected $fillable = [
        'cash_balance',
        'bank_balance',
    ];

    protected $casts = [
        'cash_balance' => 'decimal:2',
        'bank_balance' => 'decimal:2',
    ];

    public static function getBalance(): self
    {
        return static::firstOrCreate(['id' => 1], [
            'cash_balance' => 0,
            'bank_balance' => 0,
        ]);
    }

    public static function updateBalance(string $method, float $amount): void
    {
        $balance = static::getBalance();
        
        if ($method === 'cash') {
            $balance->cash_balance += $amount;
        } else {
            $balance->bank_balance += $amount;
        }
        
        $balance->save();
    }

    public static function transfer(string $from, string $to, float $amount): void
    {
        $balance = static::getBalance();
        
        if ($from === 'cash') {
            $balance->cash_balance -= $amount;
            $balance->bank_balance += $amount;
        } else {
            $balance->bank_balance -= $amount;
            $balance->cash_balance += $amount;
        }
        
        $balance->save();

        CashMovement::create([
            'movement_type' => 'transfer',
            'source' => $from,
            'destination' => $to,
            'amount' => $amount,
            'description' => "تحويل من {$from} إلى {$to}",
        ]);
    }
}
