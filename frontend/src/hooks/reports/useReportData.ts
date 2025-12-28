// Hook لجلب بيانات التقارير

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { ReportFilters } from '@/types/reports';

// تعريف استجابة التقرير محلياً
interface ReportResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    last_page?: number;
  };
  summary?: Record<string, unknown>;
}

interface UseReportDataOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> {
  filters?: ReportFilters;
  enabled?: boolean;
}

interface UseReportDataReturn<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
}

/**
 * Hook عام لجلب بيانات التقارير
 */
export function useReportData<T>(
  queryKey: string[],
  queryFn: (filters?: ReportFilters) => Promise<{ data: T } | ReportResponse<T>>,
  options: UseReportDataOptions<T> = {}
): UseReportDataReturn<T> {
  const { filters, enabled = true, ...queryOptions } = options;

  const query = useQuery({
    queryKey: [...queryKey, filters],
    queryFn: async () => {
      const response = await queryFn(filters);
      // استخراج البيانات من الاستجابة
      if ('data' in response) {
        return response.data as T;
      }
      return response as unknown as T;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 دقائق
    ...queryOptions,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/**
 * Hook لجلب بيانات متعددة للتقارير
 */
export function useMultipleReportData<T extends Record<string, unknown>>(
  queries: {
    key: string;
    queryKey: string[];
    queryFn: (filters?: ReportFilters) => Promise<{ data: unknown }>;
  }[],
  filters?: ReportFilters,
  enabled = true
): {
  data: Partial<T>;
  isLoading: boolean;
  isError: boolean;
  errors: Record<string, Error | null>;
} {
  const results: Partial<T> = {};
  const errors: Record<string, Error | null> = {};
  let isLoading = false;
  let isError = false;

  queries.forEach(({ key, queryKey, queryFn }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const query = useQuery({
      queryKey: [...queryKey, filters],
      queryFn: async () => {
        const response = await queryFn(filters);
        return response.data;
      },
      enabled,
      staleTime: 5 * 60 * 1000,
    });

    results[key as keyof T] = query.data as T[keyof T];
    errors[key] = query.error;
    
    if (query.isLoading) isLoading = true;
    if (query.isError) isError = true;
  });

  return { data: results, isLoading, isError, errors };
}

export default useReportData;
