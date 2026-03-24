import { useEffect, useRef, useCallback } from "react";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { runBattleStartPhase } from "../utils/battleStartPhase";
import { runBattleTurnPhase } from "../utils/battleTurnPhase";
import {
  applyPermanentBuffs,
  genE,
  applyEndTurnBuffs,
  applySummonBuffs,
} from "../utils/battleUtils";
import { loadCollection, saveCollection, getDefaultAnimalData, loadTasks, saveTasks } from "../utils/helpers";
import {
  spawnParticles,
  spawnFloatingText,
  spawnDeathEffect,
  spawnProjectile,
} from "../utils/animations";
import { BOSSES, TIERS, WIN_TURN, ACHIEVEMENTS_DEF } from "../data/gameData";
import {
  applyTeamBuff,
  applyTeamDamage,
  applyTeamDebuff,
  getFaintWeakenAllDebuff,
  getFearAllDebuff,
  getTeamBuffAmount,
  getWaveDamage,
} from "../utils/battleEffectUtils";
import {
  applyDodoTeamRetriggerEffect,
  applyFaintBuffEffect,
  applyFaintCopyEffect,
  applyFaintDamageEffect,
  applyFaintShieldEffect,
  applyFriendFaintEffect,
  applyTeamWideFaintEffect,
  applySelfFaintBuffEffect,
  applyStagComboEffect,
  createFaintSummonUnit,
  createFriendSummonUnit,
  pushFaintDuplicateEffect,
} from "../utils/battleFaintUtils";

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
  const versusRoomRef = useRef(null);
  const versusUnsubRef = useRef(null);
  const lastBattleIdRef = useRef(null);
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
 
  const handleArenaGameOver = (wins, turn) => {
  const freshTaskData = loadTasks(user?.uid);
  const pendingTaskXP = freshTaskData ? [
    ...(freshTaskData.daily?.tasks || []),
    ...(freshTaskData.weekly?.tasks || []),
  ].filter(t => t.done && !t.xpClaimed).reduce((s, t) => s + t.reward, 0) : 0;

  if (freshTaskData) {
    freshTaskData.daily.tasks = freshTaskData.daily.tasks.map(t => t.done ? { ...t, xpClaimed: true } : t);
    freshTaskData.weekly.tasks = freshTaskData.weekly.tasks.map(t => t.done ? { ...t, xpClaimed: true } : t);
    saveTasks(freshTaskData, user?.uid);
    if (saveTasksToDB) saveTasksToDB(freshTaskData);
  }

  updateLeaderboard({ won: wins > 0, totalWins: wins, totalTurns: turn, taskXP: pendingTaskXP }).then((result) => {
    const isNewRecord = result?.isNewRecord || false;
    const losses = turn - wins;
    const xpBreakdown = [
      { label: `${turn} Tur × 2 XP`, xp: turn * 2 },
      { label: `${wins} Zafer × 5 XP`, xp: wins * 5 },
      { label: `${losses} Yenilgi × -2 XP`, xp: -(losses * 2) },
      ...(isNewRecord ? [{ label: `🏆 Yeni Rekor Bonusu`, xp: 50 }] : []),
    ];
    const earnedXP = xpBreakdown.reduce((s, x) => s + x.xp, 0);
    setArenaResult({ reachedTurn: turn, totalWins: wins, totalLosses: turn - wins, earnedXP, isNewRecord, xpBreakdown });
  });
};
  const faint = (d, al, en, isP, killer) => {
    if (!d) return { lg: [], sm: [], gG: 0 };
    if (d.isDead) return { lg: [], sm: [], gG: 0 };

    d.isDead = true;
    const m = pwr(d);
    let lg = [], sm = [], gG = 0;

    if (!isP) {
      // Enemy dead-unit effects resolve first.
      if (d.ability === "faint_buff" && al.length > 0) {
        applyFaintBuffEffect({
          deadUnit: d,
          power: m,
          allyTeam: al,
          clampStat,
          logs: lg,
          logPrefix: "💀 Düşman ",
          logSuffix: " -> ",
        });
      }
      if (d.ability === "faint_dmg" && en.length > 0) {
        applyFaintDamageEffect({
          deadUnit: d,
          power: m,
          enemyTeam: en,
          logs: lg,
          logPrefix: "☠️ Düşman ",
          targetLabel: "Oyuncu takımına",
          logSuffix: " -> ",
        });
      }
      if (d.ability === "faint_shield" && al.length > 0) {
        applyFaintShieldEffect({
          deadUnit: d,
          power: m,
          allyTeam: al,
          clampStat,
          logs: lg,
          logPrefix: "🛡️ Düşman ",
          targetLabel: "Düşman takımına",
          logSuffix: " -> ",
        });
      }
      applyTeamWideFaintEffect({
        ability: d.ability,
        sourceNick: d.nick,
        power: m,
        allyTeam: al,
        enemyTeam: en,
        clampStat,
        logs: lg,
        teamBuffLabel: "enemy team",
        enemyLabel: "player team",
      });
      if (d.ability === "faint_gold") {
        lg.push(`💰 Düşman ${d.nick} -> +${m} altın (oyuncuya etkisi yok)`);
      }
      if (d.ability === "stag_combo" && al.length > 0) {
        const buff = 2 * m;
        al.forEach((pet) => {
          pet.atk = clampStat(pet.atk + buff);
          pet.curHp = clampStat(pet.curHp + buff);
        });
        lg.push(`🦌 Düşman ${d.nick} -> Düşman takımına +${buff}/+${buff} KALICI`);
      }
      if (d.ability === "faint_buff_self" && al.length > 0) {
        al.forEach((pet) => {
          if (pet.id === d.id) {
            pet.atk = clampStat(pet.atk + 2 * m);
            pet.curHp = clampStat(pet.curHp + 2 * m);
          }
        });
        lg.push(`🦡 Düşman ${d.nick} -> Kendine +${2 * m}/+${2 * m} kalıcı`);
      }
      if (d.ability === "start_trample" && al.length > 0) {
        const buff = 5 * m;
        al[0].atk = clampStat(al[0].atk + buff);
        al[0].trample = true;
        lg.push(`🦏 Düşman ${d.nick} -> +${buff} ATK (çiğneme aktif)`);
      }
      if (d.ability === "hurt_team_buff" && al.length > 0) {
        al.forEach((pet) => {
          pet.atk = clampStat(pet.atk + 3 * m);
          pet.curHp = clampStat(pet.curHp + 3 * m);
        });
        lg.push(`🦬 Düşman ${d.nick} -> Takıma +${3 * m}/+${3 * m}`);
      }
      if (d.ability === "faint_summon") {
        const newSummon = createFaintSummonUnit({
          name: "🥚",
          nick: "Düş.Yavru",
          power: m,
          img: "baby_crocodile.png",
          flip: false,
        });
        applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
        sm.push(newSummon);
        lg.push(`🥚 Düşman ${d.nick} -> ${4 * m}/${4 * m} yavru çağırdı`);
      }
      if (d.ability === "faint_copy" && al.length > 0) {
        applyFaintCopyEffect({
          deadUnit: d,
          power: m,
          allyTeam: al,
          clampStat,
          logs: lg,
          logPrefix: "📋 Düşman ",
          logSuffix: " -> ",
        });
      }
      // Enemy ally reactions resolve after the faint.
      al.forEach((a) => {
        if (a.ability === "friend_faint") {
          const am = pwr(a);
          applyFriendFaintEffect({
            allyUnit: a,
            power: am,
            clampStat,
            logs: lg,
            logPrefix: "🐺 Düşman ",
            logSuffix: " (dost öldü)",
          });
        }
        if (a.ability === "friend_summon" && !a.isSummon) {
          if (!a.summonCount) a.summonCount = 0;
          if (a.summonCount < 3) {
            const am = pwr(a);
            const newSummon = createFriendSummonUnit({
              allyUnit: a,
              power: am,
              name: "🦘",
              nick: "Düş.Yavru",
              img: "joey.png",
              flip: false,
            });
            if (!newSummon) return;
            applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
            sm.push(newSummon);
            lg.push(`🦘 Düşman ${a.nick} -> yavru çağırdı (${a.summonCount}/3)`);
          }
        }
      });
      // Killer follow-up abilities trigger after ally reactions.
      if (killer && killer.ability === "kill_buff") {
        const km = pwr(killer);
        killer.atk = clampStat(killer.atk + 3 * km);
        killer.curHp = clampStat(killer.curHp + 3 * km);
        lg.push(`🦈 Düşman ${killer.nick} -> öldürdü, +${3 * km}/+${3 * km}`);
      }
      // Enemy-side Dodo retriggers replay supported faint effects.
      al.forEach((ally) => {
        if (ally && ally.ability === "summon_retrigger") {
          const dodoM = pwr(ally);
          for (let dodoI = 0; dodoI < dodoM; dodoI++) {
            if (d.ability === "faint_buff" && al.length > 0) {
              applyFaintBuffEffect({
                deadUnit: d,
                power: m,
                allyTeam: al,
                clampStat,
                logs: lg,
                logPrefix: "🦤 Düşman Dodo -> ",
                logSuffix: " efekti tekrar! ",
              });
            }
            if (d.ability === "faint_dmg") {
              applyFaintDamageEffect({
                deadUnit: d,
                power: m,
                enemyTeam: en,
                logs: lg,
                logPrefix: "🦤 Düşman Dodo -> ",
                targetLabel: "Oyuncu takımına",
                logSuffix: " efekti tekrar! ",
              });
            }
            if (d.ability === "faint_shield") {
              applyFaintShieldEffect({
                deadUnit: d,
                power: m,
                allyTeam: al,
                clampStat,
                logs: lg,
                logPrefix: "🦤 Düşman Dodo -> ",
                targetLabel: "Takıma",
                logSuffix: " efekti tekrar! ",
              });
            }
            applyDodoTeamRetriggerEffect({
              ability: d.ability,
              sourceNick: d.nick,
              power: m,
              allyTeam: al,
              enemyTeam: en,
              enemyLabel: "player team",
              logs: lg,
              clampStat,
            });
            if (d.ability === "faint_summon") {
              const extraSummon = createFaintSummonUnit({
                name: "🥚",
                nick: "Düş.Yavru",
                power: m,
                img: "baby_crocodile.png",
                flip: false,
              });
              applySummonBuffs([extraSummon], al, lg, { triggerAnim, spawnParticles });
              sm.push(extraSummon);
              lg.push(`🦤 Düşman Dodo -> ${d.nick} efekti tekrar! Ekstra yavru ${4 * m}/${4 * m}`);
            }
          }
        }
      });
      if (d.ability === "faint_duplicate") {
        pushFaintDuplicateEffect({
          deadUnit: d,
          allyTeam: al,
          summons: sm,
          logs: lg,
          logPrefix: "🐙 Düşman ",
        });
      }
      return { lg, sm, gG: 0 };
    }

    // isP === true (oyuncu tarafı ölümleri)
    if (d.ability === "faint_buff" && al.length > 0) {
      applyFaintBuffEffect({
        deadUnit: d,
        power: m,
        allyTeam: al,
        clampStat,
        logs: lg,
        logPrefix: "💀 ",
        logSuffix: " -> ",
      });
    }
   if (d.ability === "faint_copy" && al.length > 0) {
      applyFaintCopyEffect({
        deadUnit: d,
        power: m,
        allyTeam: al,
        clampStat,
        logs: lg,
        logPrefix: "🦛 ",
        temporary: true,
        logSuffix: " -> ",
      });
    }
    if (d.ability === "faint_dmg") {
      applyFaintDamageEffect({
        deadUnit: d,
        power: m,
        enemyTeam: en,
        logs: lg,
        logPrefix: "☠️ ",
        targetLabel: "Tüm düşmanlara",
        logSuffix: " -> ",
      });
    }
    if (d.ability === "faint_shield") {
      applyFaintShieldEffect({
        deadUnit: d,
        power: m,
        allyTeam: al,
        clampStat,
        logs: lg,
        logPrefix: "🛡️ ",
        targetLabel: "Tüm takıma",
        logSuffix: " -> ",
      });
    }
    applyTeamWideFaintEffect({
      ability: d.ability,
      sourceNick: d.nick,
      power: m,
      allyTeam: al,
      enemyTeam: en,
      clampStat,
      logs: lg,
      teamBuffLabel: "player team",
      enemyLabel: "enemy team",
    });
   if (d.ability === "faint_buff_self" && isP) {
      const m2 = pwr(d);
      applySelfFaintBuffEffect({
        deadUnit: d,
        power: m2,
        allyTeam: al,
        clampStat,
        logs: lg,
        logPrefix: "🦡 ",
        logSuffix: " -> ",
      });
      setTeam((prevTeam) =>
        prevTeam.map((pet) =>
          pet && pet.id === d.id
            ? { ...pet, atk: clampStat(pet.atk + 2 * m2), hp: clampStat(pet.hp + 2 * m2), curHp: clampStat(pet.curHp + 2 * m2) }
            : pet
        )
      );
    }
    if (d.ability === "faint_summon") {
      const newSummon = createFaintSummonUnit({
        name: "🥚",
        nick: "Yavru",
        power: m,
        img: "baby_crocodile.png",
      });
      lg.push(`🥚 ${d.nick} -> ${4 * m}/${4 * m} yavru çağırdı`);
      sm.push(newSummon);
      setTimeout(() => {
        const buffedSummon = { ...newSummon };
        applySummonBuffs([buffedSummon], al, lg, { triggerAnim, spawnParticles });
        Object.assign(newSummon, buffedSummon);
      }, 800);
    }

    if (d.ability === "faint_gold" && isP) {
      gG = m;
      lg.push(`💰 ${d.nick} -> +${m} altın`);
    }
   if (d.ability === "stag_combo") {
      const m2 = pwr(d);
      applyStagComboEffect({
        deadUnit: d,
        power: m2,
        allyTeam: al,
        clampStat,
        logs: lg,
        logPrefix: "🦌 ",
        targetLabel: "Takıma ",
      });
      setTeam((prevTeam) =>
        prevTeam.map((pet) => {
          if (!pet || pet.id === d.id) return pet;
          const isAlive = al.some((bp) => bp && bp.id === pet.id);
          return isAlive
            ? { ...pet, atk: clampStat(pet.atk + 2 * m2), hp: clampStat(pet.hp + 2 * m2), curHp: clampStat(pet.curHp + 2 * m2) }
            : pet;
        })
      );
    }
    // Player ally reactions resolve after the faint.
    if (isP) {
      al.forEach((a) => {
        if (a.ability === "friend_faint") {
          const am = pwr(a);
          applyFriendFaintEffect({
            allyUnit: a,
            power: am,
            clampStat,
            logs: lg,
            logPrefix: "🐺 ",
          });
        }
        if (a.ability === "friend_summon" && !a.isSummon) {
          if (!a.summonCount) a.summonCount = 0;
         if (a.summonCount < 3) {
            const am = pwr(a);
            const newSummon = createFriendSummonUnit({
              allyUnit: a,
              power: am,
              name: "🦘",
              nick: "Yavru",
              img: "joey.png",
            });
            if (!newSummon) return;
            const buffedSummons = applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
            sm.push(...buffedSummons);
            lg.push(`🦘 ${a.nick} -> yavru çağırdı (${a.summonCount}/3)`);
          }
        }
      });
    }
    if (d.ability === "faint_duplicate" && isP) {
      pushFaintDuplicateEffect({
        deadUnit: d,
        allyTeam: al,
        summons: sm,
        logs: lg,
        logPrefix: "🐙 ",
      });
    }
    // Player-side Dodo retriggers replay supported faint effects.
    if (isP) {
      al.forEach((ally) => {
        if (ally && ally.ability === "summon_retrigger") {
          const dodoM = pwr(ally);
          for (let dodoI = 0; dodoI < dodoM; dodoI++) {
            if (d.ability === "faint_buff" && al.length > 0) {
              applyFaintBuffEffect({
                deadUnit: d,
                power: m,
                allyTeam: al,
                clampStat,
                logs: lg,
                logPrefix: "🦤 Dodo -> ",
                logSuffix: " efekti tekrar! ",
              });
            }
            if (d.ability === "faint_dmg") {
              applyFaintDamageEffect({
                deadUnit: d,
                power: m,
                enemyTeam: en,
                logs: lg,
                logPrefix: "🦤 Dodo -> ",
                targetLabel: "Tüm düşmanlara",
                logSuffix: " efekti tekrar! ",
              });
            }
            if (d.ability === "faint_shield") {
              applyFaintShieldEffect({
                deadUnit: d,
                power: m,
                allyTeam: al,
                clampStat,
                logs: lg,
                logPrefix: "🦤 Dodo -> ",
                targetLabel: "Takıma",
                logSuffix: " efekti tekrar! ",
              });
            }
            applyDodoTeamRetriggerEffect({
              ability: d.ability,
              sourceNick: d.nick,
              power: m,
              allyTeam: al,
              enemyTeam: en,
              enemyLabel: "enemy team",
              logs: lg,
              clampStat,
            });
            if (d.ability === "faint_copy" && al.length > 0) {
              applyFaintCopyEffect({
                deadUnit: d,
                power: m,
                allyTeam: al,
                clampStat,
                logs: lg,
                logPrefix: "🦤 Dodo -> ",
                logSuffix: " efekti tekrar! ",
              });
            }
            if (d.ability === "faint_summon") {
              const extraSummon = createFaintSummonUnit({
                name: "🥚",
                nick: "Yavru",
                power: m,
                img: "baby_crocodile.png",
                flip: false,
              });
              applySummonBuffs([extraSummon], al, lg, { triggerAnim, spawnParticles });
              sm.push(extraSummon);
              lg.push(`🦤 Dodo -> ${d.nick} efekti tekrar! Ekstra yavru ${4 * m}/${4 * m}`);
            }
          }
        }
      });
    }
    return { lg, sm, gG };
  };

  // --- SAVAŞ BAŞLATMA FONKSİYONLARI ---

  const startBossBattle = () => {
    setIsBattleOver(false);
    lastProcessedStepRef.current = -1;
    battleGoldRef.current = 0;
    const boss = BOSSES[turn];
    const teamWithPermBuffs = applyPermanentBuffs(team);
    const pt = teamWithPermBuffs
      .filter((x) => x)
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
    const pt = myTeam.filter((x) => x).reverse().map((x) => ({ ...x, curHp: x.hp }));
    const et = theirTeam.filter((x) => x).reverse().map((x) => ({ ...x, curHp: x.hp }));
    if (pt.length === 0) return;
    setET(et);
    setPT(pt);
    setLog([]);
    setStep(0);
    setPhase("battle");
  };

  const versusSetReady = useCallback(async () => {
    if (versusReady) return;
    if (!versusRoom) return;
    const { code, role } = versusRoom;
    const readyTurnField = role === "host" ? "hostReadyTurn" : "guestReadyTurn";
    const teamKey = role === "host" ? "hostTeam" : "guestTeam";
    const currentTeam = team
      .filter((x) => x)
      .map((p) => ({
        name: p.name, nick: p.nick,
        atk: p.atk, hp: p.hp, curHp: p.hp,
        ability: p.ability || "none",
        tier: p.tier, lvl: p.lvl || 1, exp: p.exp || 0,
        id: Math.random(), isBossUnit: false,
      }));
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

    const teamWithPermBuffs = applyPermanentBuffs(team);
    const pt = teamWithPermBuffs
      .filter((x) => x)
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
          return {
            ...p,
            img: p.img || animalData?.img || null,
            id: Math.random(),
            curHp: p.hp,
          };
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
  // --- VERSUS SHOP RESET ---
  useEffect(() => {
    if (phase !== "shop" || !versusRoom || versusPhase !== "playing") return;
    const { code, role } = versusRoom;
    const myReadyTurnField = role === "host" ? "hostReadyTurn" : "guestReadyTurn";
    const myTeamField = role === "host" ? "hostTeam" : "guestTeam";
    updateDoc(doc(db, "versus_rooms", code), {
      [myReadyTurnField]: null,
      [myTeamField]: null,
    }).catch(console.error);
  }, [phase]);
  // --- VERSUS SNAPSHOT LISTENER ---
  useEffect(() => {
    if (!versusRoom || versusPhase !== "playing") return;
    const { code, role } = versusRoom;

    const unsub = onSnapshot(doc(db, "versus_rooms", code), async (snap) => {
      const data = snap.data();
      if (!data) return;

      if (data.loser) {
        const iLost = data.loser === role;
        if (!iLost) {
          setVictory(true);
        }
        return;
      }

      if (phaseRef.current !== "shop") return;

      const currentTurn = turnRef.current;
      const hostReady = data.hostReadyTurn === currentTurn;
      const guestReady = data.guestReadyTurn === currentTurn;
      const theirReady = role === "host" ? guestReady : hostReady;
      setOpponentReady(theirReady);

      if (!hostReady || !guestReady) return;
if (!data.hostTeam || !data.guestTeam) return;
if (data.hostTeam.length === 0 || data.guestTeam.length === 0) return;

      if (role === "host" && !data.battleId) {
        const newBattleId = `${code}_${turnRef.current}_${Date.now()}`;
        try {
          await updateDoc(doc(db, "versus_rooms", code), { battleId: newBattleId });
        } catch (err) {
          console.error("battleId yazma hatası:", err);
        }
        return;
      }

      if (!data.battleId) return;
      if (lastBattleIdRef.current === data.battleId) return;
      lastBattleIdRef.current = data.battleId;

      unsub();

      const myTeam = role === "host" ? data.hostTeam : data.guestTeam;
      const theirTeam = role === "host" ? data.guestTeam : data.hostTeam;
      const opponentName = role === "host"
        ? data.guest?.name || "Rakip"
        : data.host?.name || "Rakip";

      setArenaOpponent({ userName: opponentName });
      startVersusBattle(myTeam, theirTeam);

   if (role === "host") {
  setTimeout(() => {
    updateDoc(doc(db, "versus_rooms", code), {
      battleId: null,
      hostReadyTurn: null,
      guestReadyTurn: null,
      hostTeam: null,
      guestTeam: null,
    });
  }, 2000);
}
    });

    versusUnsubRef.current = unsub;
    return () => { unsub(); };
  }, [versusRoom?.code, versusPhase, turn]);

  // --- ANA SAVAŞ ADIM DÖNGÜSÜ ---
  useEffect(() => {
    if (phase !== "battle" || isBattleOver) return;
    let isCancelled = false;

    if (step > 200) {
      setIsBattleOver(true);
      setLog((l) => [...l, "⏱️ Savaş zaman aşımı!"]);
      setTimeout(() => {
        const newLives = lives - 1;
        setLives(newLives);
       if (newLives <= 0) {
if (gameMode === "arena") {
  handleArenaGameOver(wins, turn);
  return;
}
setOver(true);
if (gameMode === "versus" && versusRoom) {
  const { code, role } = versusRoom;
  updateDoc(doc(db, "versus_rooms", code), { loser: role }).catch(console.error);
}
return;
}
        setTurnAndRef(turnRef.current + 1);
        setGold((g) => g + 10);
        const finalTeam = applyEndTurnBuffs(team);
        setTeam(finalTeam);
        setPendingEndTurnAnims(true);
        setPhase("shop");
      }, 2000);
      return;
    }

   if (pT.length === 0 || eT.length === 0) {
      if (isDebugBattle) return;
      setIsBattleOver(true);
      const won = eT.length === 0 && pT.length > 0;

      if (bossChallenge === "battle") {
        if (won) {
          setBossResult("win");
          setBossChallenge("reward");
          const rewardTier = turn === 5 ? 5 : 6;
          const pool = [...TIERS[rewardTier]];
          const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
          setBossRewards(
            shuffled.map((a) => ({
              ...a, id: Math.random(), lvl: 1, exp: 0, curHp: a.hp,
              isR: true, grp: Math.random(), rT: rewardTier,
            }))
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
         if (newLives <= 0) {
if (gameMode === "arena") {
  handleArenaGameOver(wins, turn);
  return;
}
setOver(true);
if (gameMode === "versus" && versusRoom) {
  const { code, role } = versusRoom;
  updateDoc(doc(db, "versus_rooms", code), { loser: role }).catch(console.error);
}
return;
}
          setTimeout(() => {
            setTurnAndRef(turnRef.current + 1);
            setGold((g) => g + 10);
            const finalTeam = applyEndTurnBuffs(team);
            setTeam(finalTeam);
            setPendingEndTurnAnims(true);
            setPhase("shop");
          }, 3000);
        }
        return;
      }

      const draw = pT.length === 0 && eT.length === 0;
     const updatedTeam = team.map((pet) => {
  if (!pet) return pet;
  const battlePet = pT.find((p) => p?.id === pet.id);
  if (!battlePet) {
    if (pet.ability === "start_fire") {
      const m = pwr(pet);
      return { ...pet, atk: clampStat(pet.atk + 4 * m), curHp: pet.hp };
    }
    return { ...pet, curHp: pet.hp };
  }
  if (pet.ability === "start_multi_snipe") {
    const m = pwr(pet);
    return { ...pet, atk: clampStat(pet.atk + m * 5), hp: clampStat(pet.hp + m * 5), curHp: pet.hp };
  }
  if (pet.ability === "start_all_perm") {
    return { ...pet, atk: battlePet.atk, curHp: pet.hp };
  }
  if (pet.ability === "start_fire") {
    return { ...pet, atk: battlePet.atk, curHp: pet.hp };
  }
  return { ...pet, curHp: pet.hp };
});
      setTeam(updatedTeam);

     if (won) {
        setWins((w) => w + 1);
        setLog((l) => [...l, "🎉 ZAFER!"]);
      }
      if (gameMode === "arena") saveArenaTeam(updatedTeam, difficultyLevel);

      // Koleksiyon istatistiklerini güncelle (sadece Arena'da)
      if (gameMode === "arena") {
        const collection = loadCollection(user?.uid);
        updatedTeam.forEach((pet) => {
          if (!pet) return;
          const key = pet.nick;
          const data = collection[key] || getDefaultAnimalData();
          data.used += 1;
          if (won) data.wins += 1;
          if (pet.lvl > data.maxLvl) data.maxLvl = pet.lvl;
          if (pet.lvl === 3) data.unlocked = true;
          // Görev kontrolleri
          if (data.used >= 3) data.task1 = true;
          if (data.wins >= 5) data.task2 = true;
          if (data.unlocked) data.task3 = true;
          collection[key] = data;
        });
        saveCollection(collection, user?.uid);
        
if (gameMode === "arena") {
  const toId = (nick) => nick
    .toLowerCase()
    .replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ö/g, "o").replace(/ı/g, "i").replace(/ç/g, "c")
    .replace(/\s+/g, "_");

  updatedTeam.forEach((pet) => {
    if (!pet) return;
    const col = collection[pet.nick];
    if (!col) return;
    const id = toId(pet.nick);
    if (col.wins >= 1) unlockAchievement(`use_${id}`);
    if (col.maxLvl >= 2 && col.wins >= 1) unlockAchievement(`lvl2_${id}`);
    if (col.maxLvl >= 3) unlockAchievement(`lvl3_${id}`);
  });
}
      }
     // Görev ilerlemesini güncelle
const taskData = loadTasks(user?.uid);
if (taskData) {
  const updateTask = (tasks) => tasks.map(t => {
    if (t.done) return t;
    let progress = t.progress;
    if (t.type === "battles") progress += 1;
    if (t.type === "wins" && won) progress += 1;
    if (t.type === "arena_wins" && won && gameMode === "arena") progress += 1;
    if (t.type === "tier1_wins" && won && updatedTeam.some(p => p?.tier === 1)) progress += 1;
    if (t.type === "lvl2" && updatedTeam.some(p => p?.lvl >= 2)) progress = Math.max(progress, 1);
    if (t.type === "comeback" && won && lives === 1) progress += 1;
    if (t.type === "unique_animals") {
      const used = new Set(updatedTeam.filter(p => p).map(p => p.nick));
      progress = Math.max(progress, used.size);
    }
    if (t.type === "reach_turn10" && turn >= 10 && gameMode === "arena") progress = 1;
    const done = progress >= t.target;
    return { ...t, progress: Math.min(progress, t.target), done };
  });
  taskData.daily.tasks = updateTask(taskData.daily.tasks);
  taskData.weekly.tasks = updateTask(taskData.weekly.tasks);
  saveTasks(taskData, user?.uid);
  if (saveTasksToDB) saveTasksToDB(taskData);
}
  if (turn === WIN_TURN) {
  if (gameMode === "arena") {
    setLives((l) => l + 1);
    setLog((lg) => [...lg, `♾️ ${WIN_TURN}. tura ulaştın! +1 can ile devam ediyorsun...`]);
  } else {
    setTimeout(() => setVictory(true), 500);
    return;
  }
}
      if (draw) {
        setLog((l) => [...l, "🤝 Berabere"]);
      } else if (!won) {
        const newLives = lives - 1;
        setLives(newLives);
        setLog((l) => [...l, "💀 Yenilgi"]);
      if (newLives <= 0) {
if (gameMode === "arena") {
  handleArenaGameOver(wins, turn);
  return;
}
setOver(true);
if (gameMode === "versus" && versusRoom) {
  const { code, role } = versusRoom;
  updateDoc(doc(db, "versus_rooms", code), { loser: role }).catch(console.error);
}
return;
}
      }

      const newTurn = turn + 1;
      if (gameMode === "arena") {
  if (newTurn >= 5) unlockAchievement("arena_turn5");
  if (newTurn >= 10) unlockAchievement("arena_turn10");
  if (newTurn >= 15) unlockAchievement("arena_turn15");
}
      const currentMaxT = Math.min(Math.ceil(newTurn / 2), 6);
      const willOpenNewTier = currentMaxT > lastT;
      if (newTurn === 5) {
        setNewlyOpenedSlot("shop_4_team_4");
        setTimeout(() => setNewlyOpenedSlot(null), 1200);
      } else if (newTurn === 7) {
        setNewlyOpenedSlot("shop_5_team_5");
        setTimeout(() => setNewlyOpenedSlot(null), 1200);
      }
      setTurnAndRef(newTurn);
      let camelBonus = 0;
      updatedTeam.forEach((pet) => {
        if (pet && pet.ability === "end_gain_gold") camelBonus += pwr(pet);
      });
      setGold((prevGold) => prevGold + 10 + battleGoldRef.current + camelBonus);

      if (!willOpenNewTier) {
        setTeam(updatedTeam);
        setShowSwordClash(false);
        setTimeout(() => { setPendingEndTurnAnims(true); setPhase("shop"); }, 3000);
      } else {
        setTeam(updatedTeam);
        setShowSwordClash(false);
        setTimeout(() => {
          setPendingEndTurnAnims(true);
          setNewTier(currentMaxT);
          setLastT(currentMaxT);
        }, 3000);
      }
      return;
    }

    if (phase !== "battle" || isBattleOver) {
      lastProcessedStepRef.current = -1;
      return;
    }
    if (step === lastProcessedStepRef.current) return;
    lastProcessedStepRef.current = step;
    isCancelled = false;

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

      // Battle playback helpers
      const addBattleLog = (message) => {
        setLog((l) => [...l, message]);
      };

      const playBattleLogs = async (messages, waitMs) => {
        for (const logMsg of messages) {
          addBattleLog(logMsg);
          await delay(waitMs);
        }
      };

      const playDeathAnim = (petId, direction) => {
        triggerAnim(petId, direction);
        spawnDeathEffect(petId);
      };
      if (isCancelled) return;

      const resolveFaintResult = async (result, waitMs) => {
        await playBattleLogs(result.lg, waitMs);
        if (result.gG > 0) battleGoldRef.current += result.gG;
        return result.sm;
      };

      const scheduleDebugBattleReset = () => {
        setIsDebugBattle(false);
        setIsBattleOver(true);
        setTimeout(() => {
          setIsBattleOver(false);
          lastProcessedStepRef.current = -1;
          setPT([]);
          setET([]);
          setStep(0);
          setLog([]);
          setPhase("shop");
          setGameStarted(false);
          setTimeout(() => setShowDebugPanel(true), 50);
        }, 4000);
      };

      const announceDebugWinner = (playerAliveCount, enemyAliveCount) => {
        const winner = enemyAliveCount === 0 && playerAliveCount > 0
          ? "SEN KAZANDIN!"
          : playerAliveCount === 0 && enemyAliveCount > 0
            ? "DUSMAN KAZANDI!"
            : "BERABERLIK!";
        setLog((l) => [...l, "------------------", winner, "------------------"]);
      };


      const syncBattleTeams = (playerTeam, enemyTeam) => {
        if (playerTeam) setPT([...playerTeam]);
        if (enemyTeam) setET([...enemyTeam]);
      };
      const runFaintResolution = async ({
        deadUnit,
        allyTeam,
        enemyTeam,
        isPlayer,
        killer,
        waitMs,
      }) => {
        const result = faint(deadUnit, allyTeam, enemyTeam, isPlayer, killer);
        return resolveFaintResult(result, waitMs);
      };
    // Step 0: Savaş başı yetenekleri
      if (step === 0) {
        await runBattleStartPhase({
          pp: [...pT],
          ee: [...eT],
          delay,
          isCancelled: () => isCancelled,
          triggerAnim,
          clampStat,
          pwr,
          spawnParticles,
          spawnProjectile,
          setLog,
          setTeam,
          syncBattleTeams,
          isDebugBattle,
          announceDebugWinner,
          scheduleDebugBattleReset,
          setStep,
        });
        return;
      }
// Standart Savaş Turu
      if (step > 0) {
        await runBattleTurnPhase({
          pT, eT,
          delay,
          isCancelled: () => isCancelled,
          triggerAnim, clampStat, pwr,
          battleSpeedRef,
          setLog, setPT, setET, setStep, setIsBattleOver, setTeam,
          battleGoldRef,
          faint,
          isDebugBattle,
          announceDebugWinner,
          scheduleDebugBattleReset,
        });
      }
    }, 300);
    return () => {
      isCancelled = true;
      clearTimeout(tmr);
    };

  }, [phase, step]);
  return { battle, startBossBattle, startVersusBattle, versusSetReady };
}

























