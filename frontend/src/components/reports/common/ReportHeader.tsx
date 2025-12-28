// مكون رأس التقرير

import React from 'react';
import { ArrowLeft, Download, Printer, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showBackButton?: boolean;
  backPath?: string;
  onRefresh?: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  isExporting?: boolean;
  isRefreshing?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  title,
  subtitle,
  icon,
  showBackButton = true,
  backPath = '/reports',
  onRefresh,
  onExportPdf,
  onExportExcel,
  onPrint,
  isExporting = false,
  isRefreshing = false,
  actions,
  className = '',
}) => {
  const navigate = useNavigate();
  const hasExportOptions = onExportPdf || onExportExcel || onPrint;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backPath)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            {icon}
          </div>
        )}
        
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        )}

        {hasExportOptions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                <Download className="h-4 w-4 ml-2" />
                {isExporting ? 'جاري التصدير...' : 'تصدير'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExportPdf && (
                <DropdownMenuItem onClick={onExportPdf}>
                  <Download className="h-4 w-4 ml-2" />
                  تصدير PDF
                </DropdownMenuItem>
              )}
              {onExportExcel && (
                <DropdownMenuItem onClick={onExportExcel}>
                  <Download className="h-4 w-4 ml-2" />
                  تصدير Excel
                </DropdownMenuItem>
              )}
              {onPrint && (
                <DropdownMenuItem onClick={onPrint}>
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {actions}
      </div>
    </div>
  );
};

export default ReportHeader;
