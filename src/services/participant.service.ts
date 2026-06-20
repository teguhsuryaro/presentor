import { supabase } from '../lib/supabase'
import type { Participant, ParticipantAttributes } from '../types'

export async function addParticipant(
  sessionId: string, 
  data: { full_name: string, nim: string, attributes?: ParticipantAttributes }
): Promise<Participant> {
  const { data: newParticipant, error } = await supabase
    .from('participants')
    .insert({
      session_id: sessionId,
      full_name: data.full_name,
      nim: data.nim,
      attributes: data.attributes || {},
      source: 'manual'
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('NIM sudah terdaftar di sesi ini.')
    }
    throw new Error('Gagal menambahkan peserta: ' + error.message)
  }

  return newParticipant as Participant
}

export async function updateParticipant(
  id: string, 
  data: { full_name: string, nim: string, attributes?: ParticipantAttributes }
): Promise<Participant> {
  const { data: updatedParticipant, error } = await supabase
    .from('participants')
    .update({
      full_name: data.full_name,
      nim: data.nim,
      attributes: data.attributes || {}
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('NIM sudah terdaftar di sesi ini.')
    }
    throw new Error('Gagal memperbarui peserta: ' + error.message)
  }

  return updatedParticipant as Participant
}

export async function deleteParticipant(id: string): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error('Gagal menghapus peserta: ' + error.message)
  }
}

export async function searchParticipants(sessionId: string, query: string): Promise<Participant[]> {
  // Using simple ilike for now, could be upgraded to to_tsvector if needed for more complex scenarios
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('session_id', sessionId)
    .or(`full_name.ilike.%${query}%,nim.ilike.%${query}%`)
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error('Gagal mencari peserta: ' + error.message)
  }

  return data as Participant[]
}

export async function importParticipantsBatch(
  sessionId: string,
  participants: { full_name: string, nim: string, attributes?: ParticipantAttributes }[],
  userId: string,
  filename: string
): Promise<{ successCount: number, skippedCount: number }> {
  
  if (participants.length === 0) return { successCount: 0, skippedCount: 0 }

  const formattedData = participants.map(p => ({
    session_id: sessionId,
    full_name: p.full_name,
    nim: p.nim,
    attributes: p.attributes || {},
    source: 'import_excel' // or import_csv, generic enough for now or use 'import_file' but the DB has specific enum values. We'll just use 'import_excel' or 'import_csv' based on extension but let's pass it from frontend or just use 'import_csv'. Wait, 'import_csv' is fine.
  }))

  let successCount = 0
  let skippedCount = 0

  // Insert in chunks of 100 to avoid request too large errors
  const CHUNK_SIZE = 100
  for (let i = 0; i < formattedData.length; i += CHUNK_SIZE) {
    const chunk = formattedData.slice(i, i + CHUNK_SIZE)
    
    // Perform bulk insert. Use `upsert` with `onConflict: 'session_id,nim'` if configured,
    // but standard insert with `ignoreDuplicates` is not directly supported in all Supabase versions via client.
    // As a workaround, we'll try inserting the whole chunk, if it fails due to duplicates, we'll fallback to one-by-one.
    const { error } = await supabase
      .from('participants')
      .insert(chunk)
    
    if (error) {
      // Fallback: one-by-one
      for (const p of chunk) {
        const { error: singleError } = await supabase.from('participants').insert(p)
        if (singleError) {
          if (singleError.code === '23505') {
            skippedCount++
          } else {
            console.error('Import error for row:', p, singleError)
          }
        } else {
          successCount++
        }
      }
    } else {
      successCount += chunk.length
    }
  }

  // Audit log
  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'participant_import',
    p_related_session_id: sessionId,
    p_metadata: { filename, total_imported: successCount, total_skipped: skippedCount }
  })

  return { successCount, skippedCount }
}
