<?php

namespace App\Observers;

use App\Models\InvoiceItem;
use App\Models\KanbanCard;

class InvoiceItemObserver
{
    /**
     * Handle the InvoiceItem "created" event.
     */
    public function created(InvoiceItem $item): void
    {
        // تجنب التكرار إذا كان الكرت موجوداً بالفعل
        $existingCard = KanbanCard::where('invoice_item_id', $item->id)->first();
        if ($existingCard) {
            return;
        }

        $initialStage = \App\Models\KanbanColumn::getInitialStageKey();
        $nextSortOrder = (int) (KanbanCard::where('status', $initialStage)->max('sort_order') ?? 0) + 1;

        KanbanCard::create([
            'invoice_id' => $item->invoice_id,
            'invoice_item_id' => $item->id,
            'item_name' => $item->product_name ?? 'بند جديد',
            'description' => $item->description,
            'quantity' => $item->quantity ?? 1,
            'status' => $initialStage,
            'sort_order' => $nextSortOrder,
        ]);
    }

    /**
     * Handle the InvoiceItem "updated" event.
     */
    public function updated(InvoiceItem $item): void
    {
        $card = KanbanCard::where('invoice_item_id', $item->id)->first();
        if ($card) {
            $card->update([
                'item_name' => $item->product_name ?? $card->item_name,
                'description' => $item->description ?? $card->description,
                'quantity' => $item->quantity ?? $card->quantity,
            ]);
        }
    }

    /**
     * Handle the InvoiceItem "deleted" event.
     */
    public function deleted(InvoiceItem $item): void
    {
        KanbanCard::where('invoice_item_id', $item->id)->delete();
    }
}
