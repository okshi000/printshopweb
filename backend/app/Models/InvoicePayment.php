<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoicePayment extends Model
{
    protected $fillable = [
        'invoice_id',
        'amount',
        'payment_method',
        'payment_type',
        'payment_date',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'datetime',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    protected static function booted(): void
    {
        static::saved(function (InvoicePayment $payment) {
            $payment->invoice->recalculateTotals();
            CashBalance::updateBalance($payment->payment_method, $payment->amount);
            
            CashMovement::create([
                'movement_type' => 'income',
                'source' => $payment->payment_method,
                'amount' => $payment->amount,
                'reference_type' => 'invoice_payment',
                'reference_id' => $payment->id,
                'description' => "دفعة للفاتورة #{$payment->invoice->invoice_number}",
            ]);
        });
    }
}
