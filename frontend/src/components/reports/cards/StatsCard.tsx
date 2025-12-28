// مكون بطاقة الإحصائيات

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrendInfo } from '@/types/reports/common.types';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  trend?: TrendInfo;
  gradient?: string;
  className?: string;
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'text-white',
  trend,
  gradient = 'bg-gradient-to-br from-primary to-primary/80',
  className = '',
  onClick,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.direction === 'up') {
      return <ArrowUp className="h-4 w-4" />;
    } else if (trend.direction === 'down') {
      return <ArrowDown className="h-4 w-4" />;
    }
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    switch (trend.direction) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all',
        onClick && 'cursor-pointer hover:shadow-lg',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            
            {trend && (
              <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                {getTrendIcon()}
                <span>{Math.abs(trend.value)}%</span>
                {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
              </div>
            )}
            
            {subtitle && !trend && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          {icon && (
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg',
              gradient,
              iconColor
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// مكون بطاقة الملخص
interface SummaryCardProps {
  title: string;
  items: {
    label: string;
    value: string | number;
    color?: string;
  }[];
  icon?: React.ReactNode;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  items,
  icon,
  className = '',
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className={cn('font-medium', item.color)}>{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// مكون بطاقة الاتجاه
interface TrendCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  format?: (value: number) => string;
  positiveIsGood?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const TrendCard: React.FC<TrendCardProps> = ({
  title,
  currentValue,
  previousValue,
  format = (v) => v.toString(),
  positiveIsGood = true,
  icon,
  className = '',
}) => {
  const change = previousValue !== 0 
    ? ((currentValue - previousValue) / previousValue) * 100 
    : 0;
  
  const isPositive = change > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isGood ? 'text-emerald-600' : 'text-red-600';
  const bgColor = isGood 
    ? 'bg-emerald-50 dark:bg-emerald-950' 
    : 'bg-red-50 dark:bg-red-950';

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
          <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{format(currentValue)}</p>
            <p className="text-sm text-muted-foreground">الفترة الحالية</p>
          </div>
          <div className={cn('rounded-lg p-3', bgColor)}>
            <p className="text-sm font-medium">{format(previousValue)}</p>
            <p className="text-xs text-muted-foreground">الفترة السابقة</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// مكون بطاقة التقدم
interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  format?: (value: number) => string;
  color?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  current,
  target,
  format = (v) => v.toString(),
  color = 'bg-primary',
  icon,
  className = '',
}) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {percentage.toFixed(0)}%
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{format(current)}</span>
            <span className="text-muted-foreground">من {format(target)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', color)}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
