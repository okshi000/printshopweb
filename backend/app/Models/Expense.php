<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    protected $fillable = [
        'expense_type_id',
        'custody_id',
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

    public function custody(): BelongsTo
    {
        return $this->belongsTo(Custody::class);
    }

    protected static function booted(): void
    {
        static::created(function (Expense $expense) {
            // إذا كان المصروف ناتجاً عن تسوية عهدة، فلا يتم خصم المبلغ من رصيد الخزنة/الدرج مرة أخرى
            // لأن المبلغ خُصم بالفعل عند صرف العهدة مسبقاً
            if ($expense->custody_id) {
                return;
            }

            $method = $expense->payment_method ?: 'drawer';
            CashBalance::updateBalance($method, -$expense->amount);
            
            CashMovement::create([
                'movement_type' => 'expense',
                'source' => $method,
                'amount' => $expense->amount,
                'reference_type' => 'expense',
                'reference_id' => $expense->id,
                'description' => "مصروف: {$expense->expenseType->name}" . ($expense->notes ? " - {$expense->notes}" : ''),
                'movement_date' => now(),
            ]);
        });
    }
}
