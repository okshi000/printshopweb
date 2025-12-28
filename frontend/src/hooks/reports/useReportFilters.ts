// Hook لإدارة فلاتر التقارير

import { useState, useCallback, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, startOfQuarter, endOfQuarter } from 'date-fns';
import type { ReportFilters, DateRange, ReportPeriod } from '@/types/reports/common.types';

interface UseReportFiltersOptions {
  defaultPeriod?: ReportPeriod;
  defaultDateRange?: DateRange;
}

interface UseReportFiltersReturn {
  // الفلاتر الحالية
  filters: ReportFilters;
  
  // نطاق التاريخ
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  
  // الفترة
  period: ReportPeriod;
  setPeriod: (period: ReportPeriod) => void;
  
  // فلاتر إضافية
  customFilters: Record<string, unknown>;
  setCustomFilter: (key: string, value: unknown) => void;
  clearCustomFilters: () => void;
  
  // دوال مساعدة
  resetFilters: () => void;
  getQueryParams: () => Record<string, string>;
  
  // تحديد الفترات السريعة
  setThisWeek: () => void;
  setThisMonth: () => void;
  setThisQuarter: () => void;
  setThisYear: () => void;
  setLastMonth: () => void;
  setLast7Days: () => void;
  setLast30Days: () => void;
  setLast90Days: () => void;
}

function getDefaultDateRange(period: ReportPeriod): DateRange {
  const now = new Date();
  
  switch (period) {
    case 'week':
      return { from: subDays(now, 7), to: now };
    case 'month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'quarter':
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case 'year':
      return { from: startOfYear(now), to: endOfYear(now) };
    default:
      return { from: startOfMonth(now), to: now };
  }
}

export function useReportFilters(options: UseReportFiltersOptions = {}): UseReportFiltersReturn {
  const { defaultPeriod = 'month' } = options;
  
  const [period, setPeriodState] = useState<ReportPeriod>(defaultPeriod);
  const [dateRange, setDateRangeState] = useState<DateRange>(
    options.defaultDateRange || getDefaultDateRange(defaultPeriod)
  );
  const [customFilters, setCustomFilters] = useState<Record<string, unknown>>({});

  // تحديث نطاق التاريخ
  const setDateRange = useCallback((range: DateRange) => {
    setDateRangeState(range);
    setPeriodState('custom');
  }, []);

  // تحديث الفترة
  const setPeriod = useCallback((newPeriod: ReportPeriod) => {
    setPeriodState(newPeriod);
    if (newPeriod !== 'custom') {
      setDateRangeState(getDefaultDateRange(newPeriod));
    }
  }, []);

  // تحديث فلتر مخصص
  const setCustomFilter = useCallback((key: string, value: unknown) => {
    setCustomFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // مسح الفلاتر المخصصة
  const clearCustomFilters = useCallback(() => {
    setCustomFilters({});
  }, []);

  // إعادة تعيين جميع الفلاتر
  const resetFilters = useCallback(() => {
    setPeriodState(defaultPeriod);
    setDateRangeState(getDefaultDateRange(defaultPeriod));
    setCustomFilters({});
  }, [defaultPeriod]);

  // تحويل قيم الفترة
  const mapPeriodToFilter = (p: ReportPeriod): ReportFilters['period'] => {
    const periodMap: Record<ReportPeriod, ReportFilters['period']> = {
      week: 'weekly',
      month: 'monthly',
      quarter: 'quarterly',
      year: 'yearly',
      custom: undefined,
    };
    return periodMap[p];
  };

  // الفلاتر المجمعة
  const filters = useMemo<ReportFilters>(() => ({
    start_date: format(dateRange.from, 'yyyy-MM-dd'),
    end_date: format(dateRange.to, 'yyyy-MM-dd'),
    period: mapPeriodToFilter(period),
    ...customFilters,
  }), [dateRange, period, customFilters]);

  // الحصول على معاملات الاستعلام
  const getQueryParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date: format(dateRange.to, 'yyyy-MM-dd'),
    };
    
    if (period !== 'custom') {
      params.period = period;
    }
    
    Object.entries(customFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = String(value);
      }
    });
    
    return params;
  }, [dateRange, period, customFilters]);

  // دوال الفترات السريعة
  const setThisWeek = useCallback(() => {
    const now = new Date();
    setDateRangeState({ from: subDays(now, 7), to: now });
    setPeriodState('week');
  }, []);

  const setThisMonth = useCallback(() => {
    const now = new Date();
    setDateRangeState({ from: startOfMonth(now), to: endOfMonth(now) });
    setPeriodState('month');
  }, []);

  const setThisQuarter = useCallback(() => {
    const now = new Date();
    setDateRangeState({ from: startOfQuarter(now), to: endOfQuarter(now) });
    setPeriodState('quarter');
  }, []);

  const setThisYear = useCallback(() => {
    const now = new Date();
    setDateRangeState({ from: startOfYear(now), to: endOfYear(now) });
    setPeriodState('year');
  }, []);

  const setLastMonth = useCallback(() => {
    const lastMonth = subMonths(new Date(), 1);
    setDateRangeState({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
    setPeriodState('custom');
  }, []);

  const setLast7Days = useCallback(() => {
    const now = new Date();
    setDateRangeState({ from: subDays(now, 7), to: now });
    setPeriodState('custom');
  }, []);

  const setLast30Days = useCallback(() => {
    const now = new Date();
    setDateRangeState({ from: subDays(now, 30), to: now });
    setPeriodState('custom');
  }, []);

  const setLast90Days = useCallback(() => {
    const now = new Date();
    setDateRangeState({ from: subDays(now, 90), to: now });
    setPeriodState('custom');
  }, []);

  return {
    filters,
    dateRange,
    setDateRange,
    period,
    setPeriod,
    customFilters,
    setCustomFilter,
    clearCustomFilters,
    resetFilters,
    getQueryParams,
    setThisWeek,
    setThisMonth,
    setThisQuarter,
    setThisYear,
    setLastMonth,
    setLast7Days,
    setLast30Days,
    setLast90Days,
  };
}

export default useReportFilters;
