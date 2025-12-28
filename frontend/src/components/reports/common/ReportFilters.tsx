// مكون فلاتر التقارير

import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DateRange, ReportPeriod } from '@/types/reports/common.types';

interface ReportFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  showPeriodSelector?: boolean;
  showQuickFilters?: boolean;
  onReset?: () => void;
  additionalFilters?: React.ReactNode;
  className?: string;
}

const periodOptions = [
  { value: 'week', label: 'هذا الأسبوع' },
  { value: 'month', label: 'هذا الشهر' },
  { value: 'quarter', label: 'ربع سنوي' },
  { value: 'year', label: 'سنوي' },
  { value: 'custom', label: 'مخصص' },
];

const quickFilters = [
  { label: 'آخر 7 أيام', days: 7 },
  { label: 'آخر 30 يوم', days: 30 },
  { label: 'آخر 90 يوم', days: 90 },
];

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  dateRange,
  onDateRangeChange,
  period,
  onPeriodChange,
  showPeriodSelector = true,
  showQuickFilters = true,
  onReset,
  additionalFilters,
  className = '',
}) => {
  const handleQuickFilter = (days: number) => {
    const now = new Date();
    const from = new Date();
    from.setDate(now.getDate() - days);
    onDateRangeChange({ from, to: now });
    onPeriodChange('custom');
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* أيقونة الفلاتر */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">الفلاتر:</span>
          </div>

          {/* اختيار الفترة */}
          {showPeriodSelector && (
            <Select value={period} onValueChange={(value) => onPeriodChange(value as ReportPeriod)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="اختر الفترة" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* اختيار نطاق التاريخ */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {format(dateRange.from, 'dd/MM/yyyy', { locale: ar })} -{' '}
                  {format(dateRange.to, 'dd/MM/yyyy', { locale: ar })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onDateRangeChange({ from: range.from, to: range.to });
                    onPeriodChange('custom');
                  }
                }}
                numberOfMonths={2}
                locale={ar}
              />
            </PopoverContent>
          </Popover>

          {/* الفلاتر السريعة */}
          {showQuickFilters && (
            <div className="flex items-center gap-2">
              {quickFilters.map((filter) => (
                <Badge
                  key={filter.days}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleQuickFilter(filter.days)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
          )}

          {/* فلاتر إضافية */}
          {additionalFilters}

          {/* زر إعادة التعيين */}
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 ml-1" />
              إعادة تعيين
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFilters;
