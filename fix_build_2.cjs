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

replaceInFile('src/components/ui/Button.tsx', [{ search: "import { forwardRef }\nimport type { ButtonHTMLAttributes } from 'react'", replace: "import { forwardRef } from 'react'\nimport type { ButtonHTMLAttributes } from 'react'" }])
replaceInFile('src/components/ui/Card.tsx', [{ search: "import { forwardRef }\nimport type { HTMLAttributes } from 'react'", replace: "import { forwardRef } from 'react'\nimport type { HTMLAttributes } from 'react'" }])
replaceInFile('src/components/ui/Input.tsx', [{ search: "import { forwardRef, useState }\nimport type { InputHTMLAttributes } from 'react'", replace: "import { forwardRef, useState } from 'react'\nimport type { InputHTMLAttributes } from 'react'" }])
replaceInFile('src/components/ui/Select.tsx', [{ search: "import { forwardRef }\nimport type { SelectHTMLAttributes } from 'react'", replace: "import { forwardRef } from 'react'\nimport type { SelectHTMLAttributes } from 'react'" }])
replaceInFile('src/context/ToastContext.tsx', [{ search: "import { createContext, useContext, useState, useCallback }\nimport type { ReactNode } from 'react'", replace: "import { createContext, useContext, useState, useCallback } from 'react'\nimport type { ReactNode } from 'react'" }])

replaceInFile('src/pages/SessionDetailPage.tsx', [{ search: "() => {} /* handleToggleAttendance */ (", replace: "(() => {})(" }])

console.log('Fixes applied 2!')
