<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashMovement extends Model
{
    protected $fillable = [
        'movement_type',
        'source',
        'destination',
        'amount',
        'reference_type',
        'reference_id',
        'description',
        'movement_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'movement_date' => 'datetime',
    ];
}
