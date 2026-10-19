import { useState, useMemo } from 'react';
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
  Scissors,
  Truck,
  Palette,
  Printer,
  Wrench,
  Tag,
  Star,
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { kanbanApi, type KanbanCardItem, type KanbanBoardResponse, type KanbanColumnItem } from '@/api';

// لوحة الألوان المعتمدة للمراحل
export const STAGE_COLORS: Record<string, {
  color: string;
  lightBg: string;
  border: string;
  headerBadge: string;
  ringColor: string;
  dotColor: string;
  label: string;
}> = {
  sky: {
    color: 'from-sky-500 to-blue-600',
    lightBg: 'bg-sky-500/10 dark:bg-sky-500/15',
    border: 'border-sky-500/40',
    headerBadge: 'bg-sky-500 text-white',
    ringColor: 'ring-sky-500',
    dotColor: 'bg-sky-500',
    label: 'سماوي',
  },
  indigo: {
    color: 'from-indigo-500 to-purple-600',
    lightBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    border: 'border-indigo-500/40',
    headerBadge: 'bg-indigo-500 text-white',
    ringColor: 'ring-indigo-500',
    dotColor: 'bg-indigo-500',
    label: 'نيلي',
  },
  amber: {
    color: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-500/40',
    headerBadge: 'bg-amber-500 text-white',
    ringColor: 'ring-amber-500',
    dotColor: 'bg-amber-500',
    label: 'عنبري',
  },
  emerald: {
    color: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/40',
    headerBadge: 'bg-emerald-500 text-white',
    ringColor: 'ring-emerald-500',
    dotColor: 'bg-emerald-500',
    label: 'زمردي',
  },
  slate: {
    color: 'from-slate-500 to-zinc-600',
    lightBg: 'bg-slate-500/10 dark:bg-slate-500/15',
    border: 'border-slate-500/40',
    headerBadge: 'bg-slate-500 text-white',
    ringColor: 'ring-slate-500',
    dotColor: 'bg-slate-500',
    label: 'رمادي',
  },
  rose: {
    color: 'from-rose-500 to-pink-600',
    lightBg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-500/40',
    headerBadge: 'bg-rose-500 text-white',
    ringColor: 'ring-rose-500',
    dotColor: 'bg-rose-500',
    label: 'وردي',
  },
  purple: {
    color: 'from-purple-500 to-violet-600',
    lightBg: 'bg-purple-500/10 dark:bg-purple-500/15',
    border: 'border-purple-500/40',
    headerBadge: 'bg-purple-500 text-white',
    ringColor: 'ring-purple-500',
    dotColor: 'bg-purple-500',
    label: 'أرجواني',
  },
  teal: {
    color: 'from-teal-500 to-cyan-600',
    lightBg: 'bg-teal-500/10 dark:bg-teal-500/15',
    border: 'border-teal-500/40',
    headerBadge: 'bg-teal-500 text-white',
    ringColor: 'ring-teal-500',
    dotColor: 'bg-teal-500',
    label: 'فيروزي',
  },
  orange: {
    color: 'from-orange-500 to-amber-600',
    lightBg: 'bg-orange-500/10 dark:bg-orange-500/15',
    border: 'border-orange-500/40',
    headerBadge: 'bg-orange-500 text-white',
    ringColor: 'ring-orange-500',
    dotColor: 'bg-orange-500',
    label: 'برتقالي',
  },
};

// الأيقونات المتاحة للاختيار
export const AVAILABLE_ICONS: Record<string, React.ElementType> = {
  Sparkles,
  Package,
  Layers,
  Boxes,
  CheckCircle2,
  Scissors,
  Truck,
  Palette,
  Clock,
  Printer,
  Wrench,
  Tag,
  Star,
  FileText,
};

// المراحل الافتراضية كـ Fallback قبل اكتمال التحميل
const DEFAULT_FALLBACK_STAGES: KanbanColumnItem[] = [
  { id: 1, key: 'in_design', title: 'في التصميم', color: 'sky', icon: 'Sparkles', sort_order: 1, is_initial: true, is_final: false },
  { id: 2, key: 'in_printing', title: 'في الطباعة', color: 'indigo', icon: 'Package', sort_order: 2, is_initial: false, is_final: false },
  { id: 3, key: 'in_finishing', title: 'في التشطيب', color: 'amber', icon: 'Layers', sort_order: 3, is_initial: false, is_final: false },
  { id: 4, key: 'in_office', title: 'في المكتب (جاهز)', color: 'emerald', icon: 'Boxes', sort_order: 4, is_initial: false, is_final: false },
  { id: 5, key: 'delivered', title: 'تم التسليم', color: 'slate', icon: 'CheckCircle2', sort_order: 5, is_initial: false, is_final: true },
];

export default function KanbanPage() {
  const queryClient = useQueryClient();

  // الفلاتر
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');

  // Drag and Drop State
  const [draggedCard, setDraggedCard] = useState<KanbanCardItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // مودال خيار التسليم السريع عند السحب إلى مرحلة نهائية
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [pendingDeliveryCard, setPendingDeliveryCard] = useState<KanbanCardItem | null>(null);

  // إدارة المراحل والأعمدة (Dynamic Stages Manager)
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false);
  const [columnFormOpen, setColumnFormOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumnItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formColor, setFormColor] = useState('sky');
  const [formIcon, setFormIcon] = useState('Layers');
  const [formIsInitial, setFormIsInitial] = useState(false);
  const [formIsFinal, setFormIsFinal] = useState(false);

  // تأكيد حذف مرحلة مع خيار النقل البديل
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<KanbanColumnItem | null>(null);
  const [fallbackStageKey, setFallbackStageKey] = useState('');

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

  // قائمة الأعمدة النشطة (من السيرفر أو الافتراضية)
  const activeColumns = useMemo<KanbanColumnItem[]>(() => {
    if (data?.columns_config && data.columns_config.length > 0) {
      return data.columns_config;
    }
    return DEFAULT_FALLBACK_STAGES;
  }, [data?.columns_config]);

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

  // طفرة إنشاء أو تحديث مرحلة
  const saveColumnMutation = useMutation({
    mutationFn: async () => {
      if (!formTitle.trim()) {
        throw new Error('يرجى إدخال اسم المرحلة');
      }

      if (editingColumn) {
        const res = await kanbanApi.updateColumn(editingColumn.id, {
          title: formTitle.trim(),
          color: formColor,
          icon: formIcon,
          is_initial: formIsInitial,
          is_final: formIsFinal,
        });
        return res.data;
      } else {
        const res = await kanbanApi.createColumn({
          title: formTitle.trim(),
          color: formColor,
          icon: formIcon,
          is_initial: formIsInitial,
          is_final: formIsFinal,
        });
        return res.data;
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      toast.success(res.message || 'تم حفظ المرحلة بنجاح');
      setColumnFormOpen(false);
      setEditingColumn(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'فشل حفظ المرحلة');
    },
  });

  // طفرة حذف مرحلة
  const deleteColumnMutation = useMutation({
    mutationFn: async () => {
      if (!columnToDelete) return;
      const res = await kanbanApi.deleteColumn(columnToDelete.id, fallbackStageKey || undefined);
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      toast.success(res?.message || 'تم حذف المرحلة بنجاح');
      setDeleteModalOpen(false);
      setColumnToDelete(null);
      setFallbackStageKey('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشل حذف المرحلة');
    },
  });

  // طفرة إعادة ترتيب المراحل
  const reorderColumnsMutation = useMutation({
    mutationFn: async (columnIds: number[]) => {
      const res = await kanbanApi.reorderColumns(columnIds);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      toast.success('تم حفظ ترتيب المراحل');
    },
    onError: () => {
      toast.error('فشل حفظ ترتيب المراحل');
    },
  });

  // معالجة بدء السحب
  const handleDragStart = (card: KanbanCardItem) => {
    setDraggedCard(card);
  };

  // معالجة السحب فوق العمود
  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (dragOverColumn !== stageKey) {
      setDragOverColumn(stageKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (dragOverColumn === stageKey) {
      setDragOverColumn(null);
    }
  };

  // معالجة الإفلات (Drop)
  const handleDrop = (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedCard) return;
    if (draggedCard.status === targetStageKey) {
      setDraggedCard(null);
      return;
    }

    const targetCol = activeColumns.find((c) => c.key === targetStageKey);
    const isTargetFinal = targetCol ? targetCol.is_final : targetStageKey === 'delivered';

    // فحص إذا كانت المرحلة نهائية وتوجد بنود أخرى بالفاتورة
    if (
      isTargetFinal &&
      draggedCard.completion_stats?.total_items > 1 &&
      !draggedCard.completion_stats?.is_all_delivered
    ) {
      setPendingDeliveryCard(draggedCard);
      setDeliveryModalOpen(true);
      setDraggedCard(null);
      return;
    }

    updateCardMutation.mutate({
      cardId: draggedCard.id,
      status: targetStageKey,
    });

    setDraggedCard(null);
  };

  // تأكيد تسليم بند واحد فقط
  const confirmDeliverSingle = () => {
    if (!pendingDeliveryCard) return;
    const finalCol = activeColumns.find((c) => c.is_final);
    const finalKey = finalCol ? finalCol.key : 'delivered';

    updateCardMutation.mutate({
      cardId: pendingDeliveryCard.id,
      status: finalKey,
    });
    setDeliveryModalOpen(false);
    setPendingDeliveryCard(null);
  };

  // تأكيد تسليم كامل بنود الفاتورة معاً
  const confirmDeliverAll = () => {
    if (!pendingDeliveryCard) return;
    batchDeliverMutation.mutate(pendingDeliveryCard.invoice_id);
  };

  // فتح نافذة إنشاء مرحلة جديدة
  const openCreateColumnDialog = () => {
    setEditingColumn(null);
    setFormTitle('');
    setFormColor('sky');
    setFormIcon('Layers');
    setFormIsInitial(false);
    setFormIsFinal(false);
    setColumnFormOpen(true);
  };

  // فتح نافذة تعديل مرحلة
  const openEditColumnDialog = (col: KanbanColumnItem) => {
    setEditingColumn(col);
    setFormTitle(col.title);
    setFormColor(col.color || 'sky');
    setFormIcon(col.icon || 'Layers');
    setFormIsInitial(col.is_initial);
    setFormIsFinal(col.is_final);
    setColumnFormOpen(true);
  };

  // فتح نافذة تأكيد حذف مرحلة
  const openDeleteColumnDialog = (col: KanbanColumnItem) => {
    if (activeColumns.length <= 1) {
      toast.error('لا يمكن حذف آخر مرحلة متبقية في اللوحة');
      return;
    }
    setColumnToDelete(col);
    // اقتراح أول مرحلة بديلة
    const fallback = activeColumns.find((c) => c.id !== col.id);
    setFallbackStageKey(fallback?.key || '');
    setDeleteModalOpen(true);
  };

  // تحريك مرحلة لأعلى أو لأسفل في الترتيب
  const moveColumnOrder = (index: number, direction: 'up' | 'down') => {
    const newColumns = [...activeColumns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newColumns.length) return;

    const [moved] = newColumns.splice(index, 1);
    newColumns.splice(targetIndex, 0, moved);

    const ids = newColumns.map((c) => c.id);
    reorderColumnsMutation.mutate(ids);
  };

  const counts = data?.counts || { total: 0, overdue: 0 };

  return (
    <div className="space-y-6">
      {/* ترويسة الصفحة والأزرار التفاعلية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-primary/20">
            <Kanban className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <span>لوحة كانبان - متابعة الإنتاج</span>
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 rounded-full border-primary/30 text-primary">
                {counts.total} بنود
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              متابعة كل بند بالاسم ومرحلة الإنتاج بدقة، مع إمكانية تخصيص مراحل وأعمدة اللوحة بالكامل.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* زر إدارة المراحل والأعمدة */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setManageColumnsOpen(true)}
            className="gap-2 shadow-sm font-semibold bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>إدارة المراحل والأعمدة</span>
          </Button>

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
            <span>مزامنة الفواتير</span>
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

      {/* شريط الإحصائيات السريعة للمراحل الديناميكية */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {activeColumns.map((col) => {
          const scheme = STAGE_COLORS[col.color] || STAGE_COLORS.sky;
          const Icon = AVAILABLE_ICONS[col.icon] || Layers;
          const count = counts[col.key] ?? 0;

          return (
            <motion.div
              key={col.key}
              whileHover={{ y: -2 }}
              className="p-3.5 rounded-2xl border bg-card/60 backdrop-blur shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground truncate">{col.title}</span>
                <div className={`p-1.5 rounded-lg ${scheme.lightBg}`}>
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

        {/* فلترة مستوى الاستعجال وتاريخ التسليم */}
        <div className="w-full md:w-56">
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">كل مواعيد التسليم</option>
            <option value="overdue">متأخرة عن موعدها</option>
            <option value="today">موعد تسليمها اليوم</option>
            <option value="tomorrow">موعد تسليمها غداً</option>
            <option value="upcoming">قادمة (اليوم فما بعد)</option>
          </select>
        </div>
      </div>

      {/* لوحة الكانبان الرئيسية - الأعمدة الديناميكية */}
      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-3xl bg-card/20">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">جارٍ تحميل لوحة الكانبان...</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start scrollbar-thin">
          {activeColumns.map((col) => {
            const scheme = STAGE_COLORS[col.color] || STAGE_COLORS.sky;
            const Icon = AVAILABLE_ICONS[col.icon] || Layers;
            const cards = data?.columns?.[col.key] || [];
            const isColumnOver = dragOverColumn === col.key;

            return (
              <div
                key={col.key}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={(e) => handleDragLeave(e, col.key)}
                onDrop={(e) => handleDrop(e, col.key)}
                className={`flex flex-col rounded-2xl border transition-all duration-200 bg-muted/30 backdrop-blur min-h-[550px] w-[300px] sm:w-[320px] flex-shrink-0 ${
                  isColumnOver
                    ? `border-primary ring-2 ring-primary/30 shadow-lg ${scheme.lightBg}`
                    : 'border-border/80'
                }`}
              >
                {/* ترويسة العمود */}
                <div className="p-3.5 border-b border-border/80 flex items-center justify-between sticky top-0 bg-card/90 backdrop-blur-md rounded-t-2xl z-10">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`p-1.5 rounded-lg ${scheme.lightBg} flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-sm tracking-tight truncate">{col.title}</h3>
                      {col.is_initial && (
                        <span className="text-[10px] text-muted-foreground block -mt-0.5">البداية</span>
                      )}
                      {col.is_final && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block -mt-0.5">تسليم نهائي</span>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-bold text-xs px-2 py-0.5 rounded-full flex-shrink-0">
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
                        allColumns={activeColumns}
                        onDragStart={() => handleDragStart(card)}
                        onQuickMove={(newStatus) => {
                          const targetCol = activeColumns.find((c) => c.key === newStatus);
                          const isTargetFinal = targetCol ? targetCol.is_final : newStatus === 'delivered';

                          if (
                            isTargetFinal &&
                            card.completion_stats?.total_items > 1 &&
                            !card.completion_stats?.is_all_delivered
                          ) {
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

          {/* كرت سريع لإضافة مرحلة جديدة في نهاية اللوحة */}
          <button
            type="button"
            onClick={openCreateColumnDialog}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/70 hover:border-primary/60 bg-muted/20 hover:bg-muted/40 transition-all min-h-[550px] w-[260px] flex-shrink-0 p-6 text-center group cursor-pointer"
          >
            <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-2">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              + إضافة مرحلة جديدة
            </span>
            <span className="text-xs text-muted-foreground mt-1 max-w-[180px]">
              يمكنك إضافة عمود مخصص لأي مرحلة في خط الإنتاج
            </span>
          </button>
        </div>
      )}

      {/* نافذة إدارة المراحل والأعمدة (Manage Stages Dialog) */}
      <Dialog open={manageColumnsOpen} onOpenChange={setManageColumnsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <span>إدارة مراحل وأعمدة الكانبان</span>
              </DialogTitle>
              <Button
                size="sm"
                onClick={openCreateColumnDialog}
                className="gap-1.5 text-xs font-semibold"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة مرحلة جديدة</span>
              </Button>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              يمكنك هنا إضافة أو حذف أو تعديل أي مرحلة من مراحل لوحة الإنتاج وإعادة ترتيبها حسب تدفق العمل لديك.
            </DialogDescription>
          </DialogHeader>

          {/* قائمة المراحل الحالية */}
          <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
            {activeColumns.map((col, index) => {
              const scheme = STAGE_COLORS[col.color] || STAGE_COLORS.sky;
              const Icon = AVAILABLE_ICONS[col.icon] || Layers;
              const cardsCount = counts[col.key] ?? 0;

              return (
                <div
                  key={col.id}
                  className="p-3 rounded-xl border bg-card flex items-center justify-between gap-3 hover:border-primary/30 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveColumnOrder(index, 'up')}
                        disabled={index === 0 || reorderColumnsMutation.isPending}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="تحريك للأمام"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveColumnOrder(index, 'down')}
                        disabled={index === activeColumns.length - 1 || reorderColumnsMutation.isPending}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="تحريك للخلف"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className={`p-2 rounded-lg ${scheme.lightBg} flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{col.title}</span>
                        <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                          {col.key}
                        </code>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-muted-foreground">
                          {cardsCount} بند حالياً
                        </span>
                        {col.is_initial && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-500/10 text-sky-600 border-sky-500/30">
                            مرحلة أولية افتراضية
                          </Badge>
                        )}
                        {col.is_final && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            مرحلة تسليم نهائي
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => openEditColumnDialog(col)}
                      title="تعديل المرحلة"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => openDeleteColumnDialog(col)}
                      disabled={activeColumns.length <= 1}
                      title="حذف المرحلة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="border-t pt-3 flex justify-between items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              إجمالي المراحل المعتمدة: {activeColumns.length}
            </span>
            <Button variant="outline" size="sm" onClick={() => setManageColumnsOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة إضافة أو تعديل مرحلة (Create / Edit Column Dialog) */}
      <Dialog open={columnFormOpen} onOpenChange={setColumnFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{editingColumn ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              حدد اسم المرحلة ومظهرها وخصائصها في تدفق العمل
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* اسم المرحلة */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">عنوان المرحلة *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="مثال: مراجعة العميل، قص وسلوفان، في التوصيل..."
                className="text-sm"
                autoFocus
              />
            </div>

            {/* اختيار اللون */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">لون المرحلة</Label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(STAGE_COLORS).map(([colorKey, scheme]) => (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setFormColor(colorKey)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                      formColor === colorKey
                        ? 'border-primary ring-2 ring-primary/30 bg-primary/10'
                        : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full ${scheme.dotColor}`} />
                    <span className="text-[11px] truncate">{scheme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* اختيار الأيقونة */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">أيقونة المرحلة</Label>
              <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1 border rounded-xl bg-muted/20">
                {Object.entries(AVAILABLE_ICONS).map(([iconKey, IconComponent]) => (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setFormIcon(iconKey)}
                    className={`p-2.5 rounded-lg border flex items-center justify-center transition-all ${
                      formIcon === iconKey
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                    title={iconKey}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* خيارات الحالة والخصائص */}
            <div className="space-y-2 pt-2 border-t">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formIsInitial}
                  onChange={(e) => setFormIsInitial(e.target.checked)}
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                />
                <div className="text-xs">
                  <span className="font-semibold block text-foreground">مرحلة البداية الافتراضية للبنود الجديدة</span>
                  <span className="text-muted-foreground text-[11px]">
                    عند إنشاء أي فاتورة جديدة، ستدخل بنودها تلقائياً في هذه المرحلة.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formIsFinal}
                  onChange={(e) => setFormIsFinal(e.target.checked)}
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                />
                <div className="text-xs">
                  <span className="font-semibold block text-foreground">مرحلة تسليم نهائي</span>
                  <span className="text-muted-foreground text-[11px]">
                    عند نقل البنود إليها يتم تسجيل تاريخ ووقت التسليم واكتمال الفاتورة تلقائياً.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setColumnFormOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => saveColumnMutation.mutate()}
              disabled={saveColumnMutation.isPending || !formTitle.trim()}
              className="gap-1.5"
            >
              {saveColumnMutation.isPending ? 'جارٍ الحفظ...' : editingColumn ? 'تحديث المرحلة' : 'إنشاء المرحلة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد حذف مرحلة ونقل الكروت (Delete Column & Migrate Cards Dialog) */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="p-3 w-fit rounded-2xl bg-destructive/10 text-destructive mb-2">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-base font-bold text-destructive">
              حذف المرحلة "{columnToDelete?.title}"
            </DialogTitle>
            <DialogDescription className="text-xs space-y-2">
              <span>هل أنت متأكد من إزالة هذا العمود من لوحة الكانبان؟</span>
            </DialogDescription>
          </DialogHeader>

          {columnToDelete && (
            <div className="space-y-3 py-2">
              {/* في حال وجود كروت في هذه المرحلة */}
              {(counts[columnToDelete.key] || 0) > 0 ? (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span>تنبيه: يوجد ({counts[columnToDelete.key]}) بنود في هذه المرحلة!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    لحماية بياناتك، يرجى اختيار المرحلة البديلة التي ترغب بنقل هذه البنود إليها قبل إتمام الحذف:
                  </p>
                  <div className="pt-1">
                    <Label className="text-[11px] font-semibold text-foreground mb-1 block">
                      المرحلة البديلة لنقل البنود:
                    </Label>
                    <select
                      value={fallbackStageKey}
                      onChange={(e) => setFallbackStageKey(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {activeColumns
                        .filter((c) => c.id !== columnToDelete.id)
                        .map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border bg-muted/40 text-xs text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span>هذه المرحلة فارغة حالياً ولا تحتوي على أي بنود عمل.</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteColumnMutation.mutate()}
              disabled={deleteColumnMutation.isPending}
              className="gap-1.5"
            >
              {deleteColumnMutation.isPending ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <span className="text-emerald-600 font-semibold">التسليم النهائي</span>.
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
  allColumns,
  onDragStart,
  onQuickMove,
}: {
  card: KanbanCardItem;
  allColumns: KanbanColumnItem[];
  onDragStart: () => void;
  onQuickMove: (newStatus: string) => void;
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

      {/* تاريخ التسليم ومستوى الاستعجال */}
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

      {/* زر النقل السريع من القائمة المنسدلة لجميع المراحل المتاحة */}
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
            {allColumns.filter((s) => s.key !== card.status).map((col) => {
              const StageIcon = AVAILABLE_ICONS[col.icon] || Layers;
              return (
                <DropdownMenuItem
                  key={col.key}
                  onClick={() => onQuickMove(col.key)}
                  className="gap-2 cursor-pointer"
                >
                  <StageIcon className="h-3.5 w-3.5" />
                  <span>{col.title}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
