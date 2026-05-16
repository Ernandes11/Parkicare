import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const STEPS = [
  { text: "Tudo começa pequeno…", duration: 1500 },
  { text: "…com cuidado, floresce.", duration: 1700 },
  { text: "Um jardim de bem-estar.", duration: 1500 },
];

export function IntroSequence({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length) {
      const t = setTimeout(onDone, 200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEPS[step].duration);
    return () => clearTimeout(t);
  }, [step, onDone]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
      <div className="relative flex h-48 w-48 items-center justify-center">
        {/* Seed */}
        <AnimatePresence>
          {step === 0 && (
            <motion.div
              key="seed"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="h-5 w-5 rounded-full"
              style={{
                background: "var(--parki-coral)",
                boxShadow: "0 0 40px 8px oklch(0.66 0.22 32 / 0.6)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Sprout */}
        <AnimatePresence>
          {step === 1 && (
            <motion.svg
              key="sprout"
              width="160" height="160" viewBox="0 0 160 160"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
            >
              <motion.path
                d="M80 140 L80 70"
                stroke="var(--parki-leaf-deep)" strokeWidth="5" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7 }}
              />
              <motion.path
                d="M80 95 C 45 95, 32 75, 32 55 C 60 55, 78 78, 80 95 Z"
                fill="var(--parki-leaf)"
                initial={{ scale: 0, originX: "80px", originY: "95px" }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 11, stiffness: 130, delay: 0.4 }}
              />
              <motion.path
                d="M80 95 C 115 95, 128 75, 128 55 C 100 55, 82 78, 80 95 Z"
                fill="var(--parki-leaf)"
                initial={{ scale: 0, originX: "80px", originY: "95px" }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 11, stiffness: 130, delay: 0.55 }}
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Bloom */}
        <AnimatePresence>
          {step === 2 && (
            <motion.svg
              key="bloom"
              width="180" height="180" viewBox="0 0 180 180"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
            >
              <motion.path
                d="M90 160 L90 90"
                stroke="var(--parki-leaf-deep)" strokeWidth="5" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
              <motion.path
                d="M90 115 C 55 115, 42 95, 42 75 C 70 75, 88 98, 90 115 Z"
                fill="var(--parki-leaf)"
                initial={{ scale: 0, originX: "90px", originY: "115px" }}
                animate={{ scale: 1 }} transition={{ type: "spring", damping: 11, delay: 0.2 }}
              />
              <motion.path
                d="M90 115 C 125 115, 138 95, 138 75 C 110 75, 92 98, 90 115 Z"
                fill="var(--parki-leaf)"
                initial={{ scale: 0, originX: "90px", originY: "115px" }}
                animate={{ scale: 1 }} transition={{ type: "spring", damping: 11, delay: 0.3 }}
              />
              {/* petals open */}
              {[-25, -10, 10, 25].map((angle, i) => (
                <motion.ellipse
                  key={i}
                  cx="90" cy="55" rx="12" ry="28"
                  fill={i % 2 === 0 ? "var(--parki-coral)" : "var(--parki-coral-glow)"}
                  initial={{ rotate: 0, scaleY: 0, originX: "90px", originY: "85px" }}
                  animate={{ rotate: angle, scaleY: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 150, delay: 0.45 + i * 0.1 }}
                />
              ))}
              <motion.circle
                cx="90" cy="60" r="10" fill="var(--parki-butter)"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, delay: 0.9 }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          className="mt-8 text-center text-lg font-medium"
          style={{ color: "var(--parki-leaf-deep)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          {STEPS[step]?.text ?? ""}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
