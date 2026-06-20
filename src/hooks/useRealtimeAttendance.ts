import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeAttendanceOptions {
  sessionId: string
  onInsert?: (record: any) => void
  onDelete?: (oldRecord: { id: string; participant_id: string }) => void
  onSessionUpdate?: (session: any) => void
}

export function useRealtimeAttendance(options: UseRealtimeAttendanceOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!options.sessionId) return

    const channel = supabase
      .channel(`session-${options.sessionId}-attendance-sync`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance_records',
        filter: `session_id=eq.${options.sessionId}`,
      }, (payload) => {
        options.onInsert?.(payload.new)
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'attendance_records',
        filter: `session_id=eq.${options.sessionId}`,
      }, (payload) => {
        options.onDelete?.(payload.old as { id: string; participant_id: string })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${options.sessionId}`,
      }, (payload) => {
        options.onSessionUpdate?.(payload.new)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [options.sessionId, options.onInsert, options.onDelete, options.onSessionUpdate])

  return channelRef.current
}
