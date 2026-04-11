import { AB, ABILITY_MULTIPLIERS as AM } from "../data/gameData";
import { applyTeamBuff, applyTeamDamage, applyTeamDebuff, getFaintWeakenAllDebuff, getTeamBuffAmount, getWaveDamage } from "./battleEffectUtils";

export const applyFaintDamageEffect = ({ deadUnit, power, enemyTeam, logs, logPrefix = "", targetLabel = "", logSuffix = "" }) => {
  const damage = power * 2;
  enemyTeam.forEach((unit) => {
    unit.curHp -= damage;
  });
  logs.push(`${logPrefix}${deadUnit.nick}${logSuffix}${targetLabel} ${damage} hasar`);
  return damage;
};

export const applyFaintShieldEffect = ({ deadUnit, power, allyTeam, clampStat, logs, logPrefix = "", targetLabel = "", logSuffix = "" }) => {
  const amount = 2 * power;
  allyTeam.forEach((unit) => {
    unit.curHp = clampStat(unit.curHp + amount);
  });
  logs.push(`${logPrefix}${deadUnit.nick}${logSuffix}${targetLabel} +${amount} HP`);
  return amount;
};

export const applyFaintBuffEffect = ({ deadUnit, power, allyTeam, clampStat, logs, logPrefix = "", logSuffix = "" }) => {
  if (allyTeam.length === 0) return -1;
  const i = Math.floor(Math.random() * allyTeam.length);
  allyTeam[i].atk = clampStat(allyTeam[i].atk + power);
  allyTeam[i].curHp = clampStat(allyTeam[i].curHp + power);
  logs.push(`${logPrefix}${deadUnit.nick}${logSuffix}${allyTeam[i].nick} e +${power}/+${power}`);
  return i;
};

export const createFaintSummonUnit = ({ name, nick, power, img, flip = false }) => ({
  name,
  nick,
  atk: AM.FAINT_SUMMON_AMT * power,
  hp: AM.FAINT_SUMMON_AMT * power,
  curHp: AM.FAINT_SUMMON_AMT * power,
  ability: AB.NONE,
  tier: 1,
  lvl: 1,
  exp: 0,
  id: Math.random(),
  img,
  flip,
});

export const pushFaintDuplicateEffect = ({ deadUnit, allyTeam, summons, logs, logPrefix = "" }) => {
  if (allyTeam.length === 0) return false;
  const i = Math.floor(Math.random() * allyTeam.length);
  summons.push({
    ...allyTeam[i],
    id: Math.random(),
    curHp: allyTeam[i].hp,
    ability: allyTeam[i].ability === AB.FAINT_DUPLICATE ? AB.NONE : allyTeam[i].ability,
  });
  logs.push(`${logPrefix}${deadUnit.nick} -> ${allyTeam[i].nick} kopyalandi`);
  return true;
};

export const applyFaintCopyEffect = ({ deadUnit, power, allyTeam, clampStat, logs, logPrefix = "", temporary = false, logSuffix = "" }) => {
  if (allyTeam.length === 0) return false;
  const i = Math.floor(Math.random() * allyTeam.length);
  const pct = power === 1 ? 0.25 : power === 2 ? 0.5 : 1;
  const atkGain = Math.floor(deadUnit.atk * pct);
  const hpGain = Math.floor(deadUnit.hp * pct);
  if (temporary) {
    if (!allyTeam[i].tempAtk) allyTeam[i].tempAtk = 0;
    if (!allyTeam[i].tempHp) allyTeam[i].tempHp = 0;
    allyTeam[i].tempAtk += atkGain;
    allyTeam[i].tempHp += hpGain;
  } else {
    allyTeam[i].atk = clampStat(allyTeam[i].atk + atkGain);
  }
  allyTeam[i].curHp = clampStat(allyTeam[i].curHp + hpGain);
  logs.push(`${logPrefix}${deadUnit.nick}${logSuffix}${allyTeam[i].nick} e +${atkGain}/+${hpGain}${temporary ? " (geçici)" : ""}`);
  return true;
};

export const applyDodoTeamRetriggerEffect = ({ ability, sourceNick, power, allyTeam, enemyTeam, enemyLabel, clampStat, logs }) => {
  if (ability === AB.FAINT_RAGE || ability === AB.CHEETAH_FAINT) {
    const buff = getTeamBuffAmount(power);
    applyTeamBuff(allyTeam, buff, clampStat);
    logs.push(`🦤 Dodo → ${sourceNick} efekti tekrar! Takıma +${buff}/+${buff}`);
    return true;
  }
  if (ability === AB.FAINT_WAVE) {
    const damage = getWaveDamage(power);
    applyTeamDamage(enemyTeam, damage);
    logs.push(`🦤 Dodo → ${sourceNick} efekti tekrar! ${enemyLabel} ${damage} hasar`);
    return true;
  }
  if (ability === AB.FAINT_WEAKEN_ALL) {
    const debuff = getFaintWeakenAllDebuff(power);
    applyTeamDebuff(enemyTeam, debuff);
    logs.push(`🦤 Dodo → ${sourceNick} efekti tekrar! ${enemyLabel} -${debuff}/-${debuff}`);
    return true;
  }
  if (ability === AB.STAG_COMBO) {
    const buff = 2 * power; // AM.STAG_COMBO_AMT
    allyTeam.forEach((pet, idx) => {
      if (!pet) return;
      allyTeam[idx] = {
        ...pet,
        atk: clampStat(pet.atk + buff),
        hp: typeof pet.hp === "number" ? clampStat(pet.hp + buff) : pet.hp,
        curHp: clampStat(pet.curHp + buff),
      };
    });
    logs.push(`🦤 Dodo → ${sourceNick} efekti tekrar! Takıma +${buff}/+${buff} KALICI`);
    return true;
  }
  return false;
};
export const applyFriendFaintEffect = ({ allyUnit, power, clampStat, logs, logPrefix = "", logSuffix = "" }) => {
  allyUnit.atk = clampStat(allyUnit.atk + 2 * power);
  allyUnit.curHp = clampStat(allyUnit.curHp + 2 * power);
  logs.push(`${logPrefix}${allyUnit.nick} -> +${2 * power}/+${2 * power}${logSuffix}`);
  return true;
};

export const createFriendSummonUnit = ({ allyUnit, power, name, nick, img, flip = false }) => {
  if (!allyUnit.summonCount) allyUnit.summonCount = 0;
  if (allyUnit.summonCount >= 3) return null;
  const summon = {
    name,
    nick,
    atk: power + 1,
    hp: power + 1,
    curHp: power + 1,
    ability: AB.NONE,
    tier: 1,
    lvl: 1,
    exp: 0,
    id: Math.random(),
    isSummon: true,
    img,
    flip,
  };
  allyUnit.summonCount++;
  return summon;
};

export const applyTeamWideFaintEffect = ({
  ability,
  sourceNick,
  power,
  allyTeam,
  enemyTeam,
  clampStat,
  logs,
  teamBuffLabel = "takım",
  enemyLabel = "düşman takımı",
}) => {
  if (ability === AB.FAINT_RAGE || ability === AB.CHEETAH_FAINT) {
    const buff = getTeamBuffAmount(power);
    applyTeamBuff(allyTeam, buff, clampStat);
    logs.push(`${sourceNick} ${ability} -> ${teamBuffLabel} +${buff}/+${buff}`);
    return true;
  }
  if (ability === AB.FAINT_WAVE) {
    const damage = getWaveDamage(power);
    applyTeamDamage(enemyTeam, damage);
    logs.push(`💀 ${sourceNick} → ${enemyLabel} ${damage} hasar`);
    return true;
  }
  return false;
};

export const applySelfFaintBuffEffect = ({ deadUnit, power, allyTeam, clampStat, logs, logPrefix = "", logSuffix = "" }) => {
  let applied = false;
  allyTeam.forEach((pet) => {
    if (pet.id === deadUnit.id) {
      pet.atk = clampStat(pet.atk + 2 * power);
      pet.curHp = clampStat(pet.curHp + 2 * power);
      if (typeof pet.hp === "number") {
        pet.hp = clampStat(pet.hp + 2 * power);
      }
      applied = true;
    }
  });
  if (applied) {
    logs.push(`${logPrefix}${deadUnit.nick}${logSuffix}+${2 * power}/+${2 * power} kalıcı`);
  }
  return applied;
};

export const applyStagComboEffect = ({ deadUnit, power, allyTeam, clampStat, logs, logPrefix = "", targetLabel = "" }) => {
  const buff = 2 * power;
  allyTeam.forEach((pet, idx) => {
    if (!pet) return;
    if (pet.id === deadUnit.id) return;
    allyTeam[idx] = {
      ...pet,
      atk: clampStat(pet.atk + buff),
      hp: typeof pet.hp === "number" ? clampStat(pet.hp + buff) : pet.hp,
      curHp: clampStat(pet.curHp + buff),
    };
  });
  logs.push(`${logPrefix}${deadUnit.nick} -> ${targetLabel}+${buff}/+${buff} KALICI`);
  return buff;
};

export const pushFaintSummonEffect = ({ deadUnit, power, summons, logs, name, nick, img, flip = false, logPrefix = "" }) => {
  const summon = createFaintSummonUnit({ name, nick, power, img, flip });
  summons.push(summon);
  logs.push(`${logPrefix}${deadUnit.nick} -> ${AM.FAINT_SUMMON_AMT * power}/${AM.FAINT_SUMMON_AMT * power} yavru çağırdı`);
  return summon;
};
