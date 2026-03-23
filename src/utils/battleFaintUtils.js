export const applyFaintDamageEffect = ({ deadUnit, power, enemyTeam, logs, logPrefix = "", targetLabel = "", logSuffix = "" }) => {
  const damage = power * 2;
  enemyTeam.forEach((unit) => {
    unit.curHp -= damage;
  });
  logs.push(`${logPrefix}${deadUnit.nick}${logSuffix}${targetLabel} ${damage} hasar`);
  return damage;
};
