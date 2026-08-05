import { useState } from 'react'
import { Modal, Input, Button } from '../ui'
import { addParticipant } from '../../services/participant.service'
import { buildParticipantData } from '../../lib/columnUtils'
import { useToast } from '../../context/ToastContext'
import type { SessionColumn } from '../../types'

interface AddParticipantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  sessionId: string
  columns: SessionColumn[]
}

export function AddParticipantModal({ isOpen, onClose, onSuccess, sessionId, columns }: AddParticipantModalProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { addToast } = useToast()

  const resetForm = () => {
    setFormValues({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent, closeAfterSubmit: boolean) => {
    e.preventDefault()
    
    // Validasi required columns
    const missingRequired = columns.filter(col => col.required && !formValues[col.key]?.trim())
    if (missingRequired.length > 0) {
      addToast({
        type: 'error',
        title: 'Validasi Gagal',
        message: `Kolom ${missingRequired.map(c => c.label).join(', ')} wajib diisi.`
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { full_name, nim, attributes } = buildParticipantData(columns, formValues)
      await addParticipant(sessionId, { full_name, nim, attributes })

      addToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Peserta berhasil ditambahkan.'
      })
      
      onSuccess()
      
      if (closeAfterSubmit) {
        handleClose()
      } else {
        resetForm()
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Gagal Menambah Peserta',
        message: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Peserta Manual">
      <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4 pt-2">
        {columns.map(col => (
          <Input
            key={col.key}
            label={col.label}
            value={formValues[col.key] || ''}
            onChange={(e) => handleChange(col.key, e.target.value)}
            required={col.required}
            disabled={isSubmitting}
          />
        ))}

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} type="button">
            Batal
          </Button>
          <Button 
            variant="secondary" 
            type="button"
            onClick={(e) => handleSubmit(e as any, false)} 
            disabled={isSubmitting || (columns.some(col => col.required && !formValues[col.key]?.trim()))}
          >
            Simpan & Tambah Lagi
          </Button>
          <Button 
            type="submit" 
            isLoading={isSubmitting} 
            disabled={columns.some(col => col.required && !formValues[col.key]?.trim())}
          >
            Simpan & Tutup
          </Button>
        </div>
      </form>
    </Modal>
  )
}
