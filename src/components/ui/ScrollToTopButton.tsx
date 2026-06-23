import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container')
    if (!scrollContainer) return

    const handleScroll = () => {
      // Tampilkan tombol jika scroll > 300px
      if (scrollContainer.scrollTop > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    const scrollContainer = document.getElementById('main-scroll-container')
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-50 p-3 bg-[var(--color-accent)] text-white rounded-full shadow-[var(--shadow-card-hover)] hover:bg-[var(--color-accent-hover)] hover:scale-105 transition-all focus:outline-none"
          aria-label="Kembali ke atas"
        >
          <ArrowUp size={24} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
