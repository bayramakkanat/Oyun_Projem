/**
 * GameContext.js — Adım 3 sonrası (context bölünmesi)
 *
 * State artık üç context'e dağıtılmış:
 *   UIContext     — UI/meta state, auth köprüsü, shared utilities (pwr, clampStat, triggerAnim, unlockAchievement…)
 *   ShopContext   — gold, shop, team, turn, sel, rewards, shopSlots, teamSlots…
 *   BattleContext — phase, pT, eT, log, step, anims, bossChallenge, arenaResult, reset, goToShop…
 *
 * Geriye kalan mevcut useGameContext() çağrıları değişmeden çalışır:
 *   const { gold, battle, phase, ... } = useGameContext();
 *
 * Cross-context efektler (bir context'in state'ini okuyup başka bir context'in
 * fonksiyonunu çağıranlar) burada GameEffects bileşeninde yaşıyor.
 */

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { playSound } from "../hooks/useSound";
import { clearGameState } from "../utils/localSave";

import { UIProvider, useUIContext } from "./UIContext";
import { ShopProvider, useShopContext } from "./ShopContext";
import { BattleProvider, useBattleContext } from "./BattleContext";

// ─── Cross-context efektler ──────────────────────────────────────────────────
// Bu bileşen Provider ağacının içinde render olduğu için her üç context'e
// erişebilir. Render ettiği içerik yok (null döner), yalnızca useEffect barındırır.
const GameEffects = () => {
  const {
    unlockAchievement,
    setNewTier, setLastT, lastT,
    over, victory, wins, lives,
    updateStatsOnEnd,
    gameMode,
    stats,
  } = useUIContext();

  const { gold, turn, phase } = useShopContext();

  const { updateLeaderboard, arenaResult } = useBattleContext();

  // ─── Altın başarımı ───────────────────────────────────────────────────────
  useEffect(() => {
    if (gold >= 15) unlockAchievement("rich");
  }, [gold]);

  // ─── Yeni kademe bildirimi ────────────────────────────────────────────────
  useEffect(() => {
    const currentMaxT = Math.min(Math.ceil(turn / 2), 6);
    if (currentMaxT > lastT && phase === "shop") {
      setNewTier(currentMaxT);
      setLastT(currentMaxT);
    }
  }, [turn, phase, lastT]);

  // ─── Zafer efekti ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!victory) return;
    playSound("victory");
    updateStatsOnEnd(true, turn, wins, lives);
    if (gameMode === "arena") {
      updateLeaderboard({ won: true, isNewBestTurn: turn > (stats.bestTurn || 0) });
    }
  }, [victory]);

  // ─── Yenilgi efekti ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!over) return;
    playSound("defeat");
    updateStatsOnEnd(false, turn, wins, lives);
    if (gameMode === "arena") {
      updateLeaderboard({ won: false, isNewBestTurn: turn > (stats.bestTurn || 0) });
    }
  }, [over]);
  // ─── Arena sonucu gelince kaydı sil ──────────────────────────────────────
  useEffect(() => {
    if (!arenaResult) return;
    clearGameState();
  }, [arenaResult]);

  return null;
};

// ─── Ana Provider ─────────────────────────────────────────────────────────────
export const GameContext = createContext();

export const GameProvider = ({ children }) => (
  <UIProvider>
    <ShopProvider>
      <BattleProvider>
        <GameEffects />
        {children}
      </BattleProvider>
    </ShopProvider>
  </UIProvider>
);

// ─── Geriye dönük uyumlu hook ─────────────────────────────────────────────────
// Mevcut bileşenler useGameContext() kullanmaya devam edebilir.
// Üç context'in tüm değerlerini birleştirir.
//
// DÜZELTME: Önceki versiyonda her çağrıda yeni bir obje üretiliyordu ({...a, ...b, ...c}).
// Bu, hook'u kullanan her bileşenin ilgisiz bir context değiştiğinde de re-render
// olmasına yol açıyordu. useMemo ile birleştirilmiş obje memoize ediliyor;
// yalnızca üç context'ten biri gerçekten değiştiğinde yeni obje üretiliyor.
//
// Not: Yüksek frekanslı state değişimlerinde daha ince optimizasyon için
// bileşenleri doğrudan useUIContext / useShopContext / useBattleContext ile güncelle.
export const useGameContext = () => {
  const ui     = useUIContext();
  const shop   = useShopContext();
  const battle = useBattleContext();
  return useMemo(
    () => ({ ...ui, ...shop, ...battle }),
    [ui, shop, battle]
  );
};
