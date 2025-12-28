// مكون جدول التقارير

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface ReportTableProps<T = Record<string, unknown>> {
  title?: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  
  // التصفح
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  
  // الترتيب
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  
  // أحداث
  onRowClick?: (row: T, index: number) => void;
  
  // التخصيص
  className?: string;
  headerClassName?: string;
  rowClassName?: (row: T, index: number) => string;
  actions?: React.ReactNode;
}

export function ReportTable<T>({
  title,
  subtitle,
  columns,
  data,
  isLoading = false,
  emptyMessage = 'لا توجد بيانات',
  page = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  sortField,
  sortDirection: _sortDirection,
  onSort,
  onRowClick,
  className = '',
  headerClassName = '',
  rowClassName,
  actions,
}: ReportTableProps<T>) {
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const showPagination = totalItems && totalItems > pageSize;

  const getValue = (row: T, key: keyof T | string): unknown => {
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce<unknown>((obj, k) => {
        if (obj && typeof obj === 'object' && k in obj) {
          return (obj as Record<string, unknown>)[k];
        }
        return undefined;
      }, row);
    }
    return row[key as keyof T];
  };

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'left':
        return 'text-left';
      case 'right':
        return 'text-right';
      case 'center':
        return 'text-center';
      default:
        return 'text-right';
    }
  };

  const renderLoadingSkeleton = () => (
    <TableBody>
      {Array.from({ length: pageSize }).map((_, i) => (
        <TableRow key={i}>
          {columns.map((_col, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );

  const renderEmptyState = () => (
    <TableBody>
      <TableRow>
        <TableCell colSpan={columns.length} className="h-32 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </TableCell>
      </TableRow>
    </TableBody>
  );

  return (
    <Card className={className}>
      {(title || actions) && (
        <CardHeader className={`flex flex-row items-center justify-between ${headerClassName}`}>
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </CardHeader>
      )}
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={getAlignClass(column.align)}
                    style={{ width: column.width }}
                  >
                    {column.sortable && onSort ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSort(String(column.key))}
                        className="gap-1 font-semibold"
                      >
                        {column.title}
                        <ArrowUpDown className={`h-4 w-4 ${
                          sortField === column.key ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </Button>
                    ) : (
                      column.title
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            
            {isLoading ? renderLoadingSkeleton() : data.length === 0 ? renderEmptyState() : (
              <TableBody>
                {data.map((row, index) => (
                  <TableRow
                    key={index}
                    className={`
                      ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                      ${rowClassName ? rowClassName(row, index) : ''}
                    `}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.key)}
                        className={getAlignClass(column.align)}
                      >
                        {column.render
                          ? column.render(getValue(row, column.key), row, index)
                          : String(getValue(row, column.key) ?? '-')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>

        {/* التصفح */}
        {showPagination && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              عرض {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalItems)} من {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(page - 1)}
                disabled={page <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                صفحة {page} من {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReportTable;
