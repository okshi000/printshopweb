<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    protected $fillable = [
        'name',
        'unit',
        'current_quantity',
        'minimum_quantity',
        'unit_cost',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'current_quantity' => 'decimal:2',
        'minimum_quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('current_quantity', '<=', 'minimum_quantity');
    }

    public function addStock(float $quantity, ?float $unitCost = null, ?string $notes = null): void
    {
        $this->current_quantity += $quantity;
        if ($unitCost) {
            $this->unit_cost = $unitCost;
        }
        $this->save();

        $this->movements()->create([
            'movement_type' => 'in',
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'total_cost' => $unitCost ? $quantity * $unitCost : null,
            'movement_date' => now(),
            'notes' => $notes,
        ]);
    }

    public function removeStock(float $quantity, ?string $notes = null): void
    {
        $this->current_quantity -= $quantity;
        $this->save();

        $this->movements()->create([
            'movement_type' => 'out',
            'quantity' => $quantity,
            'movement_date' => now(),
            'notes' => $notes,
        ]);
    }
}
