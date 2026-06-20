import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Session, ParticipantWithAttendance } from '../types'
import { supabase } from '../lib/supabase'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit'
  }) + ' WIB'
}

function formatDateFile(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function generatePDF(
  session: Session,
  participants: ParticipantWithAttendance[],
  userId: string
): Promise<void> {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(16)
  doc.text(`Laporan Kehadiran`, 14, 20)
  doc.setFontSize(12)
  doc.text(`Sesi: ${session.name}`, 14, 30)
  doc.text(`Tanggal: ${formatDate(session.created_at)}`, 14, 37)
  doc.text(`Status: ${session.status}`, 14, 44)

  // Ringkasan
  const totalHadir = participants.filter(p => p.attendance).length
  doc.text(`Total Peserta: ${participants.length}`, 14, 54)
  doc.text(`Total Hadir: ${totalHadir}`, 14, 61)
  const percentage = participants.length > 0 ? ((totalHadir / participants.length) * 100).toFixed(1) : '0'
  doc.text(`Persentase: ${percentage}%`, 14, 68)

  // Tabel
  autoTable(doc, {
    startY: 78,
    head: [['No', 'Nama', 'NIM', 'Status', 'Waktu Presensi']],
    body: participants.map((p, i) => [
      i + 1,
      p.full_name,
      p.nim,
      p.attendance ? 'Hadir' : 'Belum Hadir',
      p.attendance ? formatTime(p.attendance.attended_at) : '-'
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [217, 101, 26] }, // --color-accent
  })

  // Save
  const filename = `Laporan_${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_${formatDateFile(new Date())}.pdf`
  doc.save(filename)

  // Audit log
  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'report_download_pdf',
    p_related_session_id: session.id,
    p_metadata: { session_name: session.name, total_participants: participants.length, filename }
  })
}

export async function generateCSV(
  session: Session,
  participants: ParticipantWithAttendance[],
  userId: string
): Promise<void> {
  const headers = ['No', 'Nama', 'NIM', 'Status', 'Waktu Presensi']
  const rows = participants.map((p, i) => [
    i + 1,
    p.full_name,
    p.nim,
    p.attendance ? 'Hadir' : 'Belum Hadir',
    p.attendance ? formatTime(p.attendance.attended_at) : '-'
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  const filename = `Laporan_${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_${formatDateFile(new Date())}.csv`
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)

  // Audit log
  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'report_download_csv',
    p_related_session_id: session.id,
    p_metadata: { session_name: session.name, total_participants: participants.length, filename }
  })
}
