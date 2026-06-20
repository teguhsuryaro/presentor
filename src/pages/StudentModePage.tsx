import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowLeft, CheckCircle2, Clock, Check } from 'lucide-react'

import { getSessionById } from '../services/session.service'
import { searchParticipants } from '../services/participant.service'
import { markAttendance, getParticipantsWithAttendance } from '../services/attendance.service'
import type { SessionWithStats, ParticipantWithAttendance } from '../types'
import { ConfirmDialog } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { useRealtimeAttendance } from '../hooks/useRealtimeAttendance'

export function StudentModePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [session, setSession] = useState<SessionWithStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ParticipantWithAttendance[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithAttendance | null>(null)
  const [isSuccessMode, setIsSuccessMode] = useState(false)
  const [confirmExitDialog, setConfirmExitDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add all participants to memory for fast client-side searching, 
  // or use the server if there are too many. For OSPEK (thousands), fetching all and searching client-side is fine,
  // but let's stick to debounced server/client hybrid.
  const [allParticipants, setAllParticipants] = useState<ParticipantWithAttendance[]>([])

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    fetchSessionAndParticipants()
  }, [id])

  // Sync state efficiently without full re-fetch
  useRealtimeAttendance({
    sessionId: id || '',
    onInsert: (record) => {
      setAllParticipants(prev => prev.map(p => p.id === record.participant_id ? { ...p, attendance: record } : p))
      
      // Update selected participant if it's currently selected
      if (selectedParticipant && selectedParticipant.id === record.participant_id) {
        setSelectedParticipant(prev => prev ? { ...prev, attendance: record } : prev)
      }
    },
    onDelete: (old) => {
      setAllParticipants(prev => prev.map(p => p.id === old.participant_id ? { ...p, attendance: null } : p))
      
      if (selectedParticipant && selectedParticipant.id === old.participant_id) {
        setSelectedParticipant(prev => prev ? { ...prev, attendance: null } : prev)
      }
    }
  })

  const fetchSessionAndParticipants = async () => {
    if (!id) return
    try {
      const [sessionData, participantsData] = await Promise.all([
        getSessionById(id),
        getParticipantsWithAttendance(id)
      ])
      setSession(sessionData)
      setAllParticipants(participantsData)
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message })
      navigate('/dashboard')
    }
  }

  useEffect(() => {
    // Focus search input on mount and when returning to search
    if (!selectedParticipant && !isSuccessMode) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [selectedParticipant, isSuccessMode])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      const query = searchQuery.toLowerCase().trim()
      
      const results = allParticipants.filter(p => 
        p.full_name.toLowerCase().includes(query) || 
        p.nim.toLowerCase().includes(query)
      ).slice(0, 5) // Limit to 5 results for student mode to prevent clutter
      
      setSearchResults(results)
      setIsSearching(false)
    }, 250) // 250ms debounce

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, allParticipants])

  const handleSelectParticipant = (participant: ParticipantWithAttendance) => {
    setSelectedParticipant(participant)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleConfirmAttendance = async () => {
    if (!id || !selectedParticipant) return
    setIsSubmitting(true)
    try {
      await markAttendance(id, selectedParticipant.id, 'self_service')
      setIsSuccessMode(true)
      
      // Auto redirect after 2 seconds
      setTimeout(() => {
        handleBackToSearch()
      }, 2000)
      
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: e.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToSearch = () => {
    setSelectedParticipant(null)
    setIsSuccessMode(false)
    setSearchQuery('')
  }

  if (!session) {
    return <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">Memuat...</div>
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-[var(--color-accent-soft)] to-transparent pointer-events-none opacity-50" />
      
      {/* Header */}
      <header className="relative z-10 px-6 py-8 md:py-12 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)] mb-2">
          {session.name}
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)]">Presensi Peserta</p>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center">
        
        <AnimatePresence mode="wait">
          {!selectedParticipant && !isSuccessMode && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <div className="relative group w-full">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-accent)] transition-colors" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="block w-full pl-14 pr-6 py-5 text-xl md:text-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-0 focus:border-[var(--color-accent)] shadow-sm transition-all"
                  placeholder="Ketik Nama atau NIM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
                
                {/* Loading indicator line */}
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[var(--color-border)] rounded-b-2xl overflow-hidden">
                  <div className={`h-full bg-[var(--color-accent)] transition-all duration-300 ${isSearching ? 'w-full origin-left animate-pulse' : 'w-0'}`} />
                </div>
              </div>

              {/* Search Results */}
              {searchQuery.trim().length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                  <AnimatePresence>
                    {searchResults.length > 0 ? (
                      searchResults.map((p) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-5 flex items-center justify-between cursor-pointer hover:border-[var(--color-accent)] hover:shadow-md transition-all group"
                          onClick={() => handleSelectParticipant(p)}
                        >
                          <div>
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                              {p.full_name}
                            </h3>
                            <p className="text-sm font-[var(--font-mono)] text-[var(--color-text-secondary)] mt-1">
                              {p.nim}
                            </p>
                          </div>
                          
                          {p.attendance ? (
                            <div className="flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
                                <CheckCircle2 size={16} /> Sudah Hadir
                              </span>
                              <span className="text-xs font-[var(--font-mono)] text-[var(--color-text-secondary)] mt-1.5 flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(p.attendance.attended_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                              </span>
                            </div>
                          ) : (
                            <ArrowLeft size={24} className="text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity rotate-180" />
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 px-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
                      >
                        <p className="text-lg text-[var(--color-text-secondary)]">
                          Tidak ditemukan peserta dengan nama/NIM tersebut.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* Confirmation / Already Attended View */}
          {selectedParticipant && !isSuccessMode && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl p-8 md:p-12 shadow-lg relative overflow-hidden"
            >
              {selectedParticipant.attendance ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">Sudah Hadir</h2>
                  <p className="text-[var(--color-text-secondary)] mb-8 max-w-md">
                    Anda sudah melakukan presensi sebelumnya.
                  </p>
                  
                  <div className="w-full max-w-sm bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl p-6 text-left mb-8">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nama Peserta</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">{selectedParticipant.full_name}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">NIM</p>
                      <p className="text-lg font-[var(--font-mono)] text-[var(--color-text-primary)]">{selectedParticipant.nim}</p>
                    </div>
                    <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-full border border-green-200">
                        Hadir
                      </span>
                      <span className="text-sm font-[var(--font-mono)] text-[var(--color-text-secondary)] flex items-center gap-1.5">
                        <Clock size={16} />
                        {new Date(selectedParticipant.attendance.attended_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleBackToSearch}
                    className="w-full max-w-sm py-4 bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-bold text-lg rounded-xl hover:bg-[var(--color-border)] transition-colors"
                  >
                    Kembali ke Pencarian
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">Konfirmasi Presensi</h2>
                  <p className="text-[var(--color-text-secondary)] mb-8 max-w-md">
                    Pastikan nama dan NIM di bawah ini sesuai dengan identitas Anda.
                  </p>
                  
                  <div className="w-full max-w-sm bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl p-6 text-left mb-8 shadow-inner">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nama Peserta</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">{selectedParticipant.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">NIM</p>
                      <p className="text-lg font-[var(--font-mono)] text-[var(--color-text-primary)]">{selectedParticipant.nim}</p>
                    </div>
                  </div>

                  <div className="w-full max-w-sm flex flex-col gap-4">
                    <button
                      onClick={handleConfirmAttendance}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[var(--color-accent)] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 transition-all"
                    >
                      {isSubmitting ? 'Mencatat...' : 'Konfirmasi Kehadiran'}
                    </button>
                    <button
                      onClick={handleBackToSearch}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-transparent text-[var(--color-text-secondary)] font-bold text-lg rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Success Animation View */}
          {isSuccessMode && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full flex flex-col items-center justify-center py-12"
            >
              <div className="relative mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-32 h-32 bg-[var(--color-success)] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]"
                >
                  <motion.div
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                      />
                    </svg>
                  </motion.div>
                </motion.div>
                {/* Ripples */}
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
                  className="absolute inset-0 bg-[var(--color-success)] rounded-full -z-10"
                />
              </div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-[var(--color-text-primary)] mb-2"
              >
                Presensi Berhasil!
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-lg text-[var(--color-text-secondary)]"
              >
                Terima kasih, {selectedParticipant?.full_name}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer / Exit Button */}
      <footer className="relative z-10 p-6 flex justify-center">
        <button
          onClick={() => setConfirmExitDialog(true)}
          className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface)] px-4 py-2 rounded-full border border-[var(--color-border)] opacity-30 hover:opacity-100 transition-all focus:opacity-100"
        >
          Keluar Mode Presensi
        </button>
      </footer>

      <ConfirmDialog
        isOpen={confirmExitDialog}
        title="Keluar Mode Presensi?"
        message="Apakah Anda yakin ingin keluar dari mode layar penuh mahasiswa dan kembali ke halaman admin?"
        variant="default"
        onConfirm={async () => {
          setConfirmExitDialog(false)
          navigate(`/sessions/${id}`)
        }}
        onCancel={() => setConfirmExitDialog(false)}
      />
    </div>
  )
}
