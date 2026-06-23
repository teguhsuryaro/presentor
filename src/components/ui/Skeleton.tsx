import { cn } from '../../lib/utils'

export interface SkeletonProps {
  variant?: 'text' | 'card' | 'circle' | 'table-row'
  width?: string
  height?: string
  lines?: number
  className?: string
}

export function Skeleton({ variant = 'text', width, height, lines = 1, className }: SkeletonProps) {
  const baseClass = "bg-[var(--color-surface-hover)] animate-pulse rounded-[var(--radius-sm)]"

  if (variant === 'text') {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{ 
              width: width || (lines > 1 && i === lines - 1 ? '60%' : '100%'), 
              height: height || '16px' 
            }}
            className={cn(baseClass, className)}
          />
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        style={{ width: width || '100%', height: height || '8rem' }}
        className={cn(baseClass, "rounded-[var(--radius-md)]", className)}
      />
    )
  }

  if (variant === 'circle') {
    return (
      <div
        style={{ width: width || '40px', height: height || '40px' }}
        className={cn(baseClass, "rounded-full", className)}
      />
    )
  }

  if (variant === 'table-row') {
    return (
      <div
        style={{ width: width || '100%', height: height || '48px' }}
        className={cn(baseClass, className)}
      />
    )
  }

  return null
}
