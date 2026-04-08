import React, { useState, useEffect, useRef } from "react";
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

  // DÜZELTME: startTime artık bileşen mount anında kaydediliyor.
  // Önceki versiyonda startTime ve elapsed aynı satır bloğunda hesaplandığından
  // fark her zaman ~0ms oluyor ve remaining her zaman tam MIN_DISPLAY oluyordu.
  // Artık Firebase ne kadar hızlı hazır olursa olsun gerçek süre hesaplanıyor.
  const mountTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!authReady) return;

    const MIN_DISPLAY = 1200;
    const elapsed     = performance.now() - mountTimeRef.current;
    const remaining   = Math.max(0, MIN_DISPLAY - elapsed);

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
