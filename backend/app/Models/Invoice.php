<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_number',
        'customer_id',
        'invoice_date',
        'delivery_date',
        'status',
        'subtotal',
        'discount',
        'total',
        'total_cost',
        'profit',
        'paid_amount',
        'remaining_amount',
        'notes',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'delivery_date' => 'date',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'profit' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
    ];

    protected $appends = [
        'customer_name',
        'customer_phone',
        'total_amount',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(InvoicePayment::class);
    }

    public static function generateInvoiceNumber(): string
    {
        $year = date('Y');
        $lastInvoice = static::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastInvoice ? ((int) substr($lastInvoice->invoice_number, -4)) + 1 : 1;
        
        return "INV-{$year}-" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    public function recalculateTotals(): void
    {
        $this->subtotal = $this->items()->sum('total_price');
        $this->total = $this->subtotal - $this->discount;
        $this->total_cost = $this->items()->sum('total_cost');
        $this->profit = $this->total - $this->total_cost;
        $this->paid_amount = $this->payments()->sum('amount');
        $this->remaining_amount = $this->total - $this->paid_amount;
        $this->save();
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    // Accessor methods for frontend compatibility
    public function getCustomerNameAttribute(): ?string
    {
        return $this->customer?->name;
    }

    public function getCustomerPhoneAttribute(): ?string
    {
        return $this->customer?->phone;
    }

    public function getTotalAmountAttribute(): float
    {
        return (float) $this->total;
    }
}
