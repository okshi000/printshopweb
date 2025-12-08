import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive/10 text-destructive border-destructive/20',
        outline: 'text-foreground border-border',
        success:
          'border-transparent bg-success/10 text-success border-success/20',
        warning:
          'border-transparent bg-warning/10 text-warning border-warning/20',
        info:
          'border-transparent bg-primary/10 text-primary border-primary/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  pulse?: boolean
}

function Badge({ className, variant, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'ml-1.5 h-1.5 w-1.5 rounded-full',
            {
              'bg-primary-foreground': variant === 'default',
              'bg-secondary-foreground': variant === 'secondary',
              'bg-destructive': variant === 'destructive',
              'bg-success': variant === 'success',
              'bg-warning': variant === 'warning',
              'bg-primary': variant === 'info' || variant === 'outline',
            },
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </div>
  )
}

// Status Badge for invoices/orders
type StatusType = 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled' | 'paid' | 'partial' | 'unpaid'

const statusConfig: Record<StatusType, { label: string; variant: BadgeProps['variant'] }> = {
  new: { label: 'جديد', variant: 'info' },
  in_progress: { label: 'قيد التنفيذ', variant: 'warning' },
  ready: { label: 'جاهز', variant: 'success' },
  delivered: { label: 'تم التسليم', variant: 'default' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
  paid: { label: 'مدفوع', variant: 'success' },
  partial: { label: 'مدفوع جزئياً', variant: 'warning' },
  unpaid: { label: 'غير مدفوع', variant: 'destructive' },
}

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: StatusType
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new
  return (
    <Badge variant={config.variant} dot className={className} {...props}>
      {config.label}
    </Badge>
  )
}

export { Badge, StatusBadge, badgeVariants }
