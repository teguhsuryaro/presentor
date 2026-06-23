import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, TrendingUp, Plus, MoreVertical, FileText, Play } from 'lucide-react'
import { getSessions, getDashboardStats, softDeleteSession, openSession, closeSession, type DashboardStats } from '../services/session.service'
import type { SessionWithStats } from '../types'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { 
  Card, Button, Badge, Skeleton, AnimatedNumber, Select, DropdownMenu, ConfirmDialog 
} from '../components/ui'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { CreateSessionModal } from '../components/session/CreateSessionModal'
import { EditSessionModal } from '../components/session/EditSessionModal'

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [sessions, setSessions] = useState<SessionWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [filterStatus, setFilterStatus] = useState<string>('')
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [sessionToEdit, setSessionToEdit] = useState<SessionWithStats | null>(null)
  
  // Confirm Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean,
    title: string,
    message: string,
    variant: 'danger' | 'default',
    action: () => Promise<void>
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'default',
    action: async () => {}
  })

  const { addToast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()

    // Realtime subscriptions
    const sessionsSub = supabase.channel('dashboard-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_stats_snapshot' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(sessionsSub)
    }
  }, [filterStatus])

  const fetchData = async () => {
    // only set loading if we don't have data yet to avoid flashing
    if (sessions.length === 0) setIsLoading(true)
    try {
      const [statsData, sessionsData] = await Promise.all([
        getDashboardStats(),
        getSessions({ status: filterStatus || undefined })
      ])
      setStats(statsData)
      setSessions(sessionsData)
    } catch (error: any) {
      addToast({ type: 'error', title: 'Gagal Memuat Data', message: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (session: SessionWithStats) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Sesi',
      message: `Apakah Anda yakin ingin menghapus sesi "${session.name}"? Sesi ini akan dipindahkan ke tempat sampah.`,
      variant: 'danger',
      action: async () => {
        if (!user) return
        try {
          await softDeleteSession(session.id, user.id)
          addToast({ type: 'success', title: 'Berhasil', message: 'Sesi berhasil dihapus.' })
          fetchData()
        } catch (error: any) {
          addToast({ type: 'error', title: 'Gagal', message: error.message })
        }
      }
    })
  }

  const handleToggleStatus = (session: SessionWithStats) => {
    const isActivating = session.status !== 'aktif'
    
    setConfirmDialog({
      isOpen: true,
      title: isActivating ? 'Buka Sesi' : 'Tutup Sesi',
      message: isActivating 
        ? `Sesi "${session.name}" akan dibuka kembali untuk presensi.`
        : `Sesi "${session.name}" akan ditutup dan presensi tidak dapat dilakukan lagi.`,
      variant: 'default',
      action: async () => {
        if (!user) return
        try {
          if (isActivating) {
            await openSession(session.id, user.id)
          } else {
            await closeSession(session.id, user.id)
          }
          addToast({ type: 'success', title: 'Berhasil', message: `Sesi berhasil ${isActivating ? 'dibuka' : 'ditutup'}.` })
          fetchData()
        } catch (error: any) {
          addToast({ type: 'error', title: 'Gagal', message: error.message })
        }
      }
    })
  }

  const StatCard = ({ title, value, icon: Icon, percentage = false }: { title: string, value: number, icon: any, percentage?: boolean }) => (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
          <div className="mt-2 flex items-baseline gap-1 text-3xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
            {isLoading ? (
              <Skeleton variant="text" width="60px" height="36px" />
            ) : (
              <>
                <AnimatedNumber value={value} />
                {percentage && <span className="text-xl">%</span>}
              </>
            )}
          </div>
        </div>
        <div className="p-3 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-[var(--radius-md)]">
          <Icon size={24} strokeWidth={1.5} />
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <StatCard title="Total Sesi" value={stats?.total_sessions || 0} icon={CalendarDays} />
        <StatCard title="Kehadiran" value={stats?.attendance_percentage || 0} icon={TrendingUp} percentage />
      </div>

      {/* List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-semibold font-[var(--font-display)] text-[var(--color-text-primary)]">
            Daftar Sesi
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'aktif', label: 'Aktif' },
                { value: 'ditutup', label: 'Ditutup' }
              ]}
              className="w-full sm:w-40"
            />
            <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus size={18} />} className="whitespace-nowrap w-full sm:w-auto shrink-0">
              Buat Sesi
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton variant="card" height="120px" />
            <Skeleton variant="card" height="120px" />
            <Skeleton variant="card" height="120px" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
            <div className="w-16 h-16 mx-auto bg-[var(--color-accent-soft)] rounded-full flex items-center justify-center mb-4">
              <CalendarDays size={32} className="text-[var(--color-accent)]" />
            </div>
            <h4 className="text-lg font-semibold font-[var(--font-display)] text-[var(--color-text-primary)]">Belum ada sesi</h4>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-6">Buat sesi presensi pertama Anda untuk memulai.</p>
            <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus size={18} />}>
              Buat Sesi Baru
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card 
                key={session.id} 
                className={cn(
                  "p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group",
                  session.status === 'aktif' && "border-l-4 border-l-[var(--color-accent)]"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
                      {session.name}
                    </h4>
                    <Badge variant={session.status === 'aktif' ? 'accent' : 'default'} className="uppercase text-[10px] tracking-wider">
                      {session.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)] flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>{new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className="hidden sm:inline text-[var(--color-border)]">•</span>
                    <span>
                      Kehadiran: <span className="font-semibold text-[var(--color-text-primary)]">{session.stats?.total_attended || 0}</span> / {session.stats?.total_participants || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    leftIcon={<Play size={16} />}
                    onClick={() => navigate(`/sessions/${session.id}/presensi`)}
                    disabled={session.status !== 'aktif'}
                  >
                    Presensi
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    leftIcon={<FileText size={16} />}
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    Detail
                  </Button>
                  
                  <DropdownMenu
                    trigger={
                      <button className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] rounded-[var(--radius-sm)] transition-colors">
                        <MoreVertical size={20} />
                      </button>
                    }
                    items={[
                      { label: 'Edit Sesi', onClick: () => { setSessionToEdit(session); setIsEditOpen(true); } },
                      { 
                        label: session.status === 'aktif' ? 'Tutup Sesi' : 'Buka Sesi', 
                        onClick: () => handleToggleStatus(session) 
                      },
                      { label: 'Hapus Sesi', variant: 'danger', onClick: () => handleDelete(session) },
                    ]}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateSessionModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={fetchData} 
      />
      
      <EditSessionModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        onSuccess={fetchData} 
        session={sessionToEdit} 
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={async () => {
          await confirmDialog.action()
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        }}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
