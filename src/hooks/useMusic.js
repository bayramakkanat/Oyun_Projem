import { useEffect, useRef } from "react";

const menuMusic   = "/sounds/menu-music.mp3";
const shopMusic   = "/sounds/shop-music.mp3";
const battleMusic = "/sounds/battle-music.mp3";

// Müzik çalmayı dene; tarayıcı izin vermezse (autoplay policy) sessizce devam et.
// Hata production'da logError ile yakalanıyor, geliştirme ortamında console'a düşüyor.
const tryPlay = (audio, label) => {
  if (!audio) return;
  audio.play().catch((err) => {
    // Autoplay engellemesi sık karşılaşılan durum — sessizce yutma, geliştirme ortamında logla
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[useMusic] "${label}" çalınamadı:`, err.message);
    }
  });
};

export function useMusic({ soundEnabled, phase, gameStarted }) {
  const menuRef   = useRef(null);
  const shopRef   = useRef(null);
  const battleRef = useRef(null);

  // ─── Müzik nesnelerini bir kez oluştur ────────────────────────────────────
  useEffect(() => {
    const menu   = new Audio(menuMusic);
    const shop   = new Audio(shopMusic);
    const battle = new Audio(battleMusic);

    menu.loop   = true; menu.volume   = 0.4;
    shop.loop   = true; shop.volume   = 0.4;
    battle.loop = true; battle.volume = 0.4;

    menuRef.current   = menu;
    shopRef.current   = shop;
    battleRef.current = battle;

    return () => {
      menu.pause();   menu.src   = "";
      shop.pause();   shop.src   = "";
      battle.pause(); battle.src = "";
    };
  }, []);

  // ─── Müzik geçişlerini yönet ──────────────────────────────────────────────
  useEffect(() => {
    const menu   = menuRef.current;
    const shop   = shopRef.current;
    const battle = battleRef.current;
    if (!menu || !shop || !battle) return;

    if (!soundEnabled) {
      menu.pause();
      shop.pause();
      battle.pause();
      return;
    }

    if (!gameStarted) {
      shop.pause();
      battle.pause();
      if (menu.paused) tryPlay(menu, "menu");

    } else if (phase === "battle") {
      menu.pause();
      shop.pause();
      if (battle.paused) {
        battle.currentTime = 0;
        tryPlay(battle, "battle");
      }

    } else if (phase === "shop") {
      menu.pause();
      battle.pause();
      if (shop.paused) tryPlay(shop, "shop");
    }
  }, [soundEnabled, phase, gameStarted]);
}
