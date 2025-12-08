<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'product_id',
        'product_name',
        'description',
        'quantity',
        'unit_price',
        'total_price',
        'total_cost',
        'profit',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'profit' => 'decimal:2',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function costs(): HasMany
    {
        return $this->hasMany(ItemCost::class);
    }

    public function recalculateTotals(): void
    {
        $this->total_price = $this->quantity * $this->unit_price;
        $this->total_cost = $this->costs()->sum('amount');
        $this->profit = $this->total_price - $this->total_cost;
        $this->save();
    }
}
