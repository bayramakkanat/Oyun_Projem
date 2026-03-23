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
