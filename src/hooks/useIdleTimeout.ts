import { useEffect, useRef, useState } from 'react'

interface UseIdleTimeoutOptions {
  timeoutMinutes?: number
  warningMinutes?: number
  onTimeout: () => void
  onActivity?: () => void
}

export function useIdleTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onTimeout,
  onActivity
}: UseIdleTimeoutOptions) {
  const [isIdle, setIsIdle] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  
  const timeoutMs = timeoutMinutes * 60 * 1000
  const warningMs = warningMinutes * 60 * 1000
  const warningThreshold = timeoutMs - warningMs
  
  const lastActivity = useRef<number>(Date.now())
  const lastReportedActivity = useRef<number>(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = () => {
    const now = Date.now()
    lastActivity.current = now
    
    if (isIdle) setIsIdle(false)
    if (showWarning) setShowWarning(false)

    // Throttle the onActivity callback (max 1x per menit)
    if (now - lastReportedActivity.current > 60000) {
      lastReportedActivity.current = now
      if (onActivity) onActivity()
    }

    checkIdleStatus()
  }

  const checkIdleStatus = () => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const now = Date.now()
    const elapsed = now - lastActivity.current
    const remainingToWarning = warningThreshold - elapsed
    const remainingToTimeout = timeoutMs - elapsed

    if (elapsed >= timeoutMs) {
      onTimeout()
    } else if (elapsed >= warningThreshold) {
      setShowWarning(true)
      timerRef.current = setTimeout(checkIdleStatus, remainingToTimeout)
    } else {
      timerRef.current = setTimeout(checkIdleStatus, remainingToWarning)
    }
  }

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    const handleEvent = () => resetTimer()

    events.forEach(event => document.addEventListener(event, handleEvent, { passive: true }))
    checkIdleStatus()

    return () => {
      events.forEach(event => document.removeEventListener(event, handleEvent))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeoutMs, warningThreshold])

  return { isIdle, showWarning, resetTimer }
}
