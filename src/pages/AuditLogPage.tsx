import { useState, useEffect } from 'react'
import { Card, Button, DropdownMenu } from '../components/ui'
import { getAuditLogs, type AuditLogWithDetails, type AuditLogFilter } from '../services/auditLog.service'
import { getSessions } from '../services/session.service'
import { useToast } from '../context/ToastContext'
import {
  LogIn, LogOut, CalendarPlus, Pencil, Trash2, RotateCcw,
  PlayCircle, StopCircle, Upload, FileDown, UserPlus, UserCog,
  UserMinus, KeyRound, CheckSquare, Filter, Calendar,
  ChevronLeft, ChevronRight, Activity
} from 'lucide-react'
import type { AuditAction, Session } from '../types'

const ACTION_ICONS: Record<AuditAction, React.ElementType> = {
  login: LogIn,
  logout: LogOut,
  session_create: CalendarPlus,
  session_edit: Pencil,
  session_delete: Trash2,
  session_restore: RotateCcw,
  session_open: PlayCircle,
  session_close: StopCircle,
  participant_import: Upload,
  report_download_pdf: FileDown,
  report_download_csv: FileDown,
  account_create: UserPlus,
  account_edit: UserCog,
  account_delete: UserMinus,
  password_change: KeyRound,
  attendance_correction: CheckSquare
}

const ACTION_LABELS: Record<AuditAction, string> = {
  login: 'Login',
  logout: 'Logout',
  session_create: 'Pembuatan sesi',
  session_edit: 'Edit sesi',
  session_delete: 'Hapus sesi',
  session_restore: 'Pemulihan sesi',
  session_open: 'Buka sesi presensi',
  session_close: 'Tutup sesi presensi',
  participant_import: 'Import peserta',
  report_download_pdf: 'Download PDF',
  report_download_csv: 'Download CSV',
  account_create: 'Pembuatan akun',
  account_edit: 'Edit akun',
  account_delete: 'Hapus akun',
  password_change: 'Ubah password',
  attendance_correction: 'Koreksi kehadiran'
}

export function AuditLogPage() {
  const { addToast } = useToast()
  
  const [logs, setLogs] = useState<AuditLogWithDetails[]>([])
  const [totalLogs, setTotalLogs] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  const [page, setPage] = useState(1)
  const limit = 25
  const totalPages = Math.max(1, Math.ceil(totalLogs / limit))

  const [filterActions, setFilterActions] = useState<AuditAction[]>([])
  const [filterSessionId, setFilterSessionId] = useState<string>('')
  
  const [sessions, setSessions] = useState<Session[]>([])

  const fetchSessions = async () => {
    try {
      const data = await getSessions()
      setSessions(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const filters: AuditLogFilter = {}
      if (filterActions.length > 0) filters.actions = filterActions
      if (filterSessionId) filters.sessionId = filterSessionId
      
      const { data, total } = await getAuditLogs(page, limit, filters)
      setLogs(data)
      setTotalLogs(total)
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: 'Gagal memuat log: ' + e.message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [page, filterActions, filterSessionId])

  const toggleActionFilter = (action: AuditAction) => {
    setFilterActions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    )
    setPage(1)
  }

  const formatMetadata = (metadata: any, action: AuditAction) => {
    if (!metadata) return null
    
    // Format khusus untuk batch manual attendance
    if (action === 'attendance_correction' && metadata.action === 'batch_manual') {
      return (
        <div className="mt-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-accent-soft)] p-3 rounded-[var(--radius-md)]">
          <p className="font-medium text-[var(--color-text-primary)]">
            Presensi manual untuk {metadata.total_changes} peserta
          </p>
          <div className="flex gap-4 mt-1 text-xs">
            {metadata.marked_count > 0 && (
              <span className="text-[var(--color-success)]">
                ✓ {metadata.marked_count} ditandai hadir
              </span>
            )}
            {metadata.unmarked_count > 0 && (
              <span className="text-[var(--color-danger)]">
                ✗ {metadata.unmarked_count} dibatalkan
              </span>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="mt-2 text-xs font-[var(--font-mono)] bg-[var(--color-surface-hover)] p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key}>
            <span className="font-semibold text-[var(--color-text-primary)]">{key}:</span> {String(value)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
          Riwayat Aktivitas
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Audit log komprehensif yang mencatat seluruh aksi di dalam sistem.
        </p>
      </div>

      <Card className="p-4 bg-[var(--color-surface)]">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <DropdownMenu
              trigger={
                <Button variant="secondary" leftIcon={<Filter size={16} />}>
                  Filter Aktivitas {filterActions.length > 0 && `(${filterActions.length})`} ▾
                </Button>
              }
              items={[
                { label: 'Semua Aktivitas', onClick: () => { setFilterActions([]); setPage(1) } },
                ...Object.entries(ACTION_LABELS).map(([key, label]) => ({
                  label: `${filterActions.includes(key as AuditAction) ? '✓ ' : ''}${label}`,
                  onClick: () => toggleActionFilter(key as AuditAction)
                }))
              ]}
            />
            <DropdownMenu
              trigger={
                <Button variant="secondary" leftIcon={<Calendar size={16} />}>
                  Sesi {filterSessionId ? '(Terpilih)' : ''} ▾
                </Button>
              }
              items={[
                { label: 'Semua Sesi', onClick: () => { setFilterSessionId(''); setPage(1) } },
                ...sessions.map(s => ({
                  label: `${filterSessionId === s.id ? '✓ ' : ''}${s.name}`,
                  onClick: () => { setFilterSessionId(s.id); setPage(1) }
                }))
              ]}
            />
            {(filterActions.length > 0 || filterSessionId) && (
              <Button 
                variant="ghost" 
                onClick={() => { setFilterActions([]); setFilterSessionId(''); setPage(1) }}
                className="text-[var(--color-text-secondary)]"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)]">Memuat log aktivitas...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Activity size={48} className="text-[var(--color-border)] mb-4" />
            <p className="text-lg text-[var(--color-text-secondary)]">Tidak ada aktivitas ditemukan</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {logs.map((log) => {
              const Icon = ACTION_ICONS[log.action] || Activity
              
              // Custom label untuk batch manual
              let displayLabel = ACTION_LABELS[log.action] || log.action
              let isBatch = false
              if (log.action === 'attendance_correction' && log.metadata?.action === 'batch_manual') {
                displayLabel = `Presensi manual untuk ${log.metadata.total_changes} peserta`
                isBatch = true
              }

              return (
                <div key={log.id} className="p-4 sm:p-5 hover:bg-[var(--color-surface-hover)] transition-colors flex gap-4">
                  <div className={`mt-1 shrink-0 w-10 h-10 rounded-full border flex items-center justify-center ${
                    isBatch 
                      ? 'bg-[var(--color-accent-soft)] border-[var(--color-accent)]/20 text-[var(--color-accent)]' 
                      : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 mb-1">
                      <h3 className="font-semibold text-[var(--color-text-primary)]">
                        {displayLabel}
                      </h3>
                      <span className="text-xs font-[var(--font-mono)] text-[var(--color-text-secondary)] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })} WIB
                      </span>
                    </div>
                    
                    <div className="text-sm text-[var(--color-text-secondary)] flex flex-wrap gap-x-4 gap-y-1">
                      {log.users && (
                        <span>User: <span className="font-medium text-[var(--color-text-primary)]">{log.users.full_name}</span> ({log.users.username})</span>
                      )}
                      {!log.users && log.actor_label && (
                        <span>Actor: <span className="font-medium text-[var(--color-text-primary)]">{log.actor_label}</span></span>
                      )}
                      {log.sessions && (
                        <span>Sesi: <span className="font-medium text-[var(--color-text-primary)]">{log.sessions.name}</span></span>
                      )}
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && formatMetadata(log.metadata, log.action)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg)]">
            <Button
              variant="secondary"
              leftIcon={<ChevronLeft size={16} />}
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Sebelumnya
            </Button>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Halaman {page} dari {totalPages}
            </span>
            <Button
              variant="secondary"
              rightIcon={<ChevronRight size={16} />}
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        )}
      </Card>

    </div>
  )
}
