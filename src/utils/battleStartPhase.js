import { AB } from "../data/gameData";

const selfBuffAbilities = [
  AB.START_BUFF, AB.START_TEAM_SHIELD, AB.START_ALL_PERM,
  AB.START_TRAMPLE, AB.START_CHARGE, AB.START_TANK,
];

async function runTempBuffPhase({ playerTeam, delay, triggerAnim, addBattleLog, syncBattleTeams, isCancelled }) {
  for (let i = 0; i < playerTeam.length; i++) {
    const pet = playerTeam[i];
    if (!pet || (!pet.tempAtk && !pet.tempHp)) continue;
    triggerAnim(pet.id, "ability");
    if (pet.tempAtk) playerTeam[i].atk += pet.tempAtk;
    if (pet.tempHp) playerTeam[i].curHp += pet.tempHp;
    addBattleLog(`? ${pet.nick} +${pet.tempAtk || 0} ATK / +${pet.tempHp || 0} HP (Gecici)`);
    syncBattleTeams(playerTeam, null);
    await delay(800);
    if (isCancelled()) return false;
  }
  return true;
}

async function runPlayerSelfBuffPhase({ playerTeam, delay, triggerAnim, clampStat, pwr, spawnParticles, setLog, setTeam, syncBattleTeams, isCancelled }) {
  let nextTeam = [...playerTeam];
  for (let i = 0; i < nextTeam.length; i++) {
    const a = nextTeam[i];
    if (!a || !selfBuffAbilities.includes(a.ability)) continue;
    const m = pwr(a);
    if (a.ability === AB.START_BUFF) {
      nextTeam[i].atk += m;
      setLog((l) => [...l, `⚡ ${a.nick} -> +${m} ATK`]);
    } else if (a.ability === AB.START_TEAM_SHIELD) {
      nextTeam = nextTeam.map((x) => x ? { ...x, hp: clampStat(x.hp + m), curHp: clampStat(x.curHp + m) } : x);
      setLog((l) => [...l, `🛡️ ${a.nick} -> Tüm takima +${m} HP`]);
    } else if (a.ability === AB.START_ALL_PERM) {
      const buffAmount = 2 * m;
      nextTeam = nextTeam.map((x) => x ? { ...x, atk: clampStat(x.atk + buffAmount) } : x);
      setTeam((prev) => prev.map((pet) => pet ? { ...pet, atk: clampStat(pet.atk + buffAmount) } : pet));
      nextTeam.forEach((x) => { if (x) triggerAnim(x.id, "buff"); });
      setLog((l) => [...l, `🦅 ${a.nick} -> Tüm takima +${2 * m} ATK KALICI`]);
    } else if (a.ability === AB.START_TRAMPLE) {
      nextTeam[i].atk += 5 * m;
      nextTeam[i].trample = true;
      setLog((l) => [...l, `🦏 ${a.nick} -> +${5 * m} ATK (ciğneme)`]);
    } else if (a.ability === AB.START_CHARGE) {
      nextTeam[i].curHp += 2 * m;
      setLog((l) => [...l, `🐗 ${a.nick} -> +${2 * m} HP`]);
    } else if (a.ability === AB.START_TANK) {
      nextTeam[i].curHp += 3 * m;
      setLog((l) => [...l, `🦀 ${a.nick} -> +${3 * m} HP`]);
    }
    triggerAnim(a.id, "ability");
    spawnParticles(a.id, "buff");
    syncBattleTeams(nextTeam, null);
    await delay(600);
    if (isCancelled()) return { cancelled: true, playerTeam: nextTeam };
  }
  return { cancelled: false, playerTeam: nextTeam };
}

async function runEnemySelfBuffPhase({ enemyTeam, delay, triggerAnim, clampStat, pwr, spawnParticles, setLog, syncBattleTeams, isCancelled }) {
  let nextTeam = [...enemyTeam];
  for (let i = 0; i < nextTeam.length; i++) {
    const a = nextTeam[i];
    if (!a || !selfBuffAbilities.includes(a.ability)) continue;
    const m = pwr(a);
    if (a.ability === AB.START_BUFF) {
      nextTeam[i].atk += m;
      setLog((l) => [...l, `⚡ Düsman ${a.nick} -> +${m} ATK`]);
    } else if (a.ability === AB.START_TEAM_SHIELD) {
      nextTeam = nextTeam.map((x) => x ? { ...x, hp: clampStat(x.hp + m), curHp: clampStat(x.curHp + m) } : x);
      setLog((l) => [...l, `🛡️ Düsman ${a.nick} -> Tüm takima +${m} HP`]);
    } else if (a.ability === AB.START_ALL_PERM) {
      nextTeam = nextTeam.map((x) => x ? { ...x, atk: clampStat(x.atk + 2 * m) } : x);
      setLog((l) => [...l, `🦅 Düsman ${a.nick} -> Tüm takima +${2 * m} ATK`]);
    } else if (a.ability === AB.START_TRAMPLE) {
      nextTeam[i].atk += 5 * m;
      nextTeam[i].trample = true;
      setLog((l) => [...l, `🦏 Düsman ${a.nick} -> +${5 * m} ATK`]);
    } else if (a.ability === AB.START_CHARGE) {
      nextTeam[i].curHp += 2 * m;
      setLog((l) => [...l, `🐗 Düsman ${a.nick} -> +${2 * m} HP`]);
    } else if (a.ability === AB.START_TANK) {
      nextTeam[i].curHp += 3 * m;
      setLog((l) => [...l, `🦀 Düsman ${a.nick} -> +${3 * m} HP`]);
    }
    triggerAnim(a.id, "ability");
    spawnParticles(a.id, "buff");
    syncBattleTeams(null, nextTeam);
    await delay(600);
    if (isCancelled()) return { cancelled: true, enemyTeam: nextTeam };
  }
  return { cancelled: false, enemyTeam: nextTeam };
}

export async function runBattleStartPhase({
  pp, ee,
  delay, isCancelled,
  triggerAnim, clampStat, pwr, spawnParticles, spawnProjectile,
  setLog, setTeam,
  syncBattleTeams,
  isDebugBattle, announceDebugWinner, scheduleDebugBattleReset,
  setStep,
}) {
  const addBattleLog = (msg) => setLog((l) => [...l, msg]);

  await delay(1200);
  if (isCancelled()) return;

  // 1. Stag combo
  for (let i = 0; i < pp.length; i++) {
    if (pp[i]?.ability === AB.STAG_COMBO) {
      const pet = pp[i];
      triggerAnim(pet.id, "ability");
      const m = pwr(pet);
      pp = pp.map((a) => a ? { ...a, atk: clampStat(a.atk + 2 * m), hp: clampStat(a.hp + 2 * m), curHp: clampStat(a.curHp + 2 * m) } : a);
      setTeam((prev) => prev.map((p) => p ? { ...p, atk: clampStat(p.atk + 2 * m), hp: clampStat(p.hp + 2 * m), curHp: clampStat(p.curHp + 2 * m) } : p));
      addBattleLog(`🦌 ${pet.nick} -> Takima +${2 * m}/+${2 * m} KALICI`);
      syncBattleTeams(pp, null);
      await delay(1000);
      if (isCancelled()) return;
    }
  }
  for (let i = 0; i < ee.length; i++) {
    if (ee[i]?.ability === AB.STAG_COMBO) {
      const pet = ee[i];
      triggerAnim(pet.id, "ability");
      const m = pwr(pet);
      ee = ee.map((a) => a ? { ...a, atk: clampStat(a.atk + 2 * m), hp: clampStat(a.hp + 2 * m), curHp: clampStat(a.curHp + 2 * m) } : a);
      addBattleLog(`🦌 Düsman ${pet.nick} -> Düsman takimina +${2 * m}/+${2 * m} KALICI`);
      syncBattleTeams(null, ee);
      await delay(1000);
      if (isCancelled()) return;
    }
  }

  // 2. Temp buffs
  if (!(await runTempBuffPhase({ playerTeam: pp, delay, triggerAnim, addBattleLog, syncBattleTeams, isCancelled }))) return;

  // 3. Self buff phases
  const playerPhase = await runPlayerSelfBuffPhase({ playerTeam: pp, delay, triggerAnim, clampStat, pwr, spawnParticles, setLog, setTeam, syncBattleTeams, isCancelled });
  if (playerPhase.cancelled) return;
  pp = playerPhase.playerTeam;

  const enemyPhase = await runEnemySelfBuffPhase({ enemyTeam: ee, delay, triggerAnim, clampStat, pwr, spawnParticles, setLog, syncBattleTeams, isCancelled });
  if (enemyPhase.cancelled) return;
  ee = enemyPhase.enemyTeam;

  // 4. Attack abilities (ATK sıralı)
  const attackAbilities = [AB.START_FIRE, AB.START_FEAR, AB.START_SNIPE, AB.START_MULTI_SNIPE, AB.START_DMG, AB.START_POISON, AB.START_FREEZE_ENEMY, AB.WEAKEN_STRONG];
  let attackers = [];
  pp.forEach((a, idx) => { if (a && attackAbilities.includes(a.ability)) attackers.push({ pet: a, isPlayer: true, idx }); });
  ee.forEach((a, idx) => { if (a && attackAbilities.includes(a.ability)) attackers.push({ pet: a, isPlayer: false, idx }); });
  attackers.sort((x, y) => {
    if (y.pet.atk !== x.pet.atk) return y.pet.atk - x.pet.atk;
    if (y.pet.curHp !== x.pet.curHp) return y.pet.curHp - x.pet.curHp;
    return x.idx - y.idx;
  });

  for (const { pet: a, isPlayer } of attackers) {
    const m = pwr(a);
    const targets = isPlayer ? ee : pp;
    if (targets.length === 0) continue;
    triggerAnim(a.id, "ability");

    if (a.ability === AB.START_FIRE) {
      const dmg = 6 * m;
      targets.forEach((x) => { x.curHp -= dmg; spawnProjectile(a.id, x.id, "start_fire"); triggerAnim(x.id, "damage"); });
      addBattleLog(`🐉 ${isPlayer ? "" : "Düsman "}${a.nick} -> Tüm ${isPlayer ? "düsmanlara" : "takima"} ${dmg} hasar`);
      await delay(1400);
    } else if (a.ability === AB.START_FEAR) {
      const aliveTargets = targets.filter((x) => x.curHp > 0);
      if (aliveTargets.length === 0) continue;
      aliveTargets[0].atk = Math.max(1, aliveTargets[0].atk - 10 * m);
      spawnProjectile(a.id, aliveTargets[0].id, "start_fear");
      triggerAnim(aliveTargets[0].id, "damage");
      if (aliveTargets.length > 1) {
        aliveTargets[1].atk = Math.max(1, aliveTargets[1].atk - 10 * m);
        spawnProjectile(a.id, aliveTargets[1].id, "start_fear");
        triggerAnim(aliveTargets[1].id, "damage");
      }
      const fearT = targets.length > 1 ? `${targets[0].nick} ve ${targets[1].nick}` : targets[0].nick;
      addBattleLog(`🦁 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${fearT} -${10 * m} ATK`);
      await delay(1200);
    } else if (a.ability === AB.START_SNIPE) {
      const currentTargets = isPlayer ? ee : pp;
      const aliveTargets = currentTargets.filter((x) => x.curHp > 0);
      if (aliveTargets.length === 0) continue;
      const snipeTarget = aliveTargets[aliveTargets.length - 1];
      snipeTarget.curHp -= 3 * m;
      setTimeout(() => { spawnProjectile(a.id, snipeTarget.id, "start_snipe", null, true); }, 100);
      triggerAnim(snipeTarget.id, "damage");
      addBattleLog(`🎯 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${snipeTarget.nick} e ${3 * m} hasar`);
      await delay(1200);
    } else if (a.ability === AB.START_MULTI_SNIPE) {
      const targetCount = Math.min(m + 1, targets.length);
      for (let j = 0; j < targetCount; j++) {
        const alive = targets.filter((x) => x.curHp > 0);
        if (alive.length > 0) {
          const t = alive[Math.floor(Math.random() * alive.length)];
          t.curHp -= 8 * m;
          spawnProjectile(a.id, t.id, "start_multi_snipe", null, true);
          triggerAnim(t.id, "damage");
          addBattleLog(`🦑 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${t.nick} e ${8 * m} hasar`);
          await delay(700);
        }
      }
    } else if (a.ability === AB.START_DMG) {
      const currentTargets = isPlayer ? ee : pp;
      const alive = currentTargets.filter((x) => x.curHp > 0);
      if (alive.length === 0) continue;
      const t = alive[Math.floor(Math.random() * alive.length)];
      t.curHp -= 2 * m;
      spawnProjectile(a.id, t.id, "start_dmg", null, true);
      triggerAnim(t.id, "damage");
      addBattleLog(`💥 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${t.nick} e ${2 * m} hasar`);
      await delay(1200);
    } else if (a.ability === AB.START_POISON) {
      targets[0].atk = Math.max(1, targets[0].atk - m * 2);
      spawnProjectile(a.id, targets[0].id, "start_poison");
      triggerAnim(targets[0].id, "damage");
      addBattleLog(`🐍 ${isPlayer ? "" : "Düsman "}${a.nick} -> On düsmana -${m * 2} ATK`);
      await delay(1200);
    } else if (a.ability === AB.START_FREEZE_ENEMY) {
      const reduction = (m * 30) / 100;
      targets[0].atk = Math.max(1, Math.floor(targets[0].atk * (1 - reduction)));
      spawnProjectile(a.id, targets[0].id, "start_freeze_enemy");
      triggerAnim(targets[0].id, "damage");
      if (targets.length > 1) {
        targets[targets.length - 1].atk = Math.max(1, Math.floor(targets[targets.length - 1].atk * (1 - reduction)));
        spawnProjectile(a.id, targets[targets.length - 1].id, "start_freeze_enemy");
        triggerAnim(targets[targets.length - 1].id, "damage");
      }
      addBattleLog(`🦣 ${isPlayer ? "" : "Düsman "}${a.nick} -> On ve arka düsmani %${m * 30} yavaslatti`);
      await delay(1200);
    } else if (a.ability === AB.WEAKEN_STRONG) {
      let mxI = 0, mxP = 0;
      targets.forEach((en, idx) => { if (en.atk + en.curHp > mxP) { mxP = en.atk + en.curHp; mxI = idx; } });
      const r = (25 * m) / 100;
      targets[mxI].atk = Math.max(1, Math.floor(targets[mxI].atk * (1 - r)));
      targets[mxI].curHp = Math.max(1, Math.floor(targets[mxI].curHp * (1 - r)));
      spawnProjectile(a.id, targets[mxI].id, "weaken_strong");
      triggerAnim(targets[mxI].id, "damage");
      addBattleLog(`🐧 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${targets[mxI].nick} i %${25 * m} zayiflatti`);
      await delay(1200);
    }

    if (isPlayer) ee = ee.filter((x) => x.curHp > 0);
    else pp = pp.filter((x) => x.curHp > 0);
    syncBattleTeams(pp, ee);
    if (isCancelled()) return;
  }

  pp = pp.filter((x) => x.curHp > 0);
  ee = ee.filter((x) => x.curHp > 0);
  syncBattleTeams(pp, ee);

  if (pp.length === 0 || ee.length === 0) {
    if (isDebugBattle) {
      announceDebugWinner(pp.length, ee.length);
      scheduleDebugBattleReset();
      return;
    }
    setStep((s) => s + 1);
    return;
  }

  setStep((s) => s + 1);
  await delay(500);
}