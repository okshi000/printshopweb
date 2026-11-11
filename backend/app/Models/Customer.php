<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'phone2',
        'whatsapp_name',
        'whatsapp_phone',
        'address',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function proformaInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->withoutGlobalScope('notProforma')->where('invoices.is_proforma', true);
    }

    public function archivedInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->withoutGlobalScope('notArchived')->where('invoices.is_archived', true);
    }

    public function allInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->withoutGlobalScope('notArchived')->withoutGlobalScope('notProforma');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getTotalDebtAttribute(): float
    {
        return (float) $this->invoices()
            ->where('invoices.is_archived', false)
            ->where('invoices.is_proforma', false)
            ->sum('remaining_amount');
    }
}
