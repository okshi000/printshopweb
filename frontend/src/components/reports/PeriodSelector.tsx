import React from 'react';
import { Button } from '@/components/ui/button';
import { getPresetDateRange } from '@/lib/reportUtils';

interface PeriodSelectorProps {
  onSelect: (startDate: Date, endDate: Date) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ onSelect }) => {
  const periods = [
    { label: 'اليوم', value: 'today' as const },
    { label: 'أمس', value: 'yesterday' as const },
    { label: 'هذا الأسبوع', value: 'thisWeek' as const },
    { label: 'الأسبوع الماضي', value: 'lastWeek' as const },
    { label: 'هذا الشهر', value: 'thisMonth' as const },
    { label: 'الشهر الماضي', value: 'lastMonth' as const },
    { label: 'هذا العام', value: 'thisYear' as const },
    { label: 'العام الماضي', value: 'lastYear' as const },
  ];

  const handleSelect = (preset: typeof periods[number]['value']) => {
    const { startDate, endDate } = getPresetDateRange(preset);
    onSelect(startDate, endDate);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant="outline"
          size="sm"
          onClick={() => handleSelect(period.value)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
};
