import React, { useState, useEffect } from "react";
import "./styles.css";
import { AuthProvider } from "./context/AuthContext";
import { GameProvider } from "./context/GameContext";
import GameRouter from "./components/GameRouter";
import SplashScreen from "./components/SplashScreen";
import { useAuthContext } from "./context/AuthContext";

function AppInner() {
  const { authReady } = useAuthContext();
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    if (!authReady) return;

    // Firebase hazır — minimum 1.2s göster ki animasyon tamamlansın
    const MIN_DISPLAY = 1200;
    const startTime = performance.now();
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, MIN_DISPLAY - elapsed);

    const t = setTimeout(() => {
      setSplashFading(true);
      // Fade-out süresi kadar bekle (600ms) sonra kaldır
      setTimeout(() => setShowSplash(false), 650);
    }, remaining);

    return () => clearTimeout(t);
  }, [authReady]);

  return (
    <>
      <GameProvider>
        <GameRouter />
      </GameProvider>
      {showSplash && <SplashScreen fading={splashFading} />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
