<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'type',
        'phone',
        'address',
        'notes',
        'total_debt',
        'is_active',
    ];

    protected $casts = [
        'total_debt' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'balance_due',
        'total_purchases',
        'total_paid',
    ];

    public function costs(): HasMany
    {
        return $this->hasMany(ItemCost::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function recalculateBalance(): void
    {
        // حساب التكاليف غير المدفوعة فقط
        $totalCosts = $this->costs()->where('is_paid', false)->sum('amount');
        $totalPayments = $this->payments()->sum('amount');
        $this->total_debt = $totalCosts - $totalPayments;
        $this->save();
    }

    // Accessor methods for frontend compatibility
    public function getBalanceDueAttribute(): float
    {
        return (float) $this->total_debt;
    }

    public function getTotalPurchasesAttribute(): float
    {
        return (float) $this->costs()->where('is_paid', false)->sum('amount');
    }

    public function getTotalPaidAttribute(): float
    {
        return (float) $this->payments()->sum('amount');
    }
}
