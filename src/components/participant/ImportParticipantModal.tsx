import { useState, useRef } from 'react'
import { Modal, Button, Select } from '../ui'
import { parseCSV, parseExcel, detectColumnMapping } from '../../lib/fileParser'
import type { ParsedFile } from '../../lib/fileParser'
import { importParticipantsBatch } from '../../services/participant.service'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { FileUp, FileText, FileSpreadsheet, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'

interface ImportParticipantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  sessionId: string
}

type Step = 'upload' | 'mapping' | 'preview'

export function ImportParticipantModal({ isOpen, onClose, onSuccess, sessionId }: ImportParticipantModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedFile | null>(null)
  const [mapping, setMapping] = useState<{nameColumn: string, nimColumn: string, additionalColumns: Record<string, string>}>({
    nameColumn: '', nimColumn: '', additionalColumns: { prodi: '', fakultas: '', kelompok: '', angkatan: '', kelas: '' }
  })
  const [isProcessing, setIsProcessing] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { addToast } = useToast()

  const resetState = () => {
    setStep('upload')
    setFile(null)
    setParsedData(null)
    setMapping({ nameColumn: '', nimColumn: '', additionalColumns: { prodi: '', fakultas: '', kelompok: '', angkatan: '', kelas: '' } })
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsProcessing(true)

    try {
      let data: ParsedFile
      if (selectedFile.name.endsWith('.csv')) {
        data = await parseCSV(selectedFile)
      } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        data = await parseExcel(selectedFile)
      } else {
        throw new Error('Format file tidak didukung. Gunakan .csv atau .xlsx')
      }

      setParsedData(data)
      const detected = detectColumnMapping(data.headers)
      setMapping(prev => ({
        ...prev,
        nameColumn: detected.nameColumn,
        nimColumn: detected.nimColumn
      }))
      setStep('mapping')
    } catch (error: any) {
      addToast({ type: 'error', title: 'Gagal Membaca File', message: error.message })
      setFile(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMappingChange = (type: 'name' | 'nim' | 'prodi' | 'fakultas' | 'kelompok' | 'angkatan' | 'kelas', value: string) => {
    if (type === 'name') {
      setMapping(prev => ({ ...prev, nameColumn: value }))
    } else if (type === 'nim') {
      setMapping(prev => ({ ...prev, nimColumn: value }))
    } else {
      setMapping(prev => ({ ...prev, additionalColumns: { ...prev.additionalColumns, [type]: value } }))
    }
  }

  const generatePreview = () => {
    if (!parsedData || !mapping.nameColumn || !mapping.nimColumn) return []
    
    return parsedData.rows.slice(0, 10).map(row => {
      const attrs: Record<string, string> = {}
      Object.entries(mapping.additionalColumns).forEach(([key, colName]) => {
        if (colName && row[colName] !== undefined) {
          attrs[key] = String(row[colName])
        }
      })
      return {
        full_name: String(row[mapping.nameColumn] || ''),
        nim: String(row[mapping.nimColumn] || ''),
        ...attrs
      }
    })
  }

  const getValidRows = () => {
    if (!parsedData || !mapping.nameColumn || !mapping.nimColumn) return []
    return parsedData.rows.filter(row => row[mapping.nameColumn] && row[mapping.nimColumn])
  }

  const handleImport = async () => {
    if (!user || !parsedData) return
    
    const validRows = getValidRows()
    if (validRows.length === 0) {
      addToast({ type: 'error', title: 'Data Kosong', message: 'Tidak ada baris data valid untuk diimpor.' })
      return
    }

    setIsProcessing(true)
    try {
      const participantsToImport = validRows.map(row => {
        const attrs: Record<string, string> = {}
        Object.entries(mapping.additionalColumns).forEach(([key, colName]) => {
          if (colName && row[colName] !== undefined) {
            attrs[key] = String(row[colName])
          }
        })
        return {
          full_name: String(row[mapping.nameColumn]),
          nim: String(row[mapping.nimColumn]),
          attributes: attrs
        }
      })

      const result = await importParticipantsBatch(sessionId, participantsToImport, user.id, file?.name || 'unknown')
      
      addToast({
        type: 'success',
        title: 'Import Selesai',
        message: `${result.successCount} peserta berhasil diimpor. ${result.skippedCount > 0 ? `${result.skippedCount} dilewati karena NIM duplikat.` : ''}`
      })
      
      onSuccess()
      handleClose()
    } catch (error: any) {
      addToast({ type: 'error', title: 'Gagal Import', message: error.message })
    } finally {
      setIsProcessing(false)
    }
  }

  const renderUploadStep = () => (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface-hover)]">
      <input 
        type="file" 
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
      <div className="p-4 bg-[var(--color-bg)] rounded-full mb-4">
        <FileUp size={32} className="text-[var(--color-accent)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Upload Data Peserta</h3>
      <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6 max-w-sm">
        Drag & drop file di sini atau klik untuk memilih file dari komputer Anda.
      </p>
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
          <FileText size={14} className="text-blue-500" /> .CSV
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
          <FileSpreadsheet size={14} className="text-[var(--color-success)]" /> .XLSX
        </div>
      </div>
      <Button onClick={() => fileInputRef.current?.click()} isLoading={isProcessing}>
        Pilih File
      </Button>
    </div>
  )

  const renderMappingStep = () => {
    if (!parsedData) return null
    const headerOptions = [
      { value: '', label: '-- Tidak Dipilih --' },
      ...parsedData.headers.map(h => ({ value: h, label: h }))
    ]

    return (
      <div className="space-y-6">
        <div className="p-4 bg-[var(--color-surface-hover)] rounded-[var(--radius-md)] border border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {file?.name.endsWith('.csv') ? <FileText className="text-[var(--color-info)]" /> : <FileSpreadsheet className="text-[var(--color-success)]" />}
            <div>
              <p className="font-medium text-[var(--color-text-primary)] text-sm">{file?.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{parsedData.rows.length} baris terdeteksi</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>Ganti File</Button>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">Kolom Wajib</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select 
              label="Kolom Nama Lengkap *" 
              value={mapping.nameColumn} 
              onChange={val => handleMappingChange('name', val)} 
              options={headerOptions} 
            />
            <Select 
              label="Kolom NIM *" 
              value={mapping.nimColumn} 
              onChange={val => handleMappingChange('nim', val)} 
              options={headerOptions} 
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">Kolom Opsional (Data Tambahan)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Prodi" value={mapping.additionalColumns.prodi} onChange={val => handleMappingChange('prodi', val)} options={headerOptions} />
            <Select label="Fakultas" value={mapping.additionalColumns.fakultas} onChange={val => handleMappingChange('fakultas', val)} options={headerOptions} />
            <Select label="Kelompok" value={mapping.additionalColumns.kelompok} onChange={val => handleMappingChange('kelompok', val)} options={headerOptions} />
            <Select label="Angkatan" value={mapping.additionalColumns.angkatan} onChange={val => handleMappingChange('angkatan', val)} options={headerOptions} />
            <div className="sm:col-span-2">
              <Select label="Kelas" value={mapping.additionalColumns.kelas} onChange={val => handleMappingChange('kelas', val)} options={headerOptions} />
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={handleClose}>Batal</Button>
          <Button 
            rightIcon={<ArrowRight size={18} />} 
            onClick={() => setStep('preview')}
            disabled={!mapping.nameColumn || !mapping.nimColumn}
          >
            Lanjut ke Preview
          </Button>
        </div>
      </div>
    )
  }

  const renderPreviewStep = () => {
    const previewData = generatePreview()
    const validRowsCount = getValidRows().length

    return (
      <div className="space-y-4">
        <div className="bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 flex items-start gap-3">
          <AlertTriangle className="text-[var(--color-warning)] shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Preview {previewData.length} baris pertama</h4>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Total ada {validRowsCount} baris valid yang akan diimpor. Baris tanpa Nama atau NIM dilewati otomatis. NIM yang sudah ada di sistem akan otomatis dilewati.</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-[var(--color-border)] rounded-[var(--radius-md)]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-2 font-medium">Nama Lengkap</th>
                <th className="px-4 py-2 font-medium">NIM</th>
                {mapping.additionalColumns.prodi && <th className="px-4 py-2 font-medium">Prodi</th>}
                {mapping.additionalColumns.kelompok && <th className="px-4 py-2 font-medium">Kelompok</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {previewData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                  <td className="px-4 py-2 font-medium">{row.full_name || '-'}</td>
                  <td className="px-4 py-2 font-[var(--font-mono)] text-[var(--color-text-secondary)]">{row.nim || '-'}</td>
                  {mapping.additionalColumns.prodi && <td className="px-4 py-2 text-[var(--color-text-secondary)]">{row.prodi || '-'}</td>}
                  {mapping.additionalColumns.kelompok && <td className="px-4 py-2 text-[var(--color-text-secondary)]">{row.kelompok || '-'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={() => setStep('mapping')} disabled={isProcessing}>
            Kembali
          </Button>
          <Button 
            rightIcon={<CheckCircle2 size={18} />} 
            onClick={handleImport}
            isLoading={isProcessing}
          >
            Import {validRowsCount} Peserta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Peserta">
      <div className="pt-2">
        {step === 'upload' && renderUploadStep()}
        {step === 'mapping' && renderMappingStep()}
        {step === 'preview' && renderPreviewStep()}
      </div>
    </Modal>
  )
}
