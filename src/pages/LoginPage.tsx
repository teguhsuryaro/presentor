import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Card } from '../components/ui'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full p-8 shadow-[var(--shadow-card-hover)]">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] mb-4">
          <User size={24} />
        </div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
          Sistem Presensi
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
          Masuk ke akun Anda
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-[var(--color-danger)] bg-[var(--color-danger)]/10 rounded-[var(--radius-md)] border border-[var(--color-danger)]/20">
            {error}
          </div>
        )}

        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Masukkan username"
          leftIcon={<User size={18} />}
          disabled={isSubmitting}
          required
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          leftIcon={<Lock size={18} />}
          disabled={isSubmitting}
          required
        />

        <Button
          type="submit"
          className="w-full mt-6"
          isLoading={isSubmitting}
        >
          Masuk
        </Button>
      </form>
    </Card>
  )
}
