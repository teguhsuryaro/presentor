import { supabase } from '../lib/supabase'
import type { User, ActiveSession } from '../types'

// Konstanta internal domain untuk mengubah username jadi email
const INTERNAL_DOMAIN = '@internal.presensi.local'

export async function loginUser(username: string, password: string): Promise<{ user: User, session: ActiveSession }> {
  const email = `${username.trim()}${INTERNAL_DOMAIN}`

  // 1. Sign in via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    if (authError.message.includes('Invalid login credentials')) {
      throw new Error('Username atau password salah.')
    }
    throw new Error(authError.message)
  }

  const authUserId = authData.user?.id
  if (!authUserId) throw new Error('Autentikasi gagal.')

  // 2. Fetch user data dari tabel users
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single()

  if (userError || !user) {
    await supabase.auth.signOut()
    throw new Error('Data pengguna tidak ditemukan di sistem.')
  }

  // 3. Validasi is_active
  if (!user.is_active) {
    await supabase.auth.signOut()
    throw new Error('Akun Anda dinonaktifkan. Hubungi Super Administrator.')
  }

  // 4. Cek single device (query active_sessions)
  const activeSession = await checkActiveSession(user.id)
  if (activeSession) {
    await supabase.auth.signOut()
    throw new Error(`Akun sedang aktif di perangkat lain (${activeSession.device_label || 'Unknown'}) sejak ${new Date(activeSession.created_at).toLocaleString()}.`)
  }

  // 5. Buat active_session baru
  const session = await createActiveSession(user.id)

  // 6. Catat audit log 'login'
  await supabase.rpc('create_audit_log', {
    p_user_id: user.id,
    p_action: 'login',
    p_related_session_id: null,
    p_metadata: { device: session.device_label }
  })

  return { user: user as User, session }
}

export async function logoutUser(userId: string, sessionId: string): Promise<void> {
  // Update active_session: set expired_at = now()
  await supabase
    .from('active_sessions')
    .update({ expired_at: new Date().toISOString() })
    .eq('id', sessionId)

  // Catat audit_log 'logout'
  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'logout',
    p_related_session_id: null,
    p_metadata: { session_id: sessionId }
  })

  // Sign out Supabase Auth
  await supabase.auth.signOut()
}

export async function checkActiveSession(userId: string): Promise<ActiveSession | null> {
  // 30 menit ke belakang
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('active_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('expired_at', null)
    .gt('last_activity_at', thirtyMinutesAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error checking active session:', error)
    return null
  }

  return data as ActiveSession | null
}

export async function createActiveSession(userId: string): Promise<ActiveSession> {
  const sessionToken = crypto.randomUUID()
  const deviceLabel = getDeviceLabel()

  const { data, error } = await supabase
    .from('active_sessions')
    .insert({
      user_id: userId,
      session_token: sessionToken,
      device_label: deviceLabel,
      last_activity_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error('Gagal membuat sesi login: ' + error.message)
  }

  return data as ActiveSession
}

export async function updateLastActivity(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('active_sessions')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    console.error('Failed to update last activity:', error)
  }
}

// Utils
function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device'
  const ua = navigator.userAgent
  let browser = 'Unknown Browser'
  if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('Safari/')) browser = 'Safari'
  else if (ua.includes('Edge/')) browser = 'Edge'

  let os = 'Unknown OS'
  if (ua.includes('Win')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'MacOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('like Mac')) os = 'iOS'

  return `${browser} on ${os}`
}
