<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Custody extends Model
{
    protected $fillable = [
        'employee_name',
        'user_id',
        'amount',
        'spent_amount',
        'returned_amount',
        'status',
        'source',
        'purpose',
        'disbursed_at',
        'settled_at',
        'expense_type_id',
        'expense_id',
        'settlement_notes',
        'receipt_attachment',
        'created_by',
        'settled_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'returned_amount' => 'decimal:2',
        'disbursed_at' => 'datetime',
        'settled_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function expenseType(): BelongsTo
    {
        return $this->belongsTo(ExpenseType::class);
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function settler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'settled_by');
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', 'open');
    }

    public function scopeSettled(Builder $query): Builder
    {
        return $query->where('status', 'settled');
    }
}

