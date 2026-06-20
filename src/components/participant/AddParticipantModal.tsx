import { useState } from 'react'
import { Modal, Input, Button } from '../ui'
import { addParticipant } from '../../services/participant.service'
import { useToast } from '../../context/ToastContext'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AddParticipantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  sessionId: string
}

export function AddParticipantModal({ isOpen, onClose, onSuccess, sessionId }: AddParticipantModalProps) {
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

  const resetForm = () => {
    setFullName('')
    setNim('')
    setProdi('')
    setFakultas('')
    setKelompok('')
    setAngkatan('')
    setKelas('')
    setShowAdditional(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent, closeAfterSubmit: boolean) => {
    e.preventDefault()
    if (!fullName.trim() || !nim.trim()) return

    setIsSubmitting(true)
    try {
      await addParticipant(sessionId, {
        full_name: fullName,
        nim: nim,
        attributes: { prodi, fakultas, kelompok, angkatan, kelas }
      })

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
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} type="button">
            Batal
          </Button>
          <Button 
            variant="secondary" 
            type="button"
            onClick={(e) => handleSubmit(e as any, false)} 
            disabled={isSubmitting || !fullName.trim() || !nim.trim()}
          >
            Simpan & Tambah Lagi
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!fullName.trim() || !nim.trim()}>
            Simpan & Tutup
          </Button>
        </div>
      </form>
    </Modal>
  )
}
