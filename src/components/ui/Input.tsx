import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, type, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputId = id || `input-${label?.toLowerCase().replace(/\\s/g, '-')}`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type === 'password' && showPassword ? 'text' : type}
            className={cn(
              "w-full px-3 py-2 border rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] transition-all duration-200",
              "placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]",
              error ? "border-[var(--color-danger)] ring-1 ring-[var(--color-danger)] focus:ring-[var(--color-danger)] focus:border-[var(--color-danger)]" : "border-[var(--color-border)]",
              leftIcon ? "pl-10" : "",
              (rightIcon || type === 'password') ? "pr-10" : "",
              className
            )}
            {...props}
          />
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {rightIcon && type !== 'password' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-[var(--color-danger)] mt-1">{error}</p>}
        {helperText && !error && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
