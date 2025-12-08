import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hover?: boolean; gradient?: 'primary' | 'success' | 'warning' | 'destructive' }
>(({ className, hover = false, gradient, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow-soft',
      hover && 'card-hover cursor-pointer',
      gradient && `gradient-${gradient}`,
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold text-lg leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

// Animated Card with hover effects
interface AnimatedCardProps {
  className?: string
  delay?: number
  children?: React.ReactNode
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, delay = 0, children }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        type: 'spring',
        stiffness: 100,
        damping: 15,
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 20px 40px -3px rgba(0, 0, 0, 0.1), 0 8px 16px -2px rgba(0, 0, 0, 0.05)',
      }}
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-soft transition-colors',
        className
      )}
    >
      {children}
    </motion.div>
  )
)
AnimatedCard.displayName = 'AnimatedCard'

// Stats Card with icon and gradient
interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  gradient?: 'primary' | 'success' | 'warning' | 'destructive'
  className?: string
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  gradient = 'primary',
  className,
}) => (
  <AnimatedCard className={cn('relative overflow-hidden', className)}>
    <div className={cn('absolute top-0 left-0 w-full h-1', {
      'bg-gradient-to-r from-primary to-primary/50': gradient === 'primary',
      'bg-gradient-to-r from-success to-success/50': gradient === 'success',
      'bg-gradient-to-r from-warning to-warning/50': gradient === 'warning',
      'bg-gradient-to-r from-destructive to-destructive/50': gradient === 'destructive',
    })} />
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon && (
        <div className={cn('p-2 rounded-lg', {
          'bg-primary/10 text-primary': gradient === 'primary',
          'bg-success/10 text-success': gradient === 'success',
          'bg-warning/10 text-warning': gradient === 'warning',
          'bg-destructive/10 text-destructive': gradient === 'destructive',
        })}>
          {icon}
        </div>
      )}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      {(description || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={cn('text-sm font-medium', trend.isPositive ? 'text-success' : 'text-destructive')}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
    </CardContent>
  </AnimatedCard>
)

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  AnimatedCard,
  StatsCard,
}
