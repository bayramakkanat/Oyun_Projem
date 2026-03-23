export const getTeamBuffAmount = (power) => 8 * power;

export const getWaveDamage = (power) => 9 * power;

export const getFearAllDebuff = (power) => 5 * power;

export const getFaintWeakenAllDebuff = (power) =>
  power === 1 ? 3 : power === 2 ? 5 : 8;

export const applyTeamBuff = (team, amount, clampStat) => {
  team.forEach((unit) => {
    unit.atk = clampStat(unit.atk + amount);
    unit.curHp = clampStat(unit.curHp + amount);
  });
};

export const applyTeamDebuff = (team, amount, minHp = 0) => {
  team.forEach((unit) => {
    unit.atk = Math.max(1, unit.atk - amount);
    unit.curHp = Math.max(minHp, unit.curHp - amount);
  });
};

export const applyTeamDamage = (team, amount) => {
  team.forEach((unit) => {
    unit.curHp -= amount;
  });
};
