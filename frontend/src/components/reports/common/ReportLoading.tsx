// مكون حالة تحميل التقرير

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ReportLoadingProps {
  type?: 'cards' | 'table' | 'chart' | 'full';
  count?: number;
  showSpinner?: boolean;
  message?: string;
  className?: string;
}

export const ReportLoading: React.FC<ReportLoadingProps> = ({
  type = 'full',
  count = 4,
  showSpinner = false,
  message = 'جاري تحميل التقرير...',
  className = '',
}) => {
  // تحميل البطاقات
  const renderCardsSkeleton = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-14 w-14 rounded-2xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // تحميل الجدول
  const renderTableSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* رأس الجدول */}
          <div className="flex gap-4 border-b pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {/* صفوف الجدول */}
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // تحميل الرسم البياني
  const renderChartSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  );

  // تحميل كامل
  const renderFullSkeleton = () => (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* الفلاتر */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* البطاقات */}
      {renderCardsSkeleton()}

      {/* الرسوم البيانية */}
      <div className="grid gap-6 lg:grid-cols-2">
        {renderChartSkeleton()}
        {renderChartSkeleton()}
      </div>

      {/* الجدول */}
      {renderTableSkeleton()}
    </div>
  );

  // عرض مع spinner
  if (showSpinner) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {type === 'cards' && renderCardsSkeleton()}
      {type === 'table' && renderTableSkeleton()}
      {type === 'chart' && renderChartSkeleton()}
      {type === 'full' && renderFullSkeleton()}
    </div>
  );
};

export default ReportLoading;
