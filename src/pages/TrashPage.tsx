import { useState, useEffect } from 'react'
import { Card, Button, Badge, ConfirmDialog, Input } from '../components/ui'
import { getTrashedSessions, restoreSession, permanentlyDeleteSession, cleanupExpiredTrash } from '../services/trash.service'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Trash2, RotateCcw, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react'
import type { Session } from '../types'

export function TrashPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCleaning, setIsCleaning] = useState(false)
  
  const [restoreDialog, setRestoreDialog] = useState<{isOpen: boolean, session: Session | null}>({ isOpen: false, session: null })
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, session: Session | null}>({ isOpen: false, session: null })
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('')

  useEffect(() => {
    fetchTrashedSessions()
  }, [])

  async function fetchTrashedSessions() {
    setIsLoading(true)
    try {
      const data = await getTrashedSessions()
      setSessions(data)
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: 'Gagal memuat daftar sampah: ' + e.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanup = async () => {
    setIsCleaning(true)
    try {
      const deletedCount = await cleanupExpiredTrash()
      if (deletedCount > 0) {
        addToast({ type: 'success', title: 'Pembersihan Selesai', message: `${deletedCount} sesi kadaluwarsa telah dihapus permanen.` })
        fetchTrashedSessions()
      } else {
        addToast({ type: 'info', title: 'Info', message: 'Tidak ada sesi kadaluwarsa yang perlu dibersihkan.' })
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: 'Pembersihan gagal: ' + e.message })
    } finally {
      setIsCleaning(false)
    }
  }

  const handleRestore = async () => {
    const session = restoreDialog.session
    if (!session || !user) return

    try {
      await restoreSession(session.id, user.id)
      addToast({ type: 'success', title: 'Berhasil', message: `Sesi "${session.name}" berhasil dipulihkan.` })
      setRestoreDialog({ isOpen: false, session: null })
      fetchTrashedSessions()
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: 'Gagal memulihkan sesi: ' + e.message })
    }
  }

  const handlePermanentDelete = async () => {
    const session = deleteDialog.session
    if (!session || !user) return

    if (deleteConfirmationName !== session.name) {
      addToast({ type: 'error', title: 'Nama Tidak Cocok', message: 'Ketik nama sesi dengan benar untuk melanjutkan penghapusan permanen.' })
      return
    }

    try {
      await permanentlyDeleteSession(session.id, session.name, user.id)
      addToast({ type: 'success', title: 'Dihapus', message: `Sesi "${session.name}" dihapus permanen.` })
      setDeleteDialog({ isOpen: false, session: null })
      setDeleteConfirmationName('')
      fetchTrashedSessions()
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: 'Gagal menghapus sesi secara permanen: ' + e.message })
    }
  }

  const calculateDaysLeft = (deleteAtDate: string | null) => {
    if (!deleteAtDate) return 0
    const diff = new Date(deleteAtDate).getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)))
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
            Sampah
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Sesi yang dihapus akan tersimpan di sini selama 30 hari sebelum terhapus permanen.
          </p>
        </div>
        <Button 
          variant="secondary" 
          leftIcon={<RefreshCw size={18} className={isCleaning ? 'animate-spin' : ''} />}
          onClick={handleCleanup}
          disabled={isCleaning}
        >
          Bersihkan Kadaluwarsa
        </Button>
      </div>

      <Card className="overflow-hidden bg-[var(--color-surface)]">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)]">Memuat data sampah...</div>
        ) : sessions.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <Trash2 size={48} className="text-[var(--color-border)] mb-4" />
            <h3 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)] mb-2">
              Tidak ada sesi di sampah
            </h3>
            <p className="text-[var(--color-text-secondary)]">
              Sesi yang Anda hapus dari Dashboard akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {sessions.map((session) => {
              const daysLeft = calculateDaysLeft(session.permanently_delete_at)
              const isWarning = daysLeft <= 7

              return (
                <div key={session.id} className="p-4 sm:p-6 hover:bg-[var(--color-surface-hover)] transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1 truncate">
                      {session.name}
                    </h3>
                    <div className="text-sm text-[var(--color-text-secondary)] flex flex-col gap-1">
                      <span>Dihapus pada: {new Date(session.deleted_at!).toLocaleDateString('id-ID')}</span>
                      <span>Dihapus permanen: {new Date(session.permanently_delete_at!).toLocaleDateString('id-ID')}</span>
                      <div className="mt-1">
                        <Badge variant={isWarning ? 'warning' : 'default'} className="inline-flex items-center gap-1">
                          {isWarning && <AlertCircle size={14} />}
                          Sisa {daysLeft} hari
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto shrink-0">
                    <Button 
                      variant="primary" 
                      leftIcon={<RotateCcw size={16} />}
                      onClick={() => setRestoreDialog({ isOpen: true, session })}
                      className="flex-1 sm:flex-none"
                    >
                      Pulihkan
                    </Button>
                    <Button 
                      variant="danger" 
                      leftIcon={<Trash2 size={16} />}
                      onClick={() => {
                        setDeleteConfirmationName('')
                        setDeleteDialog({ isOpen: true, session })
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={restoreDialog.isOpen}
        title="Pulihkan Sesi?"
        message={`Apakah Anda yakin ingin memulihkan sesi "${restoreDialog.session?.name}"? Sesi akan kembali muncul di Dashboard utama.`}
        variant="default"
        onConfirm={handleRestore}
        onCancel={() => setRestoreDialog({ isOpen: false, session: null })}
        confirmText="Pulihkan Sesi"
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Hapus Permanen?"
        message={
          <div className="space-y-4">
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" />
              <p className="text-sm">
                Aksi ini <strong>tidak dapat dibatalkan</strong>. Seluruh data peserta dan rekaman kehadiran untuk sesi ini akan dihapus secara permanen dari server.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                Ketik <span className="font-bold text-[var(--color-text-primary)] select-all">{deleteDialog.session?.name}</span> untuk konfirmasi:
              </label>
              <Input
                value={deleteConfirmationName}
                onChange={(e) => setDeleteConfirmationName(e.target.value)}
                placeholder="Ketik nama sesi..."
              />
            </div>
          </div>
        }
        variant="danger"
        onConfirm={handlePermanentDelete}
        onCancel={() => {
          setDeleteDialog({ isOpen: false, session: null })
          setDeleteConfirmationName('')
        }}
        confirmText="Hapus Permanen"
      />
    </div>
  )
}
