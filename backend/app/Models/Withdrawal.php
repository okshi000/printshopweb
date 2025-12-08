<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Withdrawal extends Model
{
    protected $fillable = [
        'withdrawn_by',
        'amount',
        'payment_method',
        'withdrawal_date',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'withdrawal_date' => 'date',
    ];

    protected static function booted(): void
    {
        static::created(function (Withdrawal $withdrawal) {
            CashBalance::updateBalance($withdrawal->payment_method, -$withdrawal->amount);
            
            CashMovement::create([
                'movement_type' => 'withdrawal',
                'source' => $withdrawal->payment_method,
                'amount' => $withdrawal->amount,
                'reference_type' => 'withdrawal',
                'reference_id' => $withdrawal->id,
                'description' => "سحب شخصي بواسطة: {$withdrawal->withdrawn_by}",
            ]);
        });
    }
}
