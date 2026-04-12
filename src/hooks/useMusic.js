import { useEffect, useRef } from "react";

const menuMusic   = "/sounds/menu-music.mp3";
const shopMusic   = "/sounds/shop-music.mp3";
const battleMusic = "/sounds/battle-music.mp3";

const tryPlay = (audio, label, intendedAudioRef) => {
  if (!audio) return;
  
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      // Yalnızca autoplay engellendiyse (NotAllowedError) etkileşim bekle.
      // AbortError genellikle play() çağrısının hemen ardına pause() gelirse oluşur.
      if (err.name === 'NotAllowedError') {
        const events = ["click", "touchstart", "keydown", "pointerdown"];
        const retry = () => {
          events.forEach((e) => document.removeEventListener(e, retry));
          // Eğer bu ses artık o anki çalınması gereken ses değilse, çalma!
          if (intendedAudioRef && intendedAudioRef.current !== audio) return;
          if (!audio.paused) return; // zaten çalıyorsa dokunma
          audio.play().catch(e => console.error(`[useMusic] Retry failed for ${label}:`, e));
        };
        events.forEach((e) => document.addEventListener(e, retry, { once: true }));
      } else if (err.name !== 'AbortError') {
        console.error(`[useMusic] Error playing ${label}:`, err);
      }
    });
  }
};

export function useMusic({ soundEnabled, phase, gameStarted }) {
  const menuRef   = useRef(null);
  const shopRef   = useRef(null);
  const battleRef = useRef(null);
  const intendedAudioRef = useRef(null);

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
      intendedAudioRef.current = null;
      menu.pause();
      shop.pause();
      battle.pause();
      return;
    }

    if (!gameStarted) {
      intendedAudioRef.current = menu;
      shop.pause();
      battle.pause();
      if (menu.paused) {
        menu.currentTime = 0;
        tryPlay(menu, "menu", intendedAudioRef);
      }

    } else if (phase === "battle") {
      intendedAudioRef.current = battle;
      menu.pause();
      shop.pause();
      if (battle.paused) {
        battle.currentTime = 0;
        tryPlay(battle, "battle", intendedAudioRef);
      }

    } else if (phase === "shop") {
      intendedAudioRef.current = shop;
      menu.pause();
      battle.pause();
      if (shop.paused) tryPlay(shop, "shop", intendedAudioRef);
    }
  }, [soundEnabled, phase, gameStarted]);
}
