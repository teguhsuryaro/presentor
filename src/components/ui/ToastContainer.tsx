import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { ToastMessage } from '../../types'
import { prefersReducedMotion } from '../../lib/motion'

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const iconStyles = {
    success: 'text-[var(--color-success)] bg-[var(--color-success)]/10',
    error: 'text-[var(--color-danger)] bg-[var(--color-danger)]/10',
    warning: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10',
    info: 'text-[var(--color-accent)] bg-[var(--color-accent-soft)]',
  }

  const isReduced = prefersReducedMotion()
  const transition = isReduced ? { duration: 0 } : { duration: 0.15 }

  // Batasi max 5 toast
  const visibleToasts = toasts.slice(-5)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
      <AnimatePresence>
        {visibleToasts.map(toast => {
          const Icon = icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: isReduced ? 0 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isReduced ? 0 : 50 }}
              transition={transition}
              className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-card-hover)] flex items-start gap-3 bg-[var(--color-surface)]"
            >
              <div className={`shrink-0 p-1.5 rounded-full ${iconStyles[toast.type]}`}>
                <Icon size={18} />
              </div>
              
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => onRemove(toast.id)}
                className="shrink-0 p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] rounded-[var(--radius-sm)] transition-colors"
                aria-label="Close toast"
              >
                <X size={16} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
