import { useState, useEffect } from 'react'
import { Card, Input, Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { logAction } from '../services/auditLog.service'
import { checkActiveSession } from '../services/auth.service'
import { User, ShieldCheck, MonitorSmartphone, KeyRound } from 'lucide-react'
import type { ActiveSession } from '../types'

export function SettingsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [fullName, setFullName] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  
  useEffect(() => {
    if (user) {
      setFullName(user.full_name)
      fetchActiveSession()
    }
  }, [user])

  const fetchActiveSession = async () => {
    if (!user) return
    const session = await checkActiveSession(user.id)
    if (session) {
      setActiveSession(session)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setIsSavingProfile(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (error) throw error
      
      await logAction('account_edit', user.id, null, { note: 'self_update_profile' })
      
      addToast({ type: 'success', title: 'Tersimpan', message: 'Profil berhasil diperbarui. Silakan refresh halaman jika nama belum berubah.' })
    } catch (error: any) {
      addToast({ type: 'error', title: 'Gagal', message: error.message })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    if (passwordForm.new !== passwordForm.confirm) {
      addToast({ type: 'error', title: 'Gagal', message: 'Konfirmasi password baru tidak cocok.' })
      return
    }
    
    if (passwordForm.new.length < 8) {
      addToast({ type: 'error', title: 'Gagal', message: 'Password baru minimal 8 karakter.' })
      return
    }

    setIsChangingPassword(true)
    try {
      // Step 1: Verify old password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: `${user.username}@internal.presensi.local`,
        password: passwordForm.old
      })
      
      if (verifyError) {
        throw new Error('Password lama tidak sesuai.')
      }
      
      // Step 2: Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.new
      })
      
      if (updateError) throw updateError
      
      await logAction('password_change', user.id, null, { note: 'self_change_password' })
      
      addToast({ type: 'success', title: 'Berhasil', message: 'Password Anda berhasil diubah.' })
      setPasswordForm({ old: '', new: '', confirm: '' })
    } catch (error: any) {
      addToast({ type: 'error', title: 'Gagal', message: error.message })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6 pb-20 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
          Pengaturan Profil
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Kelola informasi akun dan keamanan login Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[var(--color-surface-hover)] rounded-lg text-[var(--color-text-primary)]">
              <User size={24} />
            </div>
            <h2 className="text-xl font-bold font-[var(--font-display)]">Informasi Akun</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Username"
              value={user.username}
              disabled
              helperText="Username tidak dapat diubah"
            />
            <Input
              label="Nama Lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Role"
              value={user.role === 'super_admin' ? 'Super Admin' : 'Panitia'}
              disabled
              leftIcon={<ShieldCheck size={18} className={user.role === 'super_admin' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'} />}
            />
            
            <div className="pt-2">
              <Button type="submit" variant="primary" isLoading={isSavingProfile}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          {/* Change Password */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[var(--color-surface-hover)] rounded-lg text-[var(--color-text-primary)]">
                <KeyRound size={24} />
              </div>
              <h2 className="text-xl font-bold font-[var(--font-display)]">Ubah Password</h2>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Password Lama"
                type="password"
                required
                value={passwordForm.old}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, old: e.target.value }))}
              />
              <Input
                label="Password Baru"
                type="password"
                required
                value={passwordForm.new}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                minLength={8}
                helperText="Minimal 8 karakter"
              />
              <Input
                label="Konfirmasi Password Baru"
                type="password"
                required
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
              />
              
              <div className="pt-2">
                <Button type="submit" variant="primary" isLoading={isChangingPassword}>
                  Ubah Password
                </Button>
              </div>
            </form>
          </Card>

          {/* Active Session Info */}
          <Card className="p-6 border-l-4 border-l-[var(--color-success)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[var(--color-success)] bg-opacity-10 rounded-lg text-[var(--color-success)]">
                <MonitorSmartphone size={24} />
              </div>
              <h2 className="text-xl font-bold font-[var(--font-display)]">Sesi Saat Ini</h2>
            </div>
            
            {activeSession ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-secondary)]">Perangkat</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{activeSession.device_label || 'Unknown Device'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-secondary)]">Waktu Login</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {new Date(activeSession.created_at).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[var(--color-text-secondary)]">Aktivitas Terakhir</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {new Date(activeSession.last_activity_at).toLocaleString('id-ID', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[var(--color-text-secondary)]">Sesi tidak dapat dimuat.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
