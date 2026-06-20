import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, UserCheck, UserMinus, TrendingUp, Search, Download, Plus, Play, MoreVertical } from 'lucide-react'

import { getSessionById, openSession, closeSession } from '../services/session.service'
import { getParticipantsWithAttendance, markAttendance, unmarkAttendance } from '../services/attendance.service'
import { deleteParticipant } from '../services/participant.service'
import { generatePDF, generateCSV } from '../services/report.service'
import type { SessionWithStats, ParticipantWithAttendance } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, Button, Badge, Skeleton, AnimatedNumber, Input, ConfirmDialog, DropdownMenu } from '../components/ui'
import { AddParticipantModal } from '../components/participant/AddParticipantModal'
import { EditParticipantModal } from '../components/participant/EditParticipantModal'
import { ImportParticipantModal } from '../components/participant/ImportParticipantModal'
import { useRealtimeAttendance } from '../hooks/useRealtimeAttendance'

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()

  const [session, setSession] = useState<SessionWithStats | null>(null)
  const [participants, setParticipants] = useState<ParticipantWithAttendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'semua' | 'hadir' | 'belum'>('semua')
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null)

  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isEditParticipantOpen, setIsEditParticipantOpen] = useState(false)
  const [participantToEdit, setParticipantToEdit] = useState<ParticipantWithAttendance | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean,
    title: string,
    message: string,
    variant: 'danger' | 'default',
    action: () => Promise<void>
  }>({
    isOpen: false, title: '', message: '', variant: 'default', action: async () => {}
  })

  useEffect(() => {
    if (!id) return
    fetchData()
  }, [id])

  useRealtimeAttendance({
    sessionId: id || '',
    onInsert: (record) => {
      setParticipants(prev => prev.map(p => p.id === record.participant_id ? { ...p, attendance: record } : p))
      
      setHighlightedRowId(record.participant_id)
      setTimeout(() => setHighlightedRowId(null), 800)
      
      // Update stats quietly
      fetchDataQuietly()
    },
    onDelete: (old) => {
      setParticipants(prev => prev.map(p => p.id === old.participant_id ? { ...p, attendance: null } : p))
      
      setHighlightedRowId(old.participant_id)
      setTimeout(() => setHighlightedRowId(null), 800)
      
      fetchDataQuietly()
    },
    onSessionUpdate: (newSession) => {
      setSession(prev => prev ? { ...prev, ...newSession } : prev)
    }
  })

  const fetchData = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [sessionData, participantsData] = await Promise.all([
        getSessionById(id),
        getParticipantsWithAttendance(id)
      ])
      setSession(sessionData)
      setParticipants(participantsData)
    } catch (error: any) {
      addToast({ type: 'error', title: 'Gagal', message: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDataQuietly = async () => {
    if (!id) return
    try {
      const sessionData = await getSessionById(id)
      setSession(sessionData)
    } catch (e) {
      // ignore
    }
  }

  const handleToggleAttendance = async (p: ParticipantWithAttendance) => {
    if (!id || !user) return

    const isAttending = !p.attendance

    if (isAttending) {
      // Mark as attended
      markAttendance(id, p.id, 'manual_checklist', user.id)
        .then(() => {
          addToast({ type: 'success', title: 'Berhasil', message: `${p.full_name} ditandai hadir.` })
        })
        .catch(err => addToast({ type: 'error', title: 'Gagal', message: err.message }))
    } else {
      // Confirm unmark
      setConfirmDialog({
        isOpen: true,
        title: 'Batalkan Kehadiran',
        message: `Yakin ingin membatalkan kehadiran untuk ${p.full_name}?`,
        variant: 'danger',
        action: async () => {
          try {
            await unmarkAttendance(id, p.id, user.id)
            addToast({ type: 'success', title: 'Berhasil', message: `Kehadiran ${p.full_name} dibatalkan.` })
          } catch (err: any) {
            addToast({ type: 'error', title: 'Gagal', message: err.message })
          }
        }
      })
    }
  }

  const handleDeleteParticipant = (participant: ParticipantWithAttendance) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Peserta',
      message: p.attendance 
        ? `Peringatan: "${p.full_name}" sudah melakukan presensi. Menghapusnya juga akan MENGHAPUS data kehadirannya di sesi ini. Lanjutkan?`
        : `Apakah Anda yakin ingin menghapus "${p.full_name}" dari sesi ini?`,
      variant: 'danger',
      action: async () => {
        try {
          await deleteParticipant(p.id)
          addToast({ type: 'success', title: 'Berhasil', message: 'Peserta berhasil dihapus.' })
          
        } catch (error: any) {
          addToast({ type: 'error', title: 'Gagal', message: error.message })
        }
      }
    })
  }

  const handleDownloadPDF = async () => {
    if (!session || !user) return
    try {
      addToast({ type: 'info', title: 'Memproses', message: 'Mempersiapkan PDF...' })
      await generatePDF(session, participants, user.id)
      addToast({ type: 'success', title: 'Berhasil', message: 'Laporan PDF berhasil diunduh.' })
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: 'Gagal mengunduh PDF: ' + e.message })
    }
  }

  const handleDownloadCSV = async () => {
    if (!session || !user) return
    try {
      addToast({ type: 'info', title: 'Memproses', message: 'Mempersiapkan CSV...' })
      await generateCSV(session, participants, user.id)
      addToast({ type: 'success', title: 'Berhasil', message: 'Laporan CSV berhasil diunduh.' })
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: 'Gagal mengunduh CSV: ' + e.message })
    }
  }

  const filteredParticipants = useMemo(() => {
    let result = participants
    
    // Status tab filter
    if (activeTab === 'hadir') {
      result = result.filter(p => !!p.attendance)
    } else if (activeTab === 'belum') {
      result = result.filter(p => !p.attendance)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.full_name.toLowerCase().includes(query) || 
        p.nim.toLowerCase().includes(query)
      )
    }

    return result
  }, [participants, activeTab, searchQuery])

  if (isLoading || !session) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width="200px" height="32px" />
        <Skeleton variant="card" height="150px" />
        <Skeleton variant="card" height="400px" />
      </div>
    )
  }

  const totalPeserta = session.stats?.total_participants || participants.length
  const totalHadir = session.stats?.total_attended || participants.filter(p => !!p.attendance).length
  const totalBelum = totalPeserta - totalHadir
  const persentase = totalPeserta > 0 ? Math.round((totalHadir / totalPeserta) * 100) : 0

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="shrink-0 w-fit text-[var(--color-text-secondary)]"
        >
          <ArrowLeft size={20} className="mr-2" />
          Kembali
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)] truncate">
              {session.name}
            </h1>
            <Badge variant={session.status === 'aktif' ? 'accent' : 'default'} className="uppercase shrink-0">
              {session.status === 'aktif' ? 'Aktif 🟢' : 'Ditutup ⚪'}
            </Badge>
          </div>
          {session.description && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1 truncate">
              {session.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">Total Peserta</p>
              <div className="mt-1 text-2xl sm:text-3xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
                <AnimatedNumber value={totalPeserta} />
              </div>
            </div>
            <div className="p-2 sm:p-3 bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] rounded-full">
              <Users size={20} strokeWidth={2} />
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5 border-l-4 border-l-[var(--color-success)]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">Hadir</p>
              <div className="mt-1 text-2xl sm:text-3xl font-bold font-[var(--font-display)] text-[var(--color-success)]">
                <AnimatedNumber value={totalHadir} />
              </div>
            </div>
            <div className="p-2 sm:p-3 bg-green-50 text-[var(--color-success)] rounded-full dark:bg-green-900/20">
              <UserCheck size={20} strokeWidth={2} />
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5 border-l-4 border-l-[var(--color-warning)]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">Belum Hadir</p>
              <div className="mt-1 text-2xl sm:text-3xl font-bold font-[var(--font-display)] text-[var(--color-warning)]">
                <AnimatedNumber value={totalBelum} />
              </div>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-50 text-[var(--color-warning)] rounded-full dark:bg-yellow-900/20">
              <UserMinus size={20} strokeWidth={2} />
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">Kehadiran</p>
              <div className="mt-1 text-2xl sm:text-3xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
                <AnimatedNumber value={persentase} />%
              </div>
            </div>
            <div className="p-2 sm:p-3 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-full">
              <TrendingUp size={20} strokeWidth={2} />
            </div>
          </div>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-[var(--color-border)]">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="primary" 
            leftIcon={<Play size={18} />} 
            onClick={() => navigate(`/sessions/${id}/presensi`)}
            disabled={session.status !== 'aktif'}
          >
            Mode Presensi
          </Button>
          <DropdownMenu 
            trigger={
              <Button variant="secondary" leftIcon={<Download size={18} />}>
                Download Laporan ▾
              </Button>
            }
            items={[
              { label: 'Download PDF', onClick: handleDownloadPDF },
              { label: 'Download CSV', onClick: handleDownloadCSV },
            ]}
          />
        </div>
        <DropdownMenu
          trigger={
            <Button 
              variant="secondary" 
              leftIcon={<Plus size={18} />} 
            >
              Tambah Peserta ▾
            </Button>
          }
          items={[
            { label: 'Input Manual', onClick: () => setIsAddParticipantOpen(true) },
            { label: 'Import dari Excel/CSV', onClick: () => setIsImportOpen(true) }
          ]}
        />
      </div>

      {/* Main Table Area */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row justify-between gap-4 bg-[var(--color-surface)]">
          <div className="flex gap-2 p-1 bg-[var(--color-bg)] rounded-[var(--radius-md)] w-fit">
            {(['semua', 'hadir', 'belum'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-colors ${
                  activeTab === tab 
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm' 
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Cari nama atau NIM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
              className="h-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
              <tr>
                <th className="w-12 px-4 py-3 text-center">☑</th>
                <th className="px-4 py-3 font-medium">Nama Peserta</th>
                <th className="px-4 py-3 font-medium">NIM</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Waktu Presensi</th>
                <th className="w-12 px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map(participant => (
                  <tr 
                    key={participant.id} 
                    className={`hover:bg-[var(--color-surface-hover)] transition-colors ${
                      highlightedRowId === participant.id ? 'realtime-highlight' : ''
                    } ${participant.attendance ? 'bg-green-50/10 dark:bg-green-900/5' : ''}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={!!participant.attendance}
                        onChange={() => handleToggleAttendance(participant)}
                        className="w-4 h-4 rounded-[var(--radius-sm)] border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                      {participant.full_name}
                    </td>
                    <td className="px-4 py-3 font-[var(--font-mono)] text-[var(--color-text-secondary)]">
                      {participant.nim}
                    </td>
                    <td className="px-4 py-3">
                      {participant.attendance ? (
                        <Badge variant="success" className="bg-green-100 text-green-700 border-green-200">Hadir</Badge>
                      ) : (
                        <Badge variant="default">-</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {participant.attendance ? new Date(participant.attendance.attended_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DropdownMenu
                        trigger={
                          <button className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] rounded-[var(--radius-sm)] transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        }
                        items={[
                          { label: 'Edit Peserta', onClick: () => { setParticipantToEdit(participant); setIsEditParticipantOpen(true); } },
                          { label: 'Hapus Peserta', variant: 'danger', onClick: () => handleDeleteParticipant(participant) }
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[var(--color-text-secondary)]">
                    Tidak ada data peserta yang cocok dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AddParticipantModal 
        isOpen={isAddParticipantOpen}
        onClose={() => setIsAddParticipantOpen(false)}
        onSuccess={fetchData}
        sessionId={id!}
      />

      <ImportParticipantModal 
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={fetchData}
        sessionId={id!}
      />

      <EditParticipantModal 
        isOpen={isEditParticipantOpen}
        onClose={() => setIsEditParticipantOpen(false)}
        onSuccess={fetchData}
        participant={participantToEdit}
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
