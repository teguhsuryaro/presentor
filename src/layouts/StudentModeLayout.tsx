import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

export function StudentModeLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-4 py-8"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
