// src/utils/battleFaintResolver.js
//
// Refactor: isPlayer=true ve isPlayer=false dalları tek bir ortak fonksiyon
// üzerinden çalışıyor. Önceki versiyonda ~242 satırın yarısı tekrardı.
// Label/prefix parametreleri ile her iki taraf da aynı logic'i kullanıyor.

import { AB, ABILITY_MULTIPLIERS as AM } from "../data/gameData";
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

// ─── Ortak faint çözümleme çekirdeği ─────────────────────────────────────────
// Her iki taraf (oyuncu / düşman) için aynı logic çalışır.
// labels: { pfx, allyLabel, enemyLabel, summonNick, summonFlip }
function _resolveFaintCore(d, al, en, isP, killer, callbacks, labels) {
  const { pwr, clampStat, triggerAnim, spawnParticles, spawnProjectile, setTeam } = callbacks;
  const { pfx, allyLabel, enemyLabel, summonNick, summonFlip } = labels;

  const m = pwr(d);
  const lg = [], sm = [];
  let gG = 0;

  // ── FAINT_BUFF ─────────────────────────────────────────────────────────────
  if (d.ability === AB.FAINT_BUFF && al.length > 0) {
    const buffedIdx = applyFaintBuffEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: `💀 ${pfx}`, logSuffix: " -> " });
    if (buffedIdx >= 0) {
      setTimeout(() => {
        triggerAnim?.(al[buffedIdx]?.id, "buff");
        spawnParticles?.(al[buffedIdx]?.id, "buff");
      }, 0);
    }
  }

  // ── FAINT_COPY ─────────────────────────────────────────────────────────────
  if (d.ability === AB.FAINT_COPY && al.length > 0) {
    applyFaintCopyEffect({
      deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg,
      logPrefix: `📋 ${pfx}`, logSuffix: " -> ",
      temporary: isP, // Oyuncu tarafında geçici, düşman tarafında kalıcı
    });
  }

  // ── FAINT_DMG ──────────────────────────────────────────────────────────────
  if (d.ability === AB.FAINT_DMG) {
    applyFaintDamageEffect({ deadUnit: d, power: m, enemyTeam: en, logs: lg, logPrefix: `☠️ ${pfx}`, targetLabel: `Tüm ${enemyLabel}a`, logSuffix: " -> " });
    if (spawnProjectile) en.forEach((e, i) => setTimeout(() => spawnProjectile(d.id, e.id, AB.FAINT_DMG, null, false), i * 80));
  }

  // ── FAINT_SHIELD ───────────────────────────────────────────────────────────
  if (d.ability === AB.FAINT_SHIELD && al.length > 0) {
    applyFaintShieldEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: `🛡️ ${pfx}`, targetLabel: `Tüm ${allyLabel}a`, logSuffix: " -> " });
    al.forEach((a, i) => setTimeout(() => {
      triggerAnim?.(a.id, "buff");
      spawnParticles?.(a.id, "shield");
    }, i * 80));
  }

  // ── Takım çapı yetenekler (FAINT_RAGE, CHEETAH_FAINT, FAINT_WAVE) ─────────
  applyTeamWideFaintEffect({ ability: d.ability, sourceNick: d.nick, power: m, allyTeam: al, enemyTeam: en, clampStat, logs: lg, teamBuffLabel: allyLabel, enemyLabel });
  if (d.ability === AB.FAINT_WAVE && en.length > 0 && spawnProjectile) {
    en.forEach((e, i) => setTimeout(() => spawnProjectile(d.id, e.id, AB.FAINT_WAVE, null, true), i * 120));
  }
  if ((d.ability === AB.FAINT_RAGE || d.ability === AB.CHEETAH_FAINT) && al.length > 0) {
    al.forEach((a, i) => setTimeout(() => {
      triggerAnim?.(a.id, "buff");
      spawnParticles?.(a.id, "buff");
    }, i * 80));
  }

  // ── FAINT_BUFF_SELF ────────────────────────────────────────────────────────
  if (d.ability === AB.FAINT_BUFF_SELF && al.length > 0) {
    applySelfFaintBuffEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: `🦡 ${pfx}`, logSuffix: " -> " });
    // Oyuncu tarafında React state'e de yansıt
    if (isP && setTeam) {
      setTeam((prev) => prev.map((pet) =>
        pet && pet.id === d.id
          ? { ...pet, atk: clampStat(pet.atk + 2 * m), hp: clampStat(pet.hp + 2 * m), curHp: clampStat(pet.curHp + 2 * m) }
          : pet
      ));
    }
  }

  // ── STAG_COMBO ─────────────────────────────────────────────────────────────
  if (d.ability === AB.STAG_COMBO && al.length > 0) {
    applyStagComboEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: `🦌 ${pfx}`, targetLabel: `${allyLabel} ` });
    if (isP && setTeam) {
      setTeam((prev) => prev.map((pet) => {
        if (!pet || pet.id === d.id) return pet;
        const isAlive = al.some((bp) => bp && bp.id === pet.id);
        return isAlive ? { ...pet, atk: clampStat(pet.atk + 2 * m), hp: clampStat(pet.hp + 2 * m), curHp: clampStat(pet.curHp + 2 * m) } : pet;
      }));
    }
  }

  // ── FAINT_GOLD ─────────────────────────────────────────────────────────────
  if (d.ability === AB.FAINT_GOLD) {
    if (isP) {
      gG += m;
      lg.push(`💰 ${pfx}${d.nick} -> +${m} altın`);
    } else {
      lg.push(`💰 ${pfx}${d.nick} -> +${m} altın (oyuncuya etkisi yok)`);
    }
  }

  // ── HURT_TEAM_BUFF ─────────────────────────────────────────────────────────
  if (d.ability === AB.HURT_TEAM_BUFF && al.length > 0) {
    al.forEach((pet) => {
      pet.atk   = clampStat(pet.atk   + 3 * m);
      pet.curHp = clampStat(pet.curHp + 3 * m);
    });
    lg.push(`🦬 ${pfx}${d.nick} -> ${allyLabel}a +${3 * m}/+${3 * m}`);
  }

  // ── FAINT_SUMMON ───────────────────────────────────────────────────────────
  if (d.ability === AB.FAINT_SUMMON) {
    const newSummon = createFaintSummonUnit({ name: "🥚", nick: summonNick, power: m, img: "baby_crocodile.png", flip: summonFlip });
    lg.push(`🥚 ${pfx}${d.nick} -> ${AM.FAINT_SUMMON_AMT * m}/${AM.FAINT_SUMMON_AMT * m} yavru çağırdı`);
    sm.push(newSummon);
    if (isP) {
      // Oyuncu tarafında summon buffer'lar sonradan uygulanır
      setTimeout(() => {
        const buffedSummon = { ...newSummon };
        applySummonBuffs([buffedSummon], al, lg, { triggerAnim, spawnParticles });
        Object.assign(newSummon, buffedSummon);
      }, 800);
    } else {
      applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
    }
  }

  // ── FAINT_DUPLICATE ────────────────────────────────────────────────────────
  if (d.ability === AB.FAINT_DUPLICATE) {
    pushFaintDuplicateEffect({ deadUnit: d, allyTeam: al, summons: sm, logs: lg, logPrefix: `🐙 ${pfx}` });
  }

  // ── Dost ölüm tepkileri (FRIEND_FAINT, FRIEND_SUMMON) ─────────────────────
  al.forEach((a) => {
    if (a.ability === AB.FRIEND_FAINT) {
      applyFriendFaintEffect({ allyUnit: a, power: pwr(a), clampStat, logs: lg, logPrefix: `🐺 ${pfx}` });
    }
    if (a.ability === AB.FRIEND_SUMMON && !a.isSummon) {
      if (!a.summonCount) a.summonCount = 0;
      if (a.summonCount < 3) {
        const newSummon = createFriendSummonUnit({ allyUnit: a, power: pwr(a), name: "🦘", nick: `${summonNick.includes("Düş") ? "Düş." : ""}Yavru`, img: "joey.png", flip: summonFlip });
        if (!newSummon) return;
        const buffed = applySummonBuffs([newSummon], al, lg, { triggerAnim, spawnParticles });
        sm.push(...(buffed.length ? buffed : [newSummon]));
        lg.push(`🦘 ${pfx}${a.nick} -> yavru çağırdı (${a.summonCount}/3)`);
      }
    }
  });

  // ── Killer buff (KILL_BUFF) ────────────────────────────────────────────────
  if (killer && killer.ability === AB.KILL_BUFF) {
    const km = pwr(killer);
    killer.atk   = clampStat(killer.atk   + 3 * km);
    killer.curHp = clampStat(killer.curHp + 3 * km);
    lg.push(`🦈 ${pfx}${killer.nick} -> öldürdü, +${3 * km}/+${3 * km}`);
    setTimeout(() => { triggerAnim?.(killer.id, "buff"); spawnParticles?.(killer.id, "attack"); }, 100);
  }

  // ── SUMMON_RETRIGGER (Dodo) ────────────────────────────────────────────────
  al.forEach((ally) => {
    if (!ally || ally.ability !== AB.SUMMON_RETRIGGER) return;
    const dodoM = pwr(ally);
    for (let dodoI = 0; dodoI < dodoM; dodoI++) {
      if (d.ability === AB.FAINT_BUFF && al.length > 0) {
        const rIdx = applyFaintBuffEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: `🦤 ${pfx}Dodo -> `, logSuffix: " efekti tekrar! " });
        if (rIdx >= 0) { triggerAnim?.(al[rIdx]?.id, "buff"); spawnParticles?.(al[rIdx]?.id, "buff"); }
      }
      if (d.ability === AB.FAINT_DMG) {
        applyFaintDamageEffect({ deadUnit: d, power: m, enemyTeam: en, logs: lg, logPrefix: `🦤 ${pfx}Dodo -> `, targetLabel: `Tüm ${enemyLabel}a`, logSuffix: " efekti tekrar! " });
      }
      if (d.ability === AB.FAINT_SHIELD) {
        applyFaintShieldEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: `🦤 ${pfx}Dodo -> `, targetLabel: allyLabel, logSuffix: " efekti tekrar! " });
      }
      if (d.ability === AB.FAINT_COPY && al.length > 0) {
        applyFaintCopyEffect({ deadUnit: d, power: m, allyTeam: al, clampStat, logs: lg, logPrefix: `🦤 ${pfx}Dodo -> `, logSuffix: " efekti tekrar! " });
      }
      applyDodoTeamRetriggerEffect({ ability: d.ability, sourceNick: d.nick, power: m, allyTeam: al, enemyTeam: en, enemyLabel, logs: lg, clampStat });
      if (d.ability === AB.FAINT_SUMMON) {
        const extra = createFaintSummonUnit({ name: "🥚", nick: summonNick, power: m, img: "baby_crocodile.png", flip: summonFlip });
        applySummonBuffs([extra], al, lg, { triggerAnim, spawnParticles });
        sm.push(extra);
        lg.push(`🦤 ${pfx}Dodo -> ${d.nick} efekti tekrar! Ekstra yavru ${AM.FAINT_SUMMON_AMT * m}/${AM.FAINT_SUMMON_AMT * m}`);
      }
      if (d.ability === AB.FAINT_DUPLICATE) {
        pushFaintDuplicateEffect({ deadUnit: d, allyTeam: al, summons: sm, logs: lg, logPrefix: `🦤 ${pfx}Dodo -> ` });
      }
    }
  });

  return { lg, sm, gG };
}

// ─── Dışa açılan ana fonksiyon ────────────────────────────────────────────────
export function resolveFaint(d, al, en, isP, killer, callbacks) {
  if (!d || d.isDead) return { lg: [], sm: [], gG: 0 };
  d.isDead = true;

  const labels = isP
    ? { pfx: "",        allyLabel: "oyuncu takım", enemyLabel: "düşman takım", summonNick: "Yavru",      summonFlip: false }
    : { pfx: "Düşman ", allyLabel: "düşman takım", enemyLabel: "oyuncu takım", summonNick: "Düş.Yavru", summonFlip: false };

  return _resolveFaintCore(d, al, en, isP, killer, callbacks, labels);
}
