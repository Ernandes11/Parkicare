import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { IntroSequence } from "@/components/intro/IntroSequence";
import { PetalParticles } from "@/components/intro/PetalParticles";
import { WelcomeCard } from "@/components/WelcomeCard";
import { useIntroSeen } from "@/hooks/useIntroSeen";
import { AnimatePresence, motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { hasSeenIntro, setSeen } = useIntroSeen();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  // If already seen, go straight to welcome
  useEffect(() => {
    if (hasSeenIntro === true) {
      setShowWelcome(true);
      setIsSkipped(true);
    }
  }, [hasSeenIntro]);

  const handleIntroDone = () => {
    setSeen();
    setShowWelcome(true);
  };

  const handleSkip = () => {
    setSeen();
    setShowWelcome(true);
    setIsSkipped(true);
  };

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-40" 
          style={{ background: "var(--gradient-bloom)" }}
        />
        <PetalParticles />
      </div>

      <AnimatePresence mode="wait">
        {!showWelcome ? (
          <motion.div
            key="intro"
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="z-10 flex flex-col items-center"
          >
            <button
              onClick={handleSkip}
              className="absolute top-8 right-8 z-20 text-sm font-medium text-foreground/40 transition-colors hover:text-foreground"
            >
              Pular
            </button>
            <IntroSequence onDone={handleIntroDone} />
          </motion.div>
        ) : (
          <WelcomeCard key="welcome" />
        )}
      </AnimatePresence>
    </main>
  );
}
