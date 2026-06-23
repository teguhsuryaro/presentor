import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, value, onChange, label, error, className, id, disabled, ...props }, ref) => {
    const selectId = id || `select-${label?.toLowerCase().replace(/\\s/g, '-')}`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "w-full appearance-none px-3 py-2 pr-10 border rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]",
              error ? "border-[var(--color-danger)] ring-1 ring-[var(--color-danger)]" : "border-[var(--color-border)]",
              disabled && "opacity-50 cursor-not-allowed bg-[var(--color-bg)]",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-secondary)]">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && <p className="text-sm text-[var(--color-danger)] mt-1">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
