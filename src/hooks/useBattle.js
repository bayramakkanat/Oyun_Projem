import { useEffect, useRef, useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { runBattleStartPhase } from "../utils/battleStartPhase";
import { runBattleTurnPhase } from "../utils/battleTurnPhase";
import { resolveFaint } from "../utils/battleFaintResolver";
import {
  applyPermanentBuffs,
  genE,
  applyEndTurnBuffs,
} from "../utils/battleUtils";
import {
  spawnParticles,
  spawnFloatingText,
  spawnDeathEffect,
  spawnProjectile,
} from "../utils/animations";
import { BOSSES, TIERS, WIN_TURN, AB } from "../data/gameData";
import { useBattleResults } from "./useBattleResults";

export function useBattle({
  // State değerleri
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
  setShowSwordClash,
  setArenaOpponent,
  setVersusReady, setOpponentReady,
  versusReady,
  versusRoom, versusPhase,
  // Ref'ler
  battleSpeedRef,
  isPausedRef,
  battleGoldRef,
  lastProcessedStepRef,
  turnRef, setTurnAndRef,
  // Yardımcı fonksiyonlar
  triggerAnim,
  clampStat,
  pwr,
  unlockAchievement,
  playSound,
  spawnBuffAnimation,
  // Harici async fonksiyonlar
  saveArenaTeam,
  fetchArenaOpponent,
  updateLeaderboard,
  setArenaResult,
  saveTasksToDB,
  // Hesaplanan değerler
  difficultyLevel,
  maxT,
  teamSlots,
  difficulty,
  setPGold,
  setRewards,
  user,
}) {
  const versusUnsubRef    = useRef(null);
  const lastBattleIdRef   = useRef(null);
  const phaseRef          = useRef(phase);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ─── useBattleResults: koleksiyon / görev / leaderboard ─────────────────
  const { updateCollectionStats, updateTaskProgress, handleArenaGameOver, handleGameOver } =
    useBattleResults({
      user, gameMode, turn, lives, wins,
      unlockAchievement, updateLeaderboard,
      saveTasksToDB, setArenaResult,
      setLives, setOver, versusRoom,
    });

  // ─── faint yardımcısı ───────────────────────────────────────────────────
  const faint = (d, al, en, isP, killer) =>
    resolveFaint(d, al, en, isP, killer, { pwr, clampStat, triggerAnim, spawnParticles, setTeam });

  // ─── Takım durumunu savaş sonrası güncelle ──────────────────────────────
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

  // ─── Tur sonu geçişi ────────────────────────────────────────────────────
  const transitionToShop = (updatedTeam, newTurn, delayMs) => {
    const currentMaxT    = Math.min(Math.ceil(newTurn / 2), 6);
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
      setPendingEndTurnAnims(true);
      if (willOpenNewTier) {
        setNewTier(currentMaxT);
        setLastT(currentMaxT);
      } else {
        setPhase("shop");
      }
    }, delayMs);
  };

  // ─── SAVAŞ BAŞLATMA FONKSİYONLARI ──────────────────────────────────────

  const startBossBattle = () => {
    setIsBattleOver(false);
    lastProcessedStepRef.current = -1;
    battleGoldRef.current = 0;
    const boss = BOSSES[turn];
    const pt = applyPermanentBuffs(team)
      .filter(Boolean)
      .reverse()
      .map((x) => ({ ...x, curHp: x.hp }));
    if (pt.length === 0) return;
    const et = boss.team.map((b) => ({ ...b, id: Math.random() }));
    setET(et);
    setPT(pt);
    playSound("boss_start");
    setLog([`🔥 BOSS SAVAŞI BAŞLADI! ${boss.emoji} ${boss.name} - ${boss.title}`]);
    setStep(0);
    setPGold(0);
    setPhase("battle");
  };

  const startVersusBattle = (myTeam, theirTeam) => {
    setIsBattleOver(false);
    lastProcessedStepRef.current = -1;
    battleGoldRef.current = 0;
    setPGold(0);
    setVersusReady(false);
    setOpponentReady(false);
    const pt = myTeam.filter(Boolean).reverse().map((x) => ({ ...x, curHp: x.hp }));
    const et = theirTeam.filter(Boolean).reverse().map((x) => ({ ...x, curHp: x.hp }));
    if (pt.length === 0) return;
    setET(et);
    setPT(pt);
    setLog([]);
    setStep(0);
    setPhase("battle");
  };

  const versusSetReady = useCallback(async () => {
    if (versusReady || !versusRoom) return;
    const { code, role } = versusRoom;
    const readyTurnField = role === "host" ? "hostReadyTurn" : "guestReadyTurn";
    const teamKey        = role === "host" ? "hostTeam"      : "guestTeam";
    const allAnimals     = Object.values(TIERS).flat();
    const currentTeam = team.filter(Boolean).map((p) => {
      const animalData = allAnimals.find((a) => a.name === p.name);
      return {
        name: p.name, nick: p.nick,
        atk: p.atk, hp: p.hp, curHp: p.hp,
        ability: p.ability || AB.NONE,
        tier: p.tier, lvl: p.lvl || 1, exp: p.exp || 0,
        img: p.img || animalData?.img || null,
        flip: p.flip || animalData?.flip || false,
        id: Math.random(), isBossUnit: false,
      };
    });
    try {
      await updateDoc(doc(db, "versus_rooms", code), {
        [readyTurnField]: turnRef.current,
        [teamKey]: currentTeam,
      });
      setVersusReady(true);
    } catch (err) {
      console.error("Versus hazır hatası:", err);
    }
  }, [versusRoom, versusReady, team, turnRef]);

  const battle = async () => {
    if (gameMode === "versus") {
      await versusSetReady();
      return;
    }
    setIsBattleOver(false);
    lastProcessedStepRef.current = -1;
    battleGoldRef.current = 0;
    setPGold(0);
    setRewards([]);

    const pt = applyPermanentBuffs(team)
      .filter(Boolean)
      .reverse()
      .map((x) => ({ ...x, curHp: x.hp }));
    if (pt.length === 0) return;

    let et;
    if (gameMode === "arena") {
      unlockAchievement("arena_first");
      const opponentData = await fetchArenaOpponent(difficultyLevel);
      if (opponentData) {
        setArenaOpponent(opponentData);
        const allAnimals = Object.values(TIERS).flat();
        et = [...opponentData.team].reverse().map((p) => {
          const animalData = allAnimals.find((a) => a.name === p.name);
          return { ...p, img: p.img || animalData?.img || null, id: Math.random(), curHp: p.hp };
        });
      } else {
        et = genE(turn, maxT, teamSlots, difficulty, difficultyLevel);
        setArenaOpponent({ userName: "AI Komutan" });
      }
    } else {
      et = genE(turn, maxT, teamSlots, difficulty, difficultyLevel);
      setArenaOpponent(null);
    }

    setET(et);
    setPT(pt);
    setLog([]);
    setStep(0);
    setPhase("battle");
  };

  // ─── VERSUS SHOP RESET ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "shop" || !versusRoom || versusPhase !== "playing") return;
    const { code, role } = versusRoom;
    updateDoc(doc(db, "versus_rooms", code), {
      [role === "host" ? "hostReadyTurn" : "guestReadyTurn"]: null,
      [role === "host" ? "hostTeam"      : "guestTeam"     ]: null,
    }).catch(console.error);
  }, [phase]);

  // ─── VERSUS SNAPSHOT LISTENER ───────────────────────────────────────────
  useEffect(() => {
    if (!versusRoom || versusPhase !== "playing") return;
    const { code, role } = versusRoom;
    const allAnimals = Object.values(TIERS).flat();

    const processTeam = (arr) =>
      arr.map((p) => {
        const a = allAnimals.find((a) => a.name === p.name);
        return { ...p, img: p.img || a?.img || null, flip: p.flip !== undefined ? p.flip : (a?.flip || false) };
      });

    const unsub = onSnapshot(doc(db, "versus_rooms", code), async (snap) => {
      const data = snap.data();
      if (!data) return;

      if (data.loser) {
        if (data.loser !== role) setVictory(true);
        return;
      }
      if (data.disconnected && data.disconnected !== role) {
        setLog((l) => [...l, "⚠️ Rakip bağlantısı koptu! Zafer sayılıyor..."]);
        setTimeout(() => setVictory(true), 2000);
        return;
      }

      if (phaseRef.current !== "shop") return;

      const currentTurn = turnRef.current;
      const hostReady   = data.hostReadyTurn === currentTurn;
      const guestReady  = data.guestReadyTurn === currentTurn;
      setOpponentReady(role === "host" ? guestReady : hostReady);

      if (!hostReady || !guestReady) return;
      if (!data.hostTeam || !data.guestTeam) return;
      if (data.hostTeam.length === 0 || data.guestTeam.length === 0) return;

      if (role === "host" && !data.battleId) {
        const newId = `${code}_${turnRef.current}_${Date.now()}`;
        try { await updateDoc(doc(db, "versus_rooms", code), { battleId: newId }); }
        catch (err) { console.error("battleId yazma hatası:", err); }
        return;
      }
      if (!data.battleId) return;
      if (lastBattleIdRef.current === data.battleId) return;
      lastBattleIdRef.current = data.battleId;

      unsub();

      const myTeam    = processTeam(role === "host" ? data.hostTeam : data.guestTeam);
      const theirTeam = processTeam(role === "host" ? data.guestTeam : data.hostTeam);
      const opponentName = role === "host" ? (data.guest?.name || "Rakip") : (data.host?.name || "Rakip");
      setArenaOpponent({ userName: opponentName });
      startVersusBattle(myTeam, theirTeam);

      if (role === "host") {
        setTimeout(() => {
          updateDoc(doc(db, "versus_rooms", code), {
            battleId: null, hostReadyTurn: null, guestReadyTurn: null,
            hostTeam: null, guestTeam: null,
          });
        }, 2000);
      }
    });

    versusUnsubRef.current = unsub;
    return () => { unsub(); };
  }, [versusRoom?.code, versusPhase, turn]);

  // ─── ANA SAVAŞ ADIM DÖNGÜSÜ ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "battle" || isBattleOver) return;
    let isCancelled = false;

    // Zaman aşımı
    if (step > 200) {
      setIsBattleOver(true);
      setLog((l) => [...l, "⏱️ Savaş zaman aşımı!"]);
      setTimeout(async () => {
        const newLives = lives - 1;
        setLives(newLives);
        const over = await handleGameOver(newLives, wins, turn);
        if (over) return;
        const updatedTeam = buildUpdatedTeam(team, pT);
        transitionToShop(updatedTeam, turn + 1, 0);
        setPhase("shop");
      }, 2000);
      return;
    }

    // Savaş bitti: takımlardan biri boşaldı
    if (pT.length === 0 || eT.length === 0) {
      if (isDebugBattle) return;
      setIsBattleOver(true);
      const won  = eT.length === 0 && pT.length > 0;
      const draw = pT.length === 0 && eT.length === 0;

      (async () => { 
      // Boss savaşı sonu
      if (bossChallenge === "battle") {
        if (won) {
          setBossResult("win");
          setBossChallenge("reward");
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
          const over = await handleGameOver(newLives, wins, turn);
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
        setLog((l) => [...l, "🎉 ZAFER!"]);
      } else if (draw) {
        setLog((l) => [...l, "🤝 Berabere"]);
      } else {
        setLog((l) => [...l, "💀 Yenilgi"]);
      }

      // Arena: takımı kaydet
      if (gameMode === "arena") saveArenaTeam(updatedTeam, difficultyLevel);

      // Koleksiyon & görev güncellemeleri
      updateCollectionStats(updatedTeam, won);
      updateTaskProgress(updatedTeam, won);

      // Arena başarımları
      if (gameMode === "arena") {
        const newTurn = turn + 1;
        if (newTurn >= 5)  unlockAchievement("arena_turn5");
        if (newTurn >= 10) unlockAchievement("arena_turn10");
        if (newTurn >= 15) unlockAchievement("arena_turn15");
      }

      // Yenilgi / can kaybı
      if (!won && !draw) {
        const newLives = lives - 1;
        setLives(newLives);
        const over = await handleGameOver(newLives, wins, turn);
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
      })(); 
      return;
    }

    // Adım işleme — zaten işlendiyse atla
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

      const addBattleLog    = (msg) => setLog((l) => [...l, msg]);
      const playBattleLogs  = async (messages, waitMs) => {
        for (const msg of messages) { addBattleLog(msg); await delay(waitMs); }
      };
      const playDeathAnim   = (petId, dir) => { triggerAnim(petId, dir); spawnDeathEffect(petId); };
      const resolveFaintResult = async (result, waitMs) => {
        await playBattleLogs(result.lg, waitMs);
        if (result.gG > 0) battleGoldRef.current += result.gG;
        return result.sm;
      };

      if (isCancelled) return;

      const syncBattleTeams = (playerTeam, enemyTeam) => {
        if (playerTeam) setPT([...playerTeam]);
        if (enemyTeam)  setET([...enemyTeam]);
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
          pp: [...pT], ee: [...eT],
          delay, isCancelled: () => isCancelled,
          triggerAnim, clampStat, pwr,
          spawnParticles, spawnProjectile,
          setLog, setTeam, syncBattleTeams,
          isDebugBattle, announceDebugWinner,
          scheduleDebugBattleReset, setStep,
        });
        return;
      }

      // Step > 0: Normal savaş turu
      await runBattleTurnPhase({
        pT, eT,
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
  }, [phase, step]);

  return { battle, startBossBattle, startVersusBattle, versusSetReady };
}
