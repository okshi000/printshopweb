<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DebtAccount extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'total_debt',
        'total_paid',
        'balance',
    ];

    /**
     * Get all debts for this account
     */
    public function debts(): HasMany
    {
        return $this->hasMany(Debt::class);
    }

    /**
     * Get total debt amount
     */
    public function getTotalDebtAttribute(): float
    {
        return (float) $this->debts()->sum('amount');
    }

    /**
     * Get total paid amount
     */
    public function getTotalPaidAttribute(): float
    {
        return (float) $this->debts()->sum('paid_amount');
    }

    /**
     * Get remaining balance (total debt - total paid)
     */
    public function getBalanceAttribute(): float
    {
        return $this->total_debt - $this->total_paid;
    }

    /**
     * Get active debts count
     */
    public function getActiveDebtsCountAttribute(): int
    {
        return $this->debts()->where('is_paid', false)->count();
    }
}
