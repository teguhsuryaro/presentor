import { useState, useEffect } from 'react'
import { Modal, Input, Button } from '../ui'
import { EventSelector } from './EventSelector'
import { updateSession } from '../../services/session.service'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

interface EditSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  session: any | null
}

export function EditSessionModal({ isOpen, onClose, onSuccess, session }: EditSessionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [eventId, setEventId] = useState<string | undefined>(undefined)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { user } = useAuth()
  const { addToast } = useToast()

  useEffect(() => {
    if (isOpen && session) {
      setName(session.name || '')
      setDescription(session.description || '')
      setEventId(session.event_id || undefined)
    }
  }, [isOpen, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user || !session) return

    setIsSubmitting(true)
    try {
      await updateSession(session.id, {
        name,
        description,
        event_id: eventId
      }, user.id)

      addToast({
        type: 'success',
        title: 'Sesi Berhasil Diperbarui',
        message: `Sesi "${name}" telah berhasil diubah.`
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Gagal Memperbarui Sesi',
        message: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Sesi">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Nama Sesi *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isSubmitting}
        />
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--color-text-primary)]">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[80px] p-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-all resize-y"
            placeholder="Opsional"
            disabled={isSubmitting}
          />
        </div>

        <EventSelector
          value={eventId}
          onChange={setEventId}
          disabled={isSubmitting}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} type="button">
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
