import { supabase } from '../lib/supabase'
import type { Session } from '../types'
import { logAction } from './auditLog.service'

export async function getTrashedSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('permanently_delete_at', { ascending: true })

  if (error) throw error

  return data as Session[]
}

export async function restoreSession(sessionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ 
      deleted_at: null,
      permanently_delete_at: null 
    })
    .eq('id', sessionId)
    .not('deleted_at', 'is', null)

  if (error) throw error

  await logAction('session_restore', userId, sessionId)
}

export async function permanentlyDeleteSession(sessionId: string, sessionName: string, userId: string): Promise<void> {
  // We log the action before deletion because after deletion, 
  // the session_id constraint might fail or it will just be null.
  // Actually related_session_id has SET NULL ON DELETE, so we can log it.
  
  await logAction('session_delete', userId, sessionId, { 
    type: 'permanent', 
    session_name: sessionName 
  })

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .not('deleted_at', 'is', null)

  if (error) throw error
}

export async function cleanupExpiredTrash(): Promise<number> {
  const { data, error } = await supabase
    .from('sessions')
    .delete()
    .not('deleted_at', 'is', null)
    .not('permanently_delete_at', 'is', null)
    .lte('permanently_delete_at', new Date().toISOString())
    .select('id')

  if (error) throw error

  return data?.length || 0
}
