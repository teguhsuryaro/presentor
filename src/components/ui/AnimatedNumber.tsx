import { useEffect, useState } from 'react'
import { DURATIONS, prefersReducedMotion } from '../../lib/motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  formatFn?: (n: number) => string
}

export function AnimatedNumber({ 
  value, 
  duration = DURATIONS.counting * 1000, 
  formatFn = (n) => Math.round(n).toString() 
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayValue(value)
      return
    }

    let startTime: number | null = null
    const startValue = displayValue
    const endValue = value

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // easeOut function
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      setDisplayValue(startValue + (endValue - startValue) * easeProgress)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration]) // displayValue intentionally omitted to only trigger on target value change

  return <span>{formatFn(displayValue)}</span>
}
