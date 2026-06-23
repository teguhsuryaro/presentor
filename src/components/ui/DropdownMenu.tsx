import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

export interface DropdownMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownMenuItem[]
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 192 // w-48 = 12rem = 192px
    
    let top = rect.bottom + 8 // 8px gap
    let left = align === 'right' 
      ? rect.right - menuWidth 
      : rect.left

    // Pastikan tidak keluar viewport
    if (left < 8) left = 8
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8
    }

    // Jika menu keluar dari bawah viewport, tampilkan di atas trigger
    const estimatedMenuHeight = items.length * 40 + 8 // perkiraan tinggi menu
    if (top + estimatedMenuHeight > window.innerHeight - 8) {
      top = rect.top - estimatedMenuHeight - 8
    }

    setPosition({ top, left })
  }, [align, items.length])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    const handleScroll = () => {
      if (isOpen) updatePosition()
    }

    if (isOpen) {
      updatePosition()
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      window.addEventListener('scroll', handleScroll, true) // capture scroll events on all parents
      window.addEventListener('resize', updatePosition)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen(!isOpen)
  }

  return (
    <>
      <div className="inline-block text-left" ref={triggerRef}>
        <div onClick={handleToggle} className="inline-flex cursor-pointer">
          {trigger}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="fixed z-[9999] w-48 rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-card-hover)] border border-[var(--color-border)] py-1 focus:outline-none"
              style={{
                top: position.top,
                left: position.left,
              }}
            >
              <div className="flex flex-col">
                {items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (!item.disabled) {
                        item.onClick()
                        setIsOpen(false)
                      }
                    }}
                    disabled={item.disabled}
                    className={cn(
                      "flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors",
                      item.disabled && "opacity-50 cursor-not-allowed",
                      !item.disabled && item.variant === 'danger' && "text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]",
                      !item.disabled && item.variant !== 'danger' && "text-[var(--color-text-primary)] hover:bg-[var(--color-accent-soft)]"
                    )}
                    role="menuitem"
                  >
                    {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
