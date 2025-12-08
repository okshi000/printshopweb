import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  label?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = 'الفترة الزمنية',
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-right font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {startDate ? (
                format(startDate, 'PPP', { locale: ar })
              ) : (
                <span>من تاريخ</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-right font-normal',
                !endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {endDate ? (
                format(endDate, 'PPP', { locale: ar })
              ) : (
                <span>إلى تاريخ</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {(startDate || endDate) && (
          <Button
            variant="ghost"
            onClick={() => {
              onStartDateChange(undefined);
              onEndDateChange(undefined);
            }}
          >
            إعادة تعيين
          </Button>
        )}
      </div>
    </div>
  );
};
