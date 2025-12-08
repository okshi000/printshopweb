<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemCost extends Model
{
    protected $fillable = [
        'invoice_item_id',
        'supplier_id',
        'cost_type',
        'amount',
        'is_internal',
        'notes',
        'is_paid',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_internal' => 'boolean',
        'is_paid' => 'boolean',
    ];

    public function invoiceItem(): BelongsTo
    {
        return $this->belongsTo(InvoiceItem::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
    
    // Helper method to get invoice through invoice_item
    public function getInvoiceAttribute()
    {
        return $this->invoiceItem?->invoice;
    }

    protected static function booted(): void
    {
        static::saved(function (ItemCost $cost) {
            if ($cost->supplier_id && !$cost->is_internal) {
                $cost->supplier->recalculateBalance();
            }
        });

        static::deleted(function (ItemCost $cost) {
            if ($cost->supplier_id && !$cost->is_internal) {
                $cost->supplier->recalculateBalance();
            }
        });
    }
}
