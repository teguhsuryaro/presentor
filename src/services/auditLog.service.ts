import { supabase } from '../lib/supabase'
import type { AuditLog, AuditAction } from '../types'

export interface AuditLogWithDetails extends AuditLog {
  users?: {
    full_name: string
    username: string
  } | null
  sessions?: {
    name: string
  } | null
}

export interface AuditLogFilter {
  actions?: AuditAction[]
  userId?: string
  sessionId?: string
  startDate?: Date
  endDate?: Date
}

export async function getAuditLogs(
  page: number = 1,
  limit: number = 25,
  filters?: AuditLogFilter
): Promise<{ data: AuditLogWithDetails[]; total: number }> {
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      users:user_id(full_name, username),
      sessions:related_session_id(name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters) {
    if (filters.actions && filters.actions.length > 0) {
      query = query.in('action', filters.actions)
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }
    if (filters.sessionId) {
      query = query.eq('related_session_id', filters.sessionId)
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }
    if (filters.endDate) {
      // Set to end of day
      const end = new Date(filters.endDate)
      end.setHours(23, 59, 59, 999)
      query = query.lte('created_at', end.toISOString())
    }
  }

  // Pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data as unknown as AuditLogWithDetails[],
    total: count || 0
  }
}

// Global helper that uses the RPC
export async function logAction(
  action: AuditAction,
  userId: string | null = null,
  sessionId: string | null = null,
  metadata: Record<string, unknown> | null = null
): Promise<void> {
  try {
    await supabase.rpc('create_audit_log', {
      p_user_id: userId,
      p_action: action,
      p_related_session_id: sessionId,
      p_metadata: metadata
    })
  } catch (error) {
    console.error('Failed to write audit log:', error)
    // We intentionally don't throw to not break the main flow if logging fails
  }
}
