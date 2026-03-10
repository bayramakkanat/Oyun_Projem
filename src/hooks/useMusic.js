import { useEffect, useRef } from "react";
const menuMusic = "/sounds/menu-music.mp3";
const shopMusic = "/sounds/shop-music.mp3";
const battleMusic = "/sounds/battle-music.mp3";

export function useMusic({ soundEnabled, phase, gameStarted }) {
  const menuMusicRef = useRef(null);
  const shopMusicRef = useRef(null);
  const battleMusicRef = useRef(null);

  // Müzik nesnelerini bir kez oluştur
  useEffect(() => {
    const menu = new Audio(menuMusic);
    menu.loop = true;
    menu.volume = 0.4;
    menuMusicRef.current = menu;

    const shop = new Audio(shopMusic);
    shop.loop = true;
    shop.volume = 0.4;
    shopMusicRef.current = shop;

    const battle = new Audio(battleMusic);
    battle.loop = true;
    battle.volume = 0.4;
    battleMusicRef.current = battle;

    return () => {
      menu.pause();
      shop.pause();
      battle.pause();
    };
  }, []);

  // Müzik geçişlerini yönet
  useEffect(() => {
    const menu = menuMusicRef.current;
    const shop = shopMusicRef.current;
    const battle = battleMusicRef.current;
    if (!menu || !shop || !battle) return;

    menu.pause();
    shop.pause();
    battle.pause();

    if (!soundEnabled) return;

    if (!gameStarted) {
      menu.play().catch(() => {});
    } else if (phase === "battle") {
      battle.currentTime = 0;
      battle.play().catch(() => {});
    } else if (phase === "shop") {
      shop.play().catch(() => {});
    }
  }, [soundEnabled, phase, gameStarted]);
}