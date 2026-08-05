import { motion } from 'framer-motion'

interface AuroraEffectProps {
  color: string  // Warna dasar aurora (hex, misal '#6D28D9')
}

export function AuroraEffect({ color }: AuroraEffectProps) {
  // Konversi hex ke rgba dengan opacity rendah
  const hexToRgba = (hex: string, alpha: number) => {
    // Basic hex parsing, assumes 7 chars e.g. #6D28D9
    if (hex.startsWith('#') && hex.length === 7) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    // Fallback if not standard hex
    return color
  }
  
  return (
    <div className="absolute inset-0 overflow-hidden w-full h-full pointer-events-none">
      {/* Top Left Blob */}
      <motion.div
        className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full blur-[100px]"
        style={{ background: hexToRgba(color, 0.25), top: '-10%', left: '-10%', willChange: 'transform' }}
        animate={{
          x: ['0%', '15%', '-5%', '0%'],
          y: ['0%', '10%', '-10%', '0%'],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Bottom Right Blob */}
      <motion.div
        className="absolute w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full blur-[90px]"
        style={{ background: hexToRgba(color, 0.2), bottom: '-15%', right: '-5%', willChange: 'transform' }}
        animate={{
          x: ['0%', '-15%', '10%', '0%'],
          y: ['0%', '-20%', '5%', '0%'],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Center Blob */}
      <motion.div
        className="absolute w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full blur-[120px]"
        style={{ background: hexToRgba(color, 0.15), top: '20%', left: '30%', willChange: 'transform' }}
        animate={{
          x: ['0%', '10%', '-15%', '0%'],
          y: ['0%', '-10%', '15%', '0%'],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
