import { useEffect, useRef, useCallback } from "react";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
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
useEffect(() => { phaseRef.current = phase; }, [phase]);

  // --- FAINT FONKSİYONU ---
  const applyDamageAnimToTeam = (team) => {
    team.forEach((pet) => {
      triggerAnim(pet.id, "damage");
    });
  };

  const applyFearToTeam = (team, power, minHp = 0) => {
    const debuff = getFearAllDebuff(power);
    team.forEach((pet) => {
      pet.atk = Math.max(1, pet.atk - debuff);
      pet.curHp = Math.max(minHp, pet.curHp - debuff);
      triggerAnim(pet.id, "damage");
    });
    return debuff;
  };

  const applyFaintWeakenToTeam = (team, power, minHp = 0) => {
    const debuff = getFaintWeakenAllDebuff(power);
    team.forEach((pet) => {
      pet.atk = Math.max(1, pet.atk - debuff);
      pet.curHp = Math.max(minHp, pet.curHp - debuff);
      triggerAnim(pet.id, "damage");
    });
    return debuff;
  };

  const applyHurtTeamBuff = (team, amount) => {
    team.forEach((pet) => {
      if (pet && pet.curHp > 0) {
        pet.atk = clampStat(pet.atk + amount);
        pet.curHp = clampStat(pet.curHp + amount);
        triggerAnim(pet.id, "buff");
      }
    });
  };

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
        lg.push(`💀 Düşman ${d.nick} -> ${al[i].nick} e +${m}/+${m}`);
      }
      if (d.ability === "faint_dmg" && en.length > 0) {
        en.forEach((x) => { x.curHp -= m * 2; });
        lg.push(`☠️ Düşman ${d.nick} -> Oyuncu takımına ${m * 2} hasar`);
      }
      if (d.ability === "faint_shield" && al.length > 0) {
        al.forEach((x) => { x.curHp = clampStat(x.curHp + 2 * m); });
        lg.push(`🛡️ Düşman ${d.nick} -> Düşman takımına +${2 * m} HP`);
      }
      if (d.ability === "faint_rage") {
        const buff = getTeamBuffAmount(m);
        applyTeamBuff(al, buff, clampStat);
        lg.push(`${d.nick} faint_rage -> enemy team +${buff}/+${buff}`);
      }
      if (d.ability === "faint_wave") {
        const damage = getWaveDamage(m);
        applyTeamDamage(en, damage);
        lg.push(`${d.nick} faint_wave -> player team ${damage} damage`);
      }
      if (d.ability === "cheetah_faint") {
        const buff = getTeamBuffAmount(m);
        applyTeamBuff(al, buff, clampStat);
        lg.push(`${d.nick} cheetah_faint -> enemy team +${buff}/+${buff}`);
      }
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
       const newSummon = {
  name: "🥚", nick: "Düş.Yavru",
  atk: 4 * m, hp: 4 * m, curHp: 4 * m,
  ability: "none", tier: 1, lvl: 1, exp: 0, id: Math.random(),
  img: "baby_crocodile.png", flip: false,
};
        applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
        sm.push(newSummon);
        lg.push(`🥚 Düşman ${d.nick} -> ${4 * m}/${4 * m} yavru çağırdı`);
      }
      if (d.ability === "faint_copy" && al.length > 0) {
        const i = Math.floor(Math.random() * al.length);
        const pct = m === 1 ? 0.25 : m === 2 ? 0.5 : 1;
        const atkGain = Math.floor(d.atk * pct);
        const hpGain = Math.floor(d.hp * pct);
        al[i].atk = clampStat(al[i].atk + atkGain);
        al[i].curHp = clampStat(al[i].curHp + hpGain);
        lg.push(`📋 Düşman ${d.nick} -> ${al[i].nick} e +${atkGain}/+${hpGain} kopyalandı`);
      }
      al.forEach((a) => {
        if (a.ability === "friend_faint") {
          const am = pwr(a);
          a.atk = clampStat(a.atk + 2 * am);
          a.curHp = clampStat(a.curHp + 2 * am);
          lg.push(`🐺 Düşman ${a.nick} -> +${2 * am}/+${2 * am} (dost öldü)`);
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
  img: "joey.png", flip: false,
};
            a.summonCount++;
            applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
            sm.push(newSummon);
            lg.push(`🦘 Düşman ${a.nick} -> yavru çağırdı (${a.summonCount}/3)`);
          }
        }
      });
      if (killer && killer.ability === "kill_buff") {
        const km = pwr(killer);
        killer.atk = clampStat(killer.atk + 3 * km);
        killer.curHp = clampStat(killer.curHp + 3 * km);
        lg.push(`🦈 Düşman ${killer.nick} -> öldürdü, +${3 * km}/+${3 * km}`);
      }
     if (killer && killer.ability === "kill_fear_all" && al.length > 0) {
  const debuff = getFearAllDebuff(pwr(killer));
  applyTeamDebuff(al, debuff);
  lg.push(`Fear -> ${killer.nick} -> enemy team -${debuff}/-${debuff}`);
}
      al.forEach((ally) => {
        if (ally && ally.ability === "summon_retrigger") {
          const dodoM = pwr(ally);
          for (let dodoI = 0; dodoI < dodoM; dodoI++) {
            if (d.ability === "faint_buff" && al.length > 0) {
              const i = Math.floor(Math.random() * al.length);
              al[i].atk = clampStat(al[i].atk + m);
              al[i].curHp = clampStat(al[i].curHp + m);
              lg.push(`🦤 Düşman Dodo -> ${d.nick} efekti tekrar! ${al[i].nick} e +${m}/+${m}`);
            }
            if (d.ability === "faint_dmg") {
              en.forEach((x) => { x.curHp -= m * 2; });
              lg.push(`🦤 Düşman Dodo -> ${d.nick} efekti tekrar! Oyuncu takımına ${m * 2} hasar`);
            }
            if (d.ability === "faint_shield") {
              al.forEach((x) => { x.curHp = clampStat(x.curHp + 2 * m); });
              lg.push(`🦤 Düşman Dodo -> ${d.nick} efekti tekrar! Takıma +${2 * m} HP`);
            }
            if (d.ability === "faint_rage" || d.ability === "cheetah_faint") {
              const buff = getTeamBuffAmount(m);
              applyTeamBuff(al, buff, clampStat);
              lg.push(`Dodo retrigger -> ${d.nick} -> team +${buff}/+${buff}`);
            }
            if (d.ability === "faint_wave") {
              const damage = getWaveDamage(m);
              applyTeamDamage(en, damage);
              lg.push(`Dodo retrigger -> ${d.nick} -> player team ${damage} damage`);
            }
            if (d.ability === "faint_weaken_all") {
              const debuff = getFaintWeakenAllDebuff(m);
              applyTeamDebuff(en, debuff);
              lg.push(`Dodo retrigger -> ${d.nick} -> player team -${debuff}/-${debuff}`);
            }
            if (d.ability === "faint_summon") {
             const extraSummon = {
  name: "🥚", nick: "Düş.Yavru",
  atk: 4 * m, hp: 4 * m, curHp: 4 * m,
  ability: "none", tier: 1, lvl: 1, exp: 0, id: Math.random(),
  img: "baby_crocodile.png", flip: false,
};
              applySummonBuffs([extraSummon], al, lg, { triggerAnim, spawnParticles });
              sm.push(extraSummon);
              lg.push(`🦤 Düşman Dodo -> ${d.nick} efekti tekrar! Ekstra yavru ${4 * m}/${4 * m}`);
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
        lg.push(`🐙 Düşman ${d.nick} -> ${al[i].nick} kopyalandı`);
      }
      return { lg, sm, gG: 0 };
    }

    // isP === true (oyuncu tarafı ölümleri)
    if (d.ability === "faint_buff" && al.length > 0) {
      const i = Math.floor(Math.random() * al.length);
      al[i].atk = clampStat(al[i].atk + m);
      al[i].curHp = clampStat(al[i].curHp + m);
      lg.push(`💀 ${d.nick} -> ${al[i].nick} e +${m}/+${m}`);
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
      lg.push(`🦛 ${d.nick} -> ${al[i].nick} e +${atkGain}/+${hpGain} (geçici)`);
    }
    if (d.ability === "faint_dmg") {
      en.forEach((x) => { x.curHp -= m * 2; });
      lg.push(`☠️ ${d.nick} -> Tüm düşmanlara ${m * 2} hasar`);
    }
    if (d.ability === "faint_shield") {
      al.forEach((x) => { x.curHp = clampStat(x.curHp + 2 * m); });
      lg.push(`🛡️ ${d.nick} -> Tüm takıma +${2 * m} HP`);
    }
    if (d.ability === "faint_rage") {
      const buff = 8 * m;
      al.forEach((x) => {
        x.atk = clampStat(x.atk + buff);
        x.hp = clampStat(x.hp + buff);
        x.curHp = clampStat(x.curHp + buff);
      });
      lg.push(`🐻 ${d.nick} öldü -> Tüm takıma +${buff}/+${buff}`);
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
      lg.push(`🦡 ${d.nick} -> Kendine +${2 * m2}/+${2 * m2} kalıcı`);
    }
    if (d.ability === "faint_wave") {
      en.forEach((x) => { x.curHp -= 9 * m; });
      lg.push(`🌊 ${d.nick} -> Tüm düşmanlara ${9 * m} hasar`);
    }
    if (d.ability === "cheetah_faint") {
      const buff = 8 * m;
      al.forEach((x) => {
        x.atk = clampStat(x.atk + buff);
        x.hp = clampStat(x.hp + buff);
        x.curHp = clampStat(x.curHp + buff);
      });
      lg.push(`💨 ${d.nick} -> Tüm takıma +${buff}/+${buff}`);
    }
   if (d.ability === "faint_summon") {
      const newSummon = {
        name: "🥚", nick: "Yavru",
        atk: 4 * m, hp: 4 * m, curHp: 4 * m,
        ability: "none", tier: 1, lvl: 1, exp: 0, id: Math.random(),
        img: "baby_crocodile.png",
      };
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
      lg.push(`🦌 ${d.nick} -> Takıma +${2 * m2}/+${2 * m2} KALICI (ölünce)`);
    }
    if (isP) {
      al.forEach((a) => {
        if (a.ability === "friend_faint") {
          const am = pwr(a);
          a.atk = clampStat(a.atk + 2 * am);
          a.curHp = clampStat(a.curHp + 2 * am);
          lg.push(`🐺 ${a.nick} -> +${2 * am}/+${2 * am}`);
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
              img: "joey.png",
            };
            a.summonCount++;
            const buffedSummons = applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
            sm.push(...buffedSummons);
            lg.push(`🦘 ${a.nick} -> yavru çağırdı (${a.summonCount}/3)`);
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
      lg.push(`🐙 ${d.nick} -> ${al[i].nick} kopyalandı`);
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
              lg.push(`🦤 Dodo -> ${d.nick} efekti tekrar! ${al[i].nick} e +${m}/+${m}`);
            }
            if (d.ability === "faint_dmg") {
              en.forEach((x) => { x.curHp -= m * 2; });
              lg.push(`🦤 Dodo -> ${d.nick} efekti tekrar! Tüm düşmanlara ${m * 2} hasar`);
            }
            if (d.ability === "faint_shield") {
              al.forEach((x) => { x.curHp = clampStat(x.curHp + 2 * m); });
              lg.push(`🦤 Dodo -> ${d.nick} efekti tekrar! Takıma +${2 * m} HP`);
            }
            if (d.ability === "faint_rage" || d.ability === "cheetah_faint") {
              const buff = getTeamBuffAmount(m);
              applyTeamBuff(al, buff, clampStat);
              lg.push(`Dodo retrigger -> ${d.nick} -> team +${buff}/+${buff}`);
            }
            if (d.ability === "faint_wave") {
              const damage = getWaveDamage(m);
              applyTeamDamage(en, damage);
              lg.push(`Dodo retrigger -> ${d.nick} -> enemy team ${damage} damage`);
            }
            if (d.ability === "faint_weaken_all") {
              const debuff = getFaintWeakenAllDebuff(m);
              applyTeamDebuff(en, debuff);
              lg.push(`Dodo retrigger -> ${d.nick} -> enemy team -${debuff}/-${debuff}`);
            }
            if (d.ability === "faint_copy" && al.length > 0) {
              const i = Math.floor(Math.random() * al.length);
              const pct = m === 1 ? 0.25 : m === 2 ? 0.5 : 1;
              const atkGain = Math.floor(d.atk * pct);
              const hpGain = Math.floor(d.hp * pct);
              al[i].atk = clampStat(al[i].atk + atkGain);
              al[i].curHp = clampStat(al[i].curHp + hpGain);
              lg.push(`🦤 Dodo -> ${d.nick} efekti tekrar! ${al[i].nick} e +${atkGain}/+${hpGain}`);
            }
            if (d.ability === "faint_summon") {
             const extraSummon = {
                name: "🥚", nick: "Yavru",
                atk: 4 * m, hp: 4 * m, curHp: 4 * m,
                ability: "none", tier: 1, lvl: 1, exp: 0, id: Math.random(),
                img: "baby_crocodile.png", flip: false,
              };
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
 const freshTaskData = loadTasks(user?.uid);
const pendingTaskXP = freshTaskData ? [
  ...( freshTaskData.daily?.tasks || []),
  ...( freshTaskData.weekly?.tasks || []),
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
 const freshTaskData = loadTasks(user?.uid);
const pendingTaskXP = freshTaskData ? [
  ...( freshTaskData.daily?.tasks || []),
  ...( freshTaskData.weekly?.tasks || []),
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

      if (isCancelled) return;

      // Step 0: Savaş başı yetenekleri
      if (step === 0) {
        await delay(1200);
        if (isCancelled) return;

        let pp = [...pT];
        let ee = [...eT];

        // 1. Geyik (Stag Combo) - Global Buff - sıra önemli değil
        for (let i = 0; i < pp.length; i++) {
          if (pp[i]?.ability === "stag_combo") {
            const pet = pp[i];
            triggerAnim(pet.id, "ability");
            const m = pwr(pet);
            pp = pp.map((a) => a ? { ...a, atk: clampStat(a.atk + 2 * m), hp: clampStat(a.hp + 2 * m), curHp: clampStat(a.curHp + 2 * m) } : a);
            setTeam((prevTeam) =>
              prevTeam.map((p) => p ? { ...p, atk: clampStat(p.atk + 2 * m), hp: clampStat(p.hp + 2 * m), curHp: clampStat(p.curHp + 2 * m) } : p)
            );
            setLog((l) => [...l, `🦌 ${pet.nick} -> Takima +${2 * m}/+${2 * m} KALICI`]);
            setPT([...pp]);
            await delay(1000);
            if (isCancelled) return;
          }
        }
        for (let i = 0; i < ee.length; i++) {
          if (ee[i]?.ability === "stag_combo") {
            const pet = ee[i];
            triggerAnim(pet.id, "ability");
            const m = pwr(pet);
            ee = ee.map((a) => a ? { ...a, atk: clampStat(a.atk + 2 * m), hp: clampStat(a.hp + 2 * m), curHp: clampStat(a.curHp + 2 * m) } : a);
            setLog((l) => [...l, `🦌 Düsman ${pet.nick} -> Düsman takimina +${2 * m}/+${2 * m} KALICI`]);
            setET([...ee]);
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
            setLog((l) => [...l, `✨ ${a.nick} +${a.tempAtk || 0} ATK / +${a.tempHp || 0} HP (Gecici)`]);
            setPT([...pp]);
            await delay(800);
            if (isCancelled) return;
          }
        }

        // 3. Kendi buff yetenekleri (sıra önemli değil, animasyon hızlı)
        const selfBuffAbilities = ["start_buff", "start_team_shield", "start_all_perm", "start_trample", "start_charge", "start_tank"];
        
        for (let i = 0; i < pp.length; i++) {
          const a = pp[i];
          if (!a || !selfBuffAbilities.includes(a.ability)) continue;
          const m = pwr(a);
          if (a.ability === "start_buff") { pp[i].atk += m; setLog((l) => [...l, `⚡ ${a.nick} -> +${m} ATK`]); }
          else if (a.ability === "start_team_shield") { pp = pp.map((x) => x ? { ...x, hp: clampStat(x.hp + m), curHp: clampStat(x.curHp + m) } : x); setLog((l) => [...l, `🛡️ ${a.nick} -> Tüm takima +${m} HP`]); }
          else if (a.ability === "start_all_perm") {
            const buffAmount = 2 * m;
            pp = pp.map((x) => x ? { ...x, atk: clampStat(x.atk + buffAmount) } : x);
            setTeam((prevTeam) => prevTeam.map((pet) => pet ? { ...pet, atk: clampStat(pet.atk + buffAmount) } : pet));
            pp.forEach((x) => { if (x) triggerAnim(x.id, "buff"); });
            setLog((l) => [...l, `🦅 ${a.nick} -> Tüm takima +${2 * m} ATK KALICI`]);
          }
          else if (a.ability === "start_trample") { pp[i].atk += 5 * m; pp[i].trample = true; setLog((l) => [...l, `🦏 ${a.nick} -> +${5 * m} ATK (ciğneme)`]); }
          else if (a.ability === "start_charge") { pp[i].curHp += 2 * m; setLog((l) => [...l, `🐗 ${a.nick} -> +${2 * m} HP`]); }
          else if (a.ability === "start_tank") { pp[i].curHp += 3 * m; setLog((l) => [...l, `🦀 ${a.nick} -> +${3 * m} HP`]); }
          triggerAnim(a.id, "ability");
          spawnParticles(a.id, "buff");
          setPT([...pp]);
          await delay(600);
          if (isCancelled) return;
        }
        for (let i = 0; i < ee.length; i++) {
          const a = ee[i];
          if (!a || !selfBuffAbilities.includes(a.ability)) continue;
          const m = pwr(a);
          if (a.ability === "start_buff") { ee[i].atk += m; setLog((l) => [...l, `⚡ Düsman ${a.nick} -> +${m} ATK`]); }
          else if (a.ability === "start_team_shield") { ee = ee.map((x) => x ? { ...x, hp: clampStat(x.hp + m), curHp: clampStat(x.curHp + m) } : x); setLog((l) => [...l, `🛡️ Düsman ${a.nick} -> Tüm takima +${m} HP`]); }
          else if (a.ability === "start_all_perm") { ee = ee.map((x) => x ? { ...x, atk: clampStat(x.atk + 2 * m) } : x); setLog((l) => [...l, `🦅 Düsman ${a.nick} -> Tüm takima +${2 * m} ATK`]); }
          else if (a.ability === "start_trample") { ee[i].atk += 5 * m; ee[i].trample = true; setLog((l) => [...l, `🦏 Düsman ${a.nick} -> +${5 * m} ATK`]); }
          else if (a.ability === "start_charge") { ee[i].curHp += 2 * m; setLog((l) => [...l, `🐗 Düsman ${a.nick} -> +${2 * m} HP`]); }
          else if (a.ability === "start_tank") { ee[i].curHp += 3 * m; setLog((l) => [...l, `🦀 Düsman ${a.nick} -> +${3 * m} HP`]); }
          triggerAnim(a.id, "ability");
          spawnParticles(a.id, "buff");
          setET([...ee]);
          await delay(600);
          if (isCancelled) return;
        }

        // 4. Saldırı yetenekleri - ATK'ya göre sıralı, birleşik
        const attackAbilities = ["start_fire", "start_fear", "start_snipe", "start_multi_snipe", "start_dmg", "start_poison", "start_freeze_enemy", "weaken_strong"];
        
        // Her iki takımdan saldırı yeteneği olan hayvanları topla
        let attackers = [];
        pp.forEach((a, idx) => {
          if (a && attackAbilities.includes(a.ability)) {
            attackers.push({ pet: a, isPlayer: true, idx });
          }
        });
        ee.forEach((a, idx) => {
          if (a && attackAbilities.includes(a.ability)) {
            attackers.push({ pet: a, isPlayer: false, idx });
          }
        });

        // ATK'ya göre sırala (yüksek önce), eşitse HP'ye göre, eşitse pozisyona göre
        attackers.sort((x, y) => {
          if (y.pet.atk !== x.pet.atk) return y.pet.atk - x.pet.atk;
          if (y.pet.curHp !== x.pet.curHp) return y.pet.curHp - x.pet.curHp;
          return x.idx - y.idx;
        });

        // Sırayla çalıştır
        for (const { pet: a, isPlayer } of attackers) {
          const m = pwr(a);
          const targets = isPlayer ? ee : pp;
          const allies = isPlayer ? pp : ee;
          if (targets.length === 0) continue;

          triggerAnim(a.id, "ability");
          
          if (a.ability === "start_fire") {
            // Alan hasarı - tüm hedeflere
            const dmg = 6 * m;
            targets.forEach((x) => {
              x.curHp -= dmg;
              spawnProjectile(a.id, x.id, "start_fire");
              triggerAnim(x.id, "damage");
            });
            setLog((l) => [...l, `🐉 ${isPlayer ? "" : "Düsman "}${a.nick} -> Tüm ${isPlayer ? "düsmanlara" : "takima"} ${dmg} hasar`]);
            await delay(1400);

          } else if (a.ability === "start_fear") {
            const aliveTargets = targets.filter((x) => x.curHp > 0);
            if (aliveTargets.length === 0) continue;
            aliveTargets[0].atk = Math.max(1, aliveTargets[0].atk - 10 * m);
            spawnProjectile(a.id, aliveTargets[0].id, "start_fear");
            triggerAnim(aliveTargets[0].id, "damage");
            if (aliveTargets.length > 1) {
              aliveTargets[1].atk = Math.max(1, aliveTargets[1].atk - 10 * m);
              spawnProjectile(a.id, aliveTargets[1].id, "start_fear");
              triggerAnim(aliveTargets[1].id, "damage");
            }
            const fearT = targets.length > 1 ? `${targets[0].nick} ve ${targets[1].nick}` : targets[0].nick;
            setLog((l) => [...l, `🦁 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${fearT} -${10 * m} ATK`]);
            await delay(1200);

        } else if (a.ability === "start_snipe") {
  const currentTargets = isPlayer ? ee : pp;
  const aliveTargets = currentTargets.filter((x) => x.curHp > 0);
  if (aliveTargets.length === 0) continue;
  const snipeTarget = aliveTargets[aliveTargets.length - 1];
            snipeTarget.curHp -= 3 * m;
setTimeout(() => {
  spawnProjectile(a.id, snipeTarget.id, "start_snipe", null, true);
}, 100);
triggerAnim(snipeTarget.id, "damage");
            setLog((l) => [...l, `🎯 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${snipeTarget.nick} e ${3 * m} hasar`]);
            await delay(1200);

          } else if (a.ability === "start_multi_snipe") {
            // Birden fazla hedefe
            const targetCount = Math.min(m + 1, targets.length);
            for (let j = 0; j < targetCount; j++) {
              const alive = targets.filter((x) => x.curHp > 0);
              if (alive.length > 0) {
                const t = alive[Math.floor(Math.random() * alive.length)];
                t.curHp -= 8 * m;
               spawnProjectile(a.id, t.id, "start_multi_snipe", null, true);
                triggerAnim(t.id, "damage");
                setLog((l) => [...l, `🦑 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${t.nick} e ${8 * m} hasar`]);
                await delay(700);
              }
            }

         } else if (a.ability === "start_dmg") {
  const currentTargets = isPlayer ? ee : pp;
  const alive = currentTargets.filter((x) => x.curHp > 0);
  if (alive.length === 0) continue;
  {
    const t = alive[Math.floor(Math.random() * alive.length)];
              t.curHp -= 2 * m;
             spawnProjectile(a.id, t.id, "start_dmg", null, true);
              triggerAnim(t.id, "damage");
              setLog((l) => [...l, `💥 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${t.nick} e ${2 * m} hasar`]);
              await delay(1200);
            }

          } else if (a.ability === "start_poison") {
            // Öndeki düşmanı zayıflat
            targets[0].atk = Math.max(1, targets[0].atk - m * 2);
            spawnProjectile(a.id, targets[0].id, "start_poison");
            triggerAnim(targets[0].id, "damage");
            setLog((l) => [...l, `🐍 ${isPlayer ? "" : "Düsman "}${a.nick} -> On düsmana -${m * 2} ATK`]);
            await delay(1200);

          } else if (a.ability === "start_freeze_enemy") {
            // Ön ve arka düşmanı yavaşlat
            const reduction = (m * 30) / 100;
            targets[0].atk = Math.max(1, Math.floor(targets[0].atk * (1 - reduction)));
            spawnProjectile(a.id, targets[0].id, "start_freeze_enemy");
            triggerAnim(targets[0].id, "damage");
            if (targets.length > 1) {
              targets[targets.length - 1].atk = Math.max(1, Math.floor(targets[targets.length - 1].atk * (1 - reduction)));
              spawnProjectile(a.id, targets[targets.length - 1].id, "start_freeze_enemy");
              triggerAnim(targets[targets.length - 1].id, "damage");
            }
            setLog((l) => [...l, `🦣 ${isPlayer ? "" : "Düsman "}${a.nick} -> On ve arka düsmani %${m * 30} yavaslatti`]);
            await delay(1200);

          } else if (a.ability === "weaken_strong") {
            // En güçlü düşmanı zayıflat
            let mxI = 0, mxP = 0;
            targets.forEach((en, idx) => {
              if (en.atk + en.curHp > mxP) { mxP = en.atk + en.curHp; mxI = idx; }
            });
            const r = (25 * m) / 100;
            targets[mxI].atk = Math.max(1, Math.floor(targets[mxI].atk * (1 - r)));
            targets[mxI].curHp = Math.max(1, Math.floor(targets[mxI].curHp * (1 - r)));
            spawnProjectile(a.id, targets[mxI].id, "weaken_strong");
            triggerAnim(targets[mxI].id, "damage");
            setLog((l) => [...l, `🐧 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${targets[mxI].nick} i %${25 * m} zayiflatti`]);
            await delay(1200);
          }

          // Ölenleri temizle
          if (isPlayer) {
            ee = ee.filter((x) => x.curHp > 0);
          } else {
            pp = pp.filter((x) => x.curHp > 0);
          }
          setPT([...pp]);
          setET([...ee]);
          if (isCancelled) return;
        }
       pp = pp.filter((x) => x.curHp > 0);
ee = ee.filter((x) => x.curHp > 0);
setPT([...pp]);
setET([...ee]);
if (pp.length === 0 || ee.length === 0) {
  setPT([...pp]);
  setET([...ee]);
  if (isDebugBattle) {
    setIsDebugBattle(false);
    setIsBattleOver(true);
    const winner = ee.length === 0 && pp.length > 0 ? "🎉 SEN KAZANDIN!" : pp.length === 0 && ee.length > 0 ? "💀 DÜŞMAN KAZANDI!" : "🤝 BERABERLİK!";
    setLog((l) => [...l, `━━━━━━━━━━━━━━━━━━`, winner, `━━━━━━━━━━━━━━━━━━`]);
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
    return;
  }
  setStep((s) => s + 1);
  return;
}
setStep((s) => s + 1);
await delay(500);
if (isCancelled) return;
      }
      // Standart Savaş Turu
     if (step === 0) return;
let p = [...pT].filter((x) => x.curHp > 0);
let e = [...eT].filter((x) => x.curHp > 0);
if (p.length === 0 || e.length === 0) {
  setIsBattleOver(true);
  return;
}

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
        lg.push(`🦏 ${a.nick} -> Arka düşmana ${excess} hasar (çiğneme)`);
      }
      if (d.trample && p[0].curHp <= 0 && p.length > 1) {
        const excess = Math.abs(p[0].curHp);
        p[1].curHp -= excess;
        lg.push(`🦏 Düşman ${d.nick} -> Arka oyuncu birimine ${excess} hasar (çiğneme)`);
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
        setLog((l) => [...l, `💪 ${a.nick} -> +${pwr(a)} ATK`]);
        await delay(500);
      }
      if (a.ability === "start_charge" && p[0].curHp > 0) {
        p[0].atk = clampStat(p[0].atk + 2 * pwr(a));
        triggerAnim(a.id, "buff");
        setLog((l) => [...l, `🐗 ${a.nick} -> +${2 * pwr(a)} ATK`]);
        await delay(500);
      }
     if (a.ability === "faint_weaken_all" && p[0].curHp <= 0) {
  const debuff = getFaintWeakenAllDebuff(pwr(a));
  e.forEach((enemy) => {
    enemy.atk = Math.max(1, enemy.atk - debuff);
    enemy.curHp = Math.max(0, enemy.curHp - debuff);
  });
  applyDamageAnimToTeam(e);
  setLog((l) => [...l, `${a.nick} faint_weaken_all -> enemy team -${debuff}/-${debuff}`]);
  await delay(600);
}
      if (a.ability === "hurt_team_buff" && p[0].curHp > 0 && dD > 0) {
        const m = pwr(a);
        applyHurtTeamBuff(p, 3 * m);
        setLog((l) => [...l, `🦬 ${a.nick} hasar aldı -> Takıma +${3 * pwr(a)}/+${3 * pwr(a)}`]);
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
          setLog((l) => [...l, `🐘 ${a.nick} -> ${e[targetIdx].nick} e ${damage} hasar`]);
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
          setLog((l) => [...l, `🐘 Düşman ${d.nick} -> ${p[targetIdx].nick} e ${damage} hasar`]);
          await delay(600);
        }
      }
     if (a.ability === "hurt_reflect" && p[0].curHp > 0 && dD > 0 && p[0].id === a.id) {
  const pct = pwr(a) === 1 ? 0.33 : pwr(a) === 2 ? 0.66 : 0.99;
  const reflectDmg = Math.max(1, Math.floor(dD * pct));
  e[0].curHp = Math.max(0, e[0].curHp - reflectDmg);
  triggerAnim(e[0].id, "damage");
  setLog((l) => [...l, `🪞 ${a.nick} -> ${e[0].nick} e ${reflectDmg} yansıma hasarı`]);
  await delay(500);
}
      if (a.ability === "kill_buff" && e[0].curHp <= 0) {
        p[0].atk = clampStat(p[0].atk + 3 * pwr(a));
        p[0].curHp = clampStat(p[0].curHp + 3 * pwr(a));
        triggerAnim(a.id, "buff");
        setLog((l) => [...l, `🦈 ${a.nick} -> +${3 * pwr(a)}/+${3 * pwr(a)}`]);
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
        setLog((l) => [...l, `🦭 ${a.nick} -> Takıma +${3 * pwr(a)}/+${3 * pwr(a)} KALICI`]);
        await delay(800);
      }
     if (a.ability === "kill_fear_all" && e[0].curHp <= 0 && p[0].id === a.id) {
  const debuff = applyFearToTeam(e, pwr(a));
  e.forEach((enemy) => {
    spawnProjectile(a.id, enemy.id, "kill_fear_all");
  });
        setLog((l) => [...l, `${a.nick} fear -> enemy team -${debuff}/-${debuff}`]);
        await delay(500);
      }
      if (d.ability === "devour" && p[0].curHp <= 0 && e[0].curHp > 0) {
        const pctD = (30 + 10 * pwr(d)) / 100;
        const atkGainD = Math.floor(p[0].atk * pctD);
        const hpGainD = Math.floor((p[0].hp || p[0].curHp) * pctD);
        e[0].atk = clampStat(e[0].atk + atkGainD);
        e[0].hp = clampStat(e[0].hp + hpGainD);
        e[0].curHp = clampStat(e[0].curHp + hpGainD);
        triggerAnim(d.id, "buff");
        setLog((l) => [...l, `👹 Düşman ${d.nick} -> +${atkGainD}/+${hpGainD}`]);
        await delay(500);
      }
      if (d.ability === "kill_buff" && p[0].curHp <= 0) {
        e[0].atk = clampStat(e[0].atk + 3 * pwr(d));
        e[0].curHp = clampStat(e[0].curHp + 3 * pwr(d));
        triggerAnim(d.id, "buff");
        setLog((l) => [...l, `🦈 Düşman ${d.nick} -> +${3 * pwr(d)}/+${3 * pwr(d)}`]);
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
        setLog((l) => [...l, `🦭 Düşman ${d.nick} -> Takıma +${3 * km}/+${3 * km} KALICI`]);
        await delay(800);
      }
     if (d.ability === "kill_fear_all" && p[0].curHp <= 0) {
  const debuff = applyFearToTeam(
    p.filter((pet) => pet.curHp > 0),
    pwr(d),
    1
  );
  setLog((l) => [...l, `${d.nick} fear -> player team -${debuff}/-${debuff}`]);
  await delay(500);
}
      if (d.ability === "atk_buff" && e[0].curHp > 0) {
        e[0].atk = clampStat(e[0].atk + pwr(d));
        triggerAnim(d.id, "buff");
        setLog((l) => [...l, `💪 Düşman ${d.nick} -> +${pwr(d)} ATK`]);
        await delay(500);
      }
     if (d.ability === "faint_weaken_all" && e[0].curHp <= 0) {
  const debuff = applyFaintWeakenToTeam(p, pwr(d));
  setLog((l) => [...l, `${d.nick} faint_weaken_all -> player team -${debuff}/-${debuff}`]);
  await delay(600);
}
      if (d.ability === "hurt_team_buff" && e[0].curHp > 0 && aD > 0) {
        const htm = pwr(d);
        applyHurtTeamBuff(e, 3 * htm);
        setLog((l) => [...l, `🦬 Düşman ${d.nick} hasar aldı -> Takıma +${3 * pwr(d)}/+${3 * pwr(d)}`]);
        await delay(500);
      }
     if (d.ability === "hurt_reflect" && e[0].curHp > 0 && aD > 0 && e[0].id === d.id) {
  const dpct = pwr(d) === 1 ? 0.33 : pwr(d) === 2 ? 0.66 : 0.99;
  const dreflectDmg = Math.max(1, Math.floor(aD * dpct));
  p[0].curHp = Math.max(0, p[0].curHp - dreflectDmg);
  triggerAnim(p[0].id, "damage");
  setLog((l) => [...l, `🪞 Düşman ${d.nick} -> ${p[0].nick} e ${dreflectDmg} yansıma hasarı`]);
  await delay(500);
}
      if (d.ability === "start_charge" && e[0].curHp > 0) {
        e[0].atk = clampStat(e[0].atk + 2 * pwr(d));
        triggerAnim(d.id, "buff");
        setLog((l) => [...l, `🐗 Düşman ${d.nick} -> +${2 * pwr(d)} ATK`]);
        await delay(500);
      }
    if (a.ability === "devour" && e[0].curHp <= 0 && p[0].curHp > 0) {
  const pct = (30 + 10 * pwr(a)) / 100;
  const atkGain = Math.floor(e[0].atk * pct);
  const hpGain = Math.floor((e[0].hp || e[0].curHp) * pct);
  p[0].atk = clampStat(p[0].atk + atkGain);
  p[0].hp = clampStat(p[0].hp + hpGain);
  p[0].curHp = clampStat(p[0].curHp + hpGain);
 spawnProjectile(e[0].id, a.id, "devour");
  triggerAnim(a.id, "buff");
        setLog((l) => [...l, `👹 ${a.nick} -> yuttu, +${atkGain}/+${hpGain} stat kazandı`]);
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
          const r = faint(deadEnemy, e, p, false, null);
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
          const r = faint(deadEnemy, [...eS, ...e], p, false, null);
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
  setPT([]);
  setET([]);
  setStep(0);
  setLog([]);
  setPhase("shop");
  setGameStarted(false);
  setTimeout(() => setShowDebugPanel(true), 50);
}, 4000);
          return;
        }
        setStep((s) => s + 1);
        return;
      }

     if (newP.length > 0 && newP[0].id !== oldAId) triggerAnim(newP[0].id, "slideInLeft");
if (newE.length > 0 && newE[0].id !== oldDId) triggerAnim(newE[0].id, "slideInRight");

await delay(150);
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
