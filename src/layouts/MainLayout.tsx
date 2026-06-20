import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { 
  Home, CalendarDays, Users, BarChart3, History, Trash2, UserCog, Settings, LogOut, Menu, X
} from 'lucide-react'
import { cn } from '../lib/utils'
import { motion } from 'framer-motion'

// Placeholder user data until Auth Context is ready
const user = { role: 'super_admin', full_name: 'Super Administrator' }

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/sessions', label: 'Sesi Presensi', icon: CalendarDays },
  { path: '/participants', label: 'Peserta', icon: Users },
  { path: '/stats', label: 'Statistik', icon: BarChart3 },
  { path: '/history', label: 'Riwayat Aktivitas', icon: History },
  { path: '/trash', label: 'Sampah', icon: Trash2 },
]

const bottomNavItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/sessions', label: 'Sesi', icon: CalendarDays },
  { path: '/participants', label: 'Peserta', icon: Users },
  { path: '/stats', label: 'Statistik', icon: BarChart3 },
  { path: '/profile', label: 'Profil', icon: Settings },
]

export function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  
  // Close sidebar on mobile when navigating
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  const pageTitle = location.pathname === '/' 
    ? 'Dashboard' 
    : location.pathname.split('/')[1].replace('-', ' ')

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col lg:flex-row">
      
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-30">
        <div className="font-[var(--font-display)] font-semibold text-lg text-[var(--color-accent)]">Presentor</div>
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
        "fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden lg:block">
          <h1 className="font-[var(--font-display)] font-bold text-2xl text-[var(--color-accent)]">Presentor</h1>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                isActive 
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" 
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}

          <div className="my-4 border-t border-[var(--color-border)]" />

          {user.role === 'super_admin' && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                isActive 
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" 
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]"
              )}
            >
              <UserCog size={18} />
              Manajemen Akun
            </NavLink>
          )}

          <NavLink
            to="/profile"
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
              isActive 
                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" 
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]"
            )}
          >
            <Settings size={18} />
            Pengaturan Profil
          </NavLink>
        </div>

        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center font-bold font-[var(--font-display)]">
              {user.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user.full_name}</p>
              <p className="text-xs text-[var(--color-text-secondary)] capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-danger)] bg-[var(--color-danger)]/10 hover:bg-[var(--color-danger)]/20 rounded-[var(--radius-md)] transition-colors">
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 lg:pb-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center h-16 px-8 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <h2 className="text-lg font-semibold font-[var(--font-display)] text-[var(--color-text-primary)] capitalize">
            {pageTitle}
          </h2>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-6xl mx-auto h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around z-30 pb-[env(safe-area-inset-bottom)]">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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

    </div>
  )
}
