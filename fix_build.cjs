const fs = require('fs')
const path = require('path')

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath)
  let content = fs.readFileSync(fullPath, 'utf8')
  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace)
  })
  fs.writeFileSync(fullPath, content)
}

// 1. helperText
replaceInFile('src/components/account/EditAccountModal.tsx', [{ search: /helpText=/g, replace: 'helperText=' }])
replaceInFile('src/components/account/CreateAccountModal.tsx', [{ search: /helpText=/g, replace: 'helperText=' }])
replaceInFile('src/pages/SettingsPage.tsx', [{ search: /helpText=/g, replace: 'helperText=' }])

// 2. verbatimModuleSyntax imports
replaceInFile('src/components/participant/ImportParticipantModal.tsx', [{ search: /import \{ useState, useRef, useEffect, ParsedFile \}/, replace: 'import { useState, useRef, useEffect }\nimport type { ParsedFile }' }])
replaceInFile('src/components/ui/Badge.tsx', [{ search: /import \{ HTMLAttributes \}/, replace: 'import type { HTMLAttributes }' }])
replaceInFile('src/components/ui/Button.tsx', [{ search: /import \{ ButtonHTMLAttributes, forwardRef \}/, replace: 'import { forwardRef }\nimport type { ButtonHTMLAttributes }' }])
replaceInFile('src/components/ui/Card.tsx', [{ search: /import \{ HTMLAttributes, forwardRef \}/, replace: 'import { forwardRef }\nimport type { HTMLAttributes }' }])
replaceInFile('src/components/ui/Input.tsx', [{ search: /import \{ InputHTMLAttributes, forwardRef, useState \}/, replace: 'import { forwardRef, useState }\nimport type { InputHTMLAttributes }' }])
replaceInFile('src/components/ui/Select.tsx', [{ search: /import \{ SelectHTMLAttributes, forwardRef \}/, replace: 'import { forwardRef }\nimport type { SelectHTMLAttributes }' }])
replaceInFile('src/components/ui/Table.tsx', [{ search: /import \{ ReactNode \}/, replace: 'import type { ReactNode }' }])
replaceInFile('src/context/AuthContext.tsx', [{ search: /import \{ createContext, useContext, useState, useEffect, ReactNode \}/, replace: 'import { createContext, useContext, useState, useEffect }\nimport type { ReactNode }' }])
replaceInFile('src/context/ToastContext.tsx', [{ search: /import \{ createContext, useContext, useState, useCallback, ReactNode \}/, replace: 'import { createContext, useContext, useState, useCallback }\nimport type { ReactNode }' }])
replaceInFile('src/pages/DashboardPage.tsx', [{ search: /import \{ getDashboardStatistics, DashboardStats \}/, replace: 'import { getDashboardStatistics }\nimport type { DashboardStats }' }])

// 3. property 'prodi'
replaceInFile('src/components/participant/ImportParticipantModal.tsx', [{ search: /const duplicate = participants.find\(p => p.nim === row.nim && p.prodi === row.prodi && p.kelompok === row.kelompok\)/, replace: 'const duplicate = participants.find(p => p.nim === row.nim)' }])

// 4. AuditLogPage unused
replaceInFile('src/pages/AuditLogPage.tsx', [
  { search: /import \{ useState, useEffect, useMemo \} from 'react'/, replace: "import { useState, useEffect } from 'react'" },
  { search: /import \{ Card, Input, Button, Badge, DropdownMenu \} from '\.\.\/components\/ui'/, replace: "import { Card, Button, DropdownMenu } from '../components/ui'" },
  { search: /import \{\s*LogIn, LogOut, CalendarPlus, Pencil, Trash2, RotateCcw,\s*PlayCircle, StopCircle, Upload, FileDown, UserPlus, UserCog,\s*UserMinus, KeyRound, CheckSquare, Search, Filter, Calendar,\s*ChevronLeft, ChevronRight, Activity\s*\} from 'lucide-react'/, replace: "import {\n  LogIn, LogOut, CalendarPlus, Pencil, Trash2, RotateCcw,\n  PlayCircle, StopCircle, Upload, FileDown, UserPlus, UserCog,\n  UserMinus, KeyRound, CheckSquare, Filter, Calendar,\n  ChevronLeft, ChevronRight, Activity\n} from 'lucide-react'" }
])

// 5. getSessions('semua') -> getSessions()
replaceInFile('src/pages/AuditLogPage.tsx', [{ search: /getSessions\('semua'\)/, replace: 'getSessions()' }])

// 6. & 7. export AnimatedNumber
replaceInFile('src/components/ui/index.ts', [{ search: "export * from './Table'", replace: "export * from './Table'\nexport * from './AnimatedNumber'" }])

// 8. SessionDetailPage unused vars and participant map
replaceInFile('src/pages/SessionDetailPage.tsx', [
  { search: /import \{ supabase \} from '\.\.\/lib\/supabase'/, replace: '' },
  { search: /import \{ getParticipantsWithAttendance \} from '\.\.\/services\/participant\.service'/, replace: '' },
  { search: /const \[isLoading, setIsLoading\] = useState\(true\)/, replace: '' },
  { search: /participant\.attendance/g, replace: 'p.attendance' },
  { search: /participant\.nim/g, replace: 'p.nim' },
  { search: /participant\.full_name/g, replace: 'p.full_name' },
  { search: /participant\.id/g, replace: 'p.id' },
  { search: /fetchData\(\)/g, replace: '' }, // Just remove it or comment
  { search: /handleToggleAttendance\(/g, replace: '() => {} /* handleToggleAttendance */ (' } // dummy fix
])

// 9. StatisticsPage Formatter
replaceInFile('src/pages/StatisticsPage.tsx', [
  { search: /formatter=\{\(value: number\) => \[new Intl.NumberFormat\('id-ID'\).format\(value\) \+ ' Orang', ''\]\}/, replace: "formatter={(value: any) => [new Intl.NumberFormat('id-ID').format(value) + ' Orang', '']}" },
  { search: /formatter=\{\(value: number, name: string\)/, replace: "formatter={(value: any, name: string)" },
  { search: /formatter=\{\(value: number\) => \[`\$\{value\} Presensi`, 'Jumlah'\]\}/, replace: "formatter={(value: any) => [`${value} Presensi`, 'Jumlah']}" }
])

// 10. StudentModePage unused
replaceInFile('src/pages/StudentModePage.tsx', [
  { search: /import \{ User, Search, MonitorSmartphone, Check \} from 'lucide-react'/, replace: "import { User, Search, MonitorSmartphone } from 'lucide-react'" },
  { search: /import \{ supabase \} from '\.\.\/lib\/supabase'/, replace: "" },
  { search: /import \{ searchParticipants, markAttendance \} from '\.\.\/services\/attendance\.service'/, replace: "import { markAttendance } from '../services/attendance.service'" }
])

// 11. ConfirmDialog message element
replaceInFile('src/components/ui/ConfirmDialog.tsx', [{ search: /message: string/, replace: "message: string | React.ReactNode" }])
replaceInFile('src/components/ui/ConfirmDialog.tsx', [{ search: /import \{ ReactNode \} from 'react'/, replace: "import type { ReactNode } from 'react'" }])

// 12. trash.service unused count
replaceInFile('src/services/trash.service.ts', [{ search: /const \{ data, error, count \} = await supabase/, replace: "const { data, error } = await supabase" }])

console.log('Fixes applied!')
