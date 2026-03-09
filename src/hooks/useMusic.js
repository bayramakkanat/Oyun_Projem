import { useEffect, useRef } from "react";
const menuMusic = "/sounds/menu-music.mp3";
const shopMusic = "/sounds/shop-music.mp3";
const battleMusic = "/sounds/battle-music.mp3";

export function useMusic({ soundEnabled, phase, gameStarted }) {
  const menuMusicRef = useRef(null);
  const shopMusicRef = useRef(null);
  const battleMusicRef = useRef(null);

   // Menu müziği başlat
  useEffect(() => {
    const audio = new Audio(menuMusic);
    audio.loop = true;
    audio.volume = 0.4;
    menuMusicRef.current = audio;
    if (soundEnabled && !gameStarted) {
      const playOnInteraction = () => {
        audio.play().catch(() => {});
        document.removeEventListener('click', playOnInteraction);
      };
      document.addEventListener('click', playOnInteraction);
    }
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // Ses açma/kapama
  useEffect(() => {
    if (!menuMusicRef.current) return;
    if (soundEnabled) {
      if (!gameStarted) menuMusicRef.current.play().catch(() => {});
      if (phase === "shop" && gameStarted && shopMusicRef.current)
        shopMusicRef.current.play().catch(() => {});
      if (phase === "battle" && gameStarted && battleMusicRef.current)
        battleMusicRef.current.play().catch(() => {});
    } else {
      menuMusicRef.current.pause();
      if (shopMusicRef.current) shopMusicRef.current.pause();
      if (battleMusicRef.current) battleMusicRef.current.pause();
    }
  }, [soundEnabled]);

  // Shop müziği başlat
  useEffect(() => {
    const audio = new Audio(shopMusic);
    audio.loop = true;
    audio.volume = 0.4;
    shopMusicRef.current = audio;
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // Shop/menu müzik geçişi
  useEffect(() => {
    if (!shopMusicRef.current || !menuMusicRef.current) return;
    if (phase === "shop" && gameStarted) {
      menuMusicRef.current.pause();
      if (soundEnabled) shopMusicRef.current.play().catch(() => {});
    } else {
      shopMusicRef.current.pause();
      if (soundEnabled && !gameStarted)
        menuMusicRef.current.play().catch(() => {});
    }
  }, [phase, gameStarted, soundEnabled]);

  // Battle müziği başlat
  useEffect(() => {
    const music = new Audio(battleMusic);
    music.loop = true;
    music.volume = 0.4;
    battleMusicRef.current = music;
    return () => {
      music.pause();
    };
  }, []);

   // Battle müzik geçişi
  useEffect(() => {
    if (!battleMusicRef.current) return;
    if (phase === "battle") {
      if (menuMusicRef.current) menuMusicRef.current.pause();
      if (shopMusicRef.current) shopMusicRef.current.pause();
      if (soundEnabled) {
        const playBattleMusic = () => {
          battleMusicRef.current.currentTime = 0;
          battleMusicRef.current.play().catch(() => {});
          document.removeEventListener('click', playBattleMusic);
        };
        document.addEventListener('click', playBattleMusic);
      }
    } else {
      battleMusicRef.current.pause();
      battleMusicRef.current.currentTime = 0;
    }
  }, [phase, soundEnabled]);
}