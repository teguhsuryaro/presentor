import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isLoading?: boolean
  size?: 'md' | 'lg'
  autoFocus?: boolean
  debounceMs?: number
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari...',
  isLoading,
  size = 'md',
  autoFocus,
  debounceMs = 200,
  className
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, debounceMs)

    return () => clearTimeout(handler)
  }, [localValue, onChange, value, debounceMs])

  const sizeStyles = {
    md: 'text-sm py-2 px-3 pl-9 pr-9 rounded-[var(--radius-md)]',
    lg: 'text-lg py-4 px-6 pl-14 pr-12 rounded-[var(--radius-lg)] shadow-sm',
  }

  const iconSize = size === 'lg' ? 24 : 16
  const iconPos = size === 'lg' ? 'left-5' : 'left-3'
  const clearPos = size === 'lg' ? 'right-5' : 'right-3'

  return (
    <div className={cn("relative w-full", className)}>
      <Search 
        size={iconSize} 
        className={cn("absolute top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]", iconPos)} 
      />
      
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-all duration-200",
          "placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]",
          sizeStyles[size]
        )}
      />
      
      {localValue && (
        <button
          onClick={() => setLocalValue('')}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors",
            clearPos
          )}
        >
          <X size={iconSize === 24 ? 20 : 16} />
        </button>
      )}

      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-border)] overflow-hidden rounded-b-[var(--radius-md)]">
          <div className="h-full bg-[var(--color-accent)] animate-[search-loading_1.5s_infinite_ease-in-out] origin-left" />
        </div>
      )}
    </div>
  )
}
