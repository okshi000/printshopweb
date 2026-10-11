<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\KanbanCard;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class KanbanController extends Controller
{
    /**
     * المراحل الـ 5 المعتمدة للوحة الكانبان
     */
    public const STAGES = [
        'in_design'    => 'في التصميم',
        'in_printing'  => 'في الطباعة',
        'in_finishing' => 'في التشطيب',
        'in_office'    => 'في المكتب',
        'delivered'    => 'تم التسليم',
    ];

    /**
     * جلب جميع الكروت مجمعة حسب المراحل الخمس مع حساب نسب الإنجاز والفلترة
     */
    public function index(Request $request): JsonResponse
    {
        $query = KanbanCard::with([
            'invoice' => function ($q) {
                $q->with('customer');
            },
            'assignedUser:id,name,full_name',
        ]);

        // تجاهل كروت الفواتير المؤرشفة
        $query->whereHas('invoice', function ($q) {
            $q->where('is_archived', false);
        });

        // 1. فلترة البحث
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('invoice', function ($iq) use ($search) {
                      $iq->where('invoice_number', 'like', "%{$search}%")
                         ->orWhereHas('customer', function ($cq) use ($search) {
                             $cq->where('name', 'like', "%{$search}%");
                         });
                  });
            });
        }

        // 2. فلترة بالعميل
        if ($request->filled('customer_id')) {
            $customerId = $request->customer_id;
            $query->whereHas('invoice', function ($q) use ($customerId) {
                $q->where('customer_id', $customerId);
            });
        }

        // 3. فلترة برقم/معرف الفاتورة
        if ($request->filled('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }

        // 4. فلترة تاريخ التسليم ومستوى الاستعجال (Urgency)
        $today = now()->toDateString();
        $tomorrow = now()->addDay()->toDateString();

        if ($request->filled('urgency')) {
            $urgency = $request->urgency;
            $query->whereHas('invoice', function ($q) use ($urgency, $today, $tomorrow) {
                if ($urgency === 'overdue') {
                    $q->whereNotNull('delivery_date')->whereDate('delivery_date', '<', $today);
                } elseif ($urgency === 'today') {
                    $q->whereDate('delivery_date', $today);
                } elseif ($urgency === 'tomorrow') {
                    $q->whereDate('delivery_date', $tomorrow);
                } elseif ($urgency === 'upcoming') {
                    $q->whereDate('delivery_date', '>=', $today);
                }
            });
        }

        $allCards = $query->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        // حساب إحصائيات اكتمال بنود كل فاتورة (Order Items Completion Status)
        $invoiceIds = $allCards->pluck('invoice_id')->unique()->values();
        $invoiceStats = [];

        if ($invoiceIds->isNotEmpty()) {
            $statsRows = KanbanCard::whereIn('invoice_id', $invoiceIds)
                ->select(
                    'invoice_id',
                    DB::raw('COUNT(*) as total_items'),
                    DB::raw("SUM(CASE WHEN status = 'in_office' THEN 1 ELSE 0 END) as in_office_count"),
                    DB::raw("SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_count")
                )
                ->groupBy('invoice_id')
                ->get();

            foreach ($statsRows as $row) {
                $total = (int) $row->total_items;
                $inOffice = (int) $row->in_office_count;
                $delivered = (int) $row->delivered_count;
                $readyOrDelivered = $inOffice + $delivered;

                $isAllInOffice = ($inOffice === $total);
                $isAllReady = ($readyOrDelivered === $total);
                $isAllDelivered = ($delivered === $total);

                $completionText = '';
                if ($isAllDelivered) {
                    $completionText = "الطلبية مسلّمة بالكامل ({$total}/{$total})";
                } elseif ($isAllReady) {
                    $completionText = "الطلبية مكتملة بالكامل ({$total}/{$total})";
                } else {
                    $completionText = "جاهز - بانتظار اكتمال الطلب ({$readyOrDelivered} من {$total} جاهز)";
                }

                $invoiceStats[$row->invoice_id] = [
                    'total_items' => $total,
                    'in_office_count' => $inOffice,
                    'delivered_count' => $delivered,
                    'ready_count' => $readyOrDelivered,
                    'is_all_in_office' => $isAllInOffice,
                    'is_all_ready' => $isAllReady,
                    'is_all_delivered' => $isAllDelivered,
                    'completion_text' => $completionText,
                ];
            }
        }

        // تقسيم الكروت للأعمدة الخمسة مع إرفاق حالة التجميع
        $columns = [
            'in_design'    => [],
            'in_printing'  => [],
            'in_finishing' => [],
            'in_office'    => [],
            'delivered'    => [],
        ];

        $overdueCount = 0;

        foreach ($allCards as $card) {
            $invId = $card->invoice_id;
            $stats = $invoiceStats[$invId] ?? [
                'total_items' => 1,
                'in_office_count' => 0,
                'delivered_count' => 0,
                'ready_count' => 0,
                'is_all_in_office' => false,
                'is_all_ready' => false,
                'is_all_delivered' => false,
                'completion_text' => '',
            ];

            // حساب حالة موعد التسليم
            $deliveryDate = $card->invoice?->delivery_date;
            $isOverdue = false;
            $isToday = false;
            $isTomorrow = false;
            $daysLeft = null;

            if ($deliveryDate) {
                $deliveryDateStr = $deliveryDate->format('Y-m-d');
                $diff = (int) now()->startOfDay()->diffInDays($deliveryDate->startOfDay(), false);
                $daysLeft = $diff;

                if ($card->status !== 'delivered') {
                    if ($deliveryDateStr < $today) {
                        $isOverdue = true;
                        $overdueCount++;
                    } elseif ($deliveryDateStr === $today) {
                        $isToday = true;
                    } elseif ($deliveryDateStr === $tomorrow) {
                        $isTomorrow = true;
                    }
                }
            }

            $cardData = [
                'id' => $card->id,
                'invoice_id' => $card->invoice_id,
                'invoice_item_id' => $card->invoice_item_id,
                'item_name' => $card->item_name,
                'description' => $card->description,
                'quantity' => (float) $card->quantity,
                'status' => $card->status,
                'sort_order' => $card->sort_order,
                'notes' => $card->notes,
                'assigned_to' => $card->assigned_to,
                'assigned_user' => $card->assignedUser,
                'delivered_at' => $card->delivered_at?->format('Y-m-d H:i'),
                'created_at' => $card->created_at->format('Y-m-d H:i'),
                // بيانات الفاتورة المدمجة
                'invoice_number' => $card->invoice?->invoice_number,
                'customer_name' => $card->invoice?->customer?->name ?? 'عميل نقدي',
                'customer_id' => $card->invoice?->customer_id,
                'delivery_date' => $card->invoice?->delivery_date?->format('Y-m-d'),
                // حسابات الاستعجال والتأخير
                'is_overdue' => $isOverdue,
                'is_today' => $isToday,
                'is_tomorrow' => $isTomorrow,
                'days_left' => $daysLeft,
                // منطق التجميع واكتمال الطلب
                'completion_stats' => $stats,
            ];

            if (isset($columns[$card->status])) {
                $columns[$card->status][] = $cardData;
            }
        }

        // قائمة العملاء للفلترة
        $customersList = DB::table('customers')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'stages' => self::STAGES,
            'columns' => $columns,
            'counts' => [
                'in_design'    => count($columns['in_design']),
                'in_printing'  => count($columns['in_printing']),
                'in_finishing' => count($columns['in_finishing']),
                'in_office'    => count($columns['in_office']),
                'delivered'    => count($columns['delivered']),
                'total'        => $allCards->count(),
                'overdue'      => $overdueCount,
            ],
            'customers' => $customersList,
        ]);
    }

    /**
     * تحديث حالة وترتيب الكرت عند السحب والإفلات (Drag & Drop)
     */
    public function updateCard(Request $request, KanbanCard $card): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:in_design,in_printing,in_finishing,in_office,delivered',
            'sort_order' => 'nullable|integer',
            'notes' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $oldStatus = $card->status;
        $newStatus = $validated['status'];

        DB::transaction(function () use ($card, $validated, $newStatus, $oldStatus) {
            $deliveredAt = $card->delivered_at;
            if ($newStatus === 'delivered' && $oldStatus !== 'delivered') {
                $deliveredAt = now();
            } elseif ($newStatus !== 'delivered') {
                $deliveredAt = null;
            }

            $card->update([
                'status' => $newStatus,
                'sort_order' => $validated['sort_order'] ?? $card->sort_order,
                'notes' => $validated['notes'] ?? $card->notes,
                'assigned_to' => $validated['assigned_to'] ?? $card->assigned_to,
                'delivered_at' => $deliveredAt,
            ]);

            // تحديث حالة الفاتورة الأم تلقائياً إذا لزم الأمر
            $invoice = $card->invoice;
            if ($invoice && !$invoice->is_archived) {
                $totalCards = $invoice->kanbanCards()->count();
                $deliveredCards = $invoice->kanbanCards()->where('status', 'delivered')->count();
                $inOfficeCards = $invoice->kanbanCards()->where('status', 'in_office')->count();

                if ($totalCards > 0 && $deliveredCards === $totalCards) {
                    $invoice->update(['status' => 'delivered']);
                } elseif ($totalCards > 0 && ($inOfficeCards + $deliveredCards) === $totalCards) {
                    $invoice->update(['status' => 'ready']);
                } elseif ($newStatus === 'in_printing' || $newStatus === 'in_finishing') {
                    if ($invoice->status === 'new') {
                        $invoice->update(['status' => 'in_progress']);
                    }
                }
            }
        });

        ActivityLog::log(
            'update',
            'kanban',
            "نقل البند '{$card->item_name}' (فاتورة {$card->invoice_number}) من " . (self::STAGES[$oldStatus] ?? $oldStatus) . " إلى " . (self::STAGES[$newStatus] ?? $newStatus),
            $card->id
        );

        return response()->json([
            'message' => 'تم تحديث حالة البند بنجاح',
            'card' => $card->fresh(['invoice.customer', 'assignedUser']),
        ]);
    }

    /**
     * خيار التسليم السريع: تسليم كامل بنود الفاتورة دفعة واحدة
     */
    public function batchDeliver(Invoice $invoice): JsonResponse
    {
        DB::transaction(function () use ($invoice) {
            $invoice->kanbanCards()->update([
                'status' => 'delivered',
                'delivered_at' => now(),
            ]);

            $invoice->update(['status' => 'delivered']);
        });

        ActivityLog::log(
            'update',
            'kanban',
            "تسليم كامل بنود الفاتورة {$invoice->invoice_number} معاً بنجاح",
            $invoice->id
        );

        return response()->json([
            'message' => "تم تسليم كامل بنود الفاتورة {$invoice->invoice_number} بنجاح",
        ]);
    }

    /**
     * أداة المزامنة: توليد كروت الكانبان للبند التي لا تملك كروت من الفواتير السابقة
     */
    public function syncMissing(): JsonResponse
    {
        $count = 0;
        $itemsWithoutCards = InvoiceItem::whereDoesntHave('kanbanCard')
            ->whereHas('invoice', function ($q) {
                $q->where('is_archived', false);
            })
            ->with('invoice')
            ->get();

        foreach ($itemsWithoutCards as $item) {
            $status = match ($item->invoice?->status) {
                'delivered' => 'delivered',
                'ready' => 'in_office',
                'in_progress' => 'in_printing',
                default => 'in_design',
            };

            KanbanCard::create([
                'invoice_id' => $item->invoice_id,
                'invoice_item_id' => $item->id,
                'item_name' => $item->product_name ?? 'بند',
                'description' => $item->description,
                'quantity' => $item->quantity ?? 1,
                'status' => $status,
                'sort_order' => $count++,
                'delivered_at' => $status === 'delivered' ? now() : null,
            ]);
        }

        return response()->json([
            'message' => "تمت المزامنة وتوليد {$count} كرت كانبان بنجاح",
            'synced_count' => $count,
        ]);
    }
}
