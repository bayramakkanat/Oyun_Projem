// src/hooks/useBattleLoop.js
//
// useBattle.js'ten ayrıştırıldı (Faz 3 refactor).
// Sorumluluk: Her savaş adımını (step) işleyen ana döngü.
//   - Zaman aşımı tespiti
//   - Savaş sonu (kazanma/yenilgi/berabere)
//   - Boss savaşı sonu
//   - Adım başına runBattleStartPhase / runBattleTurnPhase çağrısı

import { useEffect } from "react";
import { TIERS, WIN_TURN, AB } from "../data/gameData";
import { runBattleStartPhase } from "../utils/battleStartPhase";
import { runBattleTurnPhase }  from "../utils/battleTurnPhase";
import {
  spawnParticles,
  spawnDeathEffect,
  spawnProjectile,
} from "../utils/animations";

export function useBattleLoop({
  // Savaş state
  phase, setPhase,
  step,  setStep,
  pT, setPT,
  eT, setET,
  setLog,
  team, setTeam,
  lives, setLives,
  wins, setWins,
  turn,
  setGold,
  isBattleOver, setIsBattleOver,
  bossChallenge, setBossChallenge, setBossResult, setBossRewards,
  gameMode,
  isDebugBattle, setIsDebugBattle,
  setOver, setVictory,
  setGameStarted, setShowDebugPanel,
  setNewTier, setLastT, lastT,
  setNewlyOpenedSlot,
  setPendingEndTurnAnims,
  setShowSwordClash,
  setPGold,
  setRewards,
  // Ref'ler
  battleSpeedRef,
  isPausedRef,
  battleGoldRef,
  lastProcessedStepRef,
  turnRef, setTurnAndRef,
  pTRef, eTRef,
  arenaRoundStatsRef,
  // Yardımcılar
  triggerAnim, clampStat, pwr,
  playSound,
  faint,
  // Dış fonksiyonlar
  handleGameOver,
  updateCollectionStats,
  updateTaskProgress,
  unlockAchievement,
  saveArenaTeam,
  difficultyLevel,
  buildUpdatedTeam,
  transitionToShop,
  sanitizeBattleTeam,
}) {
  useEffect(() => {
    if (phase !== "battle" || isBattleOver) return;
    let isCancelled = false;

    // ── Zaman aşımı: aynı takım boyutu 30 adım üst üste tekrarlarsa kilitlenme ──
    if (step > 0) {
      const stateKey = `${pT.length}-${eT.length}`;
      if (!lastProcessedStepRef._stuckState) {
        lastProcessedStepRef._stuckState = { key: null, count: 0 };
      }
      const stuck = lastProcessedStepRef._stuckState;
      if (stuck.key === stateKey) { stuck.count++;          }
      else                        { stuck.key = stateKey; stuck.count = 1; }

      if (stuck.count > 30 || step > 200) {
        stuck.key = null; stuck.count = 0;
        setIsBattleOver(true);
        setLog((l) => [...l, "⏱️ Savaş zaman aşımı!"]);
        setTimeout(async () => {
          try {
            const newLives = lives - 1;
            setLives(newLives);
            const over = await handleGameOver(newLives, wins, turn, arenaRoundStatsRef.current);
            if (over) return;
            const updatedTeam = buildUpdatedTeam(team, pT);
            transitionToShop(updatedTeam, turn + 1, 0);
            setPhase("shop");
          } catch (err) {
            setLog((l) => [...l, "⚠️ Beklenmeyen hata, mağazaya dönülüyor..."]);
            setTimeout(() => {
              setIsBattleOver(false);
              lastProcessedStepRef.current = -1;
              setPhase("shop");
            }, 2000);
          }
        }, 2000);
        return;
      }
    }

    // ── Savaş bitti: takımlardan biri boşaldı ────────────────────────────────
    if (pT.length === 0 || eT.length === 0) {
      if (isDebugBattle) return;
      setIsBattleOver(true);
      const won  = eT.length === 0 && pT.length > 0;
      const draw = pT.length === 0 && eT.length === 0;

      (async () => {
        try {
          // Boss savaşı sonu
          if (bossChallenge === "battle") {
            if (won) {
              setBossResult("win");
              setBossChallenge("reward");
              setPhase("shop");
              const rewardTier = turn === 5 ? 5 : 6;
              const shuffled   = [...TIERS[rewardTier]].sort(() => Math.random() - 0.5).slice(0, 3);
              setBossRewards(
                shuffled.map((a) => ({ ...a, id: Math.random(), lvl: 1, exp: 0, curHp: a.hp, isR: true, grp: Math.random(), rT: rewardTier }))
              );
              setGold((g) => g + 5);
              for (let i = 0; i < 3; i++) {
                setTimeout(() => spawnParticles("boss_center", "buff"), (i * 200) / battleSpeedRef.current);
              }
              playSound("victory");
            } else {
              setBossResult("lose");
              setBossChallenge(null);
              const newLives = lives - 2;
              setLives(newLives);
              const over = await handleGameOver(newLives, wins, turn, arenaRoundStatsRef.current);
              if (over) return;
              const updatedTeam = buildUpdatedTeam(team, pT);
              transitionToShop(updatedTeam, turn + 1, 3000);
            }
            return;
          }

          // Normal savaş sonu
          const updatedTeam = buildUpdatedTeam(team, pT);
          setTeam(updatedTeam);

          if (won) {
            setWins((w) => w + 1);
            if (gameMode === "arena") arenaRoundStatsRef.current.wins  += 1;
            setLog((l) => [...l, "🎉 ZAFER!"]);
          } else if (draw) {
            setLog((l) => [...l, "🤝 Berabere"]);
            if (gameMode === "arena") arenaRoundStatsRef.current.draws += 1;
          } else {
            setLog((l) => [...l, "💀 Yenilgi"]);
            if (gameMode === "arena") arenaRoundStatsRef.current.losses += 1;
          }

          if (gameMode === "arena") saveArenaTeam(updatedTeam, difficultyLevel);

          // Versus: koleksiyon/görev yok, doğrudan geçiş
          if (gameMode === "versus") {
            if (!won && !draw) {
              const newLives = lives - 1;
              setLives(newLives);
              const over = await handleGameOver(newLives, wins, turn, arenaRoundStatsRef.current);
              if (over) return;
            }
            transitionToShop(updatedTeam, turn + 1, 3000);
            return;
          }

          updateCollectionStats(updatedTeam, won);
          updateTaskProgress(updatedTeam, won);

          // Arena başarımları
          if (gameMode === "arena") {
            const nextTurn = turn + 1;
            if (nextTurn >= 5)  unlockAchievement("arena_turn5");
            if (nextTurn >= 10) unlockAchievement("arena_turn10");
            if (nextTurn >= 15) unlockAchievement("arena_turn15");
          }

          // Can kaybı
          if (!won && !draw) {
            const newLives = lives - 1;
            setLives(newLives);
            const over = await handleGameOver(newLives, wins, turn, arenaRoundStatsRef.current);
            if (over) return;
          }

          // Zafer kontrolü
          if (turn === WIN_TURN) {
            if (gameMode === "arena") {
              setLives((l) => l + 1);
              setLog((lg) => [...lg, `♾️ ${WIN_TURN}. tura ulaştın! +1 can ile devam ediyorsun...`]);
            } else {
              setTimeout(() => setVictory(true), 500);
              return;
            }
          }

          // Slot açılımı bildirimi
          const newTurn = turn + 1;
          if (newTurn === 5) {
            setNewlyOpenedSlot("shop_4_team_4");
            setTimeout(() => setNewlyOpenedSlot(null), 1200);
          } else if (newTurn === 7) {
            setNewlyOpenedSlot("shop_5_team_5");
            setTimeout(() => setNewlyOpenedSlot(null), 1200);
          }

          transitionToShop(updatedTeam, newTurn, 3000);
        } catch (err) {
          setLog((l) => [...l, "⚠️ Beklenmeyen hata, mağazaya dönülüyor..."]);
          setTimeout(() => {
            setIsBattleOver(false);
            lastProcessedStepRef.current = -1;
            setPhase("shop");
          }, 2000);
        }
      })();
      return;
    }

    // ── Adım işleme ───────────────────────────────────────────────────────────
    if (phase !== "battle" || isBattleOver) { lastProcessedStepRef.current = -1; return; }
    if (step === lastProcessedStepRef.current) return;
    lastProcessedStepRef.current = step;

    const tmr = setTimeout(async () => {
      if (isCancelled) return;

      const delay = (ms) =>
        new Promise((r) => {
          const check = () => {
            if (!isPausedRef.current) {
              setTimeout(r, ms / (battleSpeedRef.current || 1));
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });

      const addBattleLog       = (msg) => setLog((l) => [...l, msg]);
      const playBattleLogs     = async (messages, waitMs) => {
        for (const msg of messages) { addBattleLog(msg); await delay(waitMs); }
      };
      const playDeathAnim      = (petId, dir) => { triggerAnim(petId, dir); spawnDeathEffect(petId); };
      const resolveFaintResult = async (result, waitMs) => {
        await playBattleLogs(result.lg, waitMs);
        if (result.gG > 0) battleGoldRef.current += result.gG;
        return result.sm;
      };

      if (isCancelled) return;

      const syncBattleTeams = (playerTeam, enemyTeam) => {
        const allAnimals = Object.values(TIERS).flat();
        if (playerTeam) setPT(sanitizeBattleTeam(playerTeam, allAnimals));
        if (enemyTeam)  setET(sanitizeBattleTeam(enemyTeam, allAnimals));
      };

      const scheduleDebugBattleReset = () => {
        setIsDebugBattle(false);
        setIsBattleOver(true);
        setTimeout(() => {
          setIsBattleOver(false);
          lastProcessedStepRef.current = -1;
          setPT([]); setET([]); setStep(0); setLog([]);
          setPhase("shop");
          setGameStarted(false);
          setTimeout(() => setShowDebugPanel(true), 50);
        }, 4000);
      };

      const announceDebugWinner = (playerAlive, enemyAlive) => {
        const winner =
          enemyAlive === 0 && playerAlive > 0 ? "SEN KAZANDIN!" :
          playerAlive === 0 && enemyAlive > 0  ? "DUSMAN KAZANDI!" :
          "BERABERLIK!";
        setLog((l) => [...l, "------------------", winner, "------------------"]);
      };

      // Step 0: Savaş başı yetenekleri
      if (step === 0) {
        await runBattleStartPhase({
          pp: [...pTRef.current].filter((x) => x.curHp > 0),
          ee: [...eTRef.current].filter((x) => x.curHp > 0),
          delay, isCancelled: () => isCancelled,
          triggerAnim, clampStat, pwr,
          spawnParticles, spawnProjectile,
          setLog, setTeam, syncBattleTeams,
          faint,
          isDebugBattle, announceDebugWinner,
          scheduleDebugBattleReset, setStep,
        });
        return;
      }

      // Step > 0: Normal savaş turu
      await runBattleTurnPhase({
        pT: pTRef.current, eT: eTRef.current,
        delay, isCancelled: () => isCancelled,
        triggerAnim, clampStat, pwr,
        battleSpeedRef,
        setLog, setPT, setET, setStep, setIsBattleOver, setTeam,
        battleGoldRef,
        faint,
        isDebugBattle, announceDebugWinner, scheduleDebugBattleReset,
      });
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(tmr);
    };
  }, [phase, step, updateTaskProgress, updateCollectionStats, handleGameOver]);
}
