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
  const now = new Date()

  // ============================================
  // Header
  // ============================================
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Laporan Kehadiran', 14, 20)
  
  // Garis pemisah header
  doc.setDrawColor(108, 92, 231) // warna accent ungu
  doc.setLineWidth(0.5)
  doc.line(14, 24, 196, 24)

  // ============================================
  // Informasi Sesi
  // ============================================
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  let yPos = 32
  
  // Nama Sesi
  doc.setFont('helvetica', 'bold')
  doc.text('Nama Sesi:', 14, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(session.name, 55, yPos)
  yPos += 7
  
  // Deskripsi Sesi
  doc.setFont('helvetica', 'bold')
  doc.text('Deskripsi:', 14, yPos)
  doc.setFont('helvetica', 'normal')
  const description = session.description && session.description.trim() !== '' 
    ? session.description 
    : '-'
  // Handle multi-line description
  const splitDesc = doc.splitTextToSize(description, 135)
  doc.text(splitDesc, 55, yPos)
  yPos += splitDesc.length * 6 + 1
  
  // Tanggal Pembuatan Sesi
  doc.setFont('helvetica', 'bold')
  doc.text('Tanggal Sesi:', 14, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(session.created_at), 55, yPos)
  yPos += 7
  
  // Status
  doc.setFont('helvetica', 'bold')
  doc.text('Status:', 14, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(session.status === 'aktif' ? 'Aktif' : 'Ditutup', 55, yPos)
  yPos += 10

  // ============================================
  // Ringkasan Kehadiran
  // ============================================
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.line(14, yPos, 196, yPos)
  yPos += 7
  
  const totalHadir = participants.filter(p => p.attendance).length
  const percentage = participants.length > 0 
    ? ((totalHadir / participants.length) * 100).toFixed(1) 
    : '0'
  
  doc.setFont('helvetica', 'bold')
  doc.text('Ringkasan Kehadiran', 14, yPos)
  yPos += 7
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Peserta: ${participants.length}`, 14, yPos)
  doc.text(`Total Hadir: ${totalHadir}`, 80, yPos)
  doc.text(`Persentase: ${percentage}%`, 140, yPos)
  yPos += 10

  // ============================================
  // Tabel Peserta
  // ============================================
  autoTable(doc, {
    startY: yPos,
    head: [['No', 'Nama Lengkap', 'NIM', 'Status', 'Waktu Presensi']],
    body: participants.map((p, i) => [
      i + 1,
      p.full_name,
      p.nim,
      p.attendance ? 'Hadir' : 'Belum Hadir',
      p.attendance ? formatTime(p.attendance.attended_at) : '-'
    ]),
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: { 
      fillColor: [108, 92, 231], // warna accent ungu baru
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 237, 255] // accent-soft ungu
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' }
    }
  })

  // ============================================
  // Footer — Waktu Download
  // ============================================
  const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50
  const footerY = finalY + 15
  
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.line(14, footerY - 5, 196, footerY - 5)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 100, 100)
  
  const downloadDate = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const downloadTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  doc.text(`Dokumen ini diunduh pada: ${downloadDate}, ${downloadTime} WIB`, 14, footerY)
  doc.text('Dibuat oleh sistem Presentor', 14, footerY + 5)
  
  // Reset text color
  doc.setTextColor(0, 0, 0)

  // ============================================
  // Save & Audit
  // ============================================
  const filename = `Laporan_${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_${formatDateFile(now)}.pdf`
  doc.save(filename)

  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'report_download_pdf',
    p_related_session_id: session.id,
    p_metadata: { 
      session_name: session.name, 
      total_participants: participants.length,
      total_attended: totalHadir,
      filename,
      downloaded_at: now.toISOString()
    }
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
