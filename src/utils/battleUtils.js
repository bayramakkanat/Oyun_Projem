import { TIERS, AB, ABILITY_MULTIPLIERS as AM } from "../data/gameData";
import { spawnFlyingParticle, spawnFloatingText } from "./animations";

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
// ─── Shared helper: tek fonksiyon, iki tarafa da çalışır ─────────────────────
// isPlayer=true → pp (oyuncu); isPlayer=false → ee (düşman)
const applyStartAbilitiesForTeam = (team, enemies, isPlayer, lg, callbacks) => {
  const { triggerAnim, spawnParticles } = callbacks;
  const pfx = isPlayer ? "" : "Düşman ";

  team.forEach((a, i) => {
    if (!a) return;
    const m = pwr(a);

    if (a.ability === AB.START_BUFF) {
      team[i].atk += m;
      if (isPlayer) { triggerAnim(a.id, "buff"); spawnParticles(a.id, "buff"); }
      lg.push(`⚡ ${pfx}${a.nick} → +${m} ATK (savaş başı)`);
    }
    if (a.ability === AB.START_TEAM_SHIELD) {
      team.forEach((x, j) => {
        team[j].curHp = clampStat(team[j].curHp + m);
        if (isPlayer) { team[j].hp = clampStat(team[j].hp + m); triggerAnim(x.id, "buff"); }
      });
      if (isPlayer) spawnParticles(a.id, "shield");
      const allyLabel = isPlayer ? "takıma" : "düşman takımına";
      lg.push(`🛡️ ${pfx}${a.nick} → Tüm ${allyLabel} +${m} HP`);
    }
    if (a.ability === AB.START_TRIPLE && isPlayer) {
      team[i].tripleAttackCount = m;
      triggerAnim(a.id, "buff");
      lg.push(`⚔️⚔️⚔️ ${a.nick} → İlk ${m} saldırı 3x hasar!`);
    }
    if (a.ability === AB.START_ALL_PERM) {
      team.forEach((x, j) => {
        team[j].atk = clampStat(team[j].atk + 2 * m);
        if (isPlayer) triggerAnim(x.id, "buff");
      });
      if (isPlayer) spawnParticles(a.id, "buff");
      const allyLabel = isPlayer ? "takıma" : "düşman takımına";
      lg.push(`🦅 ${pfx}${a.nick} → Tüm ${allyLabel} +${AM.STAG_COMBO_AMT * m} ATK KALICI`);
    }
    if (a.ability === AB.START_TRAMPLE) {
      team[i].atk += 5 * m;
      team[i].trample = true;
      if (isPlayer) triggerAnim(a.id, "buff");
      lg.push(`🦏 ${pfx}${a.nick} → +${AM.START_TRAMPLE_ATK * m} ATK (çiğneme${isPlayer ? " aktif" : ""})`);
    }
    if (a.ability === AB.START_CHARGE) {
      const buffVal = AM.START_CHARGE_AMT * m;
      team[i].curHp = clampStat(team[i].curHp + buffVal);
      if (isPlayer) {
        triggerAnim(a.id, "buff");
        const el = document.querySelector(`[data-pet-id="${a.id}"]`);
        if (el) {
          const r = el.getBoundingClientRect();
          spawnFloatingText(`+${buffVal} HP`, r.left + r.width / 2, r.top, "buff");
        }
      }
      lg.push(`🐗 ${pfx}${a.nick} → +${buffVal} HP`);
    }
    if (a.ability === AB.START_TANK) {
      team[i].curHp += 3 * m;
      if (isPlayer) triggerAnim(a.id, "buff");
      lg.push(`🦀 ${pfx}${a.nick} → +${AM.START_TANK_HP * m} HP (tank)`);
    }

    // Düşmana hasar veren yetenekler
    if (enemies.length > 0) {
      const enLabel = isPlayer ? "düşmana" : "oyuncu birimine";
      if (a.ability === AB.START_SNIPE) {
        const t = enemies.length > 1 ? enemies.length - 1 : 0;
        enemies[t].curHp -= 3 * m;
        triggerAnim(enemies[t].id, "damage");
        if (isPlayer) spawnParticles(a.id, "attack");
        lg.push(`🎯 ${pfx}${a.nick} → Arka ${enLabel} ${AM.START_SNIPE_DMG * m} hasar`);
        if (isPlayer) { const dead = enemies.filter(x => x.curHp <= 0); dead.forEach((_, di) => enemies.splice(enemies.indexOf(dead[di]), 1)); }
        else { enemies.forEach((x, xi) => { enemies[xi] = { ...x, curHp: Math.max(1, x.curHp) }; }); }
      }
      if (a.ability === AB.START_MULTI_SNIPE) {
        const targetCount = Math.min(m + 1, enemies.length);
        if (isPlayer) spawnParticles(a.id, "attack");
        for (let j = 0; j < targetCount; j++) {
          if (enemies.length === 0) break;
          const targetIdx = Math.floor(Math.random() * enemies.length);
          enemies[targetIdx].curHp -= 8 * m;
          triggerAnim(enemies[targetIdx].id, "damage");
          lg.push(`🦑 ${pfx}${a.nick} → ${enemies[targetIdx].nick}'e ${AM.START_MULTI_SNIPE_DMG * m} hasar`);
          if (isPlayer) { const dead = enemies.filter(x => x.curHp <= 0); dead.forEach(d => enemies.splice(enemies.indexOf(d), 1)); }
          else { enemies.forEach((x, xi) => { enemies[xi] = { ...x, curHp: Math.max(1, x.curHp) }; }); }
        }
      }
      if (a.ability === AB.START_FEAR) {
        enemies[0].atk = Math.max(1, enemies[0].atk - 10 * m);
        triggerAnim(enemies[0].id, "damage");
        if (enemies.length > 1) {
          enemies[1].atk = Math.max(1, enemies[1].atk - 10 * m);
          triggerAnim(enemies[1].id, "damage");
        }
        if (isPlayer) spawnParticles(a.id, "attack");
        lg.push(`🦁 ${pfx}${a.nick} → Ön 2 ${enLabel.replace("na","ya")} -${AM.START_FEAR_ATK_RED * m} ATK${isPlayer ? "!" : ""}`);
      }
      if (a.ability === AB.START_FIRE) {
        enemies.forEach(x => { x.curHp -= 6 * m; triggerAnim(x.id, "damage"); });
        if (!isPlayer) team[i].atk = clampStat(team[i].atk + 4 * m); // Düşman ejderi kendine buff alır
        if (isPlayer) { triggerAnim(a.id, "buff"); spawnParticles(a.id, "fire"); }
        const targetLabel = isPlayer ? "düşmanlara" : "oyuncu takımına";
        lg.push(`🐉 ${pfx}${a.nick} → Tüm ${targetLabel} ${AM.START_FIRE_DMG * m} hasar${isPlayer ? ` + Kendine +${AM.START_FIRE_ATK_BUFF * m} ATK KALICI` : ""}`);
        if (isPlayer) { const dead = enemies.filter(x => x.curHp <= 0); dead.forEach(d => enemies.splice(enemies.indexOf(d), 1)); }
        else { enemies.forEach((x, xi) => { enemies[xi] = { ...x, curHp: Math.max(1, x.curHp) }; }); }
      }
      if (a.ability === AB.START_DMG) {
        const t = Math.floor(Math.random() * enemies.length);
        enemies[t].curHp -= 2 * m;
        triggerAnim(enemies[t].id, "damage");
        if (isPlayer) spawnParticles(a.id, "attack");
        lg.push(`💥 ${pfx}${a.nick} → ${enemies[t].nick}'e ${AM.START_DMG * m} hasar`);
        if (isPlayer) { const dead = enemies.filter(x => x.curHp <= 0); dead.forEach(d => enemies.splice(enemies.indexOf(d), 1)); }
        else { enemies.forEach((x, xi) => { enemies[xi] = { ...x, curHp: Math.max(1, x.curHp) }; }); }
      }
      if (a.ability === AB.START_POISON) {
        enemies[0].atk = Math.max(1, enemies[0].atk - m * 2);
        lg.push(`🐍 ${pfx}${a.nick} → Ön ${enLabel} -${AM.START_POISON_ATK_RED * m} ATK`);
      }
      if (a.ability === AB.START_FREEZE_ENEMY) {
        const reduction = (m * 30) / 100;
        enemies[0].atk = Math.max(1, Math.floor(enemies[0].atk * (1 - reduction)));
        triggerAnim(enemies[0].id, "damage");
        if (enemies.length > 1) {
          enemies[enemies.length - 1].atk = Math.max(1, Math.floor(enemies[enemies.length - 1].atk * (1 - reduction)));
          triggerAnim(enemies[enemies.length - 1].id, "damage");
        }
        lg.push(`🦣 ${pfx}${a.nick} → Ön ve arka ${isPlayer ? "düşmanı" : "oyuncu birimini"} %${AM.START_FREEZE_PERC * m} yavaşlattı`);
      }
      if (a.ability === AB.WEAKEN_STRONG) {
        let mxI = 0, mxP = 0;
        enemies.forEach((en, idx) => { if (en.atk + en.curHp > mxP) { mxP = en.atk + en.curHp; mxI = idx; } });
        const r = (25 * m) / 100;
        enemies[mxI].atk = Math.max(1, Math.floor(enemies[mxI].atk * (1 - r)));
        enemies[mxI].curHp = Math.max(1, Math.floor(enemies[mxI].curHp * (1 - r)));
        triggerAnim(enemies[mxI].id, "damage");
        lg.push(`🐧 ${pfx}${a.nick} → ${isPlayer ? "" : "En güçlü "}${enemies[mxI].nick}'${isPlayer ? "i" : "i"} %${AM.WEAKEN_STRONG_PERC * m} zayıflattı`);
      }
    }
  });
};

// appStart: legacy synchronous battle-start calculator (kullanılmıyor ama dışa aktarılıyor)
export const appStart = (p, e, callbacks) => {
  let pp = p.map((x) => ({ ...x }));
  let ee = e.map((x) => ({ ...x }));
  let lg = [];

  // Stag combo (savaş başı takım-çapı kalıcı buff)
  pp.forEach((pet) => {
    if (pet && pet.ability === AB.STAG_COMBO) {
      const m = pwr(pet);
      pp = pp.map((ally) =>
        ally && ally.id !== pet.id
          ? { ...ally, atk: clampStat(ally.atk + 2 * m), hp: clampStat(ally.hp + 2 * m), curHp: clampStat(ally.curHp + 2 * m) }
          : ally
      );
      lg.push(`🦌 ${pet.nick} → Takıma +${AM.STAG_COMBO_AMT * m}/+${AM.STAG_COMBO_AMT * m} KALICI`);
    }
  });

  // Geçici bufflar
  pp.forEach((a, i) => {
    if (a.tempAtk) { pp[i].atk += a.tempAtk; lg.push(`✨ ${a.nick} +${a.tempAtk} atk (geçici)`); }
    if (a.tempHp)  { pp[i].curHp += a.tempHp;  lg.push(`✨ ${a.nick} +${a.tempHp} hp (geçici)`);  }
  });

  // Savaş başı yetenekler — paylaşılan helper ile
  applyStartAbilitiesForTeam(pp, ee, true,  lg, callbacks);
  applyStartAbilitiesForTeam(ee, pp, false, lg, callbacks);

  // filter → ee/pp mutate edildi, sil/tut sync yap
  pp = pp.filter(x => x.curHp > 0);
  ee = ee.filter(x => x.curHp > 0);

  return { pp, ee, lg };
};
export const applySummonBuffs = (newSummons, alliedTeam, logArr, callbacks) => {
  const { triggerAnim, spawnParticles } = callbacks;

  newSummons.forEach((summon) => {
    alliedTeam.forEach((pet) => {
      if (pet && pet.ability === AB.SUMMON_BUFF) {
        const m = pwr(pet);
        const buff = AM.SUMMON_BUFF_AMT * m;
        summon.atk = clampStat(summon.atk + buff);
        summon.hp = clampStat(summon.hp + buff);
        summon.curHp = clampStat(summon.curHp + buff);
        triggerAnim(pet.id, "buff");
        setTimeout(() => {
          const bearCenter = document.querySelector(`[data-pet-id="${pet.id}"]`);
          const targetCenter = document.querySelector(`[data-pet-id="${summon.id}"]`);
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
            const extraBuff = AM.SUMMON_BUFF_AMT * bearM * dodoM;
            summon.atk = clampStat(summon.atk + extraBuff);
            summon.hp = clampStat(summon.hp + extraBuff);
            summon.curHp = clampStat(summon.curHp + extraBuff);
            triggerAnim(pet.id, "buff");
            setTimeout(() => {
              const dodoEl = document.querySelector(`[data-pet-id="${pet.id}"]`);
              const targetEl = document.querySelector(`[data-pet-id="${summon.id}"]`);
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
