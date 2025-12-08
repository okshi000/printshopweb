<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierPayment extends Model
{
    protected $fillable = [
        'supplier_id',
        'amount',
        'payment_method',
        'notes',
        'settled_items',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'settled_items' => 'array',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    protected static function booted(): void
    {
        static::saved(function (SupplierPayment $payment) {
            $payment->supplier->recalculateBalance();
            CashBalance::updateBalance($payment->payment_method, -$payment->amount);
            
            CashMovement::create([
                'movement_type' => 'expense',
                'source' => $payment->payment_method,
                'amount' => $payment->amount,
                'reference_type' => 'supplier_payment',
                'reference_id' => $payment->id,
                'description' => "دفعة للمورد: {$payment->supplier->name}",
            ]);
        });

        static::deleted(function (SupplierPayment $payment) {
            $payment->supplier->recalculateBalance();
        });
    }
}
