// Durasi standar (dalam detik untuk Framer Motion)
export const DURATIONS = {
  fast: 0.15,      // 150ms - fade, search results
  normal: 0.2,     // 200ms - page transition, badge status
  slow: 0.4,       // 400ms - checkmark animation, max duration
  highlight: 0.8,  // 800ms - realtime highlight fade-out
  counting: 0.5,   // 500ms - number counting animation
} as const

// Easing
export const EASINGS = {
  default: [0.4, 0, 0.2, 1],     // Material Design standard
  decelerate: [0, 0, 0.2, 1],    // Untuk masuk (fade in)
  accelerate: [0.4, 0, 1, 1],    // Untuk keluar (fade out)
} as const

// Preset variants untuk Framer Motion
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATIONS.fast, ease: EASINGS.decelerate } },
  exit: { opacity: 0, transition: { duration: DURATIONS.fast, ease: EASINGS.accelerate } },
}

export const fadeSlideIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATIONS.normal, ease: EASINGS.decelerate } },
  exit: { opacity: 0, y: -10, transition: { duration: DURATIONS.normal, ease: EASINGS.accelerate } },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: DURATIONS.normal, ease: EASINGS.decelerate } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: DURATIONS.fast, ease: EASINGS.accelerate } },
}

// Helper: cek reduced motion preference
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
