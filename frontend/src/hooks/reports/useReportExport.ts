// Hook لتصدير التقارير

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import type { ReportFilters } from '@/types/reports';

// تعريف خيارات التصدير محلياً
interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  filename?: string;
  title?: string;
  includeCharts?: boolean;
  orientation?: 'portrait' | 'landscape';
}

interface UseReportExportOptions {
  defaultFormat?: 'pdf' | 'excel' | 'csv';
  defaultFilename?: string;
}

interface UseReportExportReturn {
  // حالة التصدير
  isExporting: boolean;
  exportError: string | null;
  
  // تصدير التقرير
  exportReport: (
    exportFn: (format: 'pdf' | 'excel', filters?: ReportFilters) => Promise<Blob>,
    options?: Partial<ExportOptions>,
    filters?: ReportFilters
  ) => Promise<void>;
  
  // تصدير PDF
  exportToPdf: (
    exportFn: (format: 'pdf' | 'excel', filters?: ReportFilters) => Promise<Blob>,
    filename?: string,
    filters?: ReportFilters
  ) => Promise<void>;
  
  // تصدير Excel
  exportToExcel: (
    exportFn: (format: 'pdf' | 'excel', filters?: ReportFilters) => Promise<Blob>,
    filename?: string,
    filters?: ReportFilters
  ) => Promise<void>;
  
  // تصدير CSV
  exportToCsv: (data: unknown[], filename?: string) => void;
  
  // طباعة التقرير
  printReport: (elementId?: string) => void;
  
  // مسح الخطأ
  clearError: () => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function getFileExtension(format: 'pdf' | 'excel' | 'csv'): string {
  switch (format) {
    case 'pdf':
      return '.pdf';
    case 'excel':
      return '.xlsx';
    case 'csv':
      return '.csv';
    default:
      return '';
  }
}

function convertToCSV(data: unknown[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0] as Record<string, unknown>);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = (row as Record<string, unknown>)[header];
        // معالجة القيم التي تحتوي على فواصل أو علامات اقتباس
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

export function useReportExport(options: UseReportExportOptions = {}): UseReportExportReturn {
  const { defaultFormat = 'pdf', defaultFilename = 'report' } = options;
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setExportError(null);
  }, []);

  const exportReport = useCallback(async (
    exportFn: (format: 'pdf' | 'excel', filters?: ReportFilters) => Promise<Blob>,
    exportOptions?: Partial<ExportOptions>,
    filters?: ReportFilters
  ) => {
    const { 
      format: exportFormat = defaultFormat, 
      filename = defaultFilename 
    } = exportOptions || {};
    
    setIsExporting(true);
    setExportError(null);
    
    try {
      const response = await exportFn(exportFormat as 'pdf' | 'excel', filters);
      const blob = response instanceof Blob ? response : new Blob([response as BlobPart]);
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const fullFilename = `${filename}_${timestamp}${getFileExtension(exportFormat)}`;
      downloadBlob(blob, fullFilename);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل تصدير التقرير';
      setExportError(errorMessage);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [defaultFormat, defaultFilename]);

  const exportToPdf = useCallback(async (
    exportFn: (format: 'pdf' | 'excel', filters?: ReportFilters) => Promise<Blob>,
    filename?: string,
    filters?: ReportFilters
  ) => {
    await exportReport(exportFn, { format: 'pdf', filename }, filters);
  }, [exportReport]);

  const exportToExcel = useCallback(async (
    exportFn: (format: 'pdf' | 'excel', filters?: ReportFilters) => Promise<Blob>,
    filename?: string,
    filters?: ReportFilters
  ) => {
    await exportReport(exportFn, { format: 'excel', filename }, filters);
  }, [exportReport]);

  const exportToCsv = useCallback((data: unknown[], filename?: string) => {
    const csv = convertToCSV(data);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    const fullFilename = `${filename || defaultFilename}_${timestamp}.csv`;
    downloadBlob(blob, fullFilename);
  }, [defaultFilename]);

  const printReport = useCallback((elementId?: string) => {
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
              <head>
                <title>طباعة التقرير</title>
                <style>
                  body { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; }
                  @media print {
                    body { -webkit-print-color-adjust: exact; }
                  }
                </style>
              </head>
              <body>${element.innerHTML}</body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } else {
      window.print();
    }
  }, []);

  return {
    isExporting,
    exportError,
    exportReport,
    exportToPdf,
    exportToExcel,
    exportToCsv,
    printReport,
    clearError,
  };
}

export default useReportExport;
