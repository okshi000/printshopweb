<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Debt extends Model
{
    protected $fillable = [
        'debtor_name',
        'amount',
        'remaining_amount',
        'debt_date',
        'due_date',
        'notes',
        'is_paid',
    ];

    protected $appends = [
        'paid_amount',
        'status',
        'description',
    ];

    protected static function booted(): void
    {
        static::created(function (Debt $debt) {
            // When a debt is created, it means we gave money to the debtor
            // So we need to subtract from cash balance
            // Note: This assumes debts are money we lent out
            // If debts are money owed to us, this should be income instead
            CashBalance::updateBalance('cash', -$debt->amount); // Assuming cash by default
            
            CashMovement::create([
                'movement_type' => 'expense',
                'source' => 'cash',
                'amount' => $debt->amount,
                'reference_type' => 'debt_created',
                'reference_id' => $debt->id,
                'description' => "إنشاء دين لـ: {$debt->debtor_name}",
            ]);
        });
    }

    public function addRepayment(float $amount, string $paymentMethod, ?string $notes = null): void
    {
        $this->repayments()->create([
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'payment_date' => now(),
            'notes' => $notes,
        ]);

        $this->remaining_amount -= $amount;
        if ($this->remaining_amount <= 0) {
            $this->remaining_amount = 0;
            $this->is_paid = true;
        }
        $this->save();

        CashBalance::updateBalance($paymentMethod, $amount);
        
        CashMovement::create([
            'movement_type' => 'income',
            'source' => $paymentMethod,
            'amount' => $amount,
            'reference_type' => 'debt_repayment',
            'reference_id' => $this->id,
            'description' => "سداد دين من: {$this->debtor_name}",
        ]);
    }

    // Accessors for frontend compatibility
    public function getPaidAmountAttribute(): float
    {
        return $this->amount - $this->remaining_amount;
    }

    public function getStatusAttribute(): string
    {
        if ($this->is_paid) {
            return 'paid';
        }
        
        $paid = $this->amount - $this->remaining_amount;
        if ($paid > 0) {
            return 'partial';
        }
        
        return 'pending';
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->notes;
    }
}
