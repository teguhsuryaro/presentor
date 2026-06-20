import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { fadeSlideIn, prefersReducedMotion } from '../../lib/motion'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const isReducedMotion = prefersReducedMotion()

  if (isReducedMotion) {
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={fadeSlideIn}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
