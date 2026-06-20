// ============================================
// Database Types
// ============================================

export type UserRole = 'super_admin' | 'panitia'

export interface User {
  id: string
  username: string
  password_hash: string
  auth_user_id: string | null
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ActiveSession {
  id: string
  user_id: string
  session_token: string
  device_label: string | null
  last_activity_at: string
  created_at: string
  expired_at: string | null
}

export interface Event {
  id: string
  name: string
  academic_year: string | null
  created_by: string | null
  created_at: string
}

export type SessionStatus = 'aktif' | 'ditutup'

export interface Session {
  id: string
  event_id: string | null
  name: string
  description: string | null
  status: SessionStatus
  created_by: string
  created_at: string
  updated_at: string
  closed_at: string | null
  deleted_at: string | null
  permanently_delete_at: string | null
}

export interface ParticipantAttributes {
  prodi?: string
  fakultas?: string
  kelompok?: string
  angkatan?: string
  kelas?: string
  [key: string]: string | undefined
}

export type ParticipantSource = 'manual' | 'import_csv' | 'import_excel' | 'copied_from_session'

export interface Participant {
  id: string
  session_id: string
  full_name: string
  nim: string
  attributes: ParticipantAttributes
  created_at: string
  source: ParticipantSource
}

export type AttendanceMethod = 'self_service' | 'manual_checklist'

export interface AttendanceRecord {
  id: string
  session_id: string
  participant_id: string
  attended_at: string
  method: AttendanceMethod
  recorded_by: string | null
}

export type AuditAction =
  | 'login' | 'logout'
  | 'session_create' | 'session_edit' | 'session_delete' | 'session_restore'
  | 'session_open' | 'session_close'
  | 'participant_import'
  | 'report_download_pdf' | 'report_download_csv'
  | 'account_create' | 'account_edit' | 'account_delete'
  | 'password_change'
  | 'attendance_correction'

export interface AuditLog {
  id: string
  user_id: string | null
  actor_label: string | null
  action: AuditAction
  related_session_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface SessionStatsSnapshot {
  id: string
  session_id: string
  total_participants: number
  total_attended: number
  attendance_percentage: number
  last_calculated_at: string
}

// ============================================
// Frontend-specific Types
// ============================================

// Peserta dengan status kehadiran (joined query)
export interface ParticipantWithAttendance extends Participant {
  attendance?: AttendanceRecord | null
}

// Sesi dengan statistik (joined query)
export interface SessionWithStats extends Session {
  stats?: SessionStatsSnapshot | null
  event?: Event | null
}

// Auth context
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Toast notification
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

// Column mapping untuk import CSV/Excel
export interface ColumnMapping {
  nameColumn: string
  nimColumn: string
  additionalColumns?: Record<string, string> // attribute key → column name
}

// Import preview row
export interface ImportPreviewRow {
  [key: string]: string | number | null
}
