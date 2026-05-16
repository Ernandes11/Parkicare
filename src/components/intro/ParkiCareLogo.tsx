import { motion } from "framer-motion";

export function ParkiCareLogo({ showText = true }: { showText?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="110" height="120" viewBox="0 0 110 120" fill="none">
        {/* Stem */}
        <motion.path
          d="M55 70 L55 95"
          stroke="var(--parki-leaf-deep)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        />
        {/* Left leaf */}
        <motion.path
          d="M55 92 C 30 92, 18 78, 18 60 C 38 60, 52 75, 55 92 Z"
          fill="var(--parki-leaf)"
          initial={{ scale: 0, originX: "55px", originY: "92px" }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 120, delay: 0.15 }}
        />
        {/* Right leaf */}
        <motion.path
          d="M55 92 C 80 92, 92 78, 92 60 C 72 60, 58 75, 55 92 Z"
          fill="var(--parki-leaf)"
          initial={{ scale: 0, originX: "55px", originY: "92px" }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 120, delay: 0.25 }}
        />
        {/* Tulip petals */}
        <motion.path
          d="M40 50 C 40 30, 55 18, 55 18 L55 60 Z"
          fill="var(--parki-coral)"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.4 }}
        />
        <motion.path
          d="M70 50 C 70 30, 55 18, 55 18 L55 60 Z"
          fill="var(--parki-coral-glow)"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.5 }}
        />
        <motion.ellipse
          cx="55" cy="40" rx="13" ry="22"
          fill="var(--parki-coral)"
          initial={{ scaleY: 0, originX: "55px", originY: "60px" }}
          animate={{ scaleY: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 140, delay: 0.6 }}
        />
      </svg>

      {showText && (
        <motion.h1
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
        >
          <span style={{ color: "var(--parki-coral)" }}>Parki</span>
          <span style={{ color: "var(--parki-leaf-deep)" }}>Care</span>
        </motion.h1>
      )}
    </div>
  );
}
