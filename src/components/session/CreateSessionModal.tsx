import { useState, useEffect } from 'react'
import { Modal, Input, Button, Select } from '../ui'
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
        description
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
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Sesi Baru" description="Isi detail sesi presensi yang akan dibuat.">
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        <Input
          label="Nama Sesi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Sesi Materi Hari 1"
          required
          disabled={isSubmitting}
        />
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            Deskripsi
            <span className="ml-1 text-xs text-[var(--color-text-secondary)] font-normal">(opsional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[100px] p-3 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all resize-y"
            placeholder="Tambahkan deskripsi singkat untuk sesi ini..."
            disabled={isSubmitting}
          />
        </div>

        <div className="pt-2 border-t border-[var(--color-border)]">
          <Select
            label="Salin Peserta Dari Sesi Lain"
            value={sourceSessionId}
            onChange={setSourceSessionId}
            options={[
              { value: '', label: '— Tidak Menyalin —' },
              ...existingSessions.map(s => ({ value: s.id, label: s.name }))
            ]}
            disabled={isSubmitting}
          />
          <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
            Hanya daftar peserta yang akan disalin. Data kehadiran tidak ikut disalin.
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
