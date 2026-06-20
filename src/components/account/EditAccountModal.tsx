import { useState, useEffect } from 'react'
import { Modal, Input, Button } from '../ui'
import { updateAccount } from '../../services/account.service'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { User } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  account: User | null
}

export function EditAccountModal({ isOpen, onClose, onSuccess, account }: Props) {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [formData, setFormData] = useState({ full_name: '', is_active: true })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    if (account) {
      setFormData({ full_name: account.full_name, is_active: account.is_active })
    }
  }, [account])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !account) return

    setIsSubmitting(true)
    try {
      await updateAccount(account.id, formData, user.id)
      addToast({ type: 'success', title: 'Berhasil', message: 'Akun berhasil diperbarui.' })
      onSuccess()
      onClose()
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: e.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!account) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Akun">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          value={account.username}
          disabled
          helperText="Username tidak dapat diubah"
        />
        <Input
          label="Nama Lengkap"
          required
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
        />
        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            className="w-4 h-4 rounded-[var(--radius-sm)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] border-[var(--color-border)]"
          />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">Akun Aktif</span>
        </label>
        
        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>Simpan Perubahan</Button>
        </div>
      </form>
    </Modal>
  )
}
