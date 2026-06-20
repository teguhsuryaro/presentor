import { motion } from 'framer-motion'

export function SuccessAnimation() {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
      >
        <motion.circle
          cx="40" cy="40" r="36"
          stroke="var(--color-success)"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        <motion.path
          d="M24 42 L34 52 L56 30"
          stroke="var(--color-success)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
        />
      </motion.svg>
      <p className="text-lg font-semibold" style={{ color: 'var(--color-success)' }}>
        Presensi berhasil dicatat!
      </p>
    </div>
  )
}
