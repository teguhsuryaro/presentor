import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowLeft, CheckCircle2, Clock, Lock, Eye, EyeOff } from 'lucide-react'

import { getSessionById } from '../services/session.service'
import { searchParticipants } from '../services/participant.service'
import { markAttendance, getParticipantsWithAttendance } from '../services/attendance.service'
import type { SessionWithStats, ParticipantWithAttendance } from '../types'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useRealtimeAttendance } from '../hooks/useRealtimeAttendance'
import { supabase } from '../lib/supabase'

const INTERNAL_DOMAIN = '@internal.presensi.local'

export function StudentModePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { user } = useAuth()

  const [session, setSession] = useState<SessionWithStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ParticipantWithAttendance[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithAttendance | null>(null)
  const [isSuccessMode, setIsSuccessMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Exit password dialog state
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [exitPassword, setExitPassword] = useState('')
  const [exitPasswordError, setExitPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const [allParticipants, setAllParticipants] = useState<ParticipantWithAttendance[]>([])

  const searchInputRef = useRef<HTMLInputElement>(null)

  async function fetchSessionAndParticipants() {
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
    if (!id) return
    fetchSessionAndParticipants()
  }, [id])

  useRealtimeAttendance({
    sessionId: id || '',
    onInsert: (record) => {
      setAllParticipants(prev => prev.map(p => p.id === record.participant_id ? { ...p, attendance: record } : p))
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

  useEffect(() => {
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
      ).slice(0, 5)
      
      setSearchResults(results)
      setIsSearching(false)
    }, 200)

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

  const handleExitConfirm = async () => {
    if (!exitPassword.trim() || !user) return
    setIsExiting(true)
    setExitPasswordError('')
    try {
      const email = `${user.username}${INTERNAL_DOMAIN}`
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: exitPassword
      })
      
      if (error) {
        setExitPasswordError('Password salah. Silakan coba lagi.')
        return
      }
      
      setShowExitDialog(false)
      navigate(`/sessions/${id}`)
    } catch (e) {
      setExitPasswordError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsExiting(false)
    }
  }

  if (!session) {
    return <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text-secondary)]">Memuat...</div>
  }

  return (
    <div className="h-screen h-[100dvh] bg-[var(--color-bg)] flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-[var(--color-accent-soft)] to-transparent pointer-events-none opacity-50" />
      
      {/* Header — compact */}
      <header className="relative z-10 px-6 py-4 md:py-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-xl md:text-2xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)] mb-1">
          {session.name}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Presensi Peserta</p>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center justify-center pb-8">
        
        <AnimatePresence mode="wait">
          {!selectedParticipant && !isSuccessMode && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="w-full"
            >
              <div className="relative group w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-accent)] transition-colors" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 text-lg bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-0 focus:border-[var(--color-accent)] shadow-sm transition-all"
                  placeholder="Ketik Nama atau NIM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchQuery.trim().length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {searchResults.length > 0 ? (
                    searchResults.map((p) => (
                      <div
                        key={p.id}
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 md:p-4 flex items-center justify-between cursor-pointer hover:border-[var(--color-accent)] hover:shadow-sm transition-all"
                        onClick={() => handleSelectParticipant(p)}
                      >
                        <div>
                          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                            {p.full_name}
                          </h3>
                          <p className="text-xs font-[var(--font-mono)] text-[var(--color-text-secondary)] mt-0.5">
                            {p.nim}
                          </p>
                        </div>
                        
                        {p.attendance ? (
                          <div className="flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-success-soft)] text-[var(--color-success)] text-xs font-medium rounded-full border border-[var(--color-success)]/20">
                              <CheckCircle2 size={12} /> Sudah Hadir
                            </span>
                            <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-text-secondary)] mt-1 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(p.attendance.attended_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          </div>
                        ) : (
                          <ArrowLeft size={18} className="text-[var(--color-text-secondary)] rotate-180 opacity-40" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Tidak ditemukan peserta dengan nama/NIM tersebut.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Confirmation / Already Attended View — compact */}
          {selectedParticipant && !isSuccessMode && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl p-5 md:p-6 shadow-md"
            >
              {selectedParticipant.attendance ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-[var(--color-success-soft)] text-[var(--color-success)] rounded-[var(--radius-md)] flex items-center justify-center mb-4">
                    <CheckCircle2 size={28} />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Sudah Hadir</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    Anda sudah melakukan presensi sebelumnya.
                  </p>
                  
                  <div className="w-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg p-4 text-left mb-4">
                    <div className="mb-3">
                      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-0.5">Nama Peserta</p>
                      <p className="text-base font-bold text-[var(--color-text-primary)]">{selectedParticipant.full_name}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-0.5">NIM</p>
                      <p className="text-sm font-[var(--font-mono)] text-[var(--color-text-primary)]">{selectedParticipant.nim}</p>
                    </div>
                    <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-success-soft)] text-[var(--color-success)] text-xs font-semibold rounded-full border border-[var(--color-success)]/20">
                        Hadir
                      </span>
                      <span className="text-xs font-[var(--font-mono)] text-[var(--color-text-secondary)] flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(selectedParticipant.attendance.attended_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleBackToSearch}
                    className="w-full py-3 bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-semibold rounded-lg hover:bg-[var(--color-border)] transition-colors"
                  >
                    Kembali ke Pencarian
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Konfirmasi Presensi</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    Pastikan nama dan NIM sesuai dengan identitas Anda.
                  </p>
                  
                  <div className="w-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg p-4 text-left mb-4">
                    <div className="mb-3">
                      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-0.5">Nama Peserta</p>
                      <p className="text-base font-bold text-[var(--color-text-primary)]">{selectedParticipant.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-0.5">NIM</p>
                      <p className="text-sm font-[var(--font-mono)] text-[var(--color-text-primary)]">{selectedParticipant.nim}</p>
                    </div>
                  </div>

                  <div className="w-full flex flex-col gap-2">
                    <button
                      onClick={handleConfirmAttendance}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[var(--color-accent)] text-white font-bold rounded-lg shadow-md hover:shadow-lg active:translate-y-0 disabled:opacity-70 transition-all"
                    >
                      {isSubmitting ? 'Mencatat...' : 'Konfirmasi Kehadiran'}
                    </button>
                    <button
                      onClick={handleBackToSearch}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-transparent text-[var(--color-text-secondary)] font-semibold rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Success Animation View — compact */}
          {isSuccessMode && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center justify-center py-8"
            >
              <div className="relative mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-24 h-24 bg-[var(--color-success)] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                >
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                Presensi Berhasil!
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Terima kasih, {selectedParticipant?.full_name}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer / Exit Button — clearly visible */}
      <footer className="relative z-10 p-4 flex justify-center">
        <button
          onClick={() => { setShowExitDialog(true); setExitPassword(''); setExitPasswordError(''); setShowPassword(false) }}
          className="text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] bg-[var(--color-surface)] px-5 py-2.5 rounded-full border border-[var(--color-border)] shadow-sm hover:shadow transition-all flex items-center gap-2"
        >
          <Lock size={14} />
          Keluar Mode Presensi
        </button>
      </footer>

      {/* Exit Password Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-full flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Konfirmasi Keluar</h2>
                <p className="text-xs text-[var(--color-text-secondary)]">Masukkan password admin untuk keluar</p>
              </div>
            </div>
            
            <div className="relative mb-1">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password..."
                value={exitPassword}
                onChange={(e) => { setExitPassword(e.target.value); setExitPasswordError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter' && exitPassword.trim()) handleExitConfirm() }}
                className="w-full px-4 py-3 pr-10 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {exitPasswordError && (
              <p className="text-xs text-[var(--color-danger)] mb-3">{exitPasswordError}</p>
            )}
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-2.5 bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-medium rounded-lg hover:bg-[var(--color-border)] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleExitConfirm}
                disabled={isExiting || !exitPassword.trim()}
                className="flex-1 py-2.5 bg-[var(--color-accent)] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isExiting ? 'Verifikasi...' : 'Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
