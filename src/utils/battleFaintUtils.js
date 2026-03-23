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
