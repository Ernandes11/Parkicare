import { motion } from "framer-motion";
import { ParkiCareLogo } from "./intro/ParkiCareLogo";
import { Link } from "@tanstack/react-router";

export function WelcomeCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="relative z-10 w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white/40 p-8 shadow-2xl backdrop-blur-xl border border-white/50"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 scale-90">
          <ParkiCareLogo showText={false} />
        </div>

        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
          <span style={{ color: "var(--parki-coral)" }}>Parki</span>
          <span style={{ color: "var(--parki-leaf-deep)" }}>Care</span>
        </h1>

        <h2 className="mb-2 text-xl font-semibold text-foreground/90">
          Bem-vindo!
        </h2>
        <p className="mb-10 text-balance text-sm leading-relaxed text-foreground/70">
          Pequenos passos, grandes cuidados. O seu companheiro diário na jornada do bem-estar.
        </p>

        <div className="flex w-full flex-col gap-4">
          <Link
            to="/login"
            className="flex h-14 items-center justify-center rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95"
            style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-petal)" }}
          >
            Seguir
          </Link>
          
          <Link
            to="/login"
            className="flex h-12 items-center justify-center rounded-2xl font-semibold text-foreground/60 transition-colors hover:text-foreground active:scale-95"
          >
            Já tenho uma conta
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
