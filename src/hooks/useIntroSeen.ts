import { useState, useEffect } from "react";

export function useIntroSeen() {
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem("parkicare_intro_seen");
    setHasSeenIntro(seen === "true");
  }, []);

  const setSeen = () => {
    localStorage.setItem("parkicare_intro_seen", "true");
    setHasSeenIntro(true);
  };

  return { hasSeenIntro, setSeen };
}
