import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, BarChart3, History, Trash2, UserCog, Settings, LogOut, Menu, X, Search, ArrowUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { ConfirmDialog } from '../components/ui'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/stats', label: 'Statistik', icon: BarChart3 },
  { path: '/history', label: 'Riwayat Aktivitas', icon: History },
  { path: '/trash', label: 'Sampah', icon: Trash2 },
]

const bottomNavItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/stats', label: 'Statistik', icon: BarChart3 },
  { path: '/profile', label: 'Profil', icon: Settings },
]

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/stats': 'Statistik',
  '/history': 'Riwayat Aktivitas',
  '/trash': 'Tempat Sampah',
  '/admin/users': 'Manajemen Akun',
  '/profile': 'Pengaturan Profil',
}

export function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Close sidebar on mobile when navigating
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  // Resolve page title
  let pageTitle = pageTitles[location.pathname] || 'Presentor'
  if (location.pathname.startsWith('/sessions/') && location.pathname.includes('/presensi')) {
    pageTitle = 'Mode Presensi'
  } else if (location.pathname.startsWith('/sessions/')) {
    pageTitle = 'Detail Sesi'
  }

  const handleLogout = async () => {
    try {
      await logout()
      setConfirmLogout(false)
      navigate('/login', { replace: true })
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  const displayName = user?.full_name || 'User'
  const displayRole = user?.role?.replace('_', ' ') || 'user'

  const handleScroll = () => {
    if (scrollRef.current) {
      setShowScrollTop(scrollRef.current.scrollTop > 300)
    }
  }

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col lg:flex-row">
      
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--color-accent)] rounded-[var(--radius-sm)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-[var(--font-display)] font-semibold text-lg text-[var(--color-text-primary)]">Presentor</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -mr-2 text-[var(--color-text-secondary)]">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[260px] bg-[var(--color-surface)] shadow-[var(--shadow-sidebar)] flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden lg:flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--color-accent)] rounded-[var(--radius-md)] flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <h1 className="font-[var(--font-display)] font-bold text-xl text-[var(--color-text-primary)]">
            Presentor
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/20" 
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}

          <div className="my-4 border-t border-[var(--color-border)]" />

          {user?.role === 'super_admin' && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/20" 
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
              )}
            >
              <UserCog size={18} />
              Manajemen Akun
            </NavLink>
          )}

          <NavLink
            to="/profile"
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/20" 
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
            )}
          >
            <Settings size={18} />
            Pengaturan Profil
          </NavLink>
        </div>

        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg)]">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-bold font-[var(--font-display)] text-sm">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{displayName}</p>
              <p className="text-xs text-[var(--color-text-secondary)] capitalize">{displayRole}</p>
            </div>
          </div>
          <button 
            onClick={() => setConfirmLogout(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-[var(--radius-md)] transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 lg:pb-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
            {pageTitle}
          </h2>
        </header>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-auto p-4 lg:p-8 bg-[var(--color-bg)] relative"
        >
          <div className="max-w-6xl mx-auto h-full">
            <Outlet />
          </div>

          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                onClick={scrollToTop}
                className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-50 p-3 bg-[var(--color-accent)] text-white rounded-full shadow-[var(--shadow-card-hover)] hover:bg-[var(--color-accent-hover)] hover:scale-105 transition-all focus:outline-none"
                aria-label="Kembali ke atas"
              >
                <ArrowUp size={24} strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around z-30 pb-[env(safe-area-inset-bottom)]">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center w-full py-2.5 gap-1 transition-colors",
              isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmLogout}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari sistem Presentor?"
        variant="danger"
        confirmText="Ya, Keluar"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
