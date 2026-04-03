import { AB, ABILITY_MULTIPLIERS as AM } from "../data/gameData";

const selfBuffAbilities = [
  AB.START_BUFF, AB.START_TEAM_SHIELD, AB.START_ALL_PERM,
  AB.START_TRAMPLE, AB.START_CHARGE, AB.START_TANK,
];

async function runTempBuffPhase({ playerTeam, delay, triggerAnim, addBattleLog, syncBattleTeams, isCancelled, faint }) {
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

// ─── Birleştirilmiş self-buff phase ───────────────────────────────────────────
// isPlayer=true → oyuncu takımı (pp), isPlayer=false → düşman takımı (ee)
async function runSelfBuffPhase({
  team, delay, triggerAnim, clampStat, pwr, spawnParticles,
  setLog, setTeam, syncBattleTeams, isCancelled, isPlayer,
}) {
  const pfx = isPlayer ? "" : "Düsman ";
  let nextTeam = [...team];

  for (let i = 0; i < nextTeam.length; i++) {
    const a = nextTeam[i];
    if (!a || !selfBuffAbilities.includes(a.ability)) continue;
    const m = pwr(a);

    if (a.ability === AB.START_BUFF) {
      nextTeam[i].atk += m;
      setLog((l) => [...l, `⚡ ${pfx}${a.nick} -> +${m} ATK`]);
    } else if (a.ability === AB.START_TEAM_SHIELD) {
      nextTeam = nextTeam.map((x) => x ? { ...x, hp: clampStat(x.hp + m), curHp: clampStat(x.curHp + m) } : x);
      setLog((l) => [...l, `🛡️ ${pfx}${a.nick} -> Tüm takima +${m} HP`]);
    } else if (a.ability === AB.START_ALL_PERM) {
      const buffAmount = 2 * m;
      nextTeam = nextTeam.map((x) => x ? { ...x, atk: clampStat(x.atk + buffAmount) } : x);
      // Oyuncu tarafında kalıcı buff React state'e de yansıtılır
      if (isPlayer && setTeam) {
        setTeam((prev) => prev.map((pet) => pet ? { ...pet, atk: clampStat(pet.atk + buffAmount) } : pet));
      }
      nextTeam.forEach((x) => { if (x) triggerAnim(x.id, "buff"); });
      setLog((l) => [...l, `🦅 ${pfx}${a.nick} -> Tüm takima +${buffAmount} ATK KALICI`]);
    } else if (a.ability === AB.START_TRAMPLE) {
      nextTeam[i].atk += AM.START_TRAMPLE_ATK * m;
      nextTeam[i].trample = true;
      setLog((l) => [...l, `🦏 ${pfx}${a.nick} -> +${AM.START_TRAMPLE_ATK * m} ATK (çiğneme)`]);
    } else if (a.ability === AB.START_CHARGE) {
      nextTeam[i].atk += AM.START_CHARGE_AMT * m;
      setLog((l) => [...l, `🐗 ${pfx}${a.nick} -> +${AM.START_CHARGE_AMT * m} ATK`]);
    } else if (a.ability === AB.START_TANK) {
      nextTeam[i].curHp += 3 * m;
      setLog((l) => [...l, `🦀 ${pfx}${a.nick} -> +${AM.START_TANK_HP * m} HP`]);
    }

    triggerAnim(a.id, "ability");
    spawnParticles(a.id, "buff");
    // Oyuncu → syncBattleTeams(team, null); düşman → syncBattleTeams(null, team)
    syncBattleTeams(isPlayer ? nextTeam : null, isPlayer ? null : nextTeam);
    await delay(600);
    if (isCancelled()) return { cancelled: true, team: nextTeam };
  }
  return { cancelled: false, team: nextTeam };
}

// Geriye dönük uyumluluk için alias'lar (runBattleStartPhase içinde kullanılıyor)
async function runPlayerSelfBuffPhase(args) {
  const result = await runSelfBuffPhase({ ...args, team: args.playerTeam, isPlayer: true });
  return { cancelled: result.cancelled, playerTeam: result.team };
}
async function runEnemySelfBuffPhase(args) {
  const result = await runSelfBuffPhase({ ...args, team: args.enemyTeam, isPlayer: false });
  return { cancelled: result.cancelled, enemyTeam: result.team };
}

export async function runBattleStartPhase({
  pp, ee,
  delay, isCancelled,
  triggerAnim, clampStat, pwr, spawnParticles, spawnProjectile,
  setLog, setTeam,
  syncBattleTeams,
  faint,
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
      addBattleLog(`🦌 ${pet.nick} -> Takima +${AM.STAG_COMBO_AMT * m}/+${AM.STAG_COMBO_AMT * m} KALICI`);
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
      addBattleLog(`🦌 Düsman ${pet.nick} -> Düsman takimina +${AM.STAG_COMBO_AMT * m}/+${AM.STAG_COMBO_AMT * m} KALICI`);
      syncBattleTeams(null, ee);
      await delay(1000);
      if (isCancelled()) return;
    }
  }

  // 2. Temp buffs
  if (!(await runTempBuffPhase({ playerTeam: pp, delay, triggerAnim, addBattleLog, syncBattleTeams, isCancelled }))) return;
  if (!(await runTempBuffPhase({ playerTeam: ee, delay, triggerAnim, addBattleLog, syncBattleTeams, isCancelled }))) return;

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

  // Projektil uçuş süresi (ms) - statlar bu süreden sonra güncellenecek
  const PROJ_FLY_MS = 700;

  for (const { pet: a, isPlayer } of attackers) {
    const m = pwr(a);
    const targets = isPlayer ? ee : pp;
    if (targets.length === 0) continue;
    triggerAnim(a.id, "ability");

    if (a.ability === AB.START_FIRE) {
      const dmg = 6 * m;
      // 1. Projektiller fırlatılır
      targets.forEach((x) => { spawnProjectile(a.id, x.id, "start_fire"); });
      addBattleLog(`🐉 ${isPlayer ? "" : "Düsman "}${a.nick} -> Tüm ${isPlayer ? "düsmanlara" : "takima"} ${dmg} hasar`);
      // 2. Projektil uçuş süresi beklenir
      await delay(PROJ_FLY_MS);
      // 3. Projektil hedefe ulaştı → stat güncelle + hasar animasyonu
      targets.forEach((x) => { x.curHp -= dmg; triggerAnim(x.id, "damage"); });
      syncBattleTeams(pp, ee);
      await delay(1400 - PROJ_FLY_MS);
    } else if (a.ability === AB.START_FEAR) {
      const aliveTargets = targets.filter((x) => x.curHp > 0);
      if (aliveTargets.length === 0) continue;
      spawnProjectile(a.id, aliveTargets[0].id, "start_fear");
      if (aliveTargets.length > 1) spawnProjectile(a.id, aliveTargets[1].id, "start_fear");
      const fearT = aliveTargets.length > 1 ? `${aliveTargets[0].nick} ve ${aliveTargets[1].nick}` : aliveTargets[0].nick;
      addBattleLog(`🦁 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${fearT} -${AM.START_FEAR_ATK_RED * m} ATK`);
      await delay(PROJ_FLY_MS);
      aliveTargets[0].atk = Math.max(1, aliveTargets[0].atk - 10 * m);
      triggerAnim(aliveTargets[0].id, "damage");
      if (aliveTargets.length > 1) {
        aliveTargets[1].atk = Math.max(1, aliveTargets[1].atk - 10 * m);
        triggerAnim(aliveTargets[1].id, "damage");
      }
      syncBattleTeams(pp, ee);
      await delay(1200 - PROJ_FLY_MS);
    } else if (a.ability === AB.START_SNIPE) {
      const currentTargets = isPlayer ? ee : pp;
      const aliveTargets = currentTargets.filter((x) => x.curHp > 0);
      if (aliveTargets.length === 0) continue;
      const snipeTarget = aliveTargets[aliveTargets.length - 1];
      spawnProjectile(a.id, snipeTarget.id, "start_snipe", null, true);
      addBattleLog(`🎯 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${snipeTarget.nick} e ${AM.START_SNIPE_DMG * m} hasar`);
      await delay(PROJ_FLY_MS);
      snipeTarget.curHp -= 3 * m;
      triggerAnim(snipeTarget.id, "damage");
      syncBattleTeams(pp, ee);
      await delay(1200 - PROJ_FLY_MS);
    } else if (a.ability === AB.START_MULTI_SNIPE) {
      // Tüm hedefleri BAŞTA seç (snapshot) — sonra sırayla fırlat
      const alive = targets.filter((x) => x.curHp > 0);
      const targetCount = Math.min(m + 1, alive.length);
      // Rastgele karıştır ve ilk N tanesini al
      const selectedTargets = [...alive]
        .sort(() => Math.random() - 0.5)
        .slice(0, targetCount);

      for (let j = 0; j < selectedTargets.length; j++) {
        const t = selectedTargets[j];
        // Hedef hala hayatta mı kontrol et (önceki atıştan öldüyse atla)
        const stillAlive = targets.find((x) => x.id === t.id && x.curHp > 0);
        if (!stillAlive) continue;

        spawnProjectile(a.id, t.id, "start_multi_snipe", null, true);
        addBattleLog(`🦑 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${t.nick} e ${AM.START_MULTI_SNIPE_DMG * m} hasar`);
        await delay(PROJ_FLY_MS);
        // ID ile bul — referans stale olabilir
        const currentT = targets.find((x) => x.id === t.id);
        if (currentT && currentT.curHp > 0) {
          currentT.curHp -= 8 * m;
          triggerAnim(currentT.id, "damage");
          syncBattleTeams(pp, ee);
        }
        await delay(300);
      }
    } else if (a.ability === AB.START_DMG) {
      const currentTargets = isPlayer ? ee : pp;
      const alive = currentTargets.filter((x) => x.curHp > 0);
      if (alive.length === 0) continue;
      const t = alive[Math.floor(Math.random() * alive.length)];
      spawnProjectile(a.id, t.id, "start_dmg", null, true);
      addBattleLog(`💥 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${t.nick} e ${AM.START_DMG * m} hasar`);
      await delay(PROJ_FLY_MS);
      t.curHp -= 2 * m;
      triggerAnim(t.id, "damage");
      syncBattleTeams(pp, ee);
      await delay(1200 - PROJ_FLY_MS);
    } else if (a.ability === AB.START_POISON) {
      spawnProjectile(a.id, targets[0].id, "start_poison");
      addBattleLog(`🐍 ${isPlayer ? "" : "Düsman "}${a.nick} -> On düsmana -${AM.START_POISON_ATK_RED * m} ATK`);
      await delay(PROJ_FLY_MS);
      targets[0].atk = Math.max(1, targets[0].atk - m * 2);
      triggerAnim(targets[0].id, "damage");
      syncBattleTeams(pp, ee);
      await delay(1200 - PROJ_FLY_MS);
    } else if (a.ability === AB.START_FREEZE_ENEMY) {
      const reduction = (m * 30) / 100;
      spawnProjectile(a.id, targets[0].id, "start_freeze_enemy");
      if (targets.length > 1) spawnProjectile(a.id, targets[targets.length - 1].id, "start_freeze_enemy");
      addBattleLog(`🦣 ${isPlayer ? "" : "Düsman "}${a.nick} -> On ve arka düsmani %${m * 30} yavaslatti`);
      await delay(PROJ_FLY_MS);
      targets[0].atk = Math.max(1, Math.floor(targets[0].atk * (1 - reduction)));
      triggerAnim(targets[0].id, "damage");
      if (targets.length > 1) {
        targets[targets.length - 1].atk = Math.max(1, Math.floor(targets[targets.length - 1].atk * (1 - reduction)));
        triggerAnim(targets[targets.length - 1].id, "damage");
      }
      syncBattleTeams(pp, ee);
      await delay(1200 - PROJ_FLY_MS);
    } else if (a.ability === AB.WEAKEN_STRONG) {
      let mxI = 0, mxP = 0;
      targets.forEach((en, idx) => { if (en.atk + en.curHp > mxP) { mxP = en.atk + en.curHp; mxI = idx; } });
      spawnProjectile(a.id, targets[mxI].id, "weaken_strong");
      addBattleLog(`🐧 ${isPlayer ? "" : "Düsman "}${a.nick} -> ${targets[mxI].nick} i %${25 * m} zayiflatti`);
      await delay(PROJ_FLY_MS);
      const r = (25 * m) / 100;
      targets[mxI].atk = Math.max(1, Math.floor(targets[mxI].atk * (1 - r)));
      targets[mxI].curHp = Math.max(1, Math.floor(targets[mxI].curHp * (1 - r)));
      triggerAnim(targets[mxI].id, "damage");
      syncBattleTeams(pp, ee);
      await delay(1200 - PROJ_FLY_MS);
    }

    if (isPlayer) {
  const dead = ee.filter((x) => x.curHp <= 0);
  ee = ee.filter((x) => x.curHp > 0);
  if (faint) dead.forEach((d) => faint(d, ee, pp, false, null));
} else {
  const dead = pp.filter((x) => x.curHp <= 0);
  pp = pp.filter((x) => x.curHp > 0);
  if (faint) dead.forEach((d) => faint(d, pp, ee, true, null));
}
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