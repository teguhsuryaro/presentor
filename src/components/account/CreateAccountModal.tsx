import { useState } from 'react'
import { Modal, Input, Button } from '../ui'
import { createAccount } from '../../services/account.service'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateAccountModal({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [formData, setFormData] = useState({ username: '', full_name: '', password: '', confirm_password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
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
      await createAccount(formData, user.id)
      addToast({ type: 'success', title: 'Berhasil', message: 'Akun panitia berhasil dibuat.' })
      onSuccess()
      onClose()
      setFormData({ username: '', full_name: '', password: '', confirm_password: '' })
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: e.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Akun Panitia">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          required
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
          placeholder="cth: panitia_ospek"
          helperText="Hanya huruf kecil, angka, dan underscore (_)"
        />
        <Input
          label="Nama Lengkap"
          required
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="cth: Ahmad Fulan"
        />
        <Input
          label="Password"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          placeholder="Minimal 8 karakter"
          minLength={8}
        />
        <Input
          label="Konfirmasi Password"
          type="password"
          required
          value={formData.confirm_password}
          onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
          placeholder="Ketik ulang password"
          minLength={8}
        />
        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>Simpan Akun</Button>
        </div>
      </form>
    </Modal>
  )
}
