import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn, getInitials } from '@/lib/utils'

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
})
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-medium',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// User Avatar with name fallback
interface UserAvatarProps {
  name: string
  image?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const UserAvatar: React.FC<UserAvatarProps> = ({ name, image, size = 'md', className }) => (
  <Avatar size={size} className={className}>
    {image && <AvatarImage src={image} alt={name} />}
    <AvatarFallback>{getInitials(name)}</AvatarFallback>
  </Avatar>
)

// Avatar Group
interface AvatarGroupProps {
  avatars: { name: string; image?: string | null }[]
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'sm',
  className,
}) => {
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn('flex -space-x-2 rtl:space-x-reverse', className)}>
      {visibleAvatars.map((avatar, index) => (
        <UserAvatar
          key={index}
          name={avatar.name}
          image={avatar.image}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remainingCount > 0 && (
        <Avatar size={size} className="ring-2 ring-background">
          <AvatarFallback className="bg-muted text-muted-foreground">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar, AvatarGroup }
