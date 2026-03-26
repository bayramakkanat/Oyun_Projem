import { TIERS, AB } from "../data/gameData";
import { spawnFlyingParticle } from "./animations";

const MAX_STAT = 500;

const safeNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null || isNaN(value))
    return defaultValue;
  return value;
};

const clampStat = (v) => {
  const num = safeNumber(v, 0);
  return Math.min(Math.max(num, 0), MAX_STAT);
};

const pwr = (a) => {
  if (!a) return 1;
  if (a.lvl === 3) return 3;
  if (a.lvl === 2) return 2;
  return 1;
};

export const applyPermanentBuffs = (teamArray) => {
  let newTeam = [...teamArray];
  newTeam.forEach((pet, idx) => {
    if (pet && pet.ability === AB.START_FIRE) {
      const m = pwr(pet);
      newTeam[idx] = {
        ...newTeam[idx],
        atk: clampStat(newTeam[idx].atk + 4 * m),
      };
    }
  });
  return newTeam;
};

export const genE = (turn, maxT, teamSlots, difficulty, difficultyLevel) => {
  const cnt = Math.min(2 + Math.floor(turn / 2), teamSlots);
  const pool = [];
  for (let t = 1; t <= maxT; t++) pool.push(...TIERS[t]);
  const enemies = Array.from({ length: cnt }, () => {
    const b = pool[Math.floor(Math.random() * pool.length)];
    const bn = Math.floor((turn / 2) * difficulty) + 1;
    const l = Math.min(
      1 + Math.floor(Math.random() * Math.ceil(turn / 2.5)),
      3
    );
    return {
      ...b,
      id: Math.random(),
      lvl: l,
      exp: 0,
      atk: clampStat(
        Math.max(b.atk, Math.floor((b.atk + bn + l - 1) * difficulty))
      ),
      hp: clampStat(
        Math.max(b.hp, Math.floor((b.hp + bn + l - 1) * difficulty))
      ),
      curHp: clampStat(
        Math.max(b.hp, Math.floor((b.hp + bn + l - 1) * difficulty))
      ),
    };
  });
  return enemies.sort((a, b) => {
    const aFB = [
      AB.FRIEND_FAINT,
      AB.FRIEND_SUMMON,
      AB.FAINT_BUFF,
      AB.END_TEAM_BUFF,
    ].includes(a.ability);
    const bFB = [
      AB.FRIEND_FAINT,
      AB.FRIEND_SUMMON,
      AB.FAINT_BUFF,
      AB.END_TEAM_BUFF,
    ].includes(b.ability);
    if (difficultyLevel === "hard") {
      if (aFB && !bFB) return 1;
      if (!aFB && bFB) return -1;
      return b.atk + b.curHp - (a.atk + a.curHp);
    }
    if (aFB && !bFB) return 1;
    if (!aFB && bFB) return -1;
    return b.curHp / (b.atk + b.curHp) - a.curHp / (a.atk + a.curHp);
  });
};
export const applyEndTurnBuffs = (currentTeam) => {
  const nt = [...currentTeam];
  nt.forEach((a, i) => {
    if (!a) return;
    const m = pwr(a);

    if (a.ability === AB.END_HEAL_ONE) {
      const allies = nt.filter((t, idx) => t && idx !== i);
      if (allies.length > 0) {
        const randomAlly = allies[Math.floor(Math.random() * allies.length)];
        const tIdx = nt.findIndex((t) => t && t.id === randomAlly.id);
        if (tIdx !== -1) {
          nt[tIdx] = {
            ...nt[tIdx],
            hp: clampStat(nt[tIdx].hp + m),
            curHp: clampStat(nt[tIdx].curHp + m),
          };
        }
      }
    }

    if (a.ability === AB.END_TEAM_BUFF) {
      const targets = nt
        .slice(0, i)
        .filter((x) => x)
        .slice(-2);
      targets.forEach((t) => {
        const idx = nt.findIndex((x) => x && x.id === t.id);
        if (idx !== -1) {
          nt[idx] = {
            ...nt[idx],
            atk: clampStat(nt[idx].atk + m * 2),
            hp: clampStat(nt[idx].hp + m * 2),
            curHp: clampStat(nt[idx].curHp + m * 2),
          };
        }
      });
    }

    if (a.ability === AB.END_ALL) {
      nt.forEach((t, j) => {
        if (t) {
          nt[j] = {
            ...nt[j],
            hp: clampStat(nt[j].hp + m * 3),
            curHp: clampStat(nt[j].curHp + m * 3),
          };
        }
      });
    }

    if (a.ability === AB.END_BUFF_AHEAD) {
      const targets = nt
        .slice(i + 1)
        .filter((x) => x)
        .slice(0, 3);
      targets.forEach((t) => {
        const idx = nt.findIndex((x) => x && x.id === t.id);
        if (idx !== -1) {
          nt[idx] = {
            ...nt[idx],
            atk: clampStat(nt[idx].atk + m * 2),
            hp: clampStat(nt[idx].hp + m * 2),
            curHp: clampStat(nt[idx].curHp + m * 2),
          };
        }
      });
    }

    if (a.ability === AB.END_SELF_BUFF) {
      nt[i] = {
        ...nt[i],
        atk: clampStat(nt[i].atk + m * 3),
        hp: clampStat(nt[i].hp + m * 3),
        curHp: clampStat(nt[i].curHp + m * 3),
      };
    }
  });
  return nt;
};
export const appStart = (p, e, callbacks) => {
  const { triggerAnim, spawnParticles } = callbacks;
  let pp = p.map((x) => ({ ...x }));
  let ee = e.map((x) => ({ ...x }));
  let lg = [];

  pp.forEach((pet) => {
   if (pet && pet.ability === AB.STAG_COMBO) {
      const m = pwr(pet);
      pp = pp.map((ally) =>
        ally && ally.id !== pet.id
          ? {
              ...ally,
              atk: clampStat(ally.atk + 2 * m),
              hp: clampStat(ally.hp + 2 * m),
              curHp: clampStat(ally.curHp + 2 * m),
            }
          : ally
      );
      lg.push(`🦌 ${pet.nick} → Takıma +${2 * m}/+${2 * m} KALICI`);
    }
  });

  pp.forEach((a, i) => {
    if (a.tempAtk) {
      pp[i].atk += a.tempAtk;
      lg.push(`✨ ${a.nick} +${a.tempAtk} atk (geçici)`);
    }
    if (a.tempHp) {
      pp[i].curHp += a.tempHp;
      lg.push(`✨ ${a.nick} +${a.tempHp} hp (geçici)`);
    }
  });

  pp.forEach((a, i) => {
    const m = pwr(a);
    if (a.ability === AB.START_BUFF) {
      pp[i].atk += m;
      triggerAnim(a.id, "buff");
      spawnParticles(a.id, "buff");
      lg.push(`⚡ ${a.nick} → +${m} ATK (savaş başı)`);
    }
    if (a.ability === AB.START_TEAM_SHIELD) {
      pp.forEach((x, j) => {
        pp[j].curHp = clampStat(pp[j].curHp + m);
        pp[j].hp = clampStat(pp[j].hp + m);
        triggerAnim(x.id, "buff");
      });
      spawnParticles(a.id, "shield");
      lg.push(`🛡️ ${a.nick} → Tüm takıma +${m} HP`);
    }
    if (a.ability === AB.START_TRIPLE) {
      pp[i].tripleAttackCount = m;
      triggerAnim(a.id, "buff");
      lg.push(`⚔️⚔️⚔️ ${a.nick} → İlk ${m} saldırı 3x hasar!`);
    }
    if (a.ability === AB.START_ALL_PERM) {
      pp.forEach((x) => {
        triggerAnim(x.id, "buff");
      });
      spawnParticles(a.id, "buff");
      lg.push(`🦅 ${a.nick} → Tüm takıma +${2 * m} ATK KALICI`);
    }
    if (a.ability === AB.START_SNIPE && ee.length > 0) {
      const t = ee.length > 1 ? ee.length - 1 : 0;
      ee[t].curHp -= 3 * m;
      triggerAnim(ee[t].id, "damage");
      spawnParticles(a.id, "attack");
      lg.push(`🎯 ${a.nick} → Arka düşmana ${3 * m} hasar`);
      ee = ee.filter((x) => x.curHp > 0);
    }
    if (a.ability === AB.START_MULTI_SNIPE && ee.length > 0) {
      const targetCount = Math.min(m + 1, ee.length);
      spawnParticles(a.id, "attack");
      for (let j = 0; j < targetCount; j++) {
        if (ee.length > 0) {
          const targetIdx = Math.floor(Math.random() * ee.length);
          ee[targetIdx].curHp -= 8 * m;
          triggerAnim(ee[targetIdx].id, "damage");
          lg.push(`🦑 ${a.nick} → ${ee[targetIdx].nick}'e ${8 * m} hasar`);
          ee = ee.filter((x) => x.curHp > 0);
        }
      }
    }
    if (a.ability === AB.START_FEAR && ee.length > 0) {
      ee[0].atk = Math.max(1, ee[0].atk - 10 * m);
      triggerAnim(ee[0].id, "damage");
      if (ee.length > 1) {
        ee[1].atk = Math.max(1, ee[1].atk - 10 * m);
        triggerAnim(ee[1].id, "damage");
      }
      spawnParticles(a.id, "attack");
      lg.push(`🦁 ${a.nick} → Ön 2 düşmana -${10 * m} ATK!`);
    }
    if (a.ability === AB.START_FIRE) {
      ee.forEach((x) => {
        x.curHp -= 6 * m;
        triggerAnim(x.id, "damage");
      });
      triggerAnim(a.id, "buff");
      spawnParticles(a.id, "fire");
      lg.push(
        `🐉 ${a.nick} → Tüm düşmanlara ${6 * m} hasar + Kendine +${
          4 * m
        } ATK KALICI`
      );
      ee = ee.filter((x) => x.curHp > 0);
    }
    if (a.ability === AB.START_TRAMPLE) {
      pp[i].atk += 5 * m;
      pp[i].trample = true;
      triggerAnim(a.id, "buff");
      lg.push(`🦏 ${a.nick} → +${5 * m} ATK (çiğneme aktif)`);
    }
    if (a.ability === AB.START_CHARGE) {
      pp[i].curHp += 2 * m;
      triggerAnim(a.id, "buff");
      lg.push(`🐗 ${a.nick} → +${2 * m} HP`);
    }
    if (a.ability === AB.START_TANK) {
      pp[i].curHp += 3 * m;
      triggerAnim(a.id, "buff");
      lg.push(`🦀 ${a.nick} → +${3 * m} HP (tank)`);
    }
    if (a.ability === AB.START_DMG && ee.length > 0) {
      const t = Math.floor(Math.random() * ee.length);
      ee[t].curHp -= 2 * m;
      triggerAnim(ee[t].id, "damage");
      spawnParticles(a.id, "attack");
      lg.push(`💥 ${a.nick} → ${ee[t].nick}'e ${2 * m} hasar`);
      ee = ee.filter((x) => x.curHp > 0);
    }
    if (a.ability === AB.START_POISON && ee.length > 0) {
      ee[0].atk = Math.max(1, ee[0].atk - m * 2);
      lg.push(`🐍 ${a.nick} → Ön düşmana -${m * 2} ATK`);
    }
    if (a.ability === AB.WEAKEN_STRONG && ee.length > 0) {
      let mxI = 0,
        mxP = 0;
      ee.forEach((en, idx) => {
        if (en.atk + en.curHp > mxP) {
          mxP = en.atk + en.curHp;
          mxI = idx;
        }
      });
      const r = (25 * m) / 100;
      ee[mxI].atk = Math.max(1, Math.floor(ee[mxI].atk * (1 - r)));
      ee[mxI].curHp = Math.max(1, Math.floor(ee[mxI].curHp * (1 - r)));
      triggerAnim(ee[mxI].id, "damage");
      lg.push(`🐧 ${a.nick} → ${ee[mxI].nick}'i %${25 * m} zayıflattı`);
    }
    if (a.ability === AB.START_FREEZE_ENEMY && ee.length > 0) {
      const reduction = (m * 30) / 100;
      ee[0].atk = Math.max(1, Math.floor(ee[0].atk * (1 - reduction)));
      triggerAnim(ee[0].id, "damage");
      if (ee.length > 1) {
        ee[ee.length - 1].atk = Math.max(
          1,
          Math.floor(ee[ee.length - 1].atk * (1 - reduction))
        );
        triggerAnim(ee[ee.length - 1].id, "damage");
      }
      lg.push(`🦣 ${a.nick} → Ön ve arka düşmanı %${m * 30} yavaşlattı`);
    }
  });

  ee.forEach((a, i) => {
    const m = pwr(a);
    if (a.ability === AB.START_BUFF) {
      ee[i].atk += m;
      lg.push(`⚡ Düşman ${a.nick} → +${m} ATK (savaş başı)`);
    }
    if (a.ability === AB.START_TEAM_SHIELD) {
      ee.forEach((x, j) => {
        ee[j].curHp = clampStat(ee[j].curHp + m);
      });
      lg.push(`🛡️ Düşman ${a.nick} → Tüm düşman takımına +${m} HP`);
    }
    if (a.ability === AB.START_TANK) {
      ee[i].curHp += 3 * m;
      lg.push(`🦀 Düşman ${a.nick} → +${3 * m} HP (tank)`);
    }
    if (a.ability === AB.START_DMG && pp.length > 0) {
      const t = Math.floor(Math.random() * pp.length);
      pp[t].curHp -= 2 * m;
      lg.push(`💥 Düşman ${a.nick} → ${pp[t].nick}'e ${2 * m} hasar`);
      pp = pp.map((x) => ({ ...x, curHp: Math.max(1, x.curHp) }));
    }
    if (a.ability === AB.START_SNIPE && pp.length > 0) {
      const t = pp.length > 1 ? pp.length - 1 : 0;
      pp[t].curHp -= 3 * m;
      lg.push(`🎯 Düşman ${a.nick} → Arka oyuncu birimine ${3 * m} hasar`);
      pp = pp.map((x) => ({ ...x, curHp: Math.max(1, x.curHp) }));
    }
    if (a.ability === AB.START_MULTI_SNIPE && pp.length > 0) {
      const targetCount = Math.min(m + 1, pp.length);
      for (let j = 0; j < targetCount; j++) {
        if (pp.length > 0) {
          const targetIdx = Math.floor(Math.random() * pp.length);
          pp[targetIdx].curHp -= 8 * m;
          lg.push(
            `🦑 Düşman ${a.nick} → ${pp[targetIdx].nick}'e ${8 * m} hasar`
          );
          pp = pp.map((x) => ({ ...x, curHp: Math.max(1, x.curHp) }));
        }
      }
    }
    if (a.ability === AB.START_FEAR && pp.length > 0) {
      pp[0].atk = Math.max(1, pp[0].atk - 10 * m);
      if (pp.length > 1) pp[1].atk = Math.max(1, pp[1].atk - 10 * m);
      lg.push(`😱 Düşman ${a.nick} → Ön 2 oyuncu birimine -${10 * m} ATK`);
    }
    if (a.ability === AB.START_FIRE) {
      pp.forEach((x) => {
        x.curHp -= 6 * m;
      });
      ee[i].atk = clampStat(ee[i].atk + 4 * m);
      lg.push(`🐉 Düşman ${a.nick} → Tüm oyuncu takımına ${6 * m} hasar`);
      pp = pp.map((x) => ({ ...x, curHp: Math.max(1, x.curHp) }));
    }
    if (a.ability === AB.START_POISON && pp.length > 0) {
      pp[0].atk = Math.max(1, pp[0].atk - m * 2);
      lg.push(`🐍 Düşman ${a.nick} → Ön oyuncu birimine -${m * 2} ATK`);
    }
    if (a.ability === AB.START_CHARGE) {
      ee[i].curHp += 2 * m;
      lg.push(`🐗 Düşman ${a.nick} → +${2 * m} HP`);
    }
    if (a.ability === AB.START_TRAMPLE) {
      ee[i].atk += 5 * m;
      ee[i].trample = true;
      lg.push(`🦏 Düşman ${a.nick} → +${5 * m} ATK (çiğneme)`);
    }
    if (a.ability === AB.START_ALL_PERM) {
      ee.forEach((x, j) => {
        ee[j].atk = clampStat(ee[j].atk + 2 * m);
      });
      lg.push(`🦅 Düşman ${a.nick} → Tüm düşman takımına +${2 * m} ATK`);
    }
    if (a.ability === AB.START_FREEZE_ENEMY && pp.length > 0) {
      const reduction = (m * 30) / 100;
      pp[0].atk = Math.max(1, Math.floor(pp[0].atk * (1 - reduction)));
      if (pp.length > 1)
        pp[pp.length - 1].atk = Math.max(
          1,
          Math.floor(pp[pp.length - 1].atk * (1 - reduction))
        );
      lg.push(
        `🦣 Düşman ${a.nick} → Ön ve arka oyuncu birimini %${m * 30} yavaşlattı`
      );
    }
    if (a.ability === AB.WEAKEN_STRONG && pp.length > 0) {
      let mxI = 0,
        mxP = 0;
      pp.forEach((en, idx) => {
        if (en.atk + en.curHp > mxP) {
          mxP = en.atk + en.curHp;
          mxI = idx;
        }
      });
      const r = (25 * m) / 100;
      pp[mxI].atk = Math.max(1, Math.floor(pp[mxI].atk * (1 - r)));
      pp[mxI].curHp = Math.max(1, Math.floor(pp[mxI].curHp * (1 - r)));
      lg.push(
        `🐧 Düşman ${a.nick} → En güçlü oyuncu birimini %${25 * m} zayıflattı`
      );
    }
  });

  return { pp, ee, lg };
};
export const applySummonBuffs = (newSummons, alliedTeam, logArr, callbacks) => {
  const { triggerAnim, spawnParticles } = callbacks;

  newSummons.forEach((summon) => {
    alliedTeam.forEach((pet) => {
      if (pet && pet.ability === AB.SUMMON_BUFF) {
        const m = pwr(pet);
        const buff = 5 * m;
        summon.atk = clampStat(summon.atk + buff);
        summon.hp = clampStat(summon.hp + buff);
        summon.curHp = clampStat(summon.curHp + buff);
        triggerAnim(pet.id, "buff");
        setTimeout(() => {
          const bearCenter = document.querySelector(`[data-pet-id="${pet.id}"]`);
          if (bearCenter) {
            const rect = bearCenter.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            ["🐻", "✨"].forEach((icon, i) => {
              setTimeout(() => spawnFlyingParticle(
                icon, cx, cy, cx + (i * 20 - 10), cy - 40, 800
              ), i * 150);
            });
          }
        }, 50);
        logArr.push(
          `🐻 ${pet.nick} → Yavru ${summon.nick}'e +${buff}/+${buff} güçlendirdi!`
        );
      }
    });

    alliedTeam.forEach((pet) => {
      if (pet && pet.ability === AB.SUMMON_RETRIGGER) {
        const dodoM = pwr(pet);
        alliedTeam.forEach((buffPet) => {
          if (buffPet && buffPet.ability === AB.SUMMON_BUFF) {
            const bearM = pwr(buffPet);
            const extraBuff = 5 * bearM * dodoM;
            summon.atk = clampStat(summon.atk + extraBuff);
            summon.hp = clampStat(summon.hp + extraBuff);
            summon.curHp = clampStat(summon.curHp + extraBuff);
            triggerAnim(pet.id, "buff");
            setTimeout(() => {
              const dodoEl = document.querySelector(`[data-pet-id="${pet.id}"]`);
              if (dodoEl) {
                const rect = dodoEl.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                ["🦤", "✨"].forEach((icon, i) => {
                  setTimeout(() => spawnFlyingParticle(
                    icon, cx, cy, cx + (i * 20 - 10), cy - 40, 800
                  ), i * 150);
                });
              }
            }, 50);
            logArr.push(
              `🦤 ${pet.nick} → Ayı buffını ${dodoM}x tekrarladı! Yavru +${extraBuff}/+${extraBuff} daha aldı!`
            );
          }
        });
      }
    });
  });

  return newSummons;
};
