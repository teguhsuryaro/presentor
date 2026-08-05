import { useState, useEffect, useMemo } from 'react'
import { Modal, Input, Button } from '../ui'
import { updateParticipant } from '../../services/participant.service'
import { getColumnValue, buildParticipantData } from '../../lib/columnUtils'
import { useToast } from '../../context/ToastContext'
import { Lock, Pencil, X } from 'lucide-react'
import type { Participant, SessionColumn } from '../../types'

interface ParticipantDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  participant: Participant | null
  columns: SessionColumn[]
}

export function ParticipantDetailModal({ isOpen, onClose, onSuccess, participant, columns }: ParticipantDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { addToast } = useToast()

  useEffect(() => {
    if (isOpen && participant) {
      const values: Record<string, string> = {}
      columns.forEach(col => {
        values[col.key] = getColumnValue(participant, col.key)
      })
      setFormValues(values)
      setInitialValues(values)
      setIsEditing(false)
    } else {
      setFormValues({})
      setInitialValues({})
      setIsEditing(false)
    }
  }, [isOpen, participant, columns])

  const hasChanges = useMemo(() => {
    return Object.keys(formValues).some(key => formValues[key] !== initialValues[key])
  }, [formValues, initialValues])

  const handleChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  const handleCancelEdit = () => {
    setFormValues(initialValues)
    setIsEditing(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!participant || !hasChanges) return

    // Validasi semua kolom wajib diisi
    const missingRequired = columns.filter(col => !formValues[col.key]?.trim())
    if (missingRequired.length > 0) {
      addToast({
        type: 'error',
        title: 'Validasi Gagal',
        message: `Semua kolom harus diisi. Kolom yang kosong: ${missingRequired.map(c => c.label).join(', ')}`
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { full_name, nim, attributes } = buildParticipantData(columns, formValues)
      await updateParticipant(participant.id, { full_name, nim, attributes })

      addToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Data peserta berhasil diperbarui.'
      })
      
      onSuccess()
      onClose()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Gagal Memperbarui Peserta',
        message: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!participant) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Peserta">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {columns.map(col => (
          <div key={col.key} className="relative">
            <Input
              label={col.label}
              value={formValues[col.key] || ''}
              onChange={(e) => handleChange(col.key, e.target.value)}
              required={isEditing}
              disabled={!isEditing || isSubmitting}
              className={`transition-all duration-200 ${!isEditing ? 'pr-10 bg-[var(--color-surface-hover)] border-transparent cursor-default focus:ring-0 opacity-90 text-[var(--color-text-secondary)]' : 'pr-10 bg-[var(--color-surface)]'}`}
            />
            {!isEditing && (
              <div className="absolute right-3 top-[34px] text-[var(--color-text-secondary)] opacity-50">
                <Lock size={16} />
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)] mt-6">
          {!isEditing ? (
            <Button 
              type="button" 
              variant="secondary" 
              leftIcon={<Pencil size={16} />}
              onClick={() => setIsEditing(true)}
            >
              Edit Data
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="ghost" 
              leftIcon={<X size={16} />}
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              Batal Edit
            </Button>
          )}

          <div className="flex gap-3">
            {!isEditing && (
              <Button variant="ghost" onClick={onClose} type="button">
                Tutup
              </Button>
            )}
            <Button 
              type="submit" 
              isLoading={isSubmitting} 
              disabled={!isEditing || !hasChanges}
            >
              Simpan Data
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
