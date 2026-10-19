<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KanbanCard extends Model
{
    protected $table = 'kanban_cards';

    protected $fillable = [
        'invoice_id',
        'invoice_item_id',
        'item_name',
        'description',
        'quantity',
        'status',
        'sort_order',
        'notes',
        'assigned_to',
        'delivered_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'sort_order' => 'integer',
        'delivered_at' => 'datetime',
    ];

    protected $appends = [
        'customer_name',
        'invoice_number',
        'delivery_date',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(InvoiceItem::class, 'invoice_item_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function column(): BelongsTo
    {
        return $this->belongsTo(KanbanColumn::class, 'status', 'key');
    }

    public function getCustomerNameAttribute(): ?string
    {
        return $this->invoice?->customer?->name;
    }

    public function getInvoiceNumberAttribute(): ?string
    {
        return $this->invoice?->invoice_number;
    }

    public function getDeliveryDateAttribute(): ?string
    {
        return $this->invoice?->delivery_date?->format('Y-m-d');
    }
}
