import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'default' | 'accent'
  icon?: React.ReactNode
}

const variantStyles = {
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)] border border-transparent',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border border-transparent',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-transparent',
  default: 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
  accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border border-transparent',
}

export function Badge({ variant = 'default', children, icon, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors duration-200',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
