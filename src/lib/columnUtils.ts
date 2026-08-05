import type { Participant, SessionColumn } from '../types'

/**
 * Mengambil nilai kolom kustom dari data peserta.
 * - Jika key === 'full_name', ambil dari participant.full_name
 * - Jika key === 'nim', ambil dari participant.nim
 * - Untuk key lainnya, ambil dari participant.attributes[key]
 */
export function getColumnValue(participant: Participant, columnKey: string): string {
  if (columnKey === 'full_name') return participant.full_name
  if (columnKey === 'nim') return participant.nim || ''
  return participant.attributes?.[columnKey] || ''
}

/**
 * Menyusun objek data peserta dari input form berdasarkan definisi kolom sesi.
 * Return: { full_name, nim, attributes }
 */
export function buildParticipantData(
  columns: SessionColumn[], 
  values: Record<string, string>
): { full_name: string; nim: string; attributes: Record<string, string> } {
  const full_name = values['full_name'] || ''
  const nim = values['nim'] || ''
  const attributes: Record<string, string> = {}

  columns.forEach(col => {
    if (col.key !== 'full_name' && col.key !== 'nim') {
      if (values[col.key]) {
        attributes[col.key] = values[col.key]
      }
    }
  })

  return { full_name, nim, attributes }
}

/**
 * Palette warna untuk highlight data ke-3.
 * Warna-warna dipilih agar kontras tinggi di atas background putih,
 * estetik, dan bisa dibedakan satu sama lain.
 */
const GROUP_COLOR_PALETTE = [
  { bg: '#EDE9FE', text: '#6D28D9' },  // Violet
  { bg: '#DBEAFE', text: '#1D4ED8' },  // Blue
  { bg: '#D1FAE5', text: '#047857' },  // Emerald
  { bg: '#FEF3C7', text: '#B45309' },  // Amber
  { bg: '#FCE7F3', text: '#BE185D' },  // Pink
  { bg: '#E0E7FF', text: '#3730A3' },  // Indigo
  { bg: '#CCFBF1', text: '#0F766E' },  // Teal
  { bg: '#FEE2E2', text: '#B91C1C' },  // Red
  { bg: '#F3E8FF', text: '#7C3AED' },  // Purple
  { bg: '#CFFAFE', text: '#0E7490' },  // Cyan
  { bg: '#FEF9C3', text: '#A16207' },  // Yellow
  { bg: '#FFE4E6', text: '#E11D48' },  // Rose
  { bg: '#ECFDF5', text: '#059669' },  // Green
  { bg: '#EFF6FF', text: '#2563EB' },  // Sky
  { bg: '#FFF7ED', text: '#C2410C' },  // Orange
]

/**
 * Map dari nilai data ke-3 → index warna.
 * Ini bersifat per-sesi dan di-generate saat runtime.
 */
const colorAssignmentMap = new Map<string, number>()
let nextColorIndex = 0

/**
 * Mendapatkan style (backgroundColor + color) untuk nilai data ke-3.
 * Nilai yang sama selalu mendapat warna yang sama.
 * Nilai yang berbeda mendapat warna yang berbeda.
 */
export function getThirdColumnStyle(value: string): { backgroundColor: string; color: string } {
  if (!value) return { backgroundColor: 'transparent', color: 'inherit' }
  
  const normalizedValue = value.trim().toLowerCase()
  
  if (!colorAssignmentMap.has(normalizedValue)) {
    colorAssignmentMap.set(normalizedValue, nextColorIndex % GROUP_COLOR_PALETTE.length)
    nextColorIndex++
  }
  
  const colorIndex = colorAssignmentMap.get(normalizedValue)!
  const palette = GROUP_COLOR_PALETTE[colorIndex]
  
  return { backgroundColor: palette.bg, color: palette.text }
}

/**
 * Reset assignment warna (dipanggil saat ganti sesi atau reload).
 */
export function resetThirdColumnColors(): void {
  colorAssignmentMap.clear()
  nextColorIndex = 0
}
