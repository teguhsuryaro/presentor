import { supabase } from '../lib/supabase'

export interface DashboardStats {
  totalSessions: number
  totalParticipants: number
  totalAttended: number
  attendancePercentage: number
}

export interface SessionAttendanceData {
  name: string
  total: number
  hadir: number
  belumHadir: number
  persentase: number
}

export interface TrendData {
  date: string
  session: string
  persentase: number
  hadir: number
}

export interface TimeDistributionData {
  hour: string
  count: number
}

export async function getDashboardStatistics(): Promise<DashboardStats> {
  // Aggregate stats from sessions table
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('status, stats:session_stats_snapshot(total_participants, total_attended)')
    
  if (error) throw error

  let totalParticipants = 0
  let totalAttended = 0

  sessions.forEach(s => {
    if (s.stats && (s.stats as any).length > 0) {
      totalParticipants += (s.stats as any)[0].total_participants || 0
      totalAttended += (s.stats as any)[0].total_attended || 0
    }
  })

  return {
    totalSessions: sessions.length,
    totalParticipants,
    totalAttended,
    attendancePercentage: totalParticipants > 0 ? (totalAttended / totalParticipants) * 100 : 0
  }
}

export async function getAttendanceBySession(): Promise<SessionAttendanceData[]> {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('name, created_at, stats:session_stats_snapshot(total_participants, total_attended)')
    .order('created_at', { ascending: true })

  if (error) throw error

  return sessions.map(s => {
    const statsObj = s.stats && (s.stats as any).length > 0 ? (s.stats as any)[0] : null
    const total = statsObj?.total_participants || 0
    const hadir = statsObj?.total_attended || 0
    const belumHadir = total - hadir
    const persentase = total > 0 ? (hadir / total) * 100 : 0

    return {
      name: s.name,
      total,
      hadir,
      belumHadir,
      persentase: Number(persentase.toFixed(1))
    }
  })
}

export async function getAttendanceTrend(): Promise<TrendData[]> {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('name, created_at, stats:session_stats_snapshot(total_participants, total_attended)')
    .order('created_at', { ascending: true })

  if (error) throw error

  return sessions.map(s => {
    const statsObj = s.stats && (s.stats as any).length > 0 ? (s.stats as any)[0] : null
    const total = statsObj?.total_participants || 0
    const hadir = statsObj?.total_attended || 0
    const persentase = total > 0 ? (hadir / total) * 100 : 0

    return {
      date: new Date(s.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      session: s.name,
      persentase: Number(persentase.toFixed(1)),
      hadir
    }
  })
}

export async function getAttendanceByTime(): Promise<TimeDistributionData[]> {
  // To get time distribution, we need all attendance records.
  // In a massive app, this should be done via RPC or serverless function.
  // For OSPEK/Campus level (a few thousands), client-side grouping is fine.
  
  const { data: records, error } = await supabase
    .from('attendance_records')
    .select('attended_at')

  if (error) throw error

  const hourCounts: Record<string, number> = {}

  records.forEach(r => {
    const date = new Date(r.attended_at)
    // Extract hour formatted as "07:00", "08:00" etc
    const hour = date.getHours().toString().padStart(2, '0') + ':00'
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  // Sort by hour
  const sortedHours = Object.keys(hourCounts).sort()

  return sortedHours.map(hour => ({
    hour,
    count: hourCounts[hour]
  }))
}
