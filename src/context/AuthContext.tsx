import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, ActiveSession } from '../types'
import { supabase } from '../lib/supabase'
import { loginUser as loginService, logoutUser as logoutService, checkActiveSession, updateLastActivity } from '../services/auth.service'
import { useToast } from './ToastContext'
import { useIdleTimeout } from '../hooks/useIdleTimeout'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

interface AuthContextType {
  user: User | null
  activeSession: ActiveSession | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    // Initial check
    const initAuth = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession()
        
        if (authSession?.user?.id) {
          // Fetch our internal user table data
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', authSession.user.id)
            .single()

          if (userData && userData.is_active) {
            // Check if active_sessions table has a valid session for this user
            const sessionData = await checkActiveSession(userData.id)
            if (sessionData) {
              setUser(userData as User)
              setActiveSession(sessionData)
            } else {
              // Session expired or invalid in DB
              await supabase.auth.signOut()
            }
          } else {
            await supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error('Error during initial auth check', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const handleActivity = () => {
    if (activeSession?.id) {
      updateLastActivity(activeSession.id).catch(console.error)
    }
  }

  const handleTimeout = async () => {
    if (user && activeSession) {
      addToast({
        type: 'warning',
        title: 'Sesi Habis',
        message: 'Anda logout secara otomatis karena tidak ada aktivitas selama 30 menit.'
      })
      await logout()
    }
  }

  const { showWarning } = useIdleTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    onTimeout: handleTimeout,
    onActivity: handleActivity
  })

  const login = async (username: string, password: string) => {
    const { user: loggedInUser, session } = await loginService(username, password)
    setUser(loggedInUser)
    setActiveSession(session)
    addToast({
      type: 'success',
      title: 'Login Berhasil',
      message: `Selamat datang, ${loggedInUser.full_name}!`
    })
  }

  const logout = async () => {
    if (user?.id && activeSession?.id) {
      try {
        await logoutService(user.id, activeSession.id)
      } catch (e) {
        console.error('Error during logout', e)
      }
    } else {
      await supabase.auth.signOut()
    }
    setUser(null)
    setActiveSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, activeSession, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
      
      {/* Idle Timeout Warning Modal */}
      <ConfirmDialog
        isOpen={showWarning && !!user}
        title="Peringatan Idle"
        message="Sesi Anda akan segera berakhir karena tidak ada aktivitas. Klik Lanjutkan untuk memperpanjang sesi."
        confirmText="Lanjutkan"
        cancelText="Logout"
        onConfirm={() => {
          // just trigger activity to reset
          if (activeSession?.id) {
            updateLastActivity(activeSession.id).catch(console.error)
          }
          // The showWarning state will automatically hide via useIdleTimeout's resetTimer call triggered by clicks
        }}
        onCancel={logout}
        variant="default"
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
