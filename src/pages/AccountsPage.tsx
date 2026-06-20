import { useState, useEffect } from 'react'
import { Card, Button, Badge, ConfirmDialog, DropdownMenu } from '../components/ui'
import { getAccounts, deactivateAccount, forceLogout } from '../services/account.service'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ShieldAlert, Plus, MoreVertical } from 'lucide-react'
import type { User } from '../types'
import { CreateAccountModal } from '../components/account/CreateAccountModal'
import { EditAccountModal } from '../components/account/EditAccountModal'
import { ResetPasswordModal } from '../components/account/ResetPasswordModal'

export function AccountsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [accounts, setAccounts] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  
  const [selectedAccount, setSelectedAccount] = useState<User | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, account: User | null}>({ isOpen: false, account: null })
  const [forceLogoutDialog, setForceLogoutDialog] = useState<{isOpen: boolean, account: User | null}>({ isOpen: false, account: null })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setIsLoading(true)
    try {
      const data = await getAccounts()
      setAccounts(data)
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: 'Gagal memuat daftar akun: ' + e.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    const account = deleteDialog.account
    if (!account || !user || !account.auth_user_id) return

    try {
      await deactivateAccount(account.id, account.auth_user_id, account.username, user.id)
      addToast({ type: 'success', title: 'Berhasil', message: `Akun "${account.username}" telah dinonaktifkan dan tidak bisa login lagi.` })
      setDeleteDialog({ isOpen: false, account: null })
      fetchAccounts()
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: 'Gagal menonaktifkan akun: ' + e.message })
    }
  }

  const handleForceLogout = async () => {
    const account = forceLogoutDialog.account
    if (!account || !user) return

    try {
      await forceLogout(account.id, account.username, user.id)
      addToast({ type: 'success', title: 'Berhasil', message: `User "${account.username}" dipaksa keluar dari semua sesi aktifnya.` })
      setForceLogoutDialog({ isOpen: false, account: null })
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: 'Gagal memaksa keluar: ' + e.message })
    }
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <ShieldAlert size={64} className="text-[var(--color-danger)] mb-4" />
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)] mb-2">Akses Ditolak</h1>
        <p className="text-[var(--color-text-secondary)]">
          Halaman Manajemen Akun hanya dapat diakses oleh Super Admin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
            Manajemen Akun
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Kelola akses panitia, edit profil, dan atur keamanan akun.
          </p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Buat Akun Panitia
        </Button>
      </div>

      <Card className="overflow-hidden bg-[var(--color-surface)]">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)]">Memuat daftar akun...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama Lengkap</th>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="w-12 px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                      {account.full_name}
                      {account.id === user.id && <span className="ml-2 text-xs text-[var(--color-text-secondary)]">(Anda)</span>}
                    </td>
                    <td className="px-4 py-3 font-[var(--font-mono)] text-[var(--color-text-secondary)]">
                      {account.username}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={account.role === 'super_admin' ? 'accent' : 'default'} className="uppercase">
                        {account.role === 'super_admin' ? 'Super Admin' : 'Panitia'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={account.is_active ? 'success' : 'danger'}>
                        {account.is_active ? 'Aktif' : 'Non-aktif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DropdownMenu
                        trigger={
                          <button className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] rounded-[var(--radius-sm)] transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        }
                        items={[
                          { 
                            label: 'Edit Akun', 
                            onClick: () => { setSelectedAccount(account); setIsEditOpen(true) },
                            disabled: account.role === 'super_admin' && account.id !== user.id // Cannot edit other super admins
                          },
                          { 
                            label: 'Reset Password', 
                            onClick: () => { setSelectedAccount(account); setIsResetOpen(true) },
                            disabled: account.role === 'super_admin' && account.id !== user.id
                          },
                          { 
                            label: 'Paksa Keluar', 
                            onClick: () => { setForceLogoutDialog({ isOpen: true, account }) },
                            disabled: account.id === user.id
                          },
                          { 
                            label: 'Hapus (Non-aktifkan)', 
                            variant: 'danger', 
                            onClick: () => { setDeleteDialog({ isOpen: true, account }) },
                            disabled: account.role === 'super_admin'
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateAccountModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={fetchAccounts} 
      />
      
      <EditAccountModal 
        isOpen={isEditOpen} 
        onClose={() => { setIsEditOpen(false); setSelectedAccount(null) }} 
        onSuccess={fetchAccounts}
        account={selectedAccount}
      />
      
      <ResetPasswordModal 
        isOpen={isResetOpen} 
        onClose={() => { setIsResetOpen(false); setSelectedAccount(null) }} 
        account={selectedAccount}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Non-aktifkan Akun?"
        message={`Apakah Anda yakin ingin menonaktifkan akun '${deleteDialog.account?.username}'? Akun ini tidak akan bisa login lagi ke dalam sistem.`}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, account: null })}
        confirmText="Non-aktifkan"
      />

      <ConfirmDialog
        isOpen={forceLogoutDialog.isOpen}
        title="Paksa Keluar?"
        message={`Apakah Anda yakin ingin memaksa keluar (force logout) user '${forceLogoutDialog.account?.username}'? Semua sesi aktifnya di perangkat manapun akan segera dihentikan.`}
        variant="danger"
        onConfirm={handleForceLogout}
        onCancel={() => setForceLogoutDialog({ isOpen: false, account: null })}
        confirmText="Paksa Keluar"
      />
    </div>
  )
}
