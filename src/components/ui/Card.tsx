import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  accentStrip?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable, accentStrip, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] transition-shadow duration-200',
          hoverable && 'hover:shadow-[var(--shadow-card-hover)] cursor-pointer',
          accentStrip && 'border-l-4 border-l-[var(--color-accent)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
