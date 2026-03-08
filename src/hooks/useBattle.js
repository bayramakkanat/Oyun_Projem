import { useEffect, useRef, useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  applyPermanentBuffs,
  genE,
  applyEndTurnBuffs,
  applySummonBuffs,
} from "../utils/battleUtils";
import {
  spawnParticles,
  spawnFloatingText,
  spawnDeathEffect,
} from "../utils/animations";
import { BOSSES, TIERS, WIN_TURN } from "../data/gameData";

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
  // Hesaplanan değerler
  difficultyLevel,
  maxT,
  teamSlots,
  difficulty,
  setPGold,
  setRewards,
}) {
  const versusRoomRef = useRef(null);
  const versusUnsubRef = useRef(null);
  const lastBattleIdRef = useRef(null);
  const phaseRef = useRef(phase);
useEffect(() => { phaseRef.current = phase; }, [phase]);

  // --- FAINT FONKSİYONU ---
  const faint = (d, al, en, isP, killer) => {
    if (!d) return { lg: [], sm: [], gG: 0 };
    if (d.isDead) return { lg: [], sm: [], gG: 0 };

    d.isDead = true;
    const m = pwr(d);
    let lg = [], sm = [], gG = 0;

    if (!isP) {
      if (d.ability === "faint_buff" && al.length > 0) {
        const i = Math.floor(Math.random() * al.length);
        al[i].atk = clampStat(al[i].atk + m);
        al[i].curHp = clampStat(al[i].curHp + m);
        lg.push(`💀 Düşman ${d.nick} → ${al[i].nick} e +${m}/+${m}`);
      }
      if (d.ability === "faint_dmg" && en.length > 0) {
        en.forEach((x) => { x.curHp -= m * 2; });
        lg.push(`☠️ Düşman ${d.nick} → Oyuncu takımına ${m * 2} hasar`);
      }
      if (d.ability === "faint_shield" && al.length > 0) {
        al.forEach((x) => { x.curHp = clampStat(x.curHp + 2 * m); });
        lg.push(`🛡️ Düşman ${d.nick} → Düşman takımına +${2 * m} HP`);
      }
      if (d.ability === "faint_rage") {
        const buff = 8 * m;
        al.forEach((x) => {
          x.atk = clampStat(x.atk + buff);
          x.curHp = clampStat(x.curHp + buff);
        });
        lg.push(`😡 Düşman ${d.nick} → Düşman takımına +${buff}/+${buff}`);
      }
      if (d.ability === "faint_wave") {
        en.forEach((x) => { x.curHp -= 9 * m; });
        lg.push(`🌊 Düşman ${d.nick} → Oyuncu takımına ${9 * m} hasar`);
      }
      if (d.ability === "cheetah_faint") {
        const buff = 8 * m;
        al.forEach((x) => {
          x.atk = clampStat(x.atk + buff);
          x.curHp = clampStat(x.curHp + buff);
        });
        lg.push(`💨 Düşman ${d.nick} → Düşman takımına +${buff}/+${buff}`);
      }
      if (d.ability === "faint_gold") {
        lg.push(`💰 Düşman ${d.nick} → +${m} altın (oyuncuya etkisi yok)`);
      }
      if (d.ability === "stag_combo" && al.length > 0) {
        const buff = 2 * m;
        al.forEach((pet) => {
          pet.atk = clampStat(pet.atk + buff);
          pet.curHp = clampStat(pet.curHp + buff);
        });
        lg.push(`🦌 Düşman ${d.nick} → Düşman takımına +${buff}/+${buff} KALICI`);
      }
      if (d.ability === "faint_buff_self" && al.length > 0) {
        al.forEach((pet) => {
          if (pet.id === d.id) {
            pet.atk = clampStat(pet.atk + 2 * m);
            pet.curHp = clampStat(pet.curHp + 2 * m);
          }
        });
        lg.push(`🦡 Düşman ${d.nick} → Kendine +${2 * m}/+${2 * m} kalıcı`);
      }
      if (d.ability === "start_trample" && al.length > 0) {
        const buff = 5 * m;
        al[0].atk = clampStat(al[0].atk + buff);
        al[0].trample = true;
        lg.push(`🦏 Düşman ${d.nick} → +${buff} ATK (çiğneme aktif)`);
      }
      if (d.ability === "hurt_buff" && al.length > 0) {
        const buff = 4 * m;
        al[0].atk = clampStat(al[0].atk + buff);
        lg.push(`🐃 Düşman ${d.nick} → +${buff} ATK (hasar aldı)`);
      }
      if (d.ability === "hurt_team_buff" && al.length > 0) {
        al.forEach((pet) => {
          pet.atk = clampStat(pet.atk + 3 * m);
          pet.curHp = clampStat(pet.curHp + 3 * m);
        });
        lg.push(`🦬 Düşman ${d.nick} → Takıma +${3 * m}/+${3 * m}`);
      }
      if (d.ability === "faint_summon") {
        const newSummon = {
          name: "🥚", nick: "Düş.Yavru",
          atk: 4 * m, hp: 4 * m, curHp: 4 * m,
          ability: "none", tier: 1, lvl: 1, exp: 0, id: Math.random(),
        };
        applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
        sm.push(newSummon);
        lg.push(`🥚 Düşman ${d.nick} → ${4 * m}/${4 * m} yavru çağırdı`);
      }
      if (d.ability === "faint_copy" && al.length > 0) {
        const i = Math.floor(Math.random() * al.length);
        const pct = m === 1 ? 0.25 : m === 2 ? 0.5 : 1;
        const atkGain = Math.floor(d.atk * pct);
        const hpGain = Math.floor(d.hp * pct);
        al[i].atk = clampStat(al[i].atk + atkGain);
        al[i].curHp = clampStat(al[i].curHp + hpGain);
        lg.push(`📋 Düşman ${d.nick} → ${al[i].nick} e +${atkGain}/+${hpGain} kopyalandı`);
      }
      al.forEach((a) => {
        if (a.ability === "friend_faint") {
          const am = pwr(a);
          a.atk = clampStat(a.atk + 2 * am);
          a.curHp = clampStat(a.curHp + 2 * am);
          lg.push(`🐺 Düşman ${a.nick} → +${2 * am}/+${2 * am} (dost öldü)`);
        }
        if (a.ability === "friend_summon" && !a.isSummon) {
          if (!a.summonCount) a.summonCount = 0;
          if (a.summonCount < 3) {
            const am = pwr(a);
            const newSummon = {
              name: "🦘", nick: "Düş.Yavru",
              atk: am * 2, hp: am * 3, curHp: am * 3,
              ability: "none", tier: 1, lvl: 1, exp: 0,
              id: Math.random(), isSummon: true,
            };
            a.summonCount++;
            applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
            sm.push(newSummon);
            lg.push(`🦘 Düşman ${a.nick} → yavru çağırdı (${a.summonCount}/3)`);
          }
        }
      });
      if (killer && killer.ability === "kill_buff") {
        const km = pwr(killer);
        killer.atk = clampStat(killer.atk + 3 * km);
        killer.curHp = clampStat(killer.curHp + 3 * km);
        lg.push(`🦈 Düşman ${killer.nick} → öldürdü, +${3 * km}/+${3 * km}`);
      }
      if (killer && killer.ability === "devour") {
        const pct = (30 + 10 * pwr(killer)) / 100;
        killer.atk = clampStat(killer.atk + Math.floor(d.atk * pct));
        killer.curHp = clampStat(killer.curHp + Math.floor((d.hp || d.curHp) * pct));
        lg.push(`👹 Düşman ${killer.nick} → yuttu, stat kazandı`);
      }
      if (killer && killer.ability === "kill_fear_all" && al.length > 0) {
        const km = pwr(killer);
        al.forEach((x) => {
          x.atk = Math.max(1, x.atk - 5 * km);
          x.curHp = Math.max(0, x.curHp - 5 * km);
        });
        lg.push(`😱 Düşman ${killer.nick} → Oyuncu takımına -${5 * km}/-${5 * km}`);
      }
      al.forEach((ally) => {
        if (ally && ally.ability === "summon_retrigger") {
          const dodoM = pwr(ally);
          for (let dodoI = 0; dodoI < dodoM; dodoI++) {
            if (d.ability === "faint_buff" && al.length > 0) {
              const i = Math.floor(Math.random() * al.length);
              al[i].atk = clampStat(al[i].atk + m);
              al[i].curHp = clampStat(al[i].curHp + m);
              lg.push(`🦤 Düşman Dodo → ${d.nick} efekti tekrar! ${al[i].nick} e +${m}/+${m}`);
            }
            if (d.ability === "faint_dmg") {
              en.forEach((x) => { x.curHp -= m * 2; });
              lg.push(`🦤 Düşman Dodo → ${d.nick} efekti tekrar! Oyuncu takımına ${m * 2} hasar`);
            }
            if (d.ability === "faint_shield") {
              al.forEach((x) => { x.curHp = clampStat(x.curHp + 2 * m); });
              lg.push(`🦤 Düşman Dodo → ${d.nick} efekti tekrar! Takıma +${2 * m} HP`);
            }
            if (d.ability === "faint_rage" || d.ability === "cheetah_faint") {
              const buff = 8 * m;
              al.forEach((x) => {
                x.atk = clampStat(x.atk + buff);
                x.curHp = clampStat(x.curHp + buff);
              });
              lg.push(`🦤 Düşman Dodo → ${d.nick} efekti tekrar! Takıma +${buff}/+${buff}`);
            }
            if (d.ability === "faint_wave") {
              en.forEach((x) => { x.curHp -= 9 * m; });
              lg.push(`🦤 Düşman Dodo → ${d.nick} efekti tekrar! Oyuncu takımına ${9 * m} hasar`);
            }
            if (d.ability === "faint_summon") {
              const extraSummon = {
                name: "🥚", nick: "Düş.Yavru",
                atk: 4 * m, hp: 4 * m, curHp: 4 * m,
                ability: "none", tier: 1, lvl: 1, exp: 0, id: Math.random(),
              };
              applySummonBuffs([extraSummon], al, lg, { triggerAnim, spawnParticles });
              sm.push(extraSummon);
              lg.push(`🦤 Düşman Dodo → ${d.nick} efekti tekrar! Ekstra yavru ${4 * m}/${4 * m}`);
            }
          }
        }
      });
      if (d.ability === "faint_duplicate" && al.length > 0) {
        const i = Math.floor(Math.random() * al.length);
        sm.push({
          ...al[i], id: Math.random(), curHp: al[i].hp,
          ability: al[i].ability === "faint_duplicate" ? "none" : al[i].ability,
        });
        lg.push(`🐙 Düşman ${d.nick} → ${al[i].nick} kopyalandı`);
      }
      return { lg, sm, gG: 0 };
    }

    // isP === true (oyuncu tarafı ölümleri)
    if (d.ability === "faint_buff" && al.length > 0) {
      const i = Math.floor(Math.random() * al.length);
      al[i].atk = clampStat(al[i].atk + m);
      al[i].curHp = clampStat(al[i].curHp + m);
      lg.push(`💀 ${d.nick} → ${al[i].nick} e +${m}/+${m}`);
    }
    if (d.ability === "faint_copy" && al.length > 0) {
      const i = Math.floor(Math.random() * al.length);
      const pct = m === 1 ? 0.25 : m === 2 ? 0.5 : 1;
      const atkGain = Math.floor(d.atk * pct);
      const hpGain = Math.floor(d.hp * pct);
      if (!al[i].tempAtk) al[i].tempAtk = 0;
      if (!al[i].tempHp) al[i].tempHp = 0;
      al[i].tempAtk += atkGain;
      al[i].tempHp += hpGain;
      al[i].curHp = clampStat(al[i].curHp + hpGain);
      lg.push(`🦛 ${d.nick} → ${al[i].nick} e +${atkGain}/+${hpGain} (geçici)`);
    }
    if (d.ability === "faint_dmg") {
      en.forEach((x) => { x.curHp -= m * 2; });
      lg.push(`☠️ ${d.nick} → Tüm düşmanlara ${m * 2} hasar`);
    }
    if (d.ability === "faint_shield") {
      al.forEach((x) => { x.curHp = clampStat(x.curHp + 2 * m); });
      lg.push(`🛡️ ${d.nick} → Tüm takıma +${2 * m} HP`);
    }
    if (d.ability === "faint_rage") {
      const buff = 8 * m;
      al.forEach((x) => {
        x.atk = clampStat(x.atk + buff);
        x.hp = clampStat(x.hp + buff);
        x.curHp = clampStat(x.curHp + buff);
      });
      lg.push(`🐻 ${d.nick} öldü → Tüm takıma +${buff}/+${buff}`);
    }
    if (d.ability === "faint_buff_self" && isP) {
      const m2 = pwr(d);
      setTeam((prevTeam) =>
        prevTeam.map((pet) =>
          pet && pet.id === d.id
            ? {
                ...pet,
                atk: clampStat(pet.atk + 2 * m2),
                hp: clampStat(pet.hp + 2 * m2),
                curHp: clampStat(pet.curHp + 2 * m2),
              }
            : pet
        )
      );
      lg.push(`🦡 ${d.nick} → Kendine +${2 * m2}/+${2 * m2} kalıcı`);
    }
    if (d.ability === "faint_wave") {
      en.forEach((x) => { x.curHp -= 9 * m; });
      lg.push(`🌊 ${d.nick} → Tüm düşmanlara ${9 * m} hasar`);
    }
    if (d.ability === "cheetah_faint") {
      const buff = 8 * m;
      al.forEach((x) => {
        x.atk = clampStat(x.atk + buff);
        x.hp = clampStat(x.hp + buff);
        x.curHp = clampStat(x.curHp + buff);
      });
      lg.push(`💨 ${d.nick} → Tüm takıma +${buff}/+${buff}`);
    }
    if (d.ability === "faint_summon") {
      const newSummon = {
        name: "🥚", nick: "Yavru",
        atk: 4 * m, hp: 4 * m, curHp: 4 * m,
        ability: "none", tier: 1, lvl: 1, exp: 0, id: Math.random(),
      };
      lg.push(`🥚 ${d.nick} → ${4 * m}/${4 * m} yavru çağırdı`);
      sm.push(newSummon);
      setTimeout(() => {
        const buffedSummon = { ...newSummon };
        applySummonBuffs([buffedSummon], al, lg, { triggerAnim, spawnParticles });
        Object.assign(newSummon, buffedSummon);
      }, 800);
    }
    if (killer && killer.ability === "kill_fear_all" && isP && en.length > 0) {
      const km = pwr(killer);
      en.forEach((x) => {
        x.atk = Math.max(1, x.atk - 5 * km);
        x.curHp = Math.max(0, x.curHp - 5 * km);
      });
      lg.push(`🐯 ${killer.nick} → Tüm düşmanlara -${5 * km}/-${5 * km}`);
    }
    if (d.ability === "faint_gold" && isP) {
      gG = m;
      lg.push(`💰 ${d.nick} → +${m} altın`);
    }
    if (d.ability === "stag_combo") {
      const m2 = pwr(d);
      al.forEach((ally, idx) => {
        if (ally && ally.id !== d.id) {
          al[idx] = {
            ...ally,
            atk: clampStat(ally.atk + 2 * m2),
            hp: clampStat(ally.hp + 2 * m2),
            curHp: clampStat(ally.curHp + 2 * m2),
          };
        }
      });
      setTeam((prevTeam) =>
        prevTeam.map((pet) => {
          if (!pet || pet.id === d.id) return pet;
          const isAlive = al.some((bp) => bp && bp.id === pet.id);
          return isAlive
            ? {
                ...pet,
                atk: clampStat(pet.atk + 2 * m2),
                hp: clampStat(pet.hp + 2 * m2),
                curHp: clampStat(pet.curHp + 2 * m2),
              }
            : pet;
        })
      );
      lg.push(`🦌 ${d.nick} → Takıma +${2 * m2}/+${2 * m2} KALICI (ölünce)`);
    }
    if (isP) {
      al.forEach((a) => {
        if (a.ability === "friend_faint") {
          const am = pwr(a);
          a.atk = clampStat(a.atk + 2 * am);
          a.curHp = clampStat(a.curHp + 2 * am);
          lg.push(`🐺 ${a.nick} → +${2 * am}/+${2 * am}`);
        }
        if (a.ability === "friend_summon" && !a.isSummon) {
          if (!a.summonCount) a.summonCount = 0;
          if (a.summonCount < 3) {
            const am = pwr(a);
            const newSummon = {
              name: "🦘", nick: "Yavru",
              atk: am * 2, hp: am * 3, curHp: am * 3,
              ability: "none", tier: 1, lvl: 1, exp: 0,
              id: Math.random(), isSummon: true,
            };
            a.summonCount++;
            const buffedSummons = applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
            sm.push(...buffedSummons);
            lg.push(`🦘 ${a.nick} → yavru çağırdı (${a.summonCount}/3)`);
          }
        }
      });
    }
    if (d.ability === "faint_duplicate" && al.length > 0 && isP) {
      const i = Math.floor(Math.random() * al.length);
      sm.push({
        ...al[i], id: Math.random(), curHp: al[i].hp,
        ability: al[i].ability === "faint_duplicate" ? "none" : al[i].ability,
      });
      lg.push(`🐙 ${d.nick} → ${al[i].nick} kopyalandı`);
    }
    if (isP) {
      al.forEach((ally) => {
        if (ally && ally.ability === "summon_retrigger") {
          const dodoM = pwr(ally);
          for (let dodoI = 0; dodoI < dodoM; dodoI++) {
            if (d.ability === "faint_buff" && al.length > 0) {
              const i = Math.floor(Math.random() * al.length);
              al[i].atk = clampStat(al[i].atk + m);
              al[i].curHp = clampStat(al[i].curHp + m);
              lg.push(`🦤 Dodo → ${d.nick} efekti tekrar! ${al[i].nick} e +${m}/+${m}`);
            }
            if (d.ability === "faint_dmg") {
              en.forEach((x) => { x.curHp -= m * 2; });
              lg.push(`🦤 Dodo → ${d.nick} efekti tekrar! Tüm düşmanlara ${m * 2} hasar`);
            }
            if (d.ability === "faint_shield") {
              al.forEach((x) => { x.curHp = clampStat(x.curHp + 2 * m); });
              lg.push(`🦤 Dodo → ${d.nick} efekti tekrar! Takıma +${2 * m} HP`);
            }
            if (d.ability === "faint_rage" || d.ability === "cheetah_faint") {
              const buff = 8 * m;
              al.forEach((x) => {
                x.atk = clampStat(x.atk + buff);
                x.curHp = clampStat(x.curHp + buff);
              });
              lg.push(`🦤 Dodo → ${d.nick} efekti tekrar! Takıma +${buff}/+${buff}`);
            }
            if (d.ability === "faint_wave") {
              en.forEach((x) => { x.curHp -= 9 * m; });
              lg.push(`🦤 Dodo → ${d.nick} efekti tekrar! Tüm düşmanlara ${9 * m} hasar`);
            }
            if (d.ability === "faint_copy" && al.length > 0) {
              const i = Math.floor(Math.random() * al.length);
              const pct = m === 1 ? 0.25 : m === 2 ? 0.5 : 1;
              const atkGain = Math.floor(d.atk * pct);
              const hpGain = Math.floor(d.hp * pct);
              al[i].atk = clampStat(al[i].atk + atkGain);
              al[i].curHp = clampStat(al[i].curHp + hpGain);
              lg.push(`🦤 Dodo → ${d.nick} efekti tekrar! ${al[i].nick} e +${atkGain}/+${hpGain}`);
            }
            if (d.ability === "faint_summon") {
              const extraSummon = {
                name: "🥚", nick: "Yavru",
                atk: 4 * m, hp: 4 * m, curHp: 4 * m,
                ability: "none", tier: 1, lvl: 1, exp: 0, id: Math.random(),
              };
              applySummonBuffs([extraSummon], al, lg, { triggerAnim, spawnParticles });
              sm.push(extraSummon);
              lg.push(`🦤 Dodo → ${d.nick} efekti tekrar! Ekstra yavru ${4 * m}/${4 * m}`);
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
      const opponentData = await fetchArenaOpponent(difficultyLevel);
      if (opponentData) {
        setArenaOpponent(opponentData);
        et = [...opponentData.team].reverse().map((p) => ({
          ...p, id: Math.random(), curHp: p.hp,
        }));
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
        if (newLives <= 0) { setOver(true); return; }
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
          unlockAchievement("first_win");
          playSound("victory");
        } else {
          setBossResult("lose");
          setBossChallenge(null);
          const newLives = lives - 2;
          setLives(newLives);
          if (newLives <= 0) { setOver(true); return; }
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
        if (!battlePet) return { ...pet, curHp: pet.hp };
        if (pet.ability === "start_multi_snipe") {
          const m = pwr(pet);
          return { ...pet, atk: clampStat(pet.atk + m * 5), hp: clampStat(pet.hp + m * 5), curHp: pet.hp };
        }
        if (pet.ability === "start_all_perm") {
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

      if (turn >= WIN_TURN) {
        setTimeout(() => setVictory(true), 500);
        return;
      }
      if (draw) {
        setLog((l) => [...l, "🤝 Berabere"]);
      } else if (!won) {
        const newLives = lives - 1;
        setLives(newLives);
        setLog((l) => [...l, "💀 Yenilgi"]);
        if (newLives <= 0) { setOver(true); return; }
      }

      const newTurn = turn + 1;
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

      if (isCancelled) return;

      // Step 0: Savaş başı yetenekleri
      if (step === 0) {
        await delay(1200);
        if (isCancelled) return;

        let pp = [...pT];
        let ee = [...eT];

        // 1. Geyik (Stag Combo) - Global Buff
        for (let i = 0; i < pp.length; i++) {
          if (pp[i]?.ability === "stag_combo") {
            const pet = pp[i];
            triggerAnim(pet.id, "ability");
            const m = pwr(pet);
            pp = pp.map((a) => a ? { ...a, atk: clampStat(a.atk + 2 * m), hp: clampStat(a.hp + 2 * m), curHp: clampStat(a.curHp + 2 * m) } : a);
            setTeam((prevTeam) =>
              prevTeam.map((p) => p ? { ...p, atk: clampStat(p.atk + 2 * m), hp: clampStat(p.hp + 2 * m), curHp: clampStat(p.curHp + 2 * m) } : p)
            );
            setLog((l) => [...l, `🦌 ${pet.nick} → Takıma +${2 * m}/+${2 * m} KALICI`]);
            setPT([...pp]);
            await delay(1000);
            if (isCancelled) return;
          }
        }

        // 2. Geçici Bufflar
        for (let i = 0; i < pp.length; i++) {
          const a = pp[i];
          if (a && (a.tempAtk || a.tempHp)) {
            triggerAnim(a.id, "ability");
            if (a.tempAtk) pp[i].atk += a.tempAtk;
            if (a.tempHp) pp[i].curHp += a.tempHp;
            setLog((l) => [...l, `✨ ${a.nick} +${a.tempAtk || 0} ATK / +${a.tempHp || 0} HP (Geçici)`]);
            setPT([...pp]);
            await delay(800);
            if (isCancelled) return;
          }
        }

        // 3. Sıralı 'Takım At Başı' Yetenekleri
        for (let i = 0; i < pp.length; i++) {
          const a = pp[i];
          if (!a) continue;
          const m = pwr(a);
          let triggered = false;

          if (a.ability === "start_buff") {
            pp[i].atk += m;
            setLog((l) => [...l, `⚡ ${a.nick} → +${m} ATK (Savaş Başı)`]);
            triggered = true;
          } else if (a.ability === "start_team_shield") {
            pp = pp.map((x) => x ? { ...x, hp: clampStat(x.hp + m), curHp: clampStat(x.curHp + m) } : x);
            setLog((l) => [...l, `🛡️ ${a.nick} → Tüm takıma +${m} HP`]);
            triggered = true;
          } else if (a.ability === "start_all_perm") {
            const buffAmount = 2 * m;
            pp = pp.map((x) => x ? { ...x, atk: clampStat(x.atk + buffAmount) } : x);
            setTeam((prevTeam) => prevTeam.map((pet) => pet ? { ...pet, atk: clampStat(pet.atk + buffAmount) } : pet));
            pp.forEach((x) => { if (x) triggerAnim(x.id, "buff"); });
            spawnParticles(a.id, "buff");
            setLog((l) => [...l, `🦅 ${a.nick} → Tüm takıma +${2 * m} ATK KALICI`]);
            triggered = true;
          } else if (a.ability === "start_snipe" && ee.length > 0) {
            const targetIdx = ee.length > 1 ? ee.length - 1 : 0;
            ee[targetIdx].curHp -= 3 * m;
            triggerAnim(ee[targetIdx].id, "damage");
            setLog((l) => [...l, `🎯 ${a.nick} → ${ee[targetIdx].nick} e ${3 * m} hasar (arka)`]);
            triggered = true;
          } else if (a.ability === "start_multi_snipe" && ee.length > 0) {
            const targetCount = Math.min(m + 1, ee.length);
            for (let j = 0; j < targetCount; j++) {
              const aliveEe = ee.filter((x) => x && x.curHp > 0);
              if (aliveEe.length > 0) {
                const rndIdx = Math.floor(Math.random() * aliveEe.length);
                const target = aliveEe[rndIdx];
                if (target && target.nick) {
                  target.curHp -= 8 * m;
                  triggerAnim(target.id, "damage");
                  setLog((l) => [...l, `🦑 ${a.nick} → ${target.nick} e ${8 * m} hasar`]);
                }
              }
            }
            triggered = true;
          } else if (a.ability === "start_fear" && ee.length > 0) {
            ee[0].atk = Math.max(1, ee[0].atk - 10 * m);
            triggerAnim(ee[0].id, "damage");
            if (ee.length > 1) {
              ee[1].atk = Math.max(1, ee[1].atk - 10 * m);
              triggerAnim(ee[1].id, "damage");
            }
            const fearTargets = ee.length > 1 ? `${ee[0].nick} ve ${ee[1].nick}` : ee[0].nick;
            setLog((l) => [...l, `🦁 ${a.nick} → ${fearTargets} -${10 * m} ATK!`]);
            triggered = true;
          } else if (a.ability === "start_fire" && ee.length > 0) {
            ee = ee.map((x) => ({ ...x, curHp: x.curHp - 6 * m }));
            ee.forEach((x) => triggerAnim(x.id, "damage"));
            setLog((l) => [...l, `🐉 ${a.nick} → Tüm düşmanlara ${6 * m} hasar`]);
            triggered = true;
          } else if (a.ability === "start_trample") {
            pp[i].atk += 5 * m;
            pp[i].trample = true;
            setLog((l) => [...l, `🦏 ${a.nick} → +${5 * m} ATK (çiğneme aktif)`]);
            triggered = true;
          } else if (a.ability === "start_charge") {
            pp[i].curHp += 2 * m;
            setLog((l) => [...l, `🐗 ${a.nick} → +${2 * m} HP`]);
            triggered = true;
          } else if (a.ability === "start_tank") {
            pp[i].curHp += 3 * m;
            setLog((l) => [...l, `🦀 ${a.nick} → +${3 * m} HP (tank)`]);
            triggered = true;
          } else if (a.ability === "start_dmg" && ee.length > 0) {
            const aliveEe = ee.filter((x) => x && x.curHp > 0);
            if (aliveEe.length > 0) {
              const target = aliveEe[Math.floor(Math.random() * aliveEe.length)];
              if (target && target.nick) {
                target.curHp -= 2 * m;
                triggerAnim(target.id, "damage");
                setLog((l) => [...l, `💥 ${a.nick} → ${target.nick} e ${2 * m} hasar`]);
              }
            }
            triggered = true;
          } else if (a.ability === "start_poison" && ee.length > 0) {
            ee[0].atk = Math.max(1, ee[0].atk - m * 2);
            setLog((l) => [...l, `🐍 ${a.nick} → Ön düşmana -${m * 2} ATK`]);
            triggered = true;
          } else if (a.ability === "start_freeze_enemy" && ee.length > 0) {
            const reduction = (m * 30) / 100;
            ee[0].atk = Math.max(1, Math.floor(ee[0].atk * (1 - reduction)));
            triggerAnim(ee[0].id, "damage");
            if (ee.length > 1) {
              ee[ee.length - 1].atk = Math.max(1, Math.floor(ee[ee.length - 1].atk * (1 - reduction)));
              triggerAnim(ee[ee.length - 1].id, "damage");
            }
            setLog((l) => [...l, `🦣 ${a.nick} → Ön ve arka düşmanı %${m * 30} yavaşlattı`]);
            triggered = true;
          } else if (a.ability === "weaken_strong" && ee.length > 0) {
            let mxI = 0, mxP = 0;
            ee.forEach((en, idx) => {
              if (en.atk + en.curHp > mxP) { mxP = en.atk + en.curHp; mxI = idx; }
            });
            const r = (25 * m) / 100;
            ee[mxI].atk = Math.max(1, Math.floor(ee[mxI].atk * (1 - r)));
            ee[mxI].curHp = Math.max(1, Math.floor(ee[mxI].curHp * (1 - r)));
            triggerAnim(ee[mxI].id, "damage");
            setLog((l) => [...l, `🐧 ${a.nick} → ${ee[mxI].nick}'i %${25 * m} zayıflattı`]);
            triggered = true;
          }

          if (triggered) {
            triggerAnim(a.id, "ability");
            spawnParticles(a.id, "buff");
            ee = ee.filter((x) => x.curHp > 0);
            setPT([...pp]);
            setET([...ee]);
            await delay(1000);
            if (isCancelled) return;
          }
        }

        // 4. Düşman savaş başı yetenekleri
        let finalP = [...pp];
        let finalE = [...ee];

        finalE.forEach((a, i) => {
          const m = pwr(a);
          if (a.ability === "stag_combo") {
            const buff = 2 * m;
            finalE.forEach((x, j) => {
              finalE[j].atk = clampStat(finalE[j].atk + buff);
              finalE[j].hp = clampStat(finalE[j].hp + buff);
              finalE[j].curHp = clampStat(finalE[j].curHp + buff);
            });
            setLog((l) => [...l, `🦌 Düşman ${a.nick} → Düşman takımına +${buff}/+${buff} KALICI`]);
          }
          if (a.ability === "start_buff") finalE[i].atk += m;
          if (a.ability === "start_team_shield") {
            finalE.forEach((x, j) => {
              finalE[j].hp = clampStat(finalE[j].hp + m);
              finalE[j].curHp = clampStat(finalE[j].curHp + m);
            });
          }
          if (a.ability === "start_tank") finalE[i].curHp += 3 * m;
          if (a.ability === "start_charge") finalE[i].curHp += 2 * m;
          if (a.ability === "start_trample") { finalE[i].atk += 5 * m; finalE[i].trample = true; }
          if (a.ability === "start_all_perm") {
            finalE.forEach((x, j) => { finalE[j].atk = clampStat(finalE[j].atk + 2 * m); });
          }
          if (a.ability === "start_dmg" && finalP.length > 0) {
            const t = Math.floor(Math.random() * finalP.length);
            finalP[t].curHp -= 2 * m;
          }
          if (a.ability === "start_snipe" && finalP.length > 0) {
            const t = finalP.length > 1 ? finalP.length - 1 : 0;
            finalP[t].curHp -= 3 * m;
          }
          if (a.ability === "start_fear" && finalP.length > 0) {
            finalP[0].atk = Math.max(1, finalP[0].atk - 10 * m);
            if (finalP.length > 1) finalP[1].atk = Math.max(1, finalP[1].atk - 10 * m);
          }
          if (a.ability === "start_fire") {
            finalP.forEach((x) => { x.curHp -= 6 * m; });
            finalE[i].atk = clampStat(finalE[i].atk + 4 * m);
          }
          if (a.ability === "start_poison" && finalP.length > 0) {
            finalP[0].atk = Math.max(1, finalP[0].atk - m * 2);
          }
          if (a.ability === "start_freeze_enemy" && finalP.length > 0) {
            const reduction = (m * 30) / 100;
            finalP[0].atk = Math.max(1, Math.floor(finalP[0].atk * (1 - reduction)));
            if (finalP.length > 1)
              finalP[finalP.length - 1].atk = Math.max(1, Math.floor(finalP[finalP.length - 1].atk * (1 - reduction)));
          }
          if (a.ability === "start_multi_snipe" && finalP.length > 0) {
            const targetCount = Math.min(m + 1, finalP.length);
            for (let j = 0; j < targetCount; j++) {
              const rndIdx = Math.floor(Math.random() * finalP.length);
              finalP[rndIdx].curHp -= 8 * m;
            }
          }
          if (a.ability === "weaken_strong" && finalP.length > 0) {
            let mxI = 0, mxP = 0;
            finalP.forEach((en, idx) => {
              if (en.atk + en.curHp > mxP) { mxP = en.atk + en.curHp; mxI = idx; }
            });
            const r = (25 * m) / 100;
            finalP[mxI].atk = Math.max(1, Math.floor(finalP[mxI].atk * (1 - r)));
            finalP[mxI].curHp = Math.max(1, Math.floor(finalP[mxI].curHp * (1 - r)));
          }
        });

        // Düşman savaş başı logları
        finalE.forEach((a) => {
          const m = pwr(a);
          if (a.ability === "start_dmg") setLog((l) => [...l, `💥 Düşman ${a.nick} → Takıma ${2 * m} hasar`]);
          if (a.ability === "start_snipe") setLog((l) => [...l, `🎯 Düşman ${a.nick} → ${finalP[finalP.length > 1 ? finalP.length - 1 : 0]?.nick || "Arka birim"}'e ${3 * m} hasar`]);
          if (a.ability === "start_fire") setLog((l) => [...l, `🐉 Düşman ${a.nick} → Tüm takıma ${6 * m} hasar`]);
          if (a.ability === "start_fear") setLog((l) => [...l, `😱 Düşman ${a.nick} → ${finalP[0]?.nick || ""}${finalP.length > 1 ? ` ve ${finalP[1]?.nick}` : ""} -${10 * m} ATK`]);
          if (a.ability === "start_poison") setLog((l) => [...l, `🐍 Düşman ${a.nick} → Ön birime -${m * 2} ATK`]);
          if (a.ability === "start_multi_snipe") setLog((l) => [...l, `🦑 Düşman ${a.nick} → ${m + 1} birime ${8 * m} hasar`]);
          if (a.ability === "start_freeze_enemy") setLog((l) => [...l, `🦣 Düşman ${a.nick} → Ön ve arka birimi %${m * 30} yavaşlattı`]);
          if (a.ability === "weaken_strong") setLog((l) => [...l, `🐧 Düşman ${a.nick} → En güçlü birimi %${25 * m} zayıflattı`]);
          if (a.ability === "start_buff") setLog((l) => [...l, `⚡ Düşman ${a.nick} → Kendine +${m} ATK`]);
          if (a.ability === "start_team_shield") setLog((l) => [...l, `🛡️ Düşman ${a.nick} → Düşman takımına +${m} HP`]);
          if (a.ability === "start_tank") setLog((l) => [...l, `🦀 Düşman ${a.nick} → +${3 * m} HP`]);
          if (a.ability === "start_charge") setLog((l) => [...l, `🐗 Düşman ${a.nick} → +${2 * m} HP`]);
          if (a.ability === "start_trample") setLog((l) => [...l, `🦏 Düşman ${a.nick} → +${5 * m} ATK (çiğneme)`]);
          if (a.ability === "start_all_perm") setLog((l) => [...l, `🦅 Düşman ${a.nick} → Düşman takımına +${2 * m} ATK`]);
        });

        finalE = finalE.filter((x) => x.curHp > 0);
        finalP = finalP.filter((x) => x.curHp > 0);
        setPT(finalP);
        setET(finalE);
        setStep((s) => s + 1);
        await delay(500);
        if (isCancelled) return;
      }

      // Standart Savaş Turu
      if (step === 0) return;
      let p = [...pT].filter((x) => x.curHp > 0);
      let e = [...eT].filter((x) => x.curHp > 0);
      if (p.length === 0 && pT.length === 0) { setIsBattleOver(true); return; }
      if (e.length === 0 && eT.length === 0) { setIsBattleOver(true); return; }
      if (p.length === 0 || e.length === 0) return;

      let lg = [];
      const a = p[0];
      const d = e[0];
      let pS = [];
      let eS = [];
      const oldAId = a.id;
      const oldDId = d.id;
      let aD = a.atk;
      let dD = d.atk;

      triggerAnim(a.id, "attackLeft");
      triggerAnim(d.id, "attackRight");
      await delay(2000);
      if (isCancelled) return;

      p[0].curHp -= dD;
      e[0].curHp -= aD;

      setTimeout(() => {
        const aEl = document.querySelector(`[data-pet-id="${a.id}"]`);
        const dEl = document.querySelector(`[data-pet-id="${d.id}"]`);
        if (aEl && dD > 0) {
          const rect = aEl.getBoundingClientRect();
          spawnFloatingText(`-${dD}`, rect.left + rect.width / 2, rect.top, "damage");
        }
        if (dEl && aD > 0) {
          const rect = dEl.getBoundingClientRect();
          spawnFloatingText(`-${aD}`, rect.left + rect.width / 2, rect.top, "damage");
        }
      }, 300 / battleSpeedRef.current);

      if (a.trample && e[0].curHp <= 0 && e.length > 1) {
        const excess = Math.abs(e[0].curHp);
        e[1].curHp -= excess;
        lg.push(`🦏 ${a.nick} → Arka düşmana ${excess} hasar (çiğneme)`);
      }
      if (d.trample && p[0].curHp <= 0 && p.length > 1) {
        const excess = Math.abs(p[0].curHp);
        p[1].curHp -= excess;
        lg.push(`🦏 Düşman ${d.nick} → Arka oyuncu birimine ${excess} hasar (çiğneme)`);
      }

      triggerAnim(a.id, "damage");
      triggerAnim(d.id, "damage");
      await delay(1400);
      if (isCancelled) return;

      setLog((l) => [...l, ...lg]);

      // Savaş sırası yetenekleri
      if (a.ability === "atk_buff" && p[0].curHp > 0) {
        p[0].atk = clampStat(p[0].atk + pwr(a));
        triggerAnim(a.id, "buff");
        setLog((l) => [...l, `💪 ${a.nick} → +${pwr(a)} ATK`]);
        await delay(500);
      }
      if (a.ability === "start_charge" && p[0].curHp > 0) {
        p[0].atk = clampStat(p[0].atk + 2 * pwr(a));
        triggerAnim(a.id, "buff");
        setLog((l) => [...l, `🐗 ${a.nick} → +${2 * pwr(a)} ATK`]);
        await delay(500);
      }
      if (a.ability === "hurt_buff" && p[0].curHp > 0 && dD > 0) {
        const buff = 4 * pwr(a);
        p[0].atk = clampStat(p[0].atk + buff);
        triggerAnim(a.id, "buff");
        setLog((l) => [...l, `🐃 ${a.nick} → +${buff} ATK`]);
        await delay(500);
      }
      if (a.ability === "hurt_team_buff" && p[0].curHp > 0 && dD > 0) {
        const m = pwr(a);
        p.forEach((pet) => {
          if (pet && pet.curHp > 0) {
            pet.atk = clampStat(pet.atk + 3 * m);
            pet.curHp = clampStat(pet.curHp + 3 * m);
            triggerAnim(pet.id, "buff");
          }
        });
        setLog((l) => [...l, `🦬 ${a.nick} hasar aldı → Takıma +${3 * pwr(a)}/+${3 * pwr(a)}`]);
        await delay(500);
      }
      if (a.ability === "hurt_dmg" && p[0].curHp > 0 && dD > 0 && e.length > 0) {
        const aliveE = e.filter((x) => x.curHp > 0);
        if (aliveE.length > 0) {
          const target = aliveE[Math.floor(Math.random() * aliveE.length)];
          const targetIdx = e.findIndex((x) => x.id === target.id);
          const damage = 9 * pwr(a);
          e[targetIdx].curHp -= damage;
          triggerAnim(e[targetIdx].id, "damage");
          setLog((l) => [...l, `🐘 ${a.nick} → ${e[targetIdx].nick} e ${damage} hasar`]);
          await delay(600);
        }
      }
      if (d.ability === "hurt_dmg" && e[0].curHp > 0 && aD > 0 && p.length > 0) {
        const aliveP = p.filter((x) => x.curHp > 0);
        if (aliveP.length === 0) {
          await delay(500);
        } else {
          const target = aliveP[Math.floor(Math.random() * aliveP.length)];
          const targetIdx = p.findIndex((x) => x.id === target.id);
          const damage = 9 * pwr(d);
          p[targetIdx].curHp -= damage;
          triggerAnim(p[targetIdx].id, "damage");
          setLog((l) => [...l, `🐘 Düşman ${d.nick} → ${p[targetIdx].nick} e ${damage} hasar`]);
          await delay(600);
        }
      }
      if (a.ability === "hurt_weaken_attacker" && p[0].curHp > 0 && dD > 0 && e[0] && p[0].id === a.id) {
        const wm = pwr(a);
        const weakenPercent = wm === 1 ? 0.33 : wm === 2 ? 0.66 : 0.99;
        e[0].atk = Math.max(1, Math.floor(e[0].atk * (1 - weakenPercent)));
        triggerAnim(e[0].id, "damage");
        setLog((l) => [...l, `🦨 ${a.nick} → ${e[0].nick} -%${weakenPercent * 100} ATK`]);
        await delay(500);
      }
      if (a.ability === "kill_buff" && e[0].curHp <= 0) {
        p[0].atk = clampStat(p[0].atk + 3 * pwr(a));
        p[0].curHp = clampStat(p[0].curHp + 3 * pwr(a));
        triggerAnim(a.id, "buff");
        setLog((l) => [...l, `🦈 ${a.nick} → +${3 * pwr(a)}/+${3 * pwr(a)}`]);
        await delay(500);
      }
      if (a.ability === "kill_heal_team" && e[0].curHp <= 0) {
        const m = pwr(a);
        p.forEach((pet, idx) => {
          if (pet && pet.curHp > 0) {
            p[idx] = { ...pet, atk: clampStat(pet.atk + 3 * m), hp: clampStat(pet.hp + 3 * m), curHp: clampStat(pet.curHp + 3 * m) };
            triggerAnim(pet.id, "buff");
          }
        });
        setTeam((prevTeam) =>
          prevTeam.map((pet) => {
            if (!pet) return pet;
            const alive = p.some((bp) => bp && bp.id === pet.id && bp.curHp > 0);
            return alive ? { ...pet, atk: clampStat(pet.atk + 3 * m), hp: clampStat(pet.hp + 3 * m), curHp: clampStat(pet.curHp + 3 * m) } : pet;
          })
        );
        setLog((l) => [...l, `🦭 ${a.nick} → Takıma +${3 * pwr(a)}/+${3 * pwr(a)} KALICI`]);
        await delay(800);
      }
      if (a.ability === "kill_fear_all" && e[0].curHp <= 0 && p[0].id === a.id) {
        const m = pwr(a);
        e.forEach((enemy) => {
          enemy.atk = Math.max(1, enemy.atk - 5 * m);
          enemy.curHp = Math.max(0, enemy.curHp - 5 * m);
          triggerAnim(enemy.id, "damage");
        });
        setLog((l) => [...l, `😱 ${a.nick} → Tüm düşmanlara -${5 * m}/-${5 * m}`]);
        await delay(500);
      }
      if (d.ability === "devour" && p[0].curHp <= 0) {
        const pctD = (30 + 10 * pwr(d)) / 100;
        const atkGainD = Math.floor(p[0].atk * pctD);
        const hpGainD = Math.floor((p[0].hp || p[0].curHp) * pctD);
        e[0].atk = clampStat(e[0].atk + atkGainD);
        e[0].hp = clampStat(e[0].hp + hpGainD);
        e[0].curHp = clampStat(e[0].curHp + hpGainD);
        triggerAnim(d.id, "buff");
        setLog((l) => [...l, `👹 Düşman ${d.nick} → +${atkGainD}/+${hpGainD}`]);
        await delay(500);
      }
      if (d.ability === "kill_buff" && p[0].curHp <= 0) {
        e[0].atk = clampStat(e[0].atk + 3 * pwr(d));
        e[0].curHp = clampStat(e[0].curHp + 3 * pwr(d));
        triggerAnim(d.id, "buff");
        setLog((l) => [...l, `🦈 Düşman ${d.nick} → +${3 * pwr(d)}/+${3 * pwr(d)}`]);
        await delay(500);
      }
      if (d.ability === "kill_heal_team" && p[0].curHp <= 0) {
        const km = pwr(d);
        e.forEach((pet, idx) => {
          if (pet && pet.curHp > 0) {
            e[idx] = { ...pet, atk: clampStat(pet.atk + 3 * km), hp: clampStat(pet.hp + 3 * km), curHp: clampStat(pet.curHp + 3 * km) };
            triggerAnim(pet.id, "buff");
          }
        });
        setLog((l) => [...l, `🦭 Düşman ${d.nick} → Takıma +${3 * km}/+${3 * km} KALICI`]);
        await delay(800);
      }
      if (d.ability === "kill_fear_all" && p[0].curHp <= 0) {
        const kfm = pwr(d);
        p.forEach((pet) => {
          pet.atk = Math.max(1, pet.atk - 5 * kfm);
          pet.curHp = Math.max(0, pet.curHp - 5 * kfm);
          triggerAnim(pet.id, "damage");
        });
        setLog((l) => [...l, `😱 Düşman ${d.nick} → Oyuncu takımına -${5 * kfm}/-${5 * kfm}`]);
        await delay(500);
      }
      if (d.ability === "atk_buff" && e[0].curHp > 0) {
        e[0].atk = clampStat(e[0].atk + pwr(d));
        triggerAnim(d.id, "buff");
        setLog((l) => [...l, `💪 Düşman ${d.nick} → +${pwr(d)} ATK`]);
        await delay(500);
      }
      if (d.ability === "hurt_buff" && e[0].curHp > 0 && aD > 0) {
        const hbuff = 4 * pwr(d);
        e[0].atk = clampStat(e[0].atk + hbuff);
        triggerAnim(d.id, "buff");
        setLog((l) => [...l, `🐃 Düşman ${d.nick} → +${hbuff} ATK`]);
        await delay(500);
      }
      if (d.ability === "hurt_team_buff" && e[0].curHp > 0 && aD > 0) {
        const htm = pwr(d);
        e.forEach((pet) => {
          if (pet && pet.curHp > 0) {
            pet.atk = clampStat(pet.atk + 3 * htm);
            pet.curHp = clampStat(pet.curHp + 3 * htm);
            triggerAnim(pet.id, "buff");
          }
        });
        setLog((l) => [...l, `🦬 Düşman ${d.nick} hasar aldı → Takıma +${3 * pwr(d)}/+${3 * pwr(d)}`]);
        await delay(500);
      }
      if (d.ability === "hurt_weaken_attacker" && e[0].curHp > 0 && aD > 0 && p[0]) {
        const hwm = pwr(d);
        const weakenPct = hwm === 1 ? 0.33 : hwm === 2 ? 0.66 : 0.99;
        p[0].atk = Math.max(1, Math.floor(p[0].atk * (1 - weakenPct)));
        triggerAnim(p[0].id, "damage");
        setLog((l) => [...l, `🦨 Düşman ${d.nick} → ${p[0].nick} -%${weakenPct * 100} ATK`]);
        await delay(500);
      }
      if (d.ability === "start_charge" && e[0].curHp > 0) {
        e[0].atk = clampStat(e[0].atk + 2 * pwr(d));
        triggerAnim(d.id, "buff");
        setLog((l) => [...l, `🐗 Düşman ${d.nick} → +${2 * pwr(d)} ATK`]);
        await delay(500);
      }
      if (a.ability === "devour" && e[0].curHp <= 0) {
        const pct = (30 + 10 * pwr(a)) / 100;
        const atkGain = Math.floor(e[0].atk * pct);
        const hpGain = Math.floor((e[0].hp || e[0].curHp) * pct);
        p[0].atk = clampStat(p[0].atk + atkGain);
        p[0].hp = clampStat(p[0].hp + hpGain);
        p[0].curHp = clampStat(p[0].curHp + hpGain);
        triggerAnim(a.id, "buff");
        setLog((l) => [...l, `👹 ${a.nick} → +${atkGain}/+${hpGain}`]);
        await delay(500);
      }

      // Ara ölüm kontrolleri
      for (let i = 1; i < p.length; i++) {
        if (p[i].curHp <= 0) {
          triggerAnim(p[i].id, "deathLeft");
          spawnDeathEffect(p[i].id);
          const deadPet = p[i];
          p = p.filter((_, idx) => idx !== i);
          const r = faint(deadPet, p, e, true, e.length > 0 ? e[0] : null);
          for (const logMsg of r.lg) { setLog((l) => [...l, logMsg]); await delay(800); }
          pS = [...pS, ...r.sm];
          if (r.gG > 0) battleGoldRef.current += r.gG;
          i--;
        }
      }
      for (let i = 1; i < e.length; i++) {
        if (e[i].curHp <= 0) {
          triggerAnim(e[i].id, "deathRight");
          spawnDeathEffect(e[i].id);
          const deadEnemy = e[i];
          e = e.filter((_, idx) => idx !== i);
          const r = faint(deadEnemy, e, p, false, p.length > 0 ? p[0] : null);
          for (const logMsg of r.lg) { setLog((l) => [...l, logMsg]); await delay(300); }
          eS = [...eS, ...r.sm];
          i--;
        }
      }

      // Ön hayvan ölüm kontrolleri
      if (p[0] && p[0].curHp <= 0) {
        triggerAnim(p[0].id, "deathLeft");
        spawnDeathEffect(p[0].id);
        const deadPet = p[0];
        p = p.slice(1);
        const r = faint(deadPet, p, e, true, e.length > 0 && e[0].curHp > 0 ? e[0] : null);
        for (const logMsg of r.lg) { setLog((l) => [...l, logMsg]); await delay(800); }
        pS = [...pS, ...r.sm];
        if (r.gG > 0) battleGoldRef.current += r.gG;
        await delay(500);
      }
      if (e[0] && e[0].curHp <= 0) {
        triggerAnim(e[0].id, "deathRight");
        spawnDeathEffect(e[0].id);
        const deadEnemy = e[0];
        e = e.slice(1);
        const r = faint(deadEnemy, e, p, false, p.length > 0 && p[0].curHp > 0 ? p[0] : null);
        for (const logMsg of r.lg) { setLog((l) => [...l, logMsg]); await delay(300); }
        eS = [...eS, ...r.sm];
        await delay(500);
      }

      pS = pS.filter((x) => x.curHp > 0);
      eS = eS.filter((x) => x.curHp > 0);
      for (let i = 0; i < eS.length; i++) {
        if (eS[i].curHp <= 0) {
          triggerAnim(eS[i].id, "deathRight");
          spawnDeathEffect(eS[i].id);
          const deadEnemy = eS[i];
          eS = eS.filter((_, idx) => idx !== i);
          const r = faint(deadEnemy, [...eS, ...e], p, false, p.length > 0 ? p[0] : null);
          for (const logMsg of r.lg) { setLog((l) => [...l, logMsg]); await delay(300); }
          eS = [...eS, ...r.sm];
          i--;
        }
      }

      const newP = [...pS, ...p].filter((x) => x.curHp > 0);
      const newE = [...eS, ...e].filter((x) => x.curHp > 0);

      if (newP.length === 0 || newE.length === 0) {
        setPT(newP);
        setET(newE);
        if (isDebugBattle) {
          setIsDebugBattle(false);
          setIsBattleOver(true);
          const winner = newE.length === 0 && newP.length > 0 ? "🎉 SEN KAZANDIN!" : newP.length === 0 && newE.length > 0 ? "💀 DÜŞMAN KAZANDI!" : "🤝 BERABERLİK!";
          setLog((l) => [...l, `━━━━━━━━━━━━━━━━━━`, winner, `━━━━━━━━━━━━━━━━━━`]);
          setTimeout(() => {
            setIsBattleOver(false);
            lastProcessedStepRef.current = -1;
            setPhase("shop");
            setGameStarted(false);
            setShowDebugPanel(true);
          }, 4000);
          return;
        }
        setStep((s) => s + 1);
        return;
      }

      if (newP.length > 0 && newP[0].id !== oldAId) triggerAnim(newP[0].id, "slideInLeft");
      if (newE.length > 0 && newE[0].id !== oldDId) triggerAnim(newE[0].id, "slideInRight");

      await delay(100);
      setPT(newP);
      setET(newE);
      setStep((s) => s + 1);
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(tmr);
    };
  }, [phase, step]);

  return { battle, startBossBattle, startVersusBattle, versusSetReady };
}