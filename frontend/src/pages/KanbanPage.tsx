import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Kanban,
  Search,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  FileText,
  User,
  ChevronDown,
  Sparkles,
  Layers,
  Send,
  Boxes,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { kanbanApi, type KanbanCardItem, type KanbanBoardResponse } from '@/api';

// أعمدة ومراحل الكانبان الخمس
const STAGES_CONFIG = [
  {
    id: 'in_design',
    title: 'في التصميم',
    icon: Sparkles,
    color: 'from-sky-500 to-blue-600',
    lightBg: 'bg-sky-500/10 dark:bg-sky-500/15',
    border: 'border-sky-500/40',
    headerBadge: 'bg-sky-500 text-white',
    ringColor: 'ring-sky-500',
  },
  {
    id: 'in_printing',
    title: 'في الطباعة',
    icon: Package,
    color: 'from-indigo-500 to-purple-600',
    lightBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    border: 'border-indigo-500/40',
    headerBadge: 'bg-indigo-500 text-white',
    ringColor: 'ring-indigo-500',
  },
  {
    id: 'in_finishing',
    title: 'في التشطيب',
    icon: Layers,
    color: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-500/40',
    headerBadge: 'bg-amber-500 text-white',
    ringColor: 'ring-amber-500',
  },
  {
    id: 'in_office',
    title: 'في المكتب (جاهز)',
    icon: Boxes,
    color: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/40',
    headerBadge: 'bg-emerald-500 text-white',
    ringColor: 'ring-emerald-500',
  },
  {
    id: 'delivered',
    title: 'تم التسليم',
    icon: CheckCircle2,
    color: 'from-slate-500 to-zinc-600',
    lightBg: 'bg-slate-500/10 dark:bg-slate-500/15',
    border: 'border-slate-500/40',
    headerBadge: 'bg-slate-500 text-white',
    ringColor: 'ring-slate-500',
  },
] as const;

type StageId = (typeof STAGES_CONFIG)[number]['id'];

export default function KanbanPage() {
  const queryClient = useQueryClient();

  // الفلاتر
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');

  // Drag and Drop State
  const [draggedCard, setDraggedCard] = useState<KanbanCardItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<StageId | null>(null);

  // مودال خيار التسليم السريع عند السحب إلى "تم التسليم"
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [pendingDeliveryCard, setPendingDeliveryCard] = useState<KanbanCardItem | null>(null);

  // جلب بيانات اللوحة
  const { data, isLoading, refetch, isFetching } = useQuery<KanbanBoardResponse>({
    queryKey: ['kanban', { search, selectedCustomer, selectedUrgency }],
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCustomer !== 'all') params.customer_id = selectedCustomer;
      if (selectedUrgency !== 'all') params.urgency = selectedUrgency;
      const res = await kanbanApi.getBoard(params);
      return res.data;
    },
  });

  // تحديث حالة الكرت
  const updateCardMutation = useMutation({
    mutationFn: async ({ cardId, status }: { cardId: number; status: string }) => {
      const res = await kanbanApi.updateCard(cardId, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      toast.success('تم تحديث مرحلة البند بنجاح');
    },
    onError: (err: unknown) => {
      toast.error('فشل تحديث مرحلة البند');
      console.error(err);
    },
  });

  // تسليم كامل بنود الفاتورة دفعة واحدة
  const batchDeliverMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const res = await kanbanApi.batchDeliver(invoiceId);
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      toast.success(res.message || 'تم تسليم كافة بنود الفاتورة بنجاح');
      setDeliveryModalOpen(false);
      setPendingDeliveryCard(null);
    },
    onError: (err: unknown) => {
      toast.error('حدث خطأ أثناء تسليم البنود');
      console.error(err);
    },
  });

  // مزامنة الكروت القديمة
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await kanbanApi.syncMissing();
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      toast.success(res.message || 'تمت مزامنة الكروت بنجاح');
    },
    onError: () => {
      toast.error('فشل مزامنة الكروت');
    },
  });

  // معالجة بدء السحب
  const handleDragStart = (card: KanbanCardItem) => {
    setDraggedCard(card);
  };

  // معالجة السحب فوق العمود
  const handleDragOver = (e: React.DragEvent, stageId: StageId) => {
    e.preventDefault();
    if (dragOverColumn !== stageId) {
      setDragOverColumn(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: StageId) => {
    e.preventDefault();
    if (dragOverColumn === stageId) {
      setDragOverColumn(null);
    }
  };

  // معالجة الإفلات (Drop)
  const handleDrop = (e: React.DragEvent, targetStage: StageId) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedCard || draggedCard.status === targetStage) {
      setDraggedCard(null);
      return;
    }

    // إذا تم الإفلات في "تم التسليم" وكان للفاتورة أكثر من بند أو بنود أخرى غير مسلّمة
    if (targetStage === 'delivered') {
      const stats = draggedCard.completion_stats;
      if (stats && stats.total_items > 1 && !stats.is_all_delivered) {
        setPendingDeliveryCard(draggedCard);
        setDeliveryModalOpen(true);
        setDraggedCard(null);
        return;
      }
    }

    // النقل العادي المباشر
    updateCardMutation.mutate({
      cardId: draggedCard.id,
      status: targetStage,
    });
    setDraggedCard(null);
  };

  // تأكيد تسليم هذا البند فقط من المودال
  const confirmDeliverSingle = () => {
    if (!pendingDeliveryCard) return;
    updateCardMutation.mutate({
      cardId: pendingDeliveryCard.id,
      status: 'delivered',
    });
    setDeliveryModalOpen(false);
    setPendingDeliveryCard(null);
  };

  // تأكيد تسليم كامل بنود الفاتورة
  const confirmDeliverAll = () => {
    if (!pendingDeliveryCard) return;
    batchDeliverMutation.mutate(pendingDeliveryCard.invoice_id);
  };

  const counts = data?.counts || {
    in_design: 0,
    in_printing: 0,
    in_finishing: 0,
    in_office: 0,
    delivered: 0,
    total: 0,
    overdue: 0,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* رأس الصفحة والمؤشرات */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
              <Kanban className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">لوحة متابعة الإنتاج (Kanban)</h1>
              <p className="text-sm text-muted-foreground">
                تفكيك بنود الفواتير وتتبع مراحل التصميم والطباعة والتشطيب والتسليم
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* زر مزامنة الكروت السابقة */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="gap-2 border-dashed"
            title="توليد كروت لأي فواتير قديمة لا تملك كروت كانبان"
          >
            <Layers className="h-4 w-4 text-primary" />
            <span>مزامنة الفواتير السابقة</span>
          </Button>

          {/* زر التحديث السريع */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </Button>
        </div>
      </div>

      {/* شريط الإحصائيات السريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES_CONFIG.map((stage) => {
          const Icon = stage.icon;
          const count = counts[stage.id] ?? 0;
          return (
            <motion.div
              key={stage.id}
              whileHover={{ y: -2 }}
              className="p-3.5 rounded-2xl border bg-card/60 backdrop-blur shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{stage.title}</span>
                <div className={`p-1.5 rounded-lg ${stage.lightBg}`}>
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
              </div>
              <p className="text-2xl font-black mt-2 tracking-tight">{count}</p>
            </motion.div>
          );
        })}

        {/* كارت البنود المتأخرة */}
        <motion.div
          whileHover={{ y: -2 }}
          className={`p-3.5 rounded-2xl border transition-all ${
            counts.overdue > 0
              ? 'bg-destructive/10 border-destructive/30 text-destructive shadow-sm shadow-destructive/10'
              : 'bg-card/60 border-border text-muted-foreground'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">متأخر عن الموعد</span>
            <AlertCircle className={`h-4 w-4 ${counts.overdue > 0 ? 'text-destructive animate-pulse' : ''}`} />
          </div>
          <p className="text-2xl font-black mt-2 tracking-tight">{counts.overdue}</p>
        </motion.div>
      </div>

      {/* شريط أدوات البحث والفلترة */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-2xl border bg-card/40 backdrop-blur shadow-sm">
        {/* بحث نصي */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم البند، رقم الفاتورة (#INV-...)، أو اسم العميل..."
            className="pr-9 rounded-xl bg-background"
          />
        </div>

        {/* فلترة العميل */}
        <div className="w-full md:w-56">
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">كل العملاء</option>
            {data?.customers?.map((cust) => (
              <option key={cust.id} value={cust.id}>
                {cust.name}
              </option>
            ))}
          </select>
        </div>

        {/* فلترة تاريخ التسليم ومستوى الاستعجال */}
        <div className="w-full md:w-52">
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">كل المواعيد</option>
            <option value="overdue">🔴 متأخرة عن التسليم</option>
            <option value="today">🟠 موعد التسليم اليوم</option>
            <option value="tomorrow">🟡 موعد التسليم غداً</option>
            <option value="upcoming">🟢 مواعيد قادمة</option>
          </select>
        </div>

        {(search || selectedCustomer !== 'all' || selectedUrgency !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedCustomer('all');
              setSelectedUrgency('all');
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            إعادة تعيين الفلاتر
          </Button>
        )}
      </div>

      {/* لوحة الأعمدة الـ 5 للكانبان */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">جارٍ تحميل لوحة الكانبان...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {STAGES_CONFIG.map((stage) => {
            const Icon = stage.icon;
            const cards = data?.columns?.[stage.id] || [];
            const isColumnOver = dragOverColumn === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`flex flex-col rounded-2xl border transition-all duration-200 bg-muted/30 backdrop-blur min-h-[550px] ${
                  isColumnOver
                    ? `border-primary ring-2 ring-primary/30 shadow-lg ${stage.lightBg}`
                    : 'border-border/80'
                }`}
              >
                {/* ترويسة العمود */}
                <div className="p-3.5 border-b border-border/80 flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-md rounded-t-2xl z-10">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${stage.lightBg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-sm tracking-tight">{stage.title}</h3>
                  </div>
                  <Badge variant="secondary" className="font-bold text-xs px-2 py-0.5 rounded-full">
                    {cards.length}
                  </Badge>
                </div>

                {/* قائمة الكروت داخل العمود */}
                <div className="p-2.5 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {cards.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-border/60 rounded-xl my-4">
                      <p className="text-xs text-muted-foreground">لا توجد بنود في هذه المرحلة</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">اسحب كرت وأفلته هنا</p>
                    </div>
                  ) : (
                    cards.map((card) => (
                      <KanbanCardItemComponent
                        key={card.id}
                        card={card}
                        onDragStart={() => handleDragStart(card)}
                        onQuickMove={(newStatus) => {
                          if (newStatus === 'delivered' && card.completion_stats?.total_items > 1 && !card.completion_stats?.is_all_delivered) {
                            setPendingDeliveryCard(card);
                            setDeliveryModalOpen(true);
                          } else {
                            updateCardMutation.mutate({ cardId: card.id, status: newStatus });
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال خيار التسليم السريع لبنود الفاتورة */}
      <Dialog open={deliveryModalOpen} onOpenChange={setDeliveryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary mb-2">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold">تسليم طلبية الفاتورة</DialogTitle>
            <DialogDescription className="text-sm">
              أنت تقوم الآن بنقل البند{' '}
              <strong className="text-foreground font-bold">"{pendingDeliveryCard?.item_name}"</strong> إلى مرحلة{' '}
              <span className="text-emerald-600 font-semibold">تم التسليم</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 p-3.5 rounded-xl border bg-muted/40 space-y-2 text-sm">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>رقم الفاتورة:</span>
              <span className="font-bold text-foreground">#{pendingDeliveryCard?.invoice_number}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>العميل:</span>
              <span className="font-bold text-foreground">{pendingDeliveryCard?.customer_name}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>إجمالي بنود الفاتورة:</span>
              <span className="font-bold text-foreground">
                {pendingDeliveryCard?.completion_stats.total_items} بند
              </span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={confirmDeliverSingle}
              disabled={updateCardMutation.isPending || batchDeliverMutation.isPending}
              className="w-full sm:w-auto text-xs"
            >
              تسليم هذا البند فقط
            </Button>
            <Button
              variant="default"
              onClick={confirmDeliverAll}
              disabled={updateCardMutation.isPending || batchDeliverMutation.isPending}
              className="w-full sm:w-auto text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                تسليم كامل بنود الفاتورة ({pendingDeliveryCard?.completion_stats.total_items} بنود) معاً
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// مكون كرت الكانبان المستقل
function KanbanCardItemComponent({
  card,
  onDragStart,
  onQuickMove,
}: {
  card: KanbanCardItem;
  onDragStart: () => void;
  onQuickMove: (newStatus: StageId) => void;
}) {
  const stats = card.completion_stats;

  // التحقق من حالة تاريخ التسليم
  const getDeliveryDateBadge = () => {
    if (!card.delivery_date) {
      return (
        <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          غير محدد
        </span>
      );
    }

    if (card.status === 'delivered') {
      return (
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {card.delivery_date}
        </span>
      );
    }

    if (card.is_overdue) {
      return (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 gap-1 animate-pulse">
          <AlertCircle className="h-3 w-3" />
          متأخر! ({card.delivery_date})
        </Badge>
      );
    }

    if (card.is_today) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0.5 gap-1">
          <Clock className="h-3 w-3" />
          التسليم اليوم!
        </Badge>
      );
    }

    if (card.is_tomorrow) {
      return (
        <Badge variant="secondary" className="text-amber-600 bg-amber-500/15 text-[10px] px-1.5 py-0.5 gap-1">
          <Clock className="h-3 w-3" />
          التسليم غداً
        </Badge>
      );
    }

    return (
      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
        <Calendar className="h-3 w-3 text-primary" />
        {card.delivery_date}
        {card.days_left !== null && card.days_left > 0 && (
          <span className="text-[10px] text-muted-foreground/70">({card.days_left} يوم)</span>
        )}
      </span>
    );
  };

  return (
    <motion.div
      layout
      layoutId={`card-${card.id}`}
      draggable
      onDragStart={onDragStart}
      whileHover={{ y: -2, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.1)' }}
      className="p-3.5 rounded-xl border bg-card text-card-foreground shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all group relative"
    >
      {/* الصف العلوي: رقم الفاتورة والكمية */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <Link
          to={`/invoices/${card.invoice_id}`}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded-md"
          title="عرض الفاتورة"
        >
          <FileText className="h-3 w-3" />
          #{card.invoice_number}
        </Link>

        <Badge variant="outline" className="text-[11px] font-semibold bg-muted/50 border-border">
          {Number(card.quantity).toLocaleString()} قطعة
        </Badge>
      </div>

      {/* اسم البند */}
      <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2 mb-1.5">
        {card.item_name}
      </h4>

      {/* المواصفات والوصف إن وُجد */}
      {card.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5 bg-muted/30 p-1.5 rounded-lg text-[11px]">
          {card.description}
        </p>
      )}

      {/* العميل */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <User className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
        <span className="truncate font-medium">{card.customer_name}</span>
      </div>

      {/* تاريخ التسليم ومستوى الاستعجال - مهم جداً */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
        <span className="text-[10px] text-muted-foreground/80">موعد التسليم:</span>
        {getDeliveryDateBadge()}
      </div>

      {/* حالة التجميع داخل عمود "في المكتب" (Group Logic & Completion) */}
      {card.status === 'in_office' && (
        <div className="mt-2.5 pt-2 border-t border-border/60">
          {stats.is_all_ready || stats.is_all_in_office ? (
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span>الطلبية مكتملة بالكامل ({stats.total_items}/{stats.total_items})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/30">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                جاهز - بانتظار اكتمال الطلب ({stats.ready_count} من {stats.total_items} جاهز)
              </span>
            </div>
          )}
        </div>
      )}

      {/* زر النقل السريع من القائمة المنسدلة (لتسهيل الاستخدام على الموبايل وبديل السحب) */}
      <div className="mt-2 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted transition-colors opacity-70 group-hover:opacity-100"
            >
              <span>نقل لمرحلة</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            {STAGES_CONFIG.filter((s) => s.id !== card.status).map((stage) => {
              const StageIcon = stage.icon;
              return (
                <DropdownMenuItem
                  key={stage.id}
                  onClick={() => onQuickMove(stage.id)}
                  className="gap-2 cursor-pointer"
                >
                  <StageIcon className="h-3.5 w-3.5" />
                  <span>{stage.title}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
