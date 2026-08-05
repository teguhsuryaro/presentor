import { useState, useEffect } from 'react'
import { Modal, Input, Button, Select } from '../ui'
import { createSession, getSessions, copyParticipants } from '../../services/session.service'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Trash2, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SessionColumn, SessionWithStats } from '../../types'

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

interface CreateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateSessionModal({ isOpen, onClose, onSuccess }: CreateSessionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  const [columnMode, setColumnMode] = useState<'custom' | 'copy'>('custom')
  const [sourceSessionId, setSourceSessionId] = useState<string>('')
  const [copyParticipantsChecked, setCopyParticipantsChecked] = useState(false)
  
  const [columns, setColumns] = useState<(SessionColumn & { _id?: string })[]>([
    { key: 'full_name', label: 'Nama', required: true, _id: 'initial_1' }
  ])

  const [existingSessions, setExistingSessions] = useState<SessionWithStats[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { user } = useAuth()
  const { addToast } = useToast()

  useEffect(() => {
    if (isOpen) {
      getSessions().then(data => {
        setExistingSessions(data)
      }).catch(console.error)
    } else {
      setName('')
      setDescription('')
      setColumnMode('custom')
      setSourceSessionId('')
      setCopyParticipantsChecked(false)
      setColumns([{ key: 'full_name', label: 'Nama', required: true, _id: 'initial_1' }])
    }
  }, [isOpen])

  useEffect(() => {
    if (columnMode === 'copy' && sourceSessionId) {
      const source = existingSessions.find(s => s.id === sourceSessionId)
      if (source && source.custom_columns && source.custom_columns.length > 0) {
        setColumns(source.custom_columns.map(c => ({ ...c, _id: Math.random().toString() })))
      } else {
        setColumns([{ key: 'full_name', label: 'Nama', required: true, _id: 'initial_1' }])
      }
    } else if (columnMode === 'copy' && !sourceSessionId) {
      setColumns([{ key: 'full_name', label: 'Nama', required: true, _id: 'initial_1' }])
    }
  }, [sourceSessionId, columnMode, existingSessions])

  const handleAddColumn = () => {
    if (columns.length >= 10) return
    const newKey = generateColumnKey(`Kolom Baru`, columns.map(c => c.key))
    setColumns([...columns, { key: newKey, label: '', required: true, _id: Math.random().toString() }])
  }

  const handleRemoveColumn = (index: number) => {
    if (index === 0) return 
    setColumns(columns.filter((_, i) => i !== index))
  }

  const handleColumnLabelChange = (index: number, newLabel: string) => {
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
    if (!name.trim() || !user) return
    
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

    setIsSubmitting(true)
    try {
      // Strip _id before sending to API
      const columnsToSave = columns.map(({ _id, ...rest }) => rest)
      const newSession = await createSession({
        name,
        description,
        custom_columns: columnsToSave
      }, user.id)

      if (columnMode === 'copy' && sourceSessionId && copyParticipantsChecked) {
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
              Deskripsi
            </label>
            <span className="text-xs text-[var(--color-text-secondary)] italic">Opsional</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[100px] p-3 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all resize-y"
            placeholder="Tambahkan deskripsi singkat untuk sesi ini..."
            disabled={isSubmitting}
          />
        </div>

        <div className="pt-4 border-t border-[var(--color-border)]">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Pengaturan Kolom Data Peserta</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label className={`flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${columnMode === 'custom' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50'}`}>
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="columnMode" 
                  value="custom"
                  checked={columnMode === 'custom'}
                  onChange={() => setColumnMode('custom')}
                  disabled={isSubmitting}
                  className="accent-[var(--color-accent)] w-4 h-4"
                />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Atur Kolom Sendiri</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] pl-6">Buat struktur data baru dari awal.</p>
            </label>
            <label className={`flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${columnMode === 'copy' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50'}`}>
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="columnMode" 
                  value="copy"
                  checked={columnMode === 'copy'}
                  onChange={() => setColumnMode('copy')}
                  disabled={isSubmitting}
                  className="accent-[var(--color-accent)] w-4 h-4"
                />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Salin dari Sesi Lain</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] pl-6">Gunakan format dari sesi sebelumnya.</p>
            </label>
          </div>

          {columnMode === 'copy' && (
            <div className="mb-4 space-y-3 bg-[var(--color-surface-hover)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <Select
                label="Pilih Sesi Sumber"
                value={sourceSessionId}
                onChange={setSourceSessionId}
                options={[
                  { value: '', label: '— Pilih Sesi —' },
                  ...existingSessions.map(s => ({ value: s.id, label: s.name }))
                ]}
                disabled={isSubmitting}
              />
              {sourceSessionId && (
                <label className="flex items-center gap-2 text-sm mt-2 cursor-pointer text-[var(--color-text-primary)]">
                  <input 
                    type="checkbox"
                    checked={copyParticipantsChecked}
                    onChange={(e) => setCopyParticipantsChecked(e.target.checked)}
                    disabled={isSubmitting}
                    className="accent-[var(--color-accent)] rounded w-4 h-4"
                  />
                  Salin peserta juga
                </label>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="bg-[var(--color-surface-hover)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Kolom yang akan ditampilkan:</p>
              
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
                          disabled={index === 0 || isSubmitting}
                          className="!my-0"
                          placeholder="Nama Kolom"
                          autoFocus={index === columns.length - 1 && index > 0 && !col.label}
                        />
                      </div>
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

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
            </div>

            <p className="text-xs text-[var(--color-text-secondary)]">
              <span className="font-semibold">Kolom default (selalu ada):</span> Checklist · Status · Waktu Presensi · Aksi
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
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
