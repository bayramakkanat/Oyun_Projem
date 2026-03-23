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
  if (allyTeam.length === 0) return false;
  const i = Math.floor(Math.random() * allyTeam.length);
  allyTeam[i].atk = clampStat(allyTeam[i].atk + power);
  allyTeam[i].curHp = clampStat(allyTeam[i].curHp + power);
  logs.push(`${logPrefix}${deadUnit.nick}${logSuffix}${allyTeam[i].nick} e +${power}/+${power}`);
  return true;
};

export const createFaintSummonUnit = ({ name, nick, power, img, flip = false }) => ({
  name,
  nick,
  atk: 4 * power,
  hp: 4 * power,
  curHp: 4 * power,
  ability: "none",
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
    ability: allyTeam[i].ability === "faint_duplicate" ? "none" : allyTeam[i].ability,
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
  if (ability === "faint_rage" || ability === "cheetah_faint") {
    const buff = getTeamBuffAmount(power);
    applyTeamBuff(allyTeam, buff, clampStat);
    logs.push(`Dodo retrigger -> ${sourceNick} -> team +${buff}/+${buff}`);
    return true;
  }
  if (ability === "faint_wave") {
    const damage = getWaveDamage(power);
    applyTeamDamage(enemyTeam, damage);
    logs.push(`Dodo retrigger -> ${sourceNick} -> ${enemyLabel} ${damage} damage`);
    return true;
  }
  if (ability === "faint_weaken_all") {
    const debuff = getFaintWeakenAllDebuff(power);
    applyTeamDebuff(enemyTeam, debuff);
    logs.push(`Dodo retrigger -> ${sourceNick} -> ${enemyLabel} -${debuff}/-${debuff}`);
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
    atk: power * 2,
    hp: power * 3,
    curHp: power * 3,
    ability: "none",
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
  teamBuffLabel = "team",
  enemyLabel = "enemy team",
}) => {
  if (ability === "faint_rage" || ability === "cheetah_faint") {
    const buff = getTeamBuffAmount(power);
    applyTeamBuff(allyTeam, buff, clampStat);
    logs.push(`${sourceNick} ${ability} -> ${teamBuffLabel} +${buff}/+${buff}`);
    return true;
  }
  if (ability === "faint_wave") {
    const damage = getWaveDamage(power);
    applyTeamDamage(enemyTeam, damage);
    logs.push(`${sourceNick} ${ability} -> ${enemyLabel} ${damage} damage`);
    return true;
  }
  return false;
};
