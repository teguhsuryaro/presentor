import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'

export interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
  requireInput?: string
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'default',
  isLoading,
  requireInput
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('')

  const isInputMatched = requireInput ? inputValue === requireInput : true
  const isConfirmDisabled = isLoading || !isInputMatched

  const btnVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'primary' : 'primary'

  const footer = (
    <>
      <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button 
        variant={btnVariant} 
        onClick={onConfirm} 
        isLoading={isLoading} 
        disabled={isConfirmDisabled}
        className={variant === 'warning' ? 'bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/90' : ''}
      >
        {confirmText}
      </Button>
    </>
  )

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} footer={footer} size="sm">
      <div className="py-2">
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">{message}</p>
        
        {requireInput && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Ketik <span className="font-mono font-bold select-all bg-[var(--color-bg)] px-1 py-0.5 rounded">{requireInput}</span> untuk melanjutkan:
            </label>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={requireInput}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
