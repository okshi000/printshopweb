<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\KanbanCard;
use App\Models\KanbanColumn;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class KanbanController extends Controller
{
    /**
     * التحقق من وجود مراحل في جدول kanban_columns وبذر الافتراضية عند الحاجة
     */
    protected function ensureDefaultColumnsExist(): void
    {
        if (KanbanColumn::count() === 0) {
            $defaultColumns = [
                ['key' => 'in_design',    'title' => 'في التصميم',         'color' => 'sky',     'icon' => 'Sparkles',     'sort_order' => 1, 'is_initial' => true,  'is_final' => false],
                ['key' => 'in_printing',  'title' => 'في الطباعة',         'color' => 'indigo',  'icon' => 'Package',      'sort_order' => 2, 'is_initial' => false, 'is_final' => false],
                ['key' => 'in_finishing', 'title' => 'في التشطيب',        'color' => 'amber',   'icon' => 'Layers',       'sort_order' => 3, 'is_initial' => false, 'is_final' => false],
                ['key' => 'in_office',    'title' => 'في المكتب (جاهز)',   'color' => 'emerald', 'icon' => 'Boxes',        'sort_order' => 4, 'is_initial' => false, 'is_final' => false],
                ['key' => 'delivered',    'title' => 'تم التسليم',        'color' => 'slate',   'icon' => 'CheckCircle2', 'sort_order' => 5, 'is_initial' => false, 'is_final' => true],
            ];

            foreach ($defaultColumns as $col) {
                KanbanColumn::create($col);
            }
        }
    }

    /**
     * جلب جميع الكروت مجمعة حسب المراحل الديناميكية مع نسب الإنجاز والفلترة
     */
    public function index(Request $request): JsonResponse
    {
        $this->ensureDefaultColumnsExist();

        $columnsConfig = KanbanColumn::orderBy('sort_order', 'asc')->get();
        $finalKeys = $columnsConfig->where('is_final', true)->pluck('key')->toArray();
        if (empty($finalKeys)) {
            $finalKeys = ['delivered'];
        }

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
            $allInvoiceCards = KanbanCard::whereIn('invoice_id', $invoiceIds)->get();
            $groupedByInvoice = $allInvoiceCards->groupBy('invoice_id');

            foreach ($groupedByInvoice as $invId => $cards) {
                $total = $cards->count();
                $delivered = $cards->whereIn('status', $finalKeys)->count();
                $inOffice = $cards->where('status', 'in_office')->count();
                $readyOrDelivered = $inOffice + $delivered;

                $isAllInOffice = ($inOffice === $total && $total > 0);
                $isAllReady = ($readyOrDelivered === $total && $total > 0);
                $isAllDelivered = ($delivered === $total && $total > 0);

                $completionText = '';
                if ($isAllDelivered) {
                    $completionText = "الطلبية مسلّمة بالكامل ({$total}/{$total})";
                } elseif ($isAllReady) {
                    $completionText = "الطلبية مكتملة بالكامل ({$total}/{$total})";
                } else {
                    $completionText = "جاهز - بانتظار اكتمال الطلب ({$readyOrDelivered} من {$total} جاهز)";
                }

                $invoiceStats[$invId] = [
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

        // تحضير الأعمدة الديناميكية
        $columns = [];
        $stagesMap = [];
        $counts = [
            'total' => $allCards->count(),
            'overdue' => 0,
        ];

        foreach ($columnsConfig as $col) {
            $columns[$col->key] = [];
            $stagesMap[$col->key] = $col->title;
            $counts[$col->key] = 0;
        }

        $initialKey = KanbanColumn::getInitialStageKey();
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

            $isCardDelivered = in_array($card->status, $finalKeys);

            if ($deliveryDate) {
                $deliveryDateStr = $deliveryDate->format('Y-m-d');
                $diff = (int) now()->startOfDay()->diffInDays($deliveryDate->startOfDay(), false);
                $daysLeft = $diff;

                if (!$isCardDelivered) {
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

            // إذا كان الكرت ينتمي لمرحلة موجودة
            if (isset($columns[$card->status])) {
                $columns[$card->status][] = $cardData;
                $counts[$card->status] = ($counts[$card->status] ?? 0) + 1;
            } else {
                // إذا حُذفت مرحلته سابقاً، نضعه مؤقتاً في المرحلة الأولى
                if (isset($columns[$initialKey])) {
                    $cardData['status'] = $initialKey;
                    $columns[$initialKey][] = $cardData;
                    $counts[$initialKey] = ($counts[$initialKey] ?? 0) + 1;
                }
            }
        }

        $counts['overdue'] = $overdueCount;

        // قائمة العملاء للفلترة
        $customersList = DB::table('customers')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'columns_config' => $columnsConfig,
            'stages' => $stagesMap,
            'columns' => $columns,
            'counts' => $counts,
            'customers' => $customersList,
        ]);
    }

    /**
     * تحديث حالة وترتيب الكرت عند السحب والإفلات (Drag & Drop)
     */
    public function updateCard(Request $request, KanbanCard $card): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|max:50|exists:kanban_columns,key',
            'sort_order' => 'nullable|integer',
            'notes' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $oldStatus = $card->status;
        $newStatus = $validated['status'];

        $targetColumn = KanbanColumn::where('key', $newStatus)->first();
        $isFinal = $targetColumn ? $targetColumn->is_final : ($newStatus === 'delivered');
        $oldColumn = KanbanColumn::where('key', $oldStatus)->first();
        $wasFinal = $oldColumn ? $oldColumn->is_final : ($oldStatus === 'delivered');

        DB::transaction(function () use ($card, $validated, $newStatus, $oldStatus, $isFinal, $wasFinal) {
            $deliveredAt = $card->delivered_at;
            if ($isFinal && !$wasFinal) {
                $deliveredAt = now();
            } elseif (!$isFinal) {
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
                $finalKeys = KanbanColumn::where('is_final', true)->pluck('key')->toArray();
                if (empty($finalKeys)) {
                    $finalKeys = ['delivered'];
                }

                $totalCards = $invoice->kanbanCards()->count();
                $deliveredCards = $invoice->kanbanCards()->whereIn('status', $finalKeys)->count();
                $inOfficeCards = $invoice->kanbanCards()->where('status', 'in_office')->count();

                if ($totalCards > 0 && $deliveredCards === $totalCards) {
                    $invoice->update(['status' => 'delivered']);
                } elseif ($totalCards > 0 && ($inOfficeCards + $deliveredCards) === $totalCards) {
                    $invoice->update(['status' => 'ready']);
                } elseif (!$isFinal) {
                    if ($invoice->status === 'new' || $invoice->status === 'delivered') {
                        $invoice->update(['status' => 'in_progress']);
                    }
                }
            }
        });

        $stageName = KanbanColumn::where('key', $newStatus)->value('title') ?? $newStatus;
        $oldStageName = KanbanColumn::where('key', $oldStatus)->value('title') ?? $oldStatus;

        ActivityLog::log(
            'update',
            'kanban',
            "نقل البند '{$card->item_name}' (فاتورة {$card->invoice_number}) من '{$oldStageName}' إلى '{$stageName}'",
            $card->id
        );

        return response()->json([
            'message' => 'تم تحديث مرحلة البند بنجاح',
            'card' => $card->fresh(['invoice.customer', 'assignedUser']),
        ]);
    }

    /**
     * جلب قائمة المراحل/الأعمدة مع عدد الكروت في كل مرحلة
     */
    public function getColumns(): JsonResponse
    {
        $this->ensureDefaultColumnsExist();

        $columns = KanbanColumn::orderBy('sort_order', 'asc')
            ->get()
            ->map(function ($col) {
                $col->cards_count = KanbanCard::where('status', $col->key)
                    ->whereHas('invoice', function ($q) {
                        $q->where('is_archived', false);
                    })
                    ->count();
                return $col;
            });

        return response()->json($columns);
    }

    /**
     * إنشاء مرحلة / عمود جديد في لوحة كانبان
     */
    public function storeColumn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'key' => 'nullable|string|max:50|regex:/^[a-zA-Z0-9_\-]+$/|unique:kanban_columns,key',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:50',
            'is_initial' => 'nullable|boolean',
            'is_final' => 'nullable|boolean',
        ]);

        $key = !empty($validated['key'])
            ? strtolower(trim($validated['key']))
            : KanbanColumn::generateUniqueKey($validated['title']);

        $nextSort = (int) (KanbanColumn::max('sort_order') ?? 0) + 1;
        $isInitial = !empty($validated['is_initial']);

        if ($isInitial) {
            // إلغاء الافتراضي عن باقي الأعمدة لضمان وجود عمود أولي وحيد
            KanbanColumn::where('is_initial', true)->update(['is_initial' => false]);
        }

        $column = KanbanColumn::create([
            'key' => $key,
            'title' => trim($validated['title']),
            'color' => $validated['color'] ?? 'sky',
            'icon' => $validated['icon'] ?? 'Layers',
            'sort_order' => $nextSort,
            'is_initial' => $isInitial,
            'is_final' => !empty($validated['is_final']),
        ]);

        ActivityLog::log(
            'create',
            'kanban',
            "إضافة مرحلة جديدة في لوحة كانبان: '{$column->title}'",
            $column->id
        );

        return response()->json([
            'message' => 'تم إنشاء المرحلة بنجاح',
            'column' => $column,
        ], 201);
    }

    /**
     * تحديث بيانات مرحلة / عمود
     */
    public function updateColumn(Request $request, KanbanColumn $column): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:100',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:50',
            'is_initial' => 'nullable|boolean',
            'is_final' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        if (isset($validated['is_initial']) && $validated['is_initial']) {
            KanbanColumn::where('id', '!=', $column->id)
                ->where('is_initial', true)
                ->update(['is_initial' => false]);
        }

        $column->update([
            'title' => isset($validated['title']) ? trim($validated['title']) : $column->title,
            'color' => $validated['color'] ?? $column->color,
            'icon' => $validated['icon'] ?? $column->icon,
            'is_initial' => isset($validated['is_initial']) ? (bool) $validated['is_initial'] : $column->is_initial,
            'is_final' => isset($validated['is_final']) ? (bool) $validated['is_final'] : $column->is_final,
            'sort_order' => isset($validated['sort_order']) ? (int) $validated['sort_order'] : $column->sort_order,
        ]);

        ActivityLog::log(
            'update',
            'kanban',
            "تعديل بيانات المرحلة: '{$column->title}'",
            $column->id
        );

        return response()->json([
            'message' => 'تم تحديث المرحلة بنجاح',
            'column' => $column,
        ]);
    }

    /**
     * حذف مرحلة / عمود مع نقل الكروت الموجودة إلى مرحلة بديلة
     */
    public function destroyColumn(Request $request, KanbanColumn $column): JsonResponse
    {
        if (KanbanColumn::count() <= 1) {
            return response()->json([
                'message' => 'لا يمكن حذف آخر مرحلة متبقية في لوحة كانبان.',
            ], 422);
        }

        $cardsCount = KanbanCard::where('status', $column->key)->count();

        // تحديد المرحلة البديلة لنقل الكروت
        $fallbackKey = $request->input('fallback_column_key');
        if (empty($fallbackKey) || !KanbanColumn::where('key', $fallbackKey)->where('id', '!=', $column->id)->exists()) {
            $fallbackKey = KanbanColumn::where('id', '!=', $column->id)->where('is_initial', true)->value('key')
                ?? KanbanColumn::where('id', '!=', $column->id)->orderBy('sort_order', 'asc')->value('key');
        }

        DB::transaction(function () use ($column, $fallbackKey, $cardsCount) {
            if ($cardsCount > 0 && $fallbackKey) {
                KanbanCard::where('status', $column->key)->update(['status' => $fallbackKey]);
            }

            // إذا كانت المرحلة المحذوفة هي الافتراضية، ننقل الافتراضي لأول مرحلة متبقية
            if ($column->is_initial) {
                $nextInitial = KanbanColumn::where('id', '!=', $column->id)->orderBy('sort_order', 'asc')->first();
                if ($nextInitial) {
                    $nextInitial->update(['is_initial' => true]);
                }
            }

            $column->delete();
        });

        ActivityLog::log(
            'delete',
            'kanban',
            "حذف المرحلة '{$column->title}' ونقل ({$cardsCount}) كرت إلى المرحلة البديلة '{$fallbackKey}'",
            $column->id
        );

        return response()->json([
            'message' => "تم حذف المرحلة '{$column->title}' بنجاح" . ($cardsCount > 0 ? " ونقل {$cardsCount} كرت لمرحلة أخرى" : ''),
        ]);
    }

    /**
     * إعادة ترتيب الأعمدة
     */
    public function reorderColumns(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'column_ids' => 'required|array',
            'column_ids.*' => 'integer|exists:kanban_columns,id',
        ]);

        foreach ($validated['column_ids'] as $index => $id) {
            KanbanColumn::where('id', $id)->update(['sort_order' => $index + 1]);
        }

        return response()->json([
            'message' => 'تم حفظ ترتيب المراحل بنجاح',
            'columns' => KanbanColumn::orderBy('sort_order', 'asc')->get(),
        ]);
    }

    /**
     * خيار التسليم السريع: تسليم كامل بنود الفاتورة دفعة واحدة
     */
    public function batchDeliver(Invoice $invoice): JsonResponse
    {
        $finalKey = KanbanColumn::where('is_final', true)->value('key') ?? 'delivered';

        DB::transaction(function () use ($invoice, $finalKey) {
            $invoice->kanbanCards()->update([
                'status' => $finalKey,
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
        $this->ensureDefaultColumnsExist();

        $initialKey = KanbanColumn::getInitialStageKey();
        $finalKey = KanbanColumn::where('is_final', true)->value('key') ?? 'delivered';

        $count = 0;
        $itemsWithoutCards = InvoiceItem::whereDoesntHave('kanbanCard')
            ->whereHas('invoice', function ($q) {
                $q->where('is_archived', false);
            })
            ->with('invoice')
            ->get();

        foreach ($itemsWithoutCards as $item) {
            $status = match ($item->invoice?->status) {
                'delivered' => $finalKey,
                'ready' => 'in_office',
                'in_progress' => 'in_printing',
                default => $initialKey,
            };

            KanbanCard::create([
                'invoice_id' => $item->invoice_id,
                'invoice_item_id' => $item->id,
                'item_name' => $item->product_name ?? 'بند',
                'description' => $item->description,
                'quantity' => $item->quantity ?? 1,
                'status' => $status,
                'sort_order' => $count++,
                'delivered_at' => ($status === $finalKey) ? now() : null,
            ]);
        }

        return response()->json([
            'message' => "تمت المزامنة وتوليد {$count} كرت كانبان بنجاح",
            'synced_count' => $count,
        ]);
    }
}
