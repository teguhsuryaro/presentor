import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useEffect } from 'react'
import { Skeleton } from './ui/Skeleton'

export function SuperAdminRoute() {
  const { user, isLoading } = useAuth()
  const { addToast } = useToast()

  useEffect(() => {
    if (!isLoading && user && user.role !== 'super_admin') {
      addToast({
        type: 'error',
        title: 'Akses Ditolak',
        message: 'Halaman ini hanya dapat diakses oleh Super Admin.'
      })
    }
  }, [isLoading, user, addToast])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] p-8">
        <Skeleton variant="card" height="100vh" className="max-h-[800px]" />
      </div>
    )
  }

  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
