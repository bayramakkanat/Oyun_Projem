import { useEffect, useRef } from "react";

const menuMusic   = "/sounds/menu-music.mp3";
const shopMusic   = "/sounds/shop-music.mp3";
const battleMusic = "/sounds/battle-music.mp3";

// Müziği çalmayı dene; tarayıcı autoplay politikası engellerse
// ilk kullanıcı etkileşiminde (click/touch) tekrar dene.
const tryPlay = (audio, label) => {
  if (!audio) return;
  audio.play().catch(() => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[useMusic] "${label}" autoplay engellendi, jest bekleniyor...`);
    }
    // İlk kullanıcı etkileşiminde bir kez daha dene
    const retry = () => {
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    };
    document.addEventListener("click",    retry, { once: true });
    document.addEventListener("touchend", retry, { once: true });
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
