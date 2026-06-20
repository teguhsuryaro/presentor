import { useState, useEffect } from 'react'
import { Modal, Input, Button } from '../ui'
import { updateParticipant } from '../../services/participant.service'
import { useToast } from '../../context/ToastContext'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Participant } from '../../types'

interface EditParticipantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  participant: Participant | null
}

export function EditParticipantModal({ isOpen, onClose, onSuccess, participant }: EditParticipantModalProps) {
  const [fullName, setFullName] = useState('')
  const [nim, setNim] = useState('')
  const [prodi, setProdi] = useState('')
  const [fakultas, setFakultas] = useState('')
  const [kelompok, setKelompok] = useState('')
  const [angkatan, setAngkatan] = useState('')
  const [kelas, setKelas] = useState('')
  
  const [showAdditional, setShowAdditional] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { addToast } = useToast()

  useEffect(() => {
    if (isOpen && participant) {
      setFullName(participant.full_name)
      setNim(participant.nim)
      
      const attrs = participant.attributes || {}
      setProdi(attrs.prodi || '')
      setFakultas(attrs.fakultas || '')
      setKelompok(attrs.kelompok || '')
      setAngkatan(attrs.angkatan || '')
      setKelas(attrs.kelas || '')
      
      if (attrs.prodi || attrs.fakultas || attrs.kelompok || attrs.angkatan || attrs.kelas) {
        setShowAdditional(true)
      } else {
        setShowAdditional(false)
      }
    }
  }, [isOpen, participant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !nim.trim() || !participant) return

    setIsSubmitting(true)
    try {
      await updateParticipant(participant.id, {
        full_name: fullName,
        nim: nim,
        attributes: { prodi, fakultas, kelompok, angkatan, kelas }
      })

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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Peserta">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Nama Lengkap *"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={isSubmitting}
        />
        
        <Input
          label="NIM *"
          value={nim}
          onChange={(e) => setNim(e.target.value)}
          required
          disabled={isSubmitting}
        />

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdditional(!showAdditional)}
            className="flex items-center text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            {showAdditional ? <ChevronUp size={16} className="mr-1" /> : <ChevronDown size={16} className="mr-1" />}
            Data Tambahan (Opsional)
          </button>
          
          {showAdditional && (
            <div className="grid grid-cols-2 gap-4 mt-4 p-4 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]">
              <Input label="Prodi" value={prodi} onChange={(e) => setProdi(e.target.value)} disabled={isSubmitting} />
              <Input label="Fakultas" value={fakultas} onChange={(e) => setFakultas(e.target.value)} disabled={isSubmitting} />
              <Input label="Kelompok" value={kelompok} onChange={(e) => setKelompok(e.target.value)} disabled={isSubmitting} />
              <Input label="Angkatan" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} disabled={isSubmitting} />
              <div className="col-span-2">
                <Input label="Kelas" value={kelas} onChange={(e) => setKelas(e.target.value)} disabled={isSubmitting} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} type="button">
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!fullName.trim() || !nim.trim()}>
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
