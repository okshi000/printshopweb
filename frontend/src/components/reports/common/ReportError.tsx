// مكون معالجة أخطاء التقارير

import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface ReportErrorProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  showBackButton?: boolean;
  backPath?: string;
  variant?: 'default' | 'destructive' | 'warning';
  className?: string;
}

export const ReportError: React.FC<ReportErrorProps> = ({
  title = 'فشل تحميل التقرير',
  message = 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.',
  error,
  onRetry,
  showBackButton = true,
  backPath = '/reports',
  variant = 'destructive',
  className = '',
}) => {
  const navigate = useNavigate();

  const getErrorMessage = () => {
    if (error?.message) {
      // ترجمة بعض رسائل الخطأ الشائعة
      const errorMessages: Record<string, string> = {
        'Network Error': 'خطأ في الاتصال بالشبكة',
        'Request failed with status code 401': 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى',
        'Request failed with status code 403': 'ليس لديك صلاحية للوصول لهذا التقرير',
        'Request failed with status code 404': 'التقرير المطلوب غير موجود',
        'Request failed with status code 500': 'خطأ في الخادم، يرجى المحاولة لاحقاً',
      };
      return errorMessages[error.message] || error.message;
    }
    return message;
  };

  const IconComponent = variant === 'warning' ? FileWarning : AlertCircle;

  return (
    <Card className={`${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className={`mb-4 rounded-full p-4 ${
          variant === 'destructive' ? 'bg-destructive/10' : 
          variant === 'warning' ? 'bg-yellow-500/10' : 
          'bg-muted'
        }`}>
          <IconComponent className={`h-12 w-12 ${
            variant === 'destructive' ? 'text-destructive' : 
            variant === 'warning' ? 'text-yellow-500' : 
            'text-muted-foreground'
          }`} />
        </div>

        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{getErrorMessage()}</p>

        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة المحاولة
            </Button>
          )}
          {showBackButton && (
            <Button variant="outline" onClick={() => navigate(backPath)}>
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للتقارير
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// مكون تنبيه الخطأ الصغير
interface ReportAlertProps {
  title?: string;
  message: string;
  variant?: 'default' | 'destructive';
  onDismiss?: () => void;
  className?: string;
}

export const ReportAlert: React.FC<ReportAlertProps> = ({
  title = 'تنبيه',
  message,
  variant = 'destructive',
  onDismiss,
  className = '',
}) => {
  return (
    <Alert variant={variant} className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            إغلاق
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

// مكون حالة فارغة
interface ReportEmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const ReportEmptyState: React.FC<ReportEmptyStateProps> = ({
  title = 'لا توجد بيانات',
  message = 'لا توجد بيانات متاحة للفترة المحددة. جرب تغيير الفلاتر.',
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {icon || (
        <div className="mb-4 rounded-full bg-muted p-4">
          <FileWarning className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      {action}
    </div>
  );
};

export default ReportError;
