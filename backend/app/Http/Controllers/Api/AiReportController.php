<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Expense;
use App\Models\CashBalance;
use App\Models\CashMovement;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\InvoiceItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiReportController extends Controller
{
    /**
     * Gemini API endpoint
     */
    private string $geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    /**
     * الحصول على مفتاح API
     */
    private function getApiKey(): string
    {
        return env('GEMINI_API_KEY', '');
    }

    /**
     * جمع البيانات المالية الحالية
     */
    private function gatherFinancialData(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $dateFrom = $dateFrom ?? Carbon::now()->startOfMonth()->toDateString();
        $dateTo = $dateTo ?? Carbon::now()->endOfMonth()->toDateString();

        // بيانات الشهر الحالي
        $currentRevenue = Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])->sum('total');
        $currentCost = Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])->sum('total_cost');
        $currentProfit = Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])->sum('profit');
        $currentExpenses = Expense::whereBetween('expense_date', [$dateFrom, $dateTo])->sum('amount');
        $invoiceCount = Invoice::whereBetween('invoice_date', [$dateFrom, $dateTo])->count();
        $customerCount = Customer::count();
        $newCustomers = Customer::whereBetween('created_at', [$dateFrom, $dateTo])->count();

        // الفترة السابقة للمقارنة
        $daysDiff = Carbon::parse($dateFrom)->diffInDays(Carbon::parse($dateTo)) + 1;
        $prevFrom = Carbon::parse($dateFrom)->subDays($daysDiff)->toDateString();
        $prevTo = Carbon::parse($dateFrom)->subDay()->toDateString();

        $prevRevenue = Invoice::whereBetween('invoice_date', [$prevFrom, $prevTo])->sum('total');
        $prevProfit = Invoice::whereBetween('invoice_date', [$prevFrom, $prevTo])->sum('profit');
        $prevExpenses = Expense::whereBetween('expense_date', [$prevFrom, $prevTo])->sum('amount');

        // المصروفات حسب النوع
        $expensesByType = Expense::with('expenseType')
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->get()
            ->groupBy('expenseType.name')
            ->map(fn($group) => $group->sum('amount'))
            ->sortDesc()
            ->take(10)
            ->toArray();

        // أعلى المنتجات مبيعاً
        $topProducts = InvoiceItem::whereHas('invoice', function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('invoice_date', [$dateFrom, $dateTo]);
            })
            ->selectRaw('product_name, SUM(quantity) as total_quantity, SUM(total_price) as total_sales, SUM(profit) as total_profit')
            ->groupBy('product_name')
            ->orderByDesc('total_sales')
            ->limit(10)
            ->get()
            ->toArray();

        // أعلى العملاء
        $topCustomers = Invoice::with('customer')
            ->whereBetween('invoice_date', [$dateFrom, $dateTo])
            ->selectRaw('customer_id, SUM(total) as total_sales, SUM(profit) as total_profit, COUNT(*) as invoice_count')
            ->groupBy('customer_id')
            ->orderByDesc('total_sales')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->customer->name ?? 'غير محدد',
                    'total_sales' => (float) $item->total_sales,
                    'total_profit' => (float) $item->total_profit,
                    'invoice_count' => (int) $item->invoice_count,
                ];
            })
            ->toArray();

        // الديون المستحقة
        $totalReceivables = Invoice::sum('remaining_amount');
        $totalSupplierDebt = Supplier::sum('total_debt');

        // الأرصدة النقدية
        $cashBalance = null;
        try {
            $balance = CashBalance::getBalance();
            $cashBalance = [
                'cash' => (float) ($balance->cash_balance ?? 0),
                'bank' => (float) ($balance->bank_balance ?? 0),
            ];
        } catch (\Exception $e) {
            $cashBalance = ['cash' => 0, 'bank' => 0];
        }

        // المبيعات اليومية (آخر 30 يوم)
        $dailySales = Invoice::whereBetween('invoice_date', [
                Carbon::now()->subDays(30)->toDateString(),
                Carbon::now()->toDateString()
            ])
            ->selectRaw('DATE(invoice_date) as date, SUM(total) as sales, SUM(profit) as profit, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();

        return [
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
            'current' => [
                'revenue' => (float) $currentRevenue,
                'cost' => (float) $currentCost,
                'gross_profit' => (float) $currentProfit,
                'net_profit' => (float) ($currentProfit - $currentExpenses),
                'expenses' => (float) $currentExpenses,
                'invoice_count' => $invoiceCount,
                'profit_margin' => $currentRevenue > 0 ? round(($currentProfit / $currentRevenue) * 100, 2) : 0,
            ],
            'previous' => [
                'revenue' => (float) $prevRevenue,
                'profit' => (float) $prevProfit,
                'expenses' => (float) $prevExpenses,
            ],
            'changes' => [
                'revenue_change' => $prevRevenue > 0 ? round((($currentRevenue - $prevRevenue) / $prevRevenue) * 100, 1) : 0,
                'profit_change' => $prevProfit != 0 ? round((($currentProfit - $prevProfit) / abs($prevProfit)) * 100, 1) : 0,
                'expenses_change' => $prevExpenses > 0 ? round((($currentExpenses - $prevExpenses) / $prevExpenses) * 100, 1) : 0,
            ],
            'customers' => [
                'total' => $customerCount,
                'new' => $newCustomers,
            ],
            'expenses_by_type' => $expensesByType,
            'top_products' => $topProducts,
            'top_customers' => $topCustomers,
            'receivables' => (float) $totalReceivables,
            'supplier_debt' => (float) $totalSupplierDebt,
            'cash_balance' => $cashBalance,
            'daily_sales' => $dailySales,
        ];
    }

    /**
     * إرسال طلب لـ Gemini API
     */
    private function callGemini(string $prompt): ?string
    {
        $apiKey = $this->getApiKey();

        if (empty($apiKey)) {
            Log::error('Gemini API key is not configured');
            return null;
        }

        try {
            $response = Http::timeout(30)->post("{$this->geminiUrl}?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 4096,
                ],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            }

            Log::error('Gemini API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('Gemini API exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * رؤى سريعة - يتم استدعاؤها عند فتح الصفحة
     */
    public function quickInsights(Request $request): JsonResponse
    {
        $dateFrom = $request->date_from ?? Carbon::now()->startOfMonth()->toDateString();
        $dateTo = $request->date_to ?? Carbon::now()->endOfMonth()->toDateString();

        $data = $this->gatherFinancialData($dateFrom, $dateTo);

        $prompt = "أنت محلل مالي خبير لمتجر طباعة (Print Shop). 
قم بتحليل البيانات المالية التالية وتقديم رؤى مفيدة باللغة العربية.

البيانات المالية:
- إجمالي الإيرادات: {$data['current']['revenue']} دينار ليبي
- تكلفة البضائع: {$data['current']['cost']} دينار ليبي
- إجمالي الربح: {$data['current']['gross_profit']} دينار ليبي
- صافي الربح (بعد المصاريف): {$data['current']['net_profit']} دينار ليبي
- إجمالي المصروفات: {$data['current']['expenses']} دينار ليبي
- هامش الربح: {$data['current']['profit_margin']}%
- عدد الفواتير: {$data['current']['invoice_count']}
- تغير الإيرادات عن الفترة السابقة: {$data['changes']['revenue_change']}%
- تغير الأرباح عن الفترة السابقة: {$data['changes']['profit_change']}%
- تغير المصروفات عن الفترة السابقة: {$data['changes']['expenses_change']}%
- إجمالي العملاء: {$data['customers']['total']}
- العملاء الجدد: {$data['customers']['new']}
- المستحقات على العملاء: {$data['receivables']} دينار ليبي
- الديون للموردين: {$data['supplier_debt']} دينار ليبي
- رصيد الصندوق: {$data['cash_balance']['cash']} دينار ليبي
- رصيد البنك: {$data['cash_balance']['bank']} دينار ليبي
- المصروفات حسب النوع: " . json_encode($data['expenses_by_type'], JSON_UNESCAPED_UNICODE) . "
- أعلى المنتجات مبيعاً: " . json_encode($data['top_products'], JSON_UNESCAPED_UNICODE) . "
- أعلى العملاء: " . json_encode($data['top_customers'], JSON_UNESCAPED_UNICODE) . "

الفترة: من {$dateFrom} إلى {$dateTo}

قدم إجابتك بالتنسيق التالي بالضبط (JSON):
{
    \"summary\": \"ملخص عام قصير عن الوضع المالي (2-3 جمل)\",
    \"health_score\": رقم من 0 إلى 100 يمثل صحة الوضع المالي,
    \"health_label\": \"ممتاز\" أو \"جيد\" أو \"متوسط\" أو \"ضعيف\" أو \"حرج\",
    \"insights\": [
        {
            \"type\": \"positive\" أو \"warning\" أو \"info\" أو \"danger\",
            \"title\": \"عنوان قصير\",
            \"description\": \"وصف تفصيلي\"
        }
    ],
    \"recommendations\": [
        {
            \"priority\": \"high\" أو \"medium\" أو \"low\",
            \"title\": \"عنوان التوصية\",
            \"description\": \"وصف التوصية\"
        }
    ],
    \"trends\": {
        \"revenue_trend\": \"up\" أو \"down\" أو \"stable\",
        \"profit_trend\": \"up\" أو \"down\" أو \"stable\",
        \"expenses_trend\": \"up\" أو \"down\" أو \"stable\"
    }
}

مهم: أرجع JSON فقط بدون أي نص إضافي أو markdown.";

        $aiResponse = $this->callGemini($prompt);

        if (!$aiResponse) {
            return response()->json([
                'success' => false,
                'error' => 'فشل في الاتصال بخدمة الذكاء الاصطناعي',
                'data' => $data,
            ], 500);
        }

        // تنظيف الاستجابة من أي markdown
        $aiResponse = trim($aiResponse);
        $aiResponse = preg_replace('/^```json\s*/', '', $aiResponse);
        $aiResponse = preg_replace('/\s*```$/', '', $aiResponse);

        $parsed = json_decode($aiResponse, true);

        if (!$parsed) {
            return response()->json([
                'success' => true,
                'ai_response' => $aiResponse,
                'parsed' => false,
                'data' => $data,
            ]);
        }

        return response()->json([
            'success' => true,
            'parsed' => true,
            'analysis' => $parsed,
            'data' => $data,
        ]);
    }

    /**
     * تحليل مالي شامل
     */
    public function analyze(Request $request): JsonResponse
    {
        $dateFrom = $request->date_from ?? Carbon::now()->startOfYear()->toDateString();
        $dateTo = $request->date_to ?? Carbon::now()->toDateString();

        $data = $this->gatherFinancialData($dateFrom, $dateTo);

        $prompt = "أنت محلل مالي خبير لمتجر طباعة. قم بتحليل شامل ومفصل للبيانات المالية التالية باللغة العربية.

البيانات: " . json_encode($data, JSON_UNESCAPED_UNICODE) . "

قدم تحليلاً شاملاً يتضمن:
1. تقييم عام للأداء المالي
2. تحليل الإيرادات والأرباح
3. تحليل المصروفات وفرص التوفير
4. تحليل العملاء وأنماط الشراء
5. تحليل المنتجات الأكثر ربحية
6. تقييم السيولة والتدفق النقدي
7. المخاطر المالية المحتملة
8. توصيات استراتيجية لتحسين الأداء

اجعل الإجابة باللغة العربية ومنسقة بشكل واضح.";

        $aiResponse = $this->callGemini($prompt);

        if (!$aiResponse) {
            return response()->json([
                'success' => false,
                'error' => 'فشل في الاتصال بخدمة الذكاء الاصطناعي',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'analysis' => $aiResponse,
            'data' => $data,
        ]);
    }

    /**
     * دردشة تفاعلية - إرسال سؤال والحصول على إجابة
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = $request->message;
        $dateFrom = $request->date_from ?? Carbon::now()->startOfMonth()->toDateString();
        $dateTo = $request->date_to ?? Carbon::now()->endOfMonth()->toDateString();

        $data = $this->gatherFinancialData($dateFrom, $dateTo);

        $dataJson = json_encode($data, JSON_UNESCAPED_UNICODE);

        $prompt = "أنت مساعد ذكي متخصص في التحليل المالي لمتجر طباعة (Print Shop) في ليبيا.
العملة المستخدمة هي الدينار الليبي (د.ل).

البيانات المالية الحالية للمتجر:
{$dataJson}

سؤال المستخدم: {$message}

أجب على السؤال بناءً على البيانات المتاحة. كن دقيقاً واستخدم الأرقام الفعلية.
إذا كان السؤال خارج نطاق البيانات المتاحة، أخبر المستخدم بذلك بلطف.
أجب باللغة العربية بشكل مختصر ومفيد.";

        $aiResponse = $this->callGemini($prompt);

        if (!$aiResponse) {
            return response()->json([
                'success' => false,
                'error' => 'فشل في الاتصال بخدمة الذكاء الاصطناعي. تأكد من صحة مفتاح API.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'response' => $aiResponse,
        ]);
    }
}
