const fs = require('fs')
const path = require('path')

function appendToFile(filePath, content) {
  const fullPath = path.join(__dirname, filePath)
  fs.appendFileSync(fullPath, '\n' + content)
}

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath)
  let content = fs.readFileSync(fullPath, 'utf8')
  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace)
  })
  fs.writeFileSync(fullPath, content)
}

// 1. DashboardStats import in DashboardPage
replaceInFile('src/pages/DashboardPage.tsx', [
  { search: /DashboardStats, /, replace: '' }
])
// Add it from statistics.service
const dashboardPagePath = path.join(__dirname, 'src/pages/DashboardPage.tsx')
let dashboardContent = fs.readFileSync(dashboardPagePath, 'utf8')
if (!dashboardContent.includes('import type { DashboardStats }')) {
  dashboardContent = "import type { DashboardStats } from '../services/statistics.service'\n" + dashboardContent
  fs.writeFileSync(dashboardPagePath, dashboardContent)
}

// 2. AnimatedNumber export
const uiIndexPath = path.join(__dirname, 'src/components/ui/index.ts')
let uiIndexContent = fs.readFileSync(uiIndexPath, 'utf8')
if (!uiIndexContent.includes('AnimatedNumber')) {
  fs.appendFileSync(uiIndexPath, "\nexport { AnimatedNumber } from './AnimatedNumber'\n")
}

// 3. ParsedFile in ImportParticipantModal
replaceInFile('src/components/participant/ImportParticipantModal.tsx', [
  { search: /import type \{ ParsedFile \}/, replace: "import type { ParsedFile } from '../../lib/fileParser'" },
  { search: /import \{ useState, useRef, useEffect \}\nimport type \{ ParsedFile \} from '\.\.\/\.\.\/lib\/fileParser'/, replace: "import { useState, useRef, useEffect } from 'react'\nimport type { ParsedFile } from '../../lib/fileParser'" }
])

console.log('Fixes applied 3!')
