import { useEffect, useRef } from 'react'

interface AuroraEffectProps {
  color: string
}

export function AuroraEffect({ color }: AuroraEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    // Default color if parsing fails
    let r = 109, g = 40, b = 217 
    if (color.startsWith('#') && color.length === 7) {
      r = parseInt(color.slice(1, 3), 16)
      g = parseInt(color.slice(3, 5), 16)
      b = parseInt(color.slice(5, 7), 16)
    }

    const particlesX = 60
    const particlesZ = 40
    const spacing = 45
    const fov = 700

    const render = () => {
      time += 0.015
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const cx = canvas.width / 2
      const cy = canvas.height / 2 + 100 // offset camera height

      // Draw large radial glow in background
      const gradient = ctx.createRadialGradient(cx, cy - 100, 0, cx, cy - 100, canvas.width * 0.8)
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let z = 0; z < particlesZ; z++) {
        for (let x = 0; x < particlesX; x++) {
          const px = (x - particlesX / 2) * spacing
          const pz = z * spacing + 150

          // Calculate multi-wave interference
          const py1 = Math.sin(x * 0.15 + time) * 60 + Math.cos(z * 0.15 + time * 0.8) * 60 + Math.sin(x * 0.05 + z * 0.05 - time) * 40
          
          const scale1 = fov / pz
          const sx1 = cx + px * scale1
          const sy1 = cy + py1 * scale1

          const alpha = Math.max(0, 1 - (z / particlesZ)) * 0.9

          // Draw particle
          ctx.beginPath()
          ctx.arc(sx1, sy1, 1.5 * scale1, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
          ctx.fill()

          // Connect to next X
          if (x < particlesX - 1) {
            const px2 = (x + 1 - particlesX / 2) * spacing
            const py2 = Math.sin((x + 1) * 0.15 + time) * 60 + Math.cos(z * 0.15 + time * 0.8) * 60 + Math.sin((x + 1) * 0.05 + z * 0.05 - time) * 40
            const scale2 = fov / pz
            const sx2 = cx + px2 * scale2
            const sy2 = cy + py2 * scale2

            ctx.beginPath()
            ctx.moveTo(sx1, sy1)
            ctx.lineTo(sx2, sy2)
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.25})`
            ctx.lineWidth = 1 * scale1
            ctx.stroke()
          }

          // Connect to next Z
          if (z < particlesZ - 1) {
            const pz3 = (z + 1) * spacing + 150
            const py3 = Math.sin(x * 0.15 + time) * 60 + Math.cos((z + 1) * 0.15 + time * 0.8) * 60 + Math.sin(x * 0.05 + (z + 1) * 0.05 - time) * 40
            const scale3 = fov / pz3
            const sx3 = cx + px * scale3
            const sy3 = cy + py3 * scale3

            ctx.beginPath()
            ctx.moveTo(sx1, sy1)
            ctx.lineTo(sx3, sy3)
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.25})`
            ctx.lineWidth = 1 * scale1
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [color])

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none mix-blend-screen opacity-80"
      style={{ zIndex: 0 }}
    />
  )
}
