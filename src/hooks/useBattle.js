// src/hooks/useBattle.js
//
// Faz 3 refactor sonrası bu dosyanın tek sorumluluğu:
//   - Takım normalizasyon yardımcıları
//   - battle() / startBossBattle() / startVersusBattle() / versusSetReady()
//   - buildUpdatedTeam / transitionToShop
//   - useVersusSync ve useBattleLoop hook'larını koordine etmek
//
// Versus Firebase senkronizasyonu → useVersusSync.js
// Ana savaş adım döngüsü          → useBattleLoop.js

import { useEffect, useRef, useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { resolveFaint } from "../utils/battleFaintResolver";
import {
  applyPermanentBuffs,
  genE,
} from "../utils/battleUtils";
import {
  spawnParticles,
  spawnDeathEffect,
  spawnProjectile,
} from "../utils/animations";
import { BOSSES, TIERS, WIN_TURN, AB } from "../data/gameData";
import { logError } from "../utils/helpers";
import { useBattleResults } from "./useBattleResults";
import { useVersusSync }   from "./useVersusSync";
import { useBattleLoop }   from "./useBattleLoop";

export function useBattle({
  phase, setPhase,
  step, setStep,
  pT, setPT,
  eT, setET,
  log, setLog,
  team, setTeam,
  lives, setLives,
  wins, setWins,
  turn,
  gold, setGold,
  isBattleOver, setIsBattleOver,
  bossChallenge, setBossChallenge,
  setBossResult, setBossRewards,
  gameMode,
  isDebugBattle, setIsDebugBattle,
  setOver,
  setVictory,
  setGameStarted,
  setShowDebugPanel,
  setNewTier, setLastT, lastT,
  setNewlyOpenedSlot,
  setPendingEndTurnAnims,
  setPendingShop,
  setShowSwordClash,
  setArenaOpponent,
  setVersusReady, setOpponentReady,
  versusReady,
  versusRoom, versusPhase,
  battleSpeedRef,
  isPausedRef,
  battleGoldRef,
  lastProcessedStepRef,
  turnRef, setTurnAndRef,
  triggerAnim,
  clampStat,
  pwr,
  unlockAchievement,
  playSound,
  spawnBuffAnimation,
  saveArenaTeam,
  fetchArenaOpponent,
  updateLeaderboard,
  setArenaResult,
  saveTasksToDB,
  difficultyLevel,
  maxT,
  teamSlots,
  difficulty,
  setPGold,
  setRewards,
  user,
}) {
  // ─── Ref'ler ──────────────────────────────────────────────────────────────
  const versusUnsubRef           = useRef(null);
  const lastBattleIdRef          = useRef(null);
  const phaseRef                 = useRef(phase);
  const pTRef                    = useRef(pT);
  const eTRef                    = useRef(eT);
  const disconnectReportedRef    = useRef(false);
  const disconnectNoticeShownRef = useRef(false);
  const arenaRoundStatsRef       = useRef({ wins: 0, losses: 0, draws: 0 });

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pTRef.current = pT; },     [pT]);
  useEffect(() => { eTRef.current = eT; },     [eT]);

  // ─── Takım normalizasyon yardımcıları ────────────────────────────────────
  const toFiniteNumber = (value, fallback = 0) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;

  const normalizeBattlePet = (pet, animalData) => {
    const baseAtk  = toFiniteNumber(pet?.atk,  toFiniteNumber(animalData?.atk, 0));
    const baseHp   = toFiniteNumber(pet?.hp,   toFiniteNumber(animalData?.hp,  1));
    const safeHp   = clampStat(Math.max(1, baseHp));
    const safeCurHp = clampStat(Math.max(0, toFiniteNumber(pet?.curHp, safeHp)));
    return {
      ...pet,
      atk:   clampStat(baseAtk),
      hp:    safeHp,
      curHp: safeCurHp,
      lvl:   toFiniteNumber(pet?.lvl, 1),
      exp:   toFiniteNumber(pet?.exp, 0),
    };
  };

  const sanitizeBattleTeam = (teamArr, allAnimals) =>
    (teamArr || [])
      .filter(Boolean)
      .map((pet) => normalizeBattlePet(pet, allAnimals?.find((a) => a.name === pet?.name)));

  // ─── useBattleResults ────────────────────────────────────────────────────
  const { updateCollectionStats, updateTaskProgress, handleArenaGameOver, handleGameOver } =
    useBattleResults({
      user, gameMode, turn, lives, wins,
      unlockAchievement, updateLeaderboard,
      saveTasksToDB, setArenaResult,
      setLives, setOver, versusRoom,
    });

    const updateTaskProgressRef = useRef(updateTaskProgress);
  useEffect(() => { updateTaskProgressRef.current = updateTaskProgress; }, [updateTaskProgress]);

  const updateCollectionStatsRef = useRef(updateCollectionStats);
  useEffect(() => { updateCollectionStatsRef.current = updateCollectionStats; }, [updateCollectionStats]);

  // ─── faint yardımcısı ────────────────────────────────────────────────────
  const faint = (d, al, en, isP, killer) =>
    resolveFaint(d, al, en, isP, killer, { pwr, clampStat, triggerAnim, spawnParticles, spawnProjectile, setTeam });

  // ─── Takım durumunu savaş sonrası güncelle ────────────────────────────────
  const buildUpdatedTeam = (currentTeam, currentPT) =>
    currentTeam.map((pet) => {
      if (!pet) return pet;
      const battlePet = currentPT.find((p) => p?.id === pet.id);
      if (!battlePet) {
        if (pet.ability === AB.START_FIRE) {
          const m = pwr(pet);
          return { ...pet, atk: clampStat(pet.atk + 4 * m), curHp: pet.hp };
        }
        return { ...pet, curHp: pet.hp };
      }
      if (pet.ability === AB.START_MULTI_SNIPE) {
        const m = pwr(pet);
        return { ...pet, atk: clampStat(pet.atk + m * 5), hp: clampStat(pet.hp + m * 5), curHp: pet.hp };
      }
      if (pet.ability === AB.START_ALL_PERM || pet.ability === AB.START_FIRE) {
        return { ...pet, atk: battlePet.atk, curHp: pet.hp };
      }
      return { ...pet, curHp: pet.hp };
    });

  // ─── Shop'a geçiş ─────────────────────────────────────────────────────────
  const transitionToShop = (updatedTeam, newTurn, delayMs) => {
    const currentMaxT     = Math.min(Math.ceil(newTurn / 2), 6);
    const willOpenNewTier = currentMaxT > lastT;

    setTurnAndRef(newTurn);

    let camelBonus = 0;
    updatedTeam.forEach((pet) => {
      if (pet && pet.ability === AB.END_GAIN_GOLD) camelBonus += pwr(pet);
    });
    setGold((g) => g + 10 + battleGoldRef.current + camelBonus);
    setTeam(updatedTeam);
    setShowSwordClash(false);

    setTimeout(() => {
      if (willOpenNewTier) {
        // Yeni kademe ekranı — banner yok, direkt geçiş
        setPendingEndTurnAnims(true);
        setNewTier(currentMaxT);
        setLastT(currentMaxT);
      } else {
        // Önce TurnBanner gösterilsin; banner onDone'da shop açılır.
        // GameRouter bu sinyali dinliyor: pendingShopRef üzerinden.
        setPendingShop(true);
      }
    }, delayMs);
  };

  // ─── Versus: kullanıcıyı hazır işaretle ──────────────────────────────────
  const versusSetReady = useCallback(async () => {
    if (!versusRoom) return;
    const { code, role } = versusRoom;
    const readyTurnField = role === "host" ? "hostReadyTurn" : "guestReadyTurn";
    const teamKey        = role === "host" ? "hostTeam"      : "guestTeam";
    const allAnimals     = Object.values(TIERS).flat();

    const currentTeam = team.filter(Boolean).map((p) => {
      const animalData = allAnimals.find((a) => a.name === p.name);
      const normalized = normalizeBattlePet(p, animalData);
      return {
        name:    p.name,      nick:    p.nick,
        atk:     normalized.atk,
        hp:      normalized.hp,  curHp: normalized.hp,
        ability: p.ability || AB.NONE,
        tier:    p.tier,
        lvl:     normalized.lvl, exp:   normalized.exp,
        img:     p.img  || animalData?.img  || null,
        flip:    p.flip || animalData?.flip || false,
        id:      Math.random(),
        isBossUnit: false,
      };
    });

    try {
      await updateDoc(doc(db, "versus_rooms", code), {
        [readyTurnField]: turnRef.current,
        [teamKey]: currentTeam,
      });
      setVersusReady(true);
      playSound("versus_ready");
    } catch (err) {
      logError(err, "useBattle:versusSetReady");
    }
  }, [versusRoom, versusReady, team, turnRef, clampStat]);

  // ─── Versus savaşı başlat ─────────────────────────────────────────────────
  const startVersusBattle = (myTeam, theirTeam) => {
    setIsBattleOver(false);
    lastProcessedStepRef.current = -1;
    battleGoldRef.current = 0;
    setPGold(0);
    setVersusReady(false);
    setOpponentReady(false);
    const allAnimals = Object.values(TIERS).flat();
    const pt = myTeam.reverse().map((x) => normalizeBattlePet(x, allAnimals.find((a) => a.name === x.name)));
    const et = theirTeam.reverse().map((x) => normalizeBattlePet(x, allAnimals.find((a) => a.name === x.name)));
    setET(et);
    setPT(pt);
    setLog(pt.length === 0 ? ["💀 Takımın boştu! Rakip otomatik kazandı."] : []);
    setStep(0);
    playSound("versus_match");
    disconnectNoticeShownRef.current = false;
    setPhase("battle");
  };

  // ─── Boss savaşı başlat ───────────────────────────────────────────────────
  const startBossBattle = () => {
    setIsBattleOver(false);
    lastProcessedStepRef.current = -1;
    battleGoldRef.current = 0;
    const boss       = BOSSES[turn];
    const allAnimals = Object.values(TIERS).flat();
    const pt = sanitizeBattleTeam(
      applyPermanentBuffs(team).filter(Boolean).reverse().map((x) => ({ ...x, curHp: x.hp, trample: false })),
      allAnimals
    );
    if (pt.length === 0) return;
    const et = sanitizeBattleTeam(boss.team.map((b) => ({ ...b, id: Math.random() })), allAnimals);
    setET(et);
    setPT(pt);
    playSound("boss_start");
    setLog([`🔥 BOSS SAVAŞI BAŞLADI! ${boss.emoji} ${boss.name} - ${boss.title}`]);
    setStep(0);
    setPGold(0);
    setPhase("battle");
  };

  // ─── Normal savaş başlat ──────────────────────────────────────────────────
  const battle = async () => {
    if (gameMode === "versus") {
      try {
        setRewards([]);
        await versusSetReady();
      } catch (err) {
        logError(err, "useBattle:battle:versusSetReady");
      }
      return;
    }

    try {
      if (gameMode === "arena" && turnRef.current === 1 && wins === 0) {
        arenaRoundStatsRef.current = { wins: 0, losses: 0, draws: 0 };
      }
      setIsBattleOver(false);
      lastProcessedStepRef.current = -1;
      battleGoldRef.current = 0;
      setPGold(0);
      setRewards([]);

      const allAnimals = Object.values(TIERS).flat();
      const pt = sanitizeBattleTeam(
        applyPermanentBuffs(team).filter(Boolean).reverse().map((x) => ({ ...x, curHp: x.hp, trample: false })),
        allAnimals
      );
      if (pt.length === 0) return;

      let et;
      if (gameMode === "arena") {
        unlockAchievement("arena_first");
        const opponentData = await fetchArenaOpponent(difficultyLevel);
        if (opponentData) {
          setArenaOpponent(opponentData);
          et = sanitizeBattleTeam(
            [...opponentData.team].reverse().map((p) => {
              const animalData = allAnimals.find((a) => a.name === p.name);
              return { ...p, img: p.img || animalData?.img || null, id: Math.random(), curHp: p.hp };
            }),
            allAnimals
          );
        } else {
          et = genE(turn, maxT, teamSlots, difficulty, difficultyLevel);
          setArenaOpponent({ userName: "AI Komutan" });
        }
      } else {
        et = sanitizeBattleTeam(genE(turn, maxT, teamSlots, difficulty, difficultyLevel), allAnimals);
        setArenaOpponent(null);
      }

      setET(et);
      setPT(pt);
      setLog([]);
      setStep(0);
      setPhase("battle");
    } catch (err) {
      logError(err, "useBattle:battle");
      setLog((l) => [...l, "⚠️ Beklenmeyen hata, mağazaya dönülüyor..."]);
      setTimeout(() => {
        setIsBattleOver(false);
        lastProcessedStepRef.current = -1;
        setPhase("shop");
      }, 2000);
    }
  };

  // ─── Versus senkronizasyonu (ayrı hook) ──────────────────────────────────
  useVersusSync({
    gameMode, versusRoom, versusPhase,
    phase, turn, turnRef, phaseRef,
    team, clampStat,
    setOver, setVictory,
    setLog, setOpponentReady, setArenaOpponent,
    startVersusBattle,
    normalizeBattlePet,
    playSound,
    disconnectReportedRef,
    disconnectNoticeShownRef,
    lastBattleIdRef,
  });

  // ─── Ana savaş döngüsü (ayrı hook) ───────────────────────────────────────
  useBattleLoop({
    phase, setPhase,
    step, setStep,
    pT, setPT,
    eT, setET,
    setLog,
    team, setTeam,
    lives, setLives,
    wins, setWins,
    turn, setGold,
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
    setPGold, setRewards,
    battleSpeedRef, isPausedRef,
    battleGoldRef, lastProcessedStepRef,
    turnRef, setTurnAndRef,
    pTRef, eTRef,
    arenaRoundStatsRef,
    triggerAnim, clampStat, pwr,
    playSound, faint,
    handleGameOver,
    updateCollectionStats: (...args) => updateCollectionStatsRef.current(...args),
    updateTaskProgress: (...args) => updateTaskProgressRef.current(...args),
    unlockAchievement,
    saveArenaTeam, difficultyLevel,
    buildUpdatedTeam,
    transitionToShop,
    sanitizeBattleTeam,
  });

  return { battle, startBossBattle, startVersusBattle, versusSetReady };
}
