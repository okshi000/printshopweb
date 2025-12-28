<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Debt extends Model
{
    protected $fillable = [
        'debt_account_id',
        'customer_id',
        'debtor_name',
        'source',
        'amount',
        'remaining_amount',
        'paid_amount',
        'debt_date',
        'due_date',
        'notes',
        'is_paid',
    ];

    protected $appends = [
        'status',
        'description',
        'source_label',
    ];

    /**
     * Get the debt account that owns this debt
     */
    public function debtAccount(): BelongsTo
    {
        return $this->belongsTo(DebtAccount::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function repayments(): HasMany
    {
        return $this->hasMany(DebtRepayment::class);
    }

    protected static function booted(): void
    {
        static::created(function (Debt $debt) {
            // When a debt is created, it means we gave money to the debtor
            // So we need to subtract from the specified source (cash or bank)
            $source = $debt->source ?? 'cash';
            CashBalance::updateBalance($source, -$debt->amount);
            
            $sourceLabel = $source === 'bank' ? 'البنك' : 'الكاش';
            CashMovement::create([
                'movement_type' => 'expense',
                'source' => $source,
                'amount' => $debt->amount,
                'reference_type' => 'debt_created',
                'reference_id' => $debt->id,
                'description' => "إنشاء دين لـ: {$debt->debtor_name} من {$sourceLabel}",
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

        $this->paid_amount += $amount;
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
    public function getStatusAttribute(): string
    {
        if ($this->is_paid) {
            return 'paid';
        }
        
        if ($this->paid_amount > 0) {
            return 'partial';
        }
        
        return 'pending';
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->notes;
    }

    /**
     * Get human-readable source label
     */
    public function getSourceLabelAttribute(): string
    {
        return $this->source === 'bank' ? 'البنك' : 'الكاش';
    }
}
