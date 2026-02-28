import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calculator, Printer, ArrowDownUp, AlertTriangle,
  Info, TrendingDown, Layers, Scissors, FileText, Save, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  paperTypesApi,
  sheetSizesApi,
  finishingOpsApi,
  priceCalculationsApi,
  pricingConfigApi,
} from '@/api/pricing';
import { customersApi } from '@/api/index';
import type {
  PriceCalculationInput,
  PriceCalculationResult,
  ImpositionOption,
  QualityWarning,
  ColorMode,
  PaperType,
  SheetSize,
  FinishingOperation,
  PricingConfiguration,
  LayoutData,
} from '@/types/pricing.types';
import type { Customer } from '@/types';

export default function PricingCalculatorPage() {
  // ── Form State ──
  const [formData, setFormData] = useState<PriceCalculationInput>({
    product_name: '',
    product_width_cm: 0,
    product_height_cm: 0,
    quantity: 1,
    num_pages: 1,
    color_front: '4/0',
    color_back: null,
    bleed_cm: 0.3,
    paper_type_id: null,
    sheet_size_ids: [],
    finishing_operation_ids: [],
    allow_shrink: true,
    margin_percentage: 30,
    waste_percentage: 5,
    has_text: true,
    min_font_size: null,
    has_images: true,
    image_dpi: null,
    has_folding: false,
    has_binding: false,
    has_die_cutting: false,
    customer_id: null,
    notes: null,
  });

  const [result, setResult] = useState<PriceCalculationResult | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number>(0);

  // ── Data Queries ──
  const { data: configData } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: () => pricingConfigApi.getConfig(),
    select: (res) => res.data as PricingConfiguration,
  });

  const { data: paperTypes = [] } = useQuery({
    queryKey: ['paper-types'],
    queryFn: () => paperTypesApi.list({ active_only: true }),
    select: (res) => res.data as PaperType[],
  });

  const { data: sheetSizes = [] } = useQuery({
    queryKey: ['sheet-sizes'],
    queryFn: () => sheetSizesApi.list({ active_only: true }),
    select: (res) => res.data as SheetSize[],
  });

  const { data: finishingOps = [] } = useQuery({
    queryKey: ['finishing-ops'],
    queryFn: () => finishingOpsApi.list({ active_only: true }),
    select: (res) => res.data as FinishingOperation[],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersApi.list({ all: true, active_only: true }),
    select: (res) => (res.data?.data || res.data) as Customer[],
  });

  // Apply config defaults when loaded
  if (configData && formData.bleed_cm === 0.3 && formData.margin_percentage === 30) {
    // One-time sync of defaults from config
    if (configData.default_bleed_cm !== 0.3 || configData.default_margin_percentage !== 30) {
      setFormData(prev => ({
        ...prev,
        bleed_cm: configData.default_bleed_cm,
        margin_percentage: configData.default_margin_percentage,
        waste_percentage: configData.default_waste_percentage,
      }));
    }
  }

  // ── Mutations ──
  const calculateMutation = useMutation({
    mutationFn: (data: PriceCalculationInput) =>
      priceCalculationsApi.calculate(data as unknown as Record<string, unknown>),
    onSuccess: (res) => {
      setResult(res.data as PriceCalculationResult);
      setSelectedOptionIdx(0);
      toast.success('تم حساب التسعير بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في حساب التسعير');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: PriceCalculationInput) =>
      priceCalculationsApi.calculateAndSave(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      toast.success('تم حفظ التسعير بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في حفظ التسعير');
    },
  });

  // ── Handlers ──
  const handleCalculate = () => {
    if (!formData.product_width_cm || !formData.product_height_cm || !formData.quantity) {
      toast.error('يرجى إدخال مقاس المنتج والكمية');
      return;
    }
    calculateMutation.mutate(formData);
  };

  const handleSave = () => {
    if (!formData.product_name) {
      toast.error('يرجى إدخال اسم المنتج للحفظ');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      product_name: '',
      product_width_cm: 0,
      product_height_cm: 0,
      quantity: 1,
      num_pages: 1,
      color_front: '4/0',
      color_back: null,
      bleed_cm: configData?.default_bleed_cm ?? 0.3,
      paper_type_id: null,
      sheet_size_ids: [],
      finishing_operation_ids: [],
      allow_shrink: true,
      margin_percentage: configData?.default_margin_percentage ?? 30,
      waste_percentage: configData?.default_waste_percentage ?? 5,
      has_text: true,
      min_font_size: null,
      has_images: true,
      image_dpi: null,
      has_folding: false,
      has_binding: false,
      has_die_cutting: false,
      customer_id: null,
      notes: null,
    });
    setResult(null);
  };

  const updateField = <K extends keyof PriceCalculationInput>(
    key: K,
    value: PriceCalculationInput[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleSheetSize = (id: number) => {
    setFormData(prev => ({
      ...prev,
      sheet_size_ids: prev.sheet_size_ids?.includes(id)
        ? prev.sheet_size_ids.filter(s => s !== id)
        : [...(prev.sheet_size_ids || []), id],
    }));
  };

  const toggleFinishing = (id: number) => {
    setFormData(prev => ({
      ...prev,
      finishing_operation_ids: prev.finishing_operation_ids?.includes(id)
        ? prev.finishing_operation_ids.filter(f => f !== id)
        : [...(prev.finishing_operation_ids || []), id],
    }));
  };

  // Color mode options
  const colorModes: ColorMode[] = ['1/0', '1/1', '2/0', '2/2', '4/0', '4/4'];

  // ── Quick presets ──
  const presets = [
    { label: 'كرت شخصي', width: 9, height: 5, pages: 1, color: '4/4' as ColorMode },
    { label: 'فلاير A5', width: 14.8, height: 21, pages: 1, color: '4/4' as ColorMode },
    { label: 'فلاير A4', width: 21, height: 29.7, pages: 1, color: '4/4' as ColorMode },
    { label: 'بروشور ثلاثي A4', width: 29.7, height: 21, pages: 1, color: '4/4' as ColorMode },
    { label: 'ملصق 5×5', width: 5, height: 5, pages: 1, color: '4/0' as ColorMode },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            حاسبة التسعير والمونتاج
          </h1>
          <p className="text-muted-foreground mt-1">
            حساب تكلفة الطباعة وأفضل توزيع على الورق
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 ml-2" />
            مسح
          </Button>
          {result && (
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 ml-2" />
              حفظ التسعير
            </Button>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">قوالب سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  updateField('product_width_cm', p.width);
                  updateField('product_height_cm', p.height);
                  updateField('num_pages', p.pages);
                  updateField('color_front', p.color);
                  updateField('product_name', p.label);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Input Form ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                تفاصيل المنتج
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>اسم المنتج</Label>
                <Input
                  value={formData.product_name || ''}
                  onChange={e => updateField('product_name', e.target.value)}
                  placeholder="مثال: كروت شخصية"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>العرض (سم)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.product_width_cm || ''}
                    onChange={e => updateField('product_width_cm', Number(e.target.value))}
                    placeholder="9"
                  />
                </div>
                <div>
                  <Label>الارتفاع (سم)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.product_height_cm || ''}
                    onChange={e => updateField('product_height_cm', Number(e.target.value))}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الكمية</Label>
                  <Input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={e => updateField('quantity', Number(e.target.value))}
                    placeholder="1000"
                    min={1}
                  />
                </div>
                <div>
                  <Label>عدد الوجوه/الصفحات</Label>
                  <Input
                    type="number"
                    value={formData.num_pages || ''}
                    onChange={e => updateField('num_pages', Number(e.target.value))}
                    placeholder="1"
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>ألوان الوجه</Label>
                  <Select
                    value={formData.color_front || '4/0'}
                    onValueChange={v => updateField('color_front', v as ColorMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorModes.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ألوان الظهر</Label>
                  <Select
                    value={formData.color_back || 'none'}
                    onValueChange={v => updateField('color_back', v === 'none' ? null : v as ColorMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون</SelectItem>
                      {colorModes.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>هامش القص - Bleed (سم)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.bleed_cm || ''}
                  onChange={e => updateField('bleed_cm', Number(e.target.value))}
                  placeholder="0.3"
                  min={0}
                  max={2}
                />
              </div>

              <Separator />

              {/* Design attributes */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">خصائص التصميم</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={formData.has_folding}
                      onCheckedChange={v => updateField('has_folding', !!v)}
                    />
                    طي
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={formData.has_binding}
                      onCheckedChange={v => updateField('has_binding', !!v)}
                    />
                    تجليد
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={formData.has_die_cutting}
                      onCheckedChange={v => updateField('has_die_cutting', !!v)}
                    />
                    قص بقالب
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-sm mb-1">
                      <Checkbox
                        checked={formData.has_text}
                        onCheckedChange={v => updateField('has_text', !!v)}
                      />
                      يحتوي نص
                    </label>
                    {formData.has_text && (
                      <Input
                        type="number"
                        placeholder="أصغر خط (pt)"
                        value={formData.min_font_size || ''}
                        onChange={e => updateField('min_font_size', e.target.value ? Number(e.target.value) : null)}
                        className="mt-1"
                      />
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm mb-1">
                      <Checkbox
                        checked={formData.has_images}
                        onCheckedChange={v => updateField('has_images', !!v)}
                      />
                      يحتوي صور
                    </label>
                    {formData.has_images && (
                      <Input
                        type="number"
                        placeholder="DPI الصور"
                        value={formData.image_dpi || ''}
                        onChange={e => updateField('image_dpi', e.target.value ? Number(e.target.value) : null)}
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paper & Finishing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" />
                الورق والتشطيب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>نوع الورق</Label>
                <Select
                  value={formData.paper_type_id?.toString() || 'none'}
                  onValueChange={v => updateField('paper_type_id', v === 'none' ? null : Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الورق" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون تحديد</SelectItem>
                    {paperTypes.map(pt => (
                      <SelectItem key={pt.id} value={pt.id.toString()}>
                        {pt.name} ({pt.weight_gsm} جم) - {pt.price_per_sheet} /ورقة
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">مقاسات الورق (اختر واحد أو أكثر)</Label>
                <div className="flex flex-wrap gap-2">
                  {sheetSizes.map(ss => (
                    <Badge
                      key={ss.id}
                      variant={formData.sheet_size_ids?.includes(ss.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSheetSize(ss.id)}
                    >
                      {ss.name} ({ss.width_cm}×{ss.height_cm} سم)
                    </Badge>
                  ))}
                </div>
                {(!formData.sheet_size_ids || formData.sheet_size_ids.length === 0) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    اترك فارغاً لاختبار جميع المقاسات المتاحة
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-2 block">عمليات التشطيب</Label>
                <div className="space-y-2">
                  {finishingOps.map(op => (
                    <label key={op.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={formData.finishing_operation_ids?.includes(op.id) || false}
                        onCheckedChange={() => toggleFinishing(op.id)}
                      />
                      {op.name}
                      <span className="text-muted-foreground text-xs">
                        ({op.cost} / {pricingTypeLabel(op.pricing_type)})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Pricing Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نسبة الهامش %</Label>
                  <Input
                    type="number"
                    value={formData.margin_percentage || ''}
                    onChange={e => updateField('margin_percentage', Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <Label>نسبة الهالك %</Label>
                  <Input
                    type="number"
                    value={formData.waste_percentage || ''}
                    onChange={e => updateField('waste_percentage', Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">السماح باقتراح تقليل المقاس</Label>
                <Switch
                  checked={formData.allow_shrink ?? true}
                  onCheckedChange={v => updateField('allow_shrink', v)}
                />
              </div>

              <div>
                <Label>العميل (اختياري)</Label>
                <Select
                  value={formData.customer_id?.toString() || 'none'}
                  onValueChange={v => updateField('customer_id', v === 'none' ? null : Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="بدون عميل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون تحديد</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes || ''}
                  onChange={e => updateField('notes', e.target.value || null)}
                  placeholder="ملاحظات إضافية..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Calculate Button */}
          <Button
            className="w-full h-12 text-lg"
            onClick={handleCalculate}
            disabled={calculateMutation.isPending}
          >
            <Calculator className="h-5 w-5 ml-2" />
            {calculateMutation.isPending ? 'جاري الحساب...' : 'حساب التسعير والمونتاج'}
          </Button>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="lg:col-span-2 space-y-4">
          {!result ? (
            <Card className="flex items-center justify-center min-h-[400px]">
              <div className="text-center text-muted-foreground">
                <Calculator className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">أدخل بيانات المنتج واضغط "حساب التسعير"</p>
                <p className="text-sm mt-1">ستظهر النتائج هنا</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Recommendation Banner */}
              <Card className={`border-2 ${
                result.recommendation.method === 'digital' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' :
                result.recommendation.method === 'offset' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
                'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
              }`}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Printer className="h-6 w-6 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-lg">
                        التوصية: {result.recommendation.method === 'digital' ? 'طباعة رقمية' :
                          result.recommendation.method === 'offset' ? 'طباعة أوفست' : 'كلا الطريقتين'}
                      </p>
                      <p className="text-sm mt-1">{result.recommendation.reason}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-xs text-muted-foreground">التكلفة الإجمالية</p>
                    <p className="text-2xl font-bold text-primary">{result.pricing_summary.total_cost.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-xs text-muted-foreground">تكلفة القطعة</p>
                    <p className="text-2xl font-bold">{result.pricing_summary.cost_per_unit.toFixed(4)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-xs text-muted-foreground">سعر البيع المقترح</p>
                    <p className="text-2xl font-bold text-green-600">{result.pricing_summary.selling_price.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-xs text-muted-foreground">سعر بيع القطعة</p>
                    <p className="text-2xl font-bold">{result.pricing_summary.selling_price_per_unit.toFixed(4)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <Card className="border-yellow-300">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2 text-yellow-700">
                      <AlertTriangle className="h-5 w-5" />
                      تنبيهات الجودة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2">
                      {result.warnings.map((w, i) => (
                        <WarningItem key={i} warning={w} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Imposition Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowDownUp className="h-4 w-4" />
                    خيارات التوزيع (المونتاج)
                  </CardTitle>
                  <CardDescription>
                    {result.options.length} خيار متاح — مرتبة من الأفضل للأقل كفاءة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={selectedOptionIdx.toString()}
                    onValueChange={v => setSelectedOptionIdx(Number(v))}
                  >
                    <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                      {result.options.map((opt, idx) => (
                        <TabsTrigger key={idx} value={idx.toString()} className="text-xs">
                          {opt.production_method === 'digital' ? 'رقمي' : `خيار ${opt.option_rank}`}
                          {opt.is_shrink_used && ' ✂️'}
                          {idx === 0 && ' ⭐'}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {result.options.map((opt, idx) => (
                      <TabsContent key={idx} value={idx.toString()}>
                        <OptionDetail option={opt} />
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Options Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">مقارنة الخيارات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-2">الخيار</th>
                          <th className="text-right py-2 px-2">الطريقة</th>
                          <th className="text-right py-2 px-2">مقاس الورق</th>
                          <th className="text-right py-2 px-2">قطعة/لوح</th>
                          <th className="text-right py-2 px-2">ألواح ماكينة</th>
                          <th className="text-right py-2 px-2">فرخ أب</th>
                          <th className="text-right py-2 px-2">الكفاءة</th>
                          <th className="text-right py-2 px-2">التكلفة</th>
                          <th className="text-right py-2 px-2">التوفير</th>
                          <th className="text-right py-2 px-2">تقليل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.options.map((opt, idx) => (
                          <tr
                            key={idx}
                            className={`border-b cursor-pointer hover:bg-muted/50 ${
                              idx === selectedOptionIdx ? 'bg-primary/5' : ''
                            } ${idx === 0 ? 'font-medium' : ''}`}
                            onClick={() => setSelectedOptionIdx(idx)}
                          >
                            <td className="py-2 px-2">
                              {idx === 0 && <span className="text-yellow-500 ml-1">⭐</span>}
                              {opt.option_rank}
                            </td>
                            <td className="py-2 px-2">
                              <Badge variant={opt.production_method === 'digital' ? 'secondary' : 'default'} className="text-xs">
                                {opt.production_method === 'digital' ? 'رقمي' : 'أوفست'}
                              </Badge>
                            </td>
                            <td className="py-2 px-2">{opt.sheet_size_name}</td>
                            <td className="py-2 px-2">{opt.items_per_sheet}</td>
                            <td className="py-2 px-2">{opt.total_sheets}</td>
                            <td className="py-2 px-2">{opt.parent_sheets_needed}</td>
                            <td className="py-2 px-2">{opt.sheet_utilization}%</td>
                            <td className="py-2 px-2 font-mono">{opt.total_cost.toFixed(2)}</td>
                            <td className="py-2 px-2">
                              {opt.cost_saving_percent > 0 && (
                                <span className="text-green-600">
                                  -{opt.cost_saving_percent.toFixed(1)}%
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              {opt.is_shrink_used && (
                                <Scissors className="h-4 w-4 text-orange-500 inline" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function OptionDetail({ option: opt }: { option: ImpositionOption }) {
  return (
    <div className="space-y-4">
      {/* Method & Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">طريقة الطباعة</p>
          <p className="font-medium">{opt.production_method === 'digital' ? 'رقمي' : 'أوفست'}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">مقاس الورقة</p>
          <p className="font-medium">{opt.sheet_size_name}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">الاتجاه</p>
          <p className="font-medium">{opt.orientation === 'rotated' ? 'مُدوَّر 90°' : 'عادي'}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">كفاءة الورقة</p>
          <p className="font-medium">{opt.sheet_utilization}%</p>
        </div>
      </div>

      {/* Layout Grid Info */}
      {opt.production_method === 'offset' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{opt.items_per_sheet}</p>
              <p className="text-xs text-muted-foreground">قطعة / لوح ماكينة</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{opt.cols}×{opt.rows}</p>
              <p className="text-xs text-muted-foreground">شبكة التوزيع</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">{opt.machine_sheets_per_parent}</p>
              <p className="text-xs text-muted-foreground">لوح ماكينة / فرخ أب</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{opt.total_sheets}</p>
              <p className="text-xs text-muted-foreground">ألواح ماكينة</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{opt.parent_sheets_needed}</p>
              <p className="text-xs text-muted-foreground">فرخ أب مطلوب</p>
            </div>
          </div>

          {/* Waste Breakdown */}
          {opt.waste_sheets != null && opt.waste_sheets > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-red-50 dark:bg-red-950/20 rounded p-2 text-center">
                <p className="font-medium text-red-600">{opt.makeready_waste_sheets ?? 0}</p>
                <p className="text-xs text-muted-foreground">هالك تحضير</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded p-2 text-center">
                <p className="font-medium text-red-600">{opt.run_waste_sheets ?? 0}</p>
                <p className="text-xs text-muted-foreground">هالك تشغيل</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded p-2 text-center">
                <p className="font-medium text-red-600">{opt.waste_sheets}</p>
                <p className="text-xs text-muted-foreground">إجمالي الهالك</p>
              </div>
              {opt.impressions != null && (
                <div className="bg-gray-50 dark:bg-gray-950/20 rounded p-2 text-center">
                  <p className="font-medium">{opt.impressions}</p>
                  <p className="text-xs text-muted-foreground">طبعات (impressions)</p>
                </div>
              )}
            </div>
          )}

          {/* SVG Imposition Diagrams */}
          {opt.layout_data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ImpositionDiagram layoutData={opt.layout_data} />
              <ParentSheetDiagram layoutData={opt.layout_data} />
            </div>
          )}
        </>
      )}

      {/* Shrink Info */}
      {opt.is_shrink_used && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Scissors className="h-4 w-4 text-orange-500" />
            <span className="font-medium text-orange-700 dark:text-orange-400">اقتراح تقليل المقاس</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">المقاس الأصلي: </span>
              <span className="font-mono">{(opt.final_width_cm + opt.shrink_width_cm).toFixed(1)}×{(opt.final_height_cm + opt.shrink_height_cm).toFixed(1)} سم</span>
            </div>
            <div>
              <span className="text-muted-foreground">المقاس المقترح: </span>
              <span className="font-mono font-medium">{opt.final_width_cm}×{opt.final_height_cm} سم</span>
            </div>
            <div>
              <span className="text-muted-foreground">التقليل: </span>
              <span className="font-mono">-{opt.shrink_width_cm} عرض، -{opt.shrink_height_cm} ارتفاع (سم)</span>
            </div>
            {opt.cost_saving_percent > 0 && (
              <div>
                <span className="text-muted-foreground">التوفير: </span>
                <span className="text-green-600 font-bold">
                  {opt.cost_saving_amount.toFixed(2)} ({opt.cost_saving_percent.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <div>
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          تفصيل التكلفة
        </h4>
        <div className="bg-muted/30 rounded-lg divide-y">
          <CostRow label="تكلفة الورق" value={opt.paper_cost} description="تكلفة الورق المطبوع + الهالك" />
          <CostRow label="تكلفة الطباعة" value={opt.printing_cost} description={opt.production_method === 'digital' ? 'تكلفة النقر الرقمي' : 'تكلفة تشغيل المطبعة'} />
          <CostRow label="الإعداد / CTP" value={opt.setup_cost} description="تكلفة الألواح والإعداد (ثابتة)" isFixed />
          <CostRow label="الهالك" value={opt.waste_cost} description="تكلفة الورق المهدر" />
          <CostRow label="التشطيب" value={opt.finishing_cost} description="تكاليف التشطيب المختارة" />
          <div className="flex justify-between items-center p-3 font-bold text-primary">
            <span>الإجمالي</span>
            <span className="text-lg">{opt.total_cost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Option Warnings */}
      {opt.warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">تنبيهات هذا الخيار</h4>
          {opt.warnings.map((w, i) => (
            <WarningItem key={i} warning={w} />
          ))}
        </div>
      )}

      {/* Explanation */}
      {opt.explanation && (
        <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 inline ml-1" />
          {opt.explanation}
        </div>
      )}
    </div>
  );
}

function CostRow({
  label,
  value,
  description,
  isFixed = false,
}: {
  label: string;
  value: number;
  description: string;
  isFixed?: boolean;
}) {
  return (
    <div className="flex justify-between items-center p-3">
      <div>
        <span className="text-sm font-medium">{label}</span>
        {isFixed && <Badge variant="outline" className="text-xs mr-2">ثابت</Badge>}
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="font-mono text-sm">{value.toFixed(2)}</span>
    </div>
  );
}

function WarningItem({ warning }: { warning: QualityWarning }) {
  const icon = warning.severity === 'danger'
    ? <AlertTriangle className="h-4 w-4 text-red-500" />
    : warning.severity === 'warning'
    ? <AlertTriangle className="h-4 w-4 text-yellow-500" />
    : <Info className="h-4 w-4 text-blue-500" />;

  const bgClass = warning.severity === 'danger'
    ? 'bg-red-50 dark:bg-red-950/20 border-red-200'
    : warning.severity === 'warning'
    ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200'
    : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200';

  return (
    <div className={`flex items-start gap-2 p-2 rounded border ${bgClass}`}>
      {icon}
      <span className="text-sm">{warning.message}</span>
    </div>
  );
}

function pricingTypeLabel(type: string): string {
  const map: Record<string, string> = {
    per_piece: 'للقطعة',
    per_sheet: 'للورقة',
    fixed: 'ثابت',
    per_fold: 'للطية',
    per_cut: 'للقطع',
  };
  return map[type] || type;
}

// ── SVG Imposition Diagram ──
// Renders the machine sheet with product cells at exact coordinates

function ImpositionDiagram({ layoutData }: { layoutData: LayoutData }) {
  const ms = layoutData.machine_sheet;
  const grid = layoutData.grid;
  const coords = layoutData.coordinates;
  const item = layoutData.item;

  // Scale: px per cm (fit into ~400px wide container)
  const maxSvgWidth = 400;
  const scale = Math.min(maxSvgWidth / ms.width_cm, maxSvgWidth / ms.height_cm);
  const svgW = ms.width_cm * scale;
  const svgH = ms.height_cm * scale;
  const pad = 30; // padding for labels

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="h-4 w-4" />
          لوح الماكينة — توزيع المنتج
        </CardTitle>
        <CardDescription className="text-xs">
          {ms.width_cm}×{ms.height_cm} سم | {grid.count} قطعة ({grid.cols}×{grid.rows}) | {grid.orientation === 'rotated' ? 'مُدوَّر' : 'عادي'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <svg
          width={svgW + pad * 2}
          height={svgH + pad * 2}
          viewBox={`0 0 ${svgW + pad * 2} ${svgH + pad * 2}`}
          className="border rounded bg-white dark:bg-gray-900"
        >
          <g transform={`translate(${pad}, ${pad})`}>
            {/* Machine sheet outline */}
            <rect
              x={0} y={0}
              width={svgW} height={svgH}
              fill="none" stroke="#94a3b8" strokeWidth={1.5}
              rx={2}
            />

            {/* Gripper margin zone */}
            <rect
              x={0} y={0}
              width={svgW}
              height={ms.gripper_margin_cm * scale}
              fill="#fecaca" fillOpacity={0.5}
              stroke="#ef4444" strokeWidth={0.5}
            />
            <text
              x={svgW / 2} y={ms.gripper_margin_cm * scale / 2 + 3}
              textAnchor="middle" fontSize={8} fill="#ef4444"
            >
              Gripper {ms.gripper_margin_cm} سم
            </text>

            {/* Product cells */}
            {coords.map((c, i) => (
              <g key={i}>
                {/* Bleed area (outer) */}
                <rect
                  x={c.x * scale}
                  y={c.y * scale}
                  width={c.w * scale}
                  height={c.h * scale}
                  fill="#dbeafe" fillOpacity={0.6}
                  stroke="#3b82f6" strokeWidth={0.8}
                  rx={1}
                />
                {/* Product area (inner, without bleed) */}
                <rect
                  x={(c.x + item.bleed_cm) * scale}
                  y={(c.y + item.bleed_cm) * scale}
                  width={(c.w - 2 * item.bleed_cm) * scale}
                  height={(c.h - 2 * item.bleed_cm) * scale}
                  fill="#93c5fd" fillOpacity={0.4}
                  stroke="#2563eb" strokeWidth={0.5}
                  rx={1}
                />
                {/* Cell number */}
                <text
                  x={(c.x + c.w / 2) * scale}
                  y={(c.y + c.h / 2 + 3) * scale}
                  textAnchor="middle"
                  fontSize={Math.min(10, c.w * scale / 3)}
                  fill="#1e40af"
                  fontWeight="bold"
                >
                  {i + 1}
                </text>
              </g>
            ))}

            {/* Dimension labels */}
            {/* Width */}
            <line x1={0} y1={svgH + 12} x2={svgW} y2={svgH + 12} stroke="#64748b" strokeWidth={0.5} />
            <text x={svgW / 2} y={svgH + 22} textAnchor="middle" fontSize={9} fill="#64748b">
              {ms.width_cm} سم
            </text>
            {/* Height */}
            <line x1={-12} y1={0} x2={-12} y2={svgH} stroke="#64748b" strokeWidth={0.5} />
            <text
              x={-18} y={svgH / 2}
              textAnchor="middle" fontSize={9} fill="#64748b"
              transform={`rotate(-90, -18, ${svgH / 2})`}
            >
              {ms.height_cm} سم
            </text>
          </g>
        </svg>
      </CardContent>
    </Card>
  );
}

// ── Parent Sheet Cutting Diagram ──
// Shows how the parent sheet is divided into machine sheets

function ParentSheetDiagram({ layoutData }: { layoutData: LayoutData }) {
  const ps = layoutData.parent_sheet_cutting;
  if (!ps || ps.machine_sheets_per_parent <= 1) return null;

  const ms = layoutData.machine_sheet;
  const maxSvgWidth = 400;
  const scale = Math.min(maxSvgWidth / ps.parent_width_cm, maxSvgWidth / ps.parent_height_cm);
  const svgW = ps.parent_width_cm * scale;
  const svgH = ps.parent_height_cm * scale;
  const pad = 30;

  // Generate machine sheet positions on the parent
  const machineSheets: { x: number; y: number; w: number; h: number }[] = [];
  for (let r = 0; r < ps.cuts_down; r++) {
    for (let c = 0; c < ps.cuts_across; c++) {
      machineSheets.push({
        x: c * ms.width_cm,
        y: r * ms.height_cm,
        w: ms.width_cm,
        h: ms.height_cm,
      });
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Scissors className="h-4 w-4" />
          تقطيع الفرخ الأب
        </CardTitle>
        <CardDescription className="text-xs">
          {ps.parent_width_cm}×{ps.parent_height_cm} سم → {ps.machine_sheets_per_parent} لوح ماكينة ({ps.cutting_layout})
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <svg
          width={svgW + pad * 2}
          height={svgH + pad * 2}
          viewBox={`0 0 ${svgW + pad * 2} ${svgH + pad * 2}`}
          className="border rounded bg-white dark:bg-gray-900"
        >
          <g transform={`translate(${pad}, ${pad})`}>
            {/* Parent sheet outline */}
            <rect
              x={0} y={0}
              width={svgW} height={svgH}
              fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.5}
              rx={2}
            />

            {/* Machine sheets */}
            {machineSheets.map((ms2, i) => (
              <g key={i}>
                <rect
                  x={ms2.x * scale + 1}
                  y={ms2.y * scale + 1}
                  width={ms2.w * scale - 2}
                  height={ms2.h * scale - 2}
                  fill="#e0e7ff" fillOpacity={0.6}
                  stroke="#6366f1" strokeWidth={1}
                  rx={2}
                  strokeDasharray="4 2"
                />
                <text
                  x={(ms2.x + ms2.w / 2) * scale}
                  y={(ms2.y + ms2.h / 2 + 4) * scale}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#4338ca"
                  fontWeight="bold"
                >
                  {i + 1}
                </text>
                <text
                  x={(ms2.x + ms2.w / 2) * scale}
                  y={(ms2.y + ms2.h / 2 + 16) * scale}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#6366f1"
                >
                  {ms2.w}×{ms2.h}
                </text>
              </g>
            ))}

            {/* Waste areas (parts of parent not used) */}
            {ps.cuts_across * ms.width_cm < ps.parent_width_cm && (
              <rect
                x={ps.cuts_across * ms.width_cm * scale}
                y={0}
                width={(ps.parent_width_cm - ps.cuts_across * ms.width_cm) * scale}
                height={svgH}
                fill="#fef2f2" fillOpacity={0.5}
                stroke="#fca5a5" strokeWidth={0.5}
                strokeDasharray="3 2"
              />
            )}
            {ps.cuts_down * ms.height_cm < ps.parent_height_cm && (
              <rect
                x={0}
                y={ps.cuts_down * ms.height_cm * scale}
                width={ps.cuts_across * ms.width_cm * scale}
                height={(ps.parent_height_cm - ps.cuts_down * ms.height_cm) * scale}
                fill="#fef2f2" fillOpacity={0.5}
                stroke="#fca5a5" strokeWidth={0.5}
                strokeDasharray="3 2"
              />
            )}

            {/* Dimension labels */}
            <line x1={0} y1={svgH + 12} x2={svgW} y2={svgH + 12} stroke="#64748b" strokeWidth={0.5} />
            <text x={svgW / 2} y={svgH + 22} textAnchor="middle" fontSize={9} fill="#64748b">
              {ps.parent_width_cm} سم
            </text>
            <line x1={-12} y1={0} x2={-12} y2={svgH} stroke="#64748b" strokeWidth={0.5} />
            <text
              x={-18} y={svgH / 2}
              textAnchor="middle" fontSize={9} fill="#64748b"
              transform={`rotate(-90, -18, ${svgH / 2})`}
            >
              {ps.parent_height_cm} سم
            </text>
          </g>
        </svg>
      </CardContent>
    </Card>
  );
}
