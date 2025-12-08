/**
 * تنسيق العملة بالجنيه المصري
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * تنسيق الأرقام
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ar-EG').format(value);
};

/**
 * تنسيق النسبة المئوية
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

/**
 * حساب النسبة المئوية
 */
export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return (part / total) * 100;
};

/**
 * حساب النمو
 */
export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * تنسيق التاريخ بالعربية
 */
export const formatDateArabic = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
};

/**
 * الحصول على اسم الشهر بالعربية
 */
export const getArabicMonthName = (monthNumber: number): string => {
  const months = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];
  return months[monthNumber - 1] || '';
};

/**
 * تحديد لون حالة الاتجاه
 */
export const getTrendColor = (value: number): string => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};

/**
 * تحديد أيقونة الاتجاه
 */
export const getTrendIcon = (value: number): '↑' | '↓' | '→' => {
  if (value > 0) return '↑';
  if (value < 0) return '↓';
  return '→';
};

/**
 * تجميع البيانات حسب الفترة
 */
export const groupByPeriod = <T extends Record<string, any>>(
  data: T[],
  dateKey: keyof T,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
): Map<string, T[]> => {
  const grouped = new Map<string, T[]>();

  data.forEach((item) => {
    const date = new Date(item[dateKey] as string);
    let key: string;

    switch (period) {
      case 'daily':
        key = date.toISOString().split('T')[0];
        break;
      case 'weekly':
        const week = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-W${week}`;
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'yearly':
        key = String(date.getFullYear());
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  return grouped;
};

/**
 * حساب المتوسط
 */
export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return sum / numbers.length;
};

/**
 * حساب الوسيط
 */
export const calculateMedian = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

/**
 * إنشاء ألوان عشوائية للرسوم البيانية
 */
export const generateChartColors = (count: number): string[] => {
  const baseColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#14b8a6', // teal
  ];

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
};

/**
 * تصدير البيانات إلى CSV
 */
export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header] ?? '')).join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * طباعة التقرير
 */
export const printReport = (): void => {
  window.print();
};

/**
 * تحديد نطاق التاريخ المحدد مسبقاً
 */
export const getPresetDateRange = (
  preset: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'
): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };

    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
      };

    case 'thisWeek':
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      return {
        startDate: startOfWeek,
        endDate: now,
      };

    case 'lastWeek':
      const lastWeekEnd = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000 - 1);
      const lastWeekStart = new Date(lastWeekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
      return {
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
      };

    case 'thisMonth':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: now,
      };

    case 'lastMonth':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0),
      };

    case 'thisYear':
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: now,
      };

    case 'lastYear':
      return {
        startDate: new Date(now.getFullYear() - 1, 0, 1),
        endDate: new Date(now.getFullYear() - 1, 11, 31),
      };

    default:
      return { startDate: today, endDate: now };
  }
};

/**
 * تحديد حالة المخزون
 */
export const getStockStatus = (
  currentQty: number,
  reorderLevel: number
): 'in_stock' | 'low_stock' | 'out_of_stock' => {
  if (currentQty === 0) return 'out_of_stock';
  if (currentQty <= reorderLevel) return 'low_stock';
  return 'in_stock';
};

/**
 * تحديد حالة الدين
 */
export const getDebtStatus = (
  daysOverdue: number
): 'current' | 'overdue' | 'critical' => {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue > 90) return 'critical';
  if (daysOverdue > 30) return 'overdue';
  return 'current';
};

/**
 * حساب الإحصائيات الأساسية
 */
export const calculateStats = (numbers: number[]) => {
  if (numbers.length === 0) {
    return {
      sum: 0,
      average: 0,
      min: 0,
      max: 0,
      median: 0,
      count: 0,
    };
  }

  const sum = numbers.reduce((acc, val) => acc + val, 0);
  const sorted = [...numbers].sort((a, b) => a - b);

  return {
    sum,
    average: sum / numbers.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: calculateMedian(numbers),
    count: numbers.length,
  };
};
