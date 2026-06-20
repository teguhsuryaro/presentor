import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, Button } from '../components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <EmptyState
        icon={AlertTriangle}
        title="404 - Halaman Tidak Ditemukan"
        description="Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan."
        action={
          <Button onClick={() => navigate('/')}>
            Kembali ke Dashboard
          </Button>
        }
      />
    </div>
  )
}
