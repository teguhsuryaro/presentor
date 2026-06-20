import { useState } from 'react'
import { Modal, Input, Button } from '../ui'
import { resetPassword } from '../../services/account.service'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { User } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  account: User | null
}

export function ResetPasswordModal({ isOpen, onClose, account }: Props) {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [formData, setFormData] = useState({ password: '', confirm_password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !account || !account.auth_user_id) return
    
    if (formData.password !== formData.confirm_password) {
      addToast({ type: 'error', title: 'Error', message: 'Password dan konfirmasi tidak cocok.' })
      return
    }
    if (formData.password.length < 8) {
      addToast({ type: 'error', title: 'Error', message: 'Password minimal 8 karakter.' })
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(account.id, account.auth_user_id, formData.password, user.id)
      addToast({ type: 'success', title: 'Berhasil', message: `Password untuk ${account.username} berhasil direset.` })
      onClose()
      setFormData({ password: '', confirm_password: '' })
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: e.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!account) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reset Password: ${account.username}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Password Baru"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          placeholder="Minimal 8 karakter"
          minLength={8}
        />
        <Input
          label="Konfirmasi Password Baru"
          type="password"
          required
          value={formData.confirm_password}
          onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
          placeholder="Ketik ulang password baru"
          minLength={8}
        />
        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>Reset Password</Button>
        </div>
      </form>
    </Modal>
  )
}
