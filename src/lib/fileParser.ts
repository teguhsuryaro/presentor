import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { ColumnMapping } from '../types'

export interface ParsedFile {
  headers: string[]
  rows: Record<string, string>[]
}

export async function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('PapaParse warnings:', results.errors)
        }
        
        // Extract headers from meta or from first row keys if meta fails
        let headers = results.meta.fields || []
        if (headers.length === 0 && results.data.length > 0) {
          headers = Object.keys(results.data[0] as object)
        }

        resolve({
          headers,
          rows: results.data as Record<string, string>[]
        })
      },
      error: (error: Error) => {
        reject(error)
      }
    })
  })
}

export async function parseExcel(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to JSON with headers
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, string>[]
        
        let headers: string[] = []
        if (rows.length > 0) {
          headers = Object.keys(rows[0])
        }

        resolve({ headers, rows })
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = (error) => reject(error)
    reader.readAsBinaryString(file)
  })
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  let nameColumn = ''
  let nimColumn = ''

  for (const header of headers) {
    const lowerHeader = header.toLowerCase().trim()
    if (!nameColumn && (lowerHeader === 'nama' || lowerHeader === 'name' || lowerHeader === 'nama lengkap')) {
      nameColumn = header
    }
    if (!nimColumn && (lowerHeader === 'nim' || lowerHeader === 'nrp' || lowerHeader === 'npm' || lowerHeader === 'id mahasiswa' || lowerHeader === 'student id')) {
      nimColumn = header
    }
  }

  return {
    nameColumn,
    nimColumn,
    additionalColumns: {}
  }
}
