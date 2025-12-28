import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-LY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' د.ل'
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-LY').format(num)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('ar-LY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Animation variants for Framer Motion
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
}

export const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

// Spring configurations for Framer Motion
export const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
}

export const gentleSpring = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
}

export const bouncySpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 20,
}

// Invoice status utilities
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  }
  return colors[status] || colors.draft
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'جديدة',
    draft: 'مسودة',
    pending: 'قيد الانتظار',
    in_progress: 'قيد التنفيذ',
    ready: 'جاهزة',
    delivered: 'تم التسليم',
    completed: 'مكتملة',
    partial: 'مدفوعة جزئياً',
    paid: 'مدفوعة',
    cancelled: 'ملغية',
  }
  return labels[status] || status
}

// Payment status utilities
export function getPaymentStatus(total: number, paid: number): 'unpaid' | 'partial' | 'paid' {
  if (paid === 0) return 'unpaid'
  if (paid >= total) return 'paid'
  return 'partial'
}

export function getPaymentStatusColor(status: 'unpaid' | 'partial' | 'paid'): string {
  const colors: Record<string, string> = {
    unpaid: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }
  return colors[status]
}

export function getPaymentStatusLabel(status: 'unpaid' | 'partial' | 'paid'): string {
  const labels: Record<string, string> = {
    unpaid: 'لم تدفع',
    partial: 'مدفوعة جزئياً',
    paid: 'مدفوعة بالكامل',
  }
  return labels[status]
}
