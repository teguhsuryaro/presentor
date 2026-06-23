import { supabase } from '../lib/supabase'
import type { ParticipantWithAttendance } from '../types'

export async function getParticipantsWithAttendance(sessionId: string): Promise<ParticipantWithAttendance[]> {
  const { data, error } = await supabase
    .from('participants')
    .select(`
      *,
      attendance:attendance_records(*)
    `)
    .eq('session_id', sessionId)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching participants with attendance:', error)
    throw new Error('Gagal mengambil data peserta dan kehadiran: ' + error.message)
  }

  // Supabase might return attendance as array, so map to object
  return (data as any[]).map(p => ({
    ...p,
    attendance: p.attendance && p.attendance.length > 0 ? p.attendance[0] : null
  })) as ParticipantWithAttendance[]
}

export async function markAttendance(
  sessionId: string, 
  participantId: string, 
  method: 'self_service' | 'manual_checklist', 
  userId?: string
): Promise<void> {
  
  const { error } = await supabase
    .from('attendance_records')
    .insert({
      session_id: sessionId,
      participant_id: participantId,
      method: method,
      recorded_by: userId || null
    })

  if (error) {
    if (error.code === '23505') { // unique violation — record sudah ada, anggap berhasil
      return
    }
    throw new Error('Gagal mencatat kehadiran: ' + error.message)
  }

  if (method === 'manual_checklist' && userId) {
    await supabase.rpc('create_audit_log', {
      p_user_id: userId,
      p_action: 'attendance_correction',
      p_related_session_id: sessionId,
      p_metadata: { action: 'mark', participant_id: participantId }
    })
  }
}

export async function unmarkAttendance(
  sessionId: string, 
  participantId: string, 
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('attendance_records')
    .delete()
    .eq('session_id', sessionId)
    .eq('participant_id', participantId)

  if (error) throw new Error('Gagal membatalkan kehadiran: ' + error.message)

  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'attendance_correction',
    p_related_session_id: sessionId,
    p_metadata: { action: 'unmark', participant_id: participantId }
  })
}

export async function batchMarkAttendance(
  sessionId: string,
  markParticipantIds: string[],
  unmarkParticipantIds: string[],
  userId: string
): Promise<void> {
  // 1. Batch INSERT untuk peserta yang ditandai hadir
  if (markParticipantIds.length > 0) {
    const insertData = markParticipantIds.map(pid => ({
      session_id: sessionId,
      participant_id: pid,
      method: 'manual_checklist' as const,
      recorded_by: userId
    }))

    const { error: insertError } = await supabase
      .from('attendance_records')
      .upsert(insertData, { 
        onConflict: 'session_id,participant_id',
        ignoreDuplicates: true 
      })

    if (insertError) {
      throw new Error('Gagal menyimpan kehadiran batch: ' + insertError.message)
    }
  }

  // 2. Batch DELETE untuk peserta yang dibatalkan kehadirannya
  if (unmarkParticipantIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('attendance_records')
      .delete()
      .eq('session_id', sessionId)
      .in('participant_id', unmarkParticipantIds)

    if (deleteError) {
      throw new Error('Gagal membatalkan kehadiran batch: ' + deleteError.message)
    }
  }

  // 3. Buat SATU log audit untuk seluruh batch
  const totalMarked = markParticipantIds.length
  const totalUnmarked = unmarkParticipantIds.length
  
  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'attendance_correction',
    p_related_session_id: sessionId,
    p_metadata: {
      action: 'batch_manual',
      marked_count: totalMarked,
      unmarked_count: totalUnmarked,
      total_changes: totalMarked + totalUnmarked,
      marked_participant_ids: markParticipantIds,
      unmarked_participant_ids: unmarkParticipantIds
    }
  })
}

