// src/utils/battleFaintResolver.js
import { AB } from "../data/gameData";
import { applySummonBuffs } from "./battleUtils";
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
} from "./battleFaintUtils";

export function resolveFaint(d, al, en, isP, killer, { pwr, clampStat, triggerAnim, spawnParticles, setTeam }) {
  if (!d) return { lg: [], sm: [], gG: 0 };
  if (d.isDead) return { lg: [], sm: [], gG: 0 };

  d.isDead = true;
  const m = pwr(d);
  let lg = [], sm = [], gG = 0;

  if (!isP) {
    if (d.ability === AB.FAINT_BUFF && al.length > 0) {
      applyFaintBuffEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: "💀 Düşman ", logSuffix: " -> " });
    }
    if (d.ability === AB.FAINT_DMG && en.length > 0) {
      applyFaintDamageEffect({ deadUnit: d, power: m, enemyTeam: en, logs: lg, logPrefix: "☠️ Düşman ", targetLabel: "Oyuncu takımına", logSuffix: " -> " });
    }
    if (d.ability === AB.FAINT_SHIELD && al.length > 0) {
      applyFaintShieldEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: "🛡️ Düşman ", targetLabel: "Düşman takımına", logSuffix: " -> " });
    }
    applyTeamWideFaintEffect({ ability: d.ability, sourceNick: d.nick, power: m, allyTeam: al, enemyTeam: en, clampStat, logs: lg, teamBuffLabel: "enemy team", enemyLabel: "player team" });
    if (d.ability === AB.FAINT_GOLD) {
      lg.push(`💰 Düşman ${d.nick} -> +${m} altın (oyuncuya etkisi yok)`);
    }
    if (d.ability === AB.STAG_COMBO && al.length > 0) {
      const buff = 2 * m;
      al.forEach((pet) => { pet.atk = clampStat(pet.atk + buff); pet.curHp = clampStat(pet.curHp + buff); });
      lg.push(`🦌 Düşman ${d.nick} -> Düşman takımına +${buff}/+${buff} KALICI`);
    }
    if (d.ability === AB.FAINT_BUFF_SELF && al.length > 0) {
      al.forEach((pet) => { if (pet.id === d.id) { pet.atk = clampStat(pet.atk + 2 * m); pet.curHp = clampStat(pet.curHp + 2 * m); } });
      lg.push(`🦡 Düşman ${d.nick} -> Kendine +${2 * m}/+${2 * m} kalıcı`);
    }
    if (d.ability === AB.START_TRAMPLE && al.length > 0) {
      const buff = 5 * m;
      al[0].atk = clampStat(al[0].atk + buff);
      al[0].trample = true;
      lg.push(`🦏 Düşman ${d.nick} -> +${buff} ATK (çiğneme aktif)`);
    }
    if (d.ability === AB.HURT_TEAM_BUFF && al.length > 0) {
      al.forEach((pet) => { pet.atk = clampStat(pet.atk + 3 * m); pet.curHp = clampStat(pet.curHp + 3 * m); });
      lg.push(`🦬 Düşman ${d.nick} -> Takıma +${3 * m}/+${3 * m}`);
    }
    if (d.ability === AB.FAINT_SUMMON) {
      const newSummon = createFaintSummonUnit({ name: "🥚", nick: "Düş.Yavru", power: m, img: "baby_crocodile.png", flip: false });
      applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
      sm.push(newSummon);
      lg.push(`🥚 Düşman ${d.nick} -> ${4 * m}/${4 * m} yavru çağırdı`);
    }
    if (d.ability === AB.FAINT_COPY && al.length > 0) {
      applyFaintCopyEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: "📋 Düşman ", logSuffix: " -> " });
    }
    al.forEach((a) => {
      if (a.ability === AB.FRIEND_FAINT) {
        const am = pwr(a);
        applyFriendFaintEffect({ allyUnit: a, power: am, clampStat, logs: lg, logPrefix: "🐺 Düşman ", logSuffix: " (dost öldü)" });
      }
      if (a.ability === AB.FRIEND_SUMMON && !a.isSummon) {
        if (!a.summonCount) a.summonCount = 0;
        if (a.summonCount < 3) {
          const am = pwr(a);
          const newSummon = createFriendSummonUnit({ allyUnit: a, power: am, name: "🦘", nick: "Düş.Yavru", img: "joey.png", flip: false });
          if (!newSummon) return;
          applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
          sm.push(newSummon);
          lg.push(`🦘 Düşman ${a.nick} -> yavru çağırdı (${a.summonCount}/3)`);
        }
      }
    });
    if (killer && killer.ability === AB.KILL_BUFF) {
      const km = pwr(killer);
      killer.atk = clampStat(killer.atk + 3 * km);
      killer.curHp = clampStat(killer.curHp + 3 * km);
      lg.push(`🦈 Düşman ${killer.nick} -> öldürdü, +${3 * km}/+${3 * km}`);
    }
    al.forEach((ally) => {
      if (ally && ally.ability === AB.SUMMON_RETRIGGER) {
        const dodoM = pwr(ally);
        for (let dodoI = 0; dodoI < dodoM; dodoI++) {
          if (d.ability === AB.FAINT_BUFF && al.length > 0) {
            applyFaintBuffEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: "🦤 Düşman Dodo -> ", logSuffix: " efekti tekrar! " });
          }
          if (d.ability === AB.FAINT_DMG) {
            applyFaintDamageEffect({ deadUnit: d, power: m, enemyTeam: en, logs: lg, logPrefix: "🦤 Düşman Dodo -> ", targetLabel: "Oyuncu takımına", logSuffix: " efekti tekrar! " });
          }
          if (d.ability === AB.FAINT_SHIELD) {
            applyFaintShieldEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: "🦤 Düşman Dodo -> ", targetLabel: "Takıma", logSuffix: " efekti tekrar! " });
          }
          applyDodoTeamRetriggerEffect({ ability: d.ability, sourceNick: d.nick, power: m, allyTeam: al, enemyTeam: en, enemyLabel: "player team", logs: lg, clampStat });
          if (d.ability === AB.FAINT_SUMMON) {
            const extraSummon = createFaintSummonUnit({ name: "🥚", nick: "Düş.Yavru", power: m, img: "baby_crocodile.png", flip: false });
            applySummonBuffs([extraSummon], al, lg, { triggerAnim, spawnParticles });
            sm.push(extraSummon);
            lg.push(`🦤 Düşman Dodo -> ${d.nick} efekti tekrar! Ekstra yavru ${4 * m}/${4 * m}`);
          }
        }
      }
    });
    if (d.ability === AB.FAINT_DUPLICATE) {
      pushFaintDuplicateEffect({ deadUnit: d, allyTeam: al, summons: sm, logs: lg, logPrefix: "🐙 Düşman " });
    }
    return { lg, sm, gG: 0 };
  }

  // isP === true (oyuncu tarafı)
  if (d.ability === AB.FAINT_BUFF && al.length > 0) {
    applyFaintBuffEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: "💀 ", logSuffix: " -> " });
  }
  if (d.ability === AB.FAINT_COPY && al.length > 0) {
    applyFaintCopyEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: "🦛 ", temporary: true, logSuffix: " -> " });
  }
  if (d.ability === AB.FAINT_DMG) {
    applyFaintDamageEffect({ deadUnit: d, power: m, enemyTeam: en, logs: lg, logPrefix: "☠️ ", targetLabel: "Tüm düşmanlara", logSuffix: " -> " });
  }
  if (d.ability === AB.FAINT_SHIELD) {
    applyFaintShieldEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: "🛡️ ", targetLabel: "Tüm takıma", logSuffix: " -> " });
  }
  applyTeamWideFaintEffect({ ability: d.ability, sourceNick: d.nick, power: m, allyTeam: al, enemyTeam: en, clampStat, logs: lg, teamBuffLabel: "player team", enemyLabel: "enemy team" });
  if (d.ability === AB.FAINT_BUFF_SELF && isP) {
    const m2 = pwr(d);
    applySelfFaintBuffEffect({ deadUnit: d, power: m2, allyTeam: al, clampStat, logs: lg, logPrefix: "🦡 ", logSuffix: " -> " });
    setTeam((prevTeam) =>
      prevTeam.map((pet) =>
        pet && pet.id === d.id
          ? { ...pet, atk: clampStat(pet.atk + 2 * m2), hp: clampStat(pet.hp + 2 * m2), curHp: clampStat(pet.curHp + 2 * m2) }
          : pet
      )
    );
  }
  if (d.ability === AB.FAINT_SUMMON) {
    const newSummon = createFaintSummonUnit({ name: "🥚", nick: "Yavru", power: m, img: "baby_crocodile.png" });
    lg.push(`🥚 ${d.nick} -> ${4 * m}/${4 * m} yavru çağırdı`);
    sm.push(newSummon);
    setTimeout(() => {
      const buffedSummon = { ...newSummon };
      applySummonBuffs([buffedSummon], al, lg, { triggerAnim, spawnParticles });
      Object.assign(newSummon, buffedSummon);
    }, 800);
  }
  if (d.ability === AB.STAG_COMBO) {
    const m2 = pwr(d);
    applyStagComboEffect({ deadUnit: d, power: m2, allyTeam: al, clampStat, logs: lg, logPrefix: "🦌 ", targetLabel: "Takıma " });
    setTeam((prevTeam) =>
      prevTeam.map((pet) => {
        if (!pet || pet.id === d.id) return pet;
        const isAlive = al.some((bp) => bp && bp.id === pet.id);
        return isAlive ? { ...pet, atk: clampStat(pet.atk + 2 * m2), hp: clampStat(pet.hp + 2 * m2), curHp: clampStat(pet.curHp + 2 * m2) } : pet;
      })
    );
  }
  if (isP) {
    al.forEach((a) => {
      if (a.ability === AB.FRIEND_FAINT) {
        const am = pwr(a);
        applyFriendFaintEffect({ allyUnit: a, power: am, clampStat, logs: lg, logPrefix: "🐺 " });
      }
      if (a.ability === AB.FRIEND_SUMMON && !a.isSummon) {
        if (!a.summonCount) a.summonCount = 0;
        if (a.summonCount < 3) {
          const am = pwr(a);
          const newSummon = createFriendSummonUnit({ allyUnit: a, power: am, name: "🦘", nick: "Yavru", img: "joey.png" });
          if (!newSummon) return;
          const buffedSummons = applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
          sm.push(...buffedSummons);
          lg.push(`🦘 ${a.nick} -> yavru çağırdı (${a.summonCount}/3)`);
        }
      }
    });
  }
  if (d.ability === AB.FAINT_DUPLICATE && isP) {
    pushFaintDuplicateEffect({ deadUnit: d, allyTeam: al, summons: sm, logs: lg, logPrefix: "🐙 " });
  }
  if (isP) {
    al.forEach((ally) => {
      if (ally && ally.ability === AB.SUMMON_RETRIGGER) {
        const dodoM = pwr(ally);
        for (let dodoI = 0; dodoI < dodoM; dodoI++) {
          if (d.ability === AB.FAINT_BUFF && al.length > 0) {
            applyFaintBuffEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: "🦤 Dodo -> ", logSuffix: " efekti tekrar! " });
          }
          if (d.ability === AB.FAINT_DMG) {
            applyFaintDamageEffect({ deadUnit: d, power: m, enemyTeam: en, logs: lg, logPrefix: "🦤 Dodo -> ", targetLabel: "Tüm düşmanlara", logSuffix: " efekti tekrar! " });
          }
          if (d.ability === AB.FAINT_SHIELD) {
            applyFaintShieldEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: "🦤 Dodo -> ", targetLabel: "Takıma", logSuffix: " efekti tekrar! " });
          }
          applyDodoTeamRetriggerEffect({ ability: d.ability, sourceNick: d.nick, power: m, allyTeam: al, enemyTeam: en, enemyLabel: "enemy team", logs: lg, clampStat });
          if (d.ability === AB.FAINT_COPY && al.length > 0) {
            applyFaintCopyEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: "🦤 Dodo -> ", logSuffix: " efekti tekrar! " });
          }
          if (d.ability === AB.FAINT_SUMMON) {
            const extraSummon = createFaintSummonUnit({ name: "🥚", nick: "Yavru", power: m, img: "baby_crocodile.png", flip: false });
            applySummonBuffs([extraSummon], al, lg, { triggerAnim, spawnParticles });
            sm.push(extraSummon);
            lg.push(`🦤 Dodo -> ${d.nick} efekti tekrar! Ekstra yavru ${4 * m}/${4 * m}`);
          }
        }
      }
    });
  }
  return { lg, sm, gG };
}