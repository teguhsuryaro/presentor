import { useState, useEffect } from 'react'
import { Modal, Input, Button } from '../ui'
import { EventSelector } from './EventSelector'
import { updateSession } from '../../services/session.service'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Trash2, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SessionColumn } from '../../types'

function generateColumnKey(label: string, existingKeys: string[]): string {
  let baseKey = label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30)
  
  if (!baseKey) baseKey = 'kolom'

  let key = baseKey
  let counter = 2
  while (existingKeys.includes(key)) {
    key = `${baseKey}_${counter}`
    counter++
  }
  return key
}

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
  const [columns, setColumns] = useState<(SessionColumn & { _id?: string })[]>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { user } = useAuth()
  const { addToast } = useToast()

  const isColumnsEditable = session?.stats?.total_participants === 0

  useEffect(() => {
    if (isOpen && session) {
      setName(session.name || '')
      setDescription(session.description || '')
      setEventId(session.event_id || undefined)
      if (session.custom_columns && session.custom_columns.length > 0) {
        setColumns(session.custom_columns.map((c: any) => ({ ...c, _id: Math.random().toString() })))
      } else {
        setColumns([{ key: 'full_name', label: 'Nama', required: true, _id: 'initial_1' }])
      }
    }
  }, [isOpen, session])

  const handleAddColumn = () => {
    if (columns.length >= 10 || !isColumnsEditable) return
    const newKey = generateColumnKey(`Kolom Baru`, columns.map(c => c.key))
    setColumns([...columns, { key: newKey, label: '', required: true, _id: Math.random().toString() }])
  }

  const handleRemoveColumn = (index: number) => {
    if (index === 0 || !isColumnsEditable) return 
    setColumns(columns.filter((_, i) => i !== index))
  }

  const handleColumnLabelChange = (index: number, newLabel: string) => {
    if (!isColumnsEditable) return
    const updated = [...columns]
    updated[index].label = newLabel
    
    if (index > 0) {
      const existingKeys = updated.filter((_, i) => i !== index).map(c => c.key)
      updated[index].key = generateColumnKey(newLabel, existingKeys)
    }
    
    setColumns(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user || !session) return

    if (isColumnsEditable) {
      const hasEmptyLabels = columns.some(c => !c.label.trim())
      if (hasEmptyLabels) {
        addToast({ type: 'error', title: 'Validasi Gagal', message: 'Label kolom tidak boleh kosong.' })
        return
      }

      const labels = columns.map(c => c.label.toLowerCase().trim())
      const hasDuplicateLabels = new Set(labels).size !== labels.length
      if (hasDuplicateLabels) {
        addToast({ type: 'error', title: 'Validasi Gagal', message: 'Label kolom tidak boleh duplikat.' })
        return
      }
    }

    setIsSubmitting(true)
    try {
      const columnsToSave = columns.map(({ _id, ...rest }) => rest)
      await updateSession(session.id, {
        name,
        description,
        event_id: eventId,
        custom_columns: isColumnsEditable ? columnsToSave : undefined
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

        <div className="pt-4 border-t border-[var(--color-border)]">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Pengaturan Kolom Data Peserta</h3>
          
          <div className="space-y-3">
            <div className="bg-[var(--color-surface-hover)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]">
              {!isColumnsEditable && (
                <div className="mb-3 p-2 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs rounded border border-[var(--color-accent)]/20">
                  Kolom tidak dapat diubah karena sesi sudah memiliki data peserta.
                </div>
              )}
              
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {columns.map((col, index) => (
                    <motion.div 
                      key={col._id || index}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 overflow-hidden py-1"
                    >
                      <span className="w-5 text-center text-xs font-mono text-[var(--color-text-secondary)]">
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <Input
                          value={col.label}
                          onChange={(e) => handleColumnLabelChange(index, e.target.value)}
                          disabled={index === 0 || isSubmitting || !isColumnsEditable}
                          className="!my-0"
                          placeholder="Nama Kolom"
                          autoFocus={index === columns.length - 1 && index > 0 && !col.label}
                        />
                      </div>
                      {isColumnsEditable && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(index)}
                          disabled={index === 0 || isSubmitting}
                          className={`p-2 rounded-md transition-colors ${
                            index === 0 
                              ? 'text-transparent cursor-default' 
                              : 'text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {isColumnsEditable && (
                <div className="mt-3 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleAddColumn}
                    disabled={columns.length >= 10 || isSubmitting}
                    className="text-xs py-1 h-auto"
                  >
                    <Plus size={14} className="mr-1" /> Tambah Kolom
                  </Button>
                  <span className={`text-xs ${columns.length >= 10 ? 'text-[var(--color-warning)] font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                    {columns.length} / 10 kolom {columns.length >= 10 && '(Maksimal)'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)] mt-4">
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
