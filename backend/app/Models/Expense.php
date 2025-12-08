<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    protected $fillable = [
        'expense_type_id',
        'amount',
        'payment_method',
        'expense_date',
        'notes',
        'attachment',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date',
    ];

    public function expenseType(): BelongsTo
    {
        return $this->belongsTo(ExpenseType::class);
    }

    protected static function booted(): void
    {
        static::created(function (Expense $expense) {
            CashBalance::updateBalance($expense->payment_method, -$expense->amount);
            
            CashMovement::create([
                'movement_type' => 'expense',
                'source' => $expense->payment_method,
                'amount' => $expense->amount,
                'reference_type' => 'expense',
                'reference_id' => $expense->id,
                'description' => "مصروف: {$expense->expenseType->name}",
            ]);
        });
    }
}
