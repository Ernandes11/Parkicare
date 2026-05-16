import { motion } from "framer-motion";

const PETALS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: (i * 37) % 100,
  delay: (i % 7) * 0.6,
  duration: 6 + (i % 4),
  size: 6 + (i % 4) * 3,
  color: i % 3 === 0 ? "var(--parki-coral-glow)" : i % 3 === 1 ? "var(--parki-leaf)" : "var(--parki-butter)",
}));

export function PetalParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PETALS.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full opacity-60"
          style={{
            left: `${p.left}%`,
            bottom: -20,
            width: p.size,
            height: p.size,
            background: p.color,
            filter: "blur(0.5px)",
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -700, opacity: [0, 0.7, 0], x: [0, 20, -20, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
