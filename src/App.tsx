import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'

// Layouts
import { MainLayout } from './layouts/MainLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { StudentModeLayout } from './layouts/StudentModeLayout'

// Guards
import { ProtectedRoute } from './components/ProtectedRoute'
import { SuperAdminRoute } from './components/SuperAdminRoute'

// Pages
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { DashboardPage } from './pages/DashboardPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { StudentModePage } from './pages/StudentModePage'
import { StatisticsPage } from './pages/StatisticsPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { TrashPage } from './pages/TrashPage'
import { AccountsPage } from './pages/AccountsPage'
import { SettingsPage } from './pages/SettingsPage'

// Placeholders for future pages

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public/Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected Routes inside MainLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/sessions" element={<div>Sessions List</div>} />
                <Route path="/sessions/:id" element={<SessionDetailPage />} />
                <Route path="/stats" element={<StatisticsPage />} />
                <Route path="/history" element={<AuditLogPage />} />
                <Route path="/trash" element={<TrashPage />} />
                <Route path="/profile" element={<SettingsPage />} />

                {/* Super Admin Only Routes */}
                <Route element={<SuperAdminRoute />}>
                  <Route path="/admin/users" element={<AccountsPage />} />
                </Route>
              </Route>

              {/* Student Mode Layout */}
              <Route element={<StudentModeLayout />}>
                <Route path="/sessions/:id/presensi" element={<StudentModePage />} />
              </Route>
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
