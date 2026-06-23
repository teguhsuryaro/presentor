import { supabase } from '../lib/supabase'
import type { SessionWithStats } from '../types'

export interface SessionFilters {
  event_id?: string
  status?: string
}

export async function getSessions(filters?: SessionFilters): Promise<SessionWithStats[]> {
  let query = supabase
    .from('sessions')
    .select(`
      *,
      stats:session_stats_snapshot(*),
      event:events(*)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.event_id) {
    query = query.eq('event_id', filters.event_id)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching sessions:', error)
    throw new Error('Gagal mengambil daftar sesi')
  }

  // Supabase returns one-to-many relationships as arrays, we need to extract the first item for stats
  return (data as any[]).map(session => ({
    ...session,
    stats: session.stats && session.stats.length > 0 ? session.stats[0] : null,
    event: session.event && session.event.length > 0 ? session.event[0] : session.event || null
  })) as SessionWithStats[]
}

export interface DashboardStats {
  total_sessions: number
  total_participants: number
  total_attended: number
  attendance_percentage: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      stats:session_stats_snapshot(total_participants, total_attended)
    `)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching dashboard stats:', error)
    throw new Error('Gagal mengambil statistik dashboard')
  }

  const total_sessions = data.length
  let total_participants = 0
  let total_attended = 0

  data.forEach((session: any) => {
    if (session.stats && session.stats.length > 0) {
      total_participants += session.stats[0].total_participants || 0
      total_attended += session.stats[0].total_attended || 0
    }
  })

  let attendance_percentage = 0
  if (total_participants > 0) {
    attendance_percentage = Math.round((total_attended / total_participants) * 100)
  }

  return {
    total_sessions,
    total_participants,
    total_attended,
    attendance_percentage
  }
}

// ============================================
// Events
// ============================================

export async function getEvents(): Promise<any[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error('Gagal mengambil daftar event: ' + error.message)
  return data
}

export async function createEvent(data: { name: string, academic_year?: string }, userId: string): Promise<any> {
  const { data: newEvent, error } = await supabase
    .from('events')
    .insert({ ...data, created_by: userId })
    .select()
    .single()

  if (error) throw new Error('Gagal membuat event: ' + error.message)
  return newEvent
}

// ============================================
// Session CRUD
// ============================================

export async function createSession(data: { name: string, description?: string, event_id?: string }, userId: string): Promise<any> {
  const { data: newSession, error } = await supabase
    .from('sessions')
    .insert({
      name: data.name,
      description: data.description || null,
      event_id: data.event_id || null,
      status: 'aktif',
      created_by: userId
    })
    .select()
    .single()

  if (error) throw new Error('Gagal membuat sesi: ' + error.message)

  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'session_create',
    p_related_session_id: newSession.id,
    p_metadata: { name: data.name }
  })

  return newSession
}

export async function updateSession(id: string, data: { name: string, description?: string, event_id?: string }, userId: string): Promise<any> {
  const { data: updatedSession, error } = await supabase
    .from('sessions')
    .update({
      name: data.name,
      description: data.description || null,
      event_id: data.event_id || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Gagal memperbarui sesi: ' + error.message)

  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'session_edit',
    p_related_session_id: id,
    p_metadata: { updated_fields: data }
  })

  return updatedSession
}

export async function softDeleteSession(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error('Gagal menghapus sesi: ' + error.message)

  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'session_delete',
    p_related_session_id: id,
    p_metadata: null
  })
}

export async function restoreSession(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ deleted_at: null, permanently_delete_at: null })
    .eq('id', id)

  if (error) throw new Error('Gagal memulihkan sesi: ' + error.message)

  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'session_restore',
    p_related_session_id: id,
    p_metadata: null
  })
}

export async function openSession(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'aktif', closed_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error('Gagal membuka sesi: ' + error.message)

  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'session_open',
    p_related_session_id: id,
    p_metadata: null
  })
}

export async function getSessionById(id: string): Promise<SessionWithStats> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      stats:session_stats_snapshot(*),
      event:events(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error('Gagal mengambil detail sesi: ' + error.message)
  
  return {
    ...data,
    stats: data.stats && data.stats.length > 0 ? data.stats[0] : null,
    event: data.event && data.event.length > 0 ? data.event[0] : data.event || null
  } as SessionWithStats
}

export async function closeSession(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'ditutup', closed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error('Gagal menutup sesi: ' + error.message)

  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'session_close',
    p_related_session_id: id,
    p_metadata: null
  })
}

export async function copyParticipants(fromSessionId: string, toSessionId: string, userId: string): Promise<void> {
  // Ambil peserta dari fromSessionId
  const { data: participants, error: fetchError } = await supabase
    .from('participants')
    .select('full_name, nim, attributes')
    .eq('session_id', fromSessionId)

  if (fetchError) throw new Error('Gagal mengambil peserta: ' + fetchError.message)
  if (!participants || participants.length === 0) return

  // Format untuk insert
  const insertData = participants.map(p => ({
    session_id: toSessionId,
    full_name: p.full_name,
    nim: p.nim,
    attributes: p.attributes,
    source: 'copied_from_session'
  }))

  const { error: insertError } = await supabase
    .from('participants')
    .insert(insertData)

  if (insertError) throw new Error('Gagal menyalin peserta: ' + insertError.message)

  // Audit log implicit in participant_import maybe, or just custom metadata
  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'participant_import',
    p_related_session_id: toSessionId,
    p_metadata: { source: 'copy', from_session_id: fromSessionId, count: participants.length }
  })
}
