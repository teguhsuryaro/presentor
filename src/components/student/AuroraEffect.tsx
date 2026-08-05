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
    <>
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full blur-[80px]"
        style={{ background: hexToRgba(color, 0.15), top: '10%', left: '10%', willChange: 'transform' }}
        animate={{
          x: ['-20%', '20%', '-10%'],
          y: ['-10%', '15%', '-15%'],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-0 bottom-0 w-[250px] h-[250px] rounded-full blur-[60px]"
        style={{ background: hexToRgba(color, 0.1), willChange: 'transform' }}
        animate={{
          x: ['10%', '-15%', '10%'],
          y: ['10%', '-20%', '10%'],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  )
}
