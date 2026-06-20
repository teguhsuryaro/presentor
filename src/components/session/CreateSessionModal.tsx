import { useState, useEffect } from 'react'
import { Modal, Input, Button, Select } from '../ui'
import { EventSelector } from './EventSelector'
import { createSession, getSessions, copyParticipants } from '../../services/session.service'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

interface CreateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateSessionModal({ isOpen, onClose, onSuccess }: CreateSessionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [eventId, setEventId] = useState<string | undefined>(undefined)
  const [sourceSessionId, setSourceSessionId] = useState<string>('')
  
  const [existingSessions, setExistingSessions] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { user } = useAuth()
  const { addToast } = useToast()

  useEffect(() => {
    if (isOpen) {
      // Fetch active sessions to copy participants from
      getSessions().then(data => {
        setExistingSessions(data)
      }).catch(console.error)
    } else {
      // Reset form
      setName('')
      setDescription('')
      setEventId(undefined)
      setSourceSessionId('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user) return

    setIsSubmitting(true)
    try {
      const newSession = await createSession({
        name,
        description,
        event_id: eventId
      }, user.id)

      if (sourceSessionId) {
        await copyParticipants(sourceSessionId, newSession.id, user.id)
      }

      addToast({
        type: 'success',
        title: 'Sesi Berhasil Dibuat',
        message: `Sesi "${name}" telah berhasil ditambahkan.`
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Gagal Membuat Sesi',
        message: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Sesi Baru">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Nama Sesi *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Misal: Sesi Materi 1"
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

        <div className="pt-4 border-t border-[var(--color-border)]">
          <Select
            label="Salin Peserta Dari Sesi Lain (Opsional)"
            value={sourceSessionId}
            onChange={setSourceSessionId}
            options={[
              { value: '', label: '-- Jangan Salin Peserta --' },
              ...existingSessions.map(s => ({ value: s.id, label: s.name }))
            ]}
            disabled={isSubmitting}
          />
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Hanya data peserta yang akan disalin. Data kehadiran TIDAK akan ikut disalin.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} type="button">
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Buat Sesi
          </Button>
        </div>
      </form>
    </Modal>
  )
}
