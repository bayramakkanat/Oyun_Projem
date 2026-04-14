import { AB, ABILITY_MULTIPLIERS as AM } from "../data/gameData";

const selfBuffAbilities = [
  AB.START_BUFF, AB.START_TEAM_SHIELD, AB.START_ALL_PERM,
  AB.START_TRAMPLE, AB.START_CHARGE, AB.START_TANK,
];

// ─── Saldırı yeteneklerini 3 gruba ayırır ─────────────────────────────────────
// Grup 0: Alan hasarı  — tüm takıma vurur  (Ejderha)
// Grup 1: Rastgele/çoklu hedef             (Kertenkele, Kalamar)
// Grup 2: Hedefi belli                     (Baykuş, Aslan, Penguen, Yılan, Mamut)
const ATTACK_GROUP = {
  [AB.START_FIRE]:         0,
  [AB.START_DMG]:          1,
  [AB.START_MULTI_SNIPE]:  1,
  [AB.START_SNIPE]:        2,
  [AB.START_FEAR]:         2,
  [AB.START_POISON]:       2,
  [AB.START_FREEZE_ENEMY]: 2,
  [AB.WEAKEN_STRONG]:      2,
};
const getAttackGroup = (ability) => ATTACK_GROUP[ability] ?? 2;

// ─── DOM'da pet elementi görünür mü? ──────────────────────────────────────────
// spawnProjectile'a geçmeden önce hedef DOM'da yoksa boşa atım olur.
const isPetVisibleInDOM = (petId) => {
  const el = document.querySelector(`[data-pet-id="${petId}"]`);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

// ─── Ability "sahneye çık" animasyon süresi ───────────────────────────────────
// PixiBattleScene'deki "ability" GSAP bloğu: 0.28s büyü + 0.32s bekle + 0.28s küçül = ~880ms
// Projektili bu sürenin en az yarısında fırlatıyoruz (hayvan hâlâ büyük görünürken).
const ABILITY_RISE_MS  = 580; // triggerAnim → bu kadar bekle → projektil fırlat
const PROJ_FLY_MS      = 700; // projektil havada → hasar uygula

async function runTempBuffPhase({ playerTeam, delay, triggerAnim, addBattleLog, syncBattleTeams, isCancelled, faint }) {
  for (let i = 0; i < playerTeam.length; i++) {
    const pet = playerTeam[i];
    if (!pet || (!pet.tempAtk && !pet.tempHp)) continue;
    triggerAnim(pet.id, "ability");
    if (pet.tempAtk) playerTeam[i].atk += pet.tempAtk;
    if (pet.tempHp) playerTeam[i].curHp += pet.tempHp;
    addBattleLog(`✨ ${pet.nick} +${pet.tempAtk || 0} ATK / +${pet.tempHp || 0} HP (geçici)`);
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
  const pfx = isPlayer ? "" : "Düşman ";
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
      setLog((l) => [...l, `🛡️ ${pfx}${a.nick} -> Tüm takıma +${m} HP`]);
    } else if (a.ability === AB.START_ALL_PERM) {
      const buffAmount = 2 * m;
      nextTeam = nextTeam.map((x) => x ? { ...x, atk: clampStat(x.atk + buffAmount) } : x);
      // Oyuncu tarafında kalıcı buff React state'e de yansıtılır
      if (isPlayer && setTeam) {
        setTeam((prev) => prev.map((pet) => pet ? { ...pet, atk: clampStat(pet.atk + buffAmount) } : pet));
      }
      nextTeam.forEach((x) => { if (x) triggerAnim(x.id, "buff"); });
      setLog((l) => [...l, `🦅 ${pfx}${a.nick} -> Tüm takıma +${buffAmount} ATK KALICI`]);
    } else if (a.ability === AB.START_TRAMPLE) {
      nextTeam[i].atk += AM.START_TRAMPLE_ATK * m;
      nextTeam[i].trample = true;
      setLog((l) => [...l, `🦏 ${pfx}${a.nick} -> +${AM.START_TRAMPLE_ATK * m} ATK (çiğneme)`]);
    } else if (a.ability === AB.START_CHARGE) {
      nextTeam[i].hp    += AM.START_CHARGE_AMT * m;
      nextTeam[i].curHp += AM.START_CHARGE_AMT * m;
      setLog((l) => [...l, `🐗 ${pfx}${a.nick} -> +${AM.START_CHARGE_AMT * m} HP`]);
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

  // FIX 3: Spawn animasyonu bitmeden saldırıya geçme.
  // PixiBattleScene'de her hayvan idx * 150ms delay + 650ms bounce süresiyle giriyor.
  // En fazla hayvan sayısına göre dinamik hesapla, minimum 1200ms.
  const maxPetCount = Math.max(pp.length, ee.length);
  const spawnWaitMs = Math.max(1200, maxPetCount * 150 + 700);
  await delay(spawnWaitMs);
  if (isCancelled()) return;

  // 1. Stag combo
  for (let i = 0; i < pp.length; i++) {
    if (pp[i]?.ability === AB.STAG_COMBO) {
      const pet = pp[i];
      triggerAnim(pet.id, "ability");
      const m = pwr(pet);
      pp = pp.map((a) => a ? { ...a, atk: clampStat(a.atk + 2 * m), hp: clampStat(a.hp + 2 * m), curHp: clampStat(a.curHp + 2 * m) } : a);
      setTeam((prev) => prev.map((p) => p ? { ...p, atk: clampStat(p.atk + 2 * m), hp: clampStat(p.hp + 2 * m), curHp: clampStat(p.curHp + 2 * m) } : p));
      addBattleLog(`🦌 ${pet.nick} -> Takıma +${AM.STAG_COMBO_AMT * m}/+${AM.STAG_COMBO_AMT * m} KALICI`);
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
      addBattleLog(`🦌 Düşman ${pet.nick} -> Düşman takımına +${AM.STAG_COMBO_AMT * m}/+${AM.STAG_COMBO_AMT * m} KALICI`);
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

  // 4. Attack abilities
  // FIX 1: Önce grupla (Alan → Rastgele → Hedef belli), sonra aynı grupta ATK'ya göre sırala.
  const attackAbilities = [
    AB.START_FIRE,
    AB.START_DMG, AB.START_MULTI_SNIPE,
    AB.START_SNIPE, AB.START_FEAR, AB.START_POISON, AB.START_FREEZE_ENEMY, AB.WEAKEN_STRONG,
  ];
  let attackers = [];
  pp.forEach((a, idx) => { if (a && attackAbilities.includes(a.ability)) attackers.push({ pet: a, isPlayer: true, idx }); });
  ee.forEach((a, idx) => { if (a && attackAbilities.includes(a.ability)) attackers.push({ pet: a, isPlayer: false, idx }); });

  attackers.sort((x, y) => {
    const gx = getAttackGroup(x.pet.ability);
    const gy = getAttackGroup(y.pet.ability);
    if (gx !== gy) return gx - gy;              // Önce grup sırası (0→1→2)
    if (y.pet.atk !== x.pet.atk) return y.pet.atk - x.pet.atk; // Aynı grupta ATK yüksek önce
    if (y.pet.curHp !== x.pet.curHp) return y.pet.curHp - x.pet.curHp;
    return x.idx - y.idx;
  });

  for (const { pet: a, isPlayer } of attackers) {
    const m = pwr(a);
    const targets = isPlayer ? ee : pp;
    if (targets.length === 0) continue;

    // ── ADIM 1: Hayvan büyüyüp sahneye çıkıyor ──────────────────────────────
    // triggerAnim("ability") → PixiBattleScene'de 0.28s büyü + 0.32s bekle animasyonu başlar.
    // ABILITY_RISE_MS kadar bekleyerek hayvan tam büyük/parlakken projektil fırlatıyoruz.
    triggerAnim(a.id, "ability");
    await delay(ABILITY_RISE_MS);
    if (isCancelled()) return;

    // ── ADIM 2: Projektil fırlatılır + log ──────────────────────────────────
    if (a.ability === AB.START_FIRE) {
      const dmg = 6 * m;
      const aliveTargets = targets.filter((x) => x.curHp > 0);
      aliveTargets.forEach((x) => {
        if (isPetVisibleInDOM(x.id)) spawnProjectile(a.id, x.id, "start_fire");
      });
      addBattleLog(`🐉 ${isPlayer ? "" : "Düşman "}${a.nick} -> Tüm ${isPlayer ? "düşmanlara" : "takıma"} ${dmg} hasar`);
      await delay(PROJ_FLY_MS);
      aliveTargets.forEach((x) => { x.curHp -= dmg; triggerAnim(x.id, "damage"); });
      syncBattleTeams(pp, ee);
      await delay(500);

    } else if (a.ability === AB.START_FEAR) {
      const aliveTargets = targets.filter((x) => x.curHp > 0);
      if (aliveTargets.length === 0) { triggerAnim(a.id, null); continue; }
      if (isPetVisibleInDOM(aliveTargets[0].id)) spawnProjectile(a.id, aliveTargets[0].id, "start_fear");
      if (aliveTargets.length > 1 && isPetVisibleInDOM(aliveTargets[1].id)) spawnProjectile(a.id, aliveTargets[1].id, "start_fear");
      const fearT = aliveTargets.length > 1 ? `${aliveTargets[0].nick} ve ${aliveTargets[1].nick}` : aliveTargets[0].nick;
      addBattleLog(`🦁 ${isPlayer ? "" : "Düşman "}${a.nick} -> ${fearT} -${AM.START_FEAR_ATK_RED * m} ATK`);
      await delay(PROJ_FLY_MS);
      aliveTargets[0].atk = Math.max(1, aliveTargets[0].atk - 10 * m);
      triggerAnim(aliveTargets[0].id, "damage");
      if (aliveTargets.length > 1) {
        aliveTargets[1].atk = Math.max(1, aliveTargets[1].atk - 10 * m);
        triggerAnim(aliveTargets[1].id, "damage");
      }
      syncBattleTeams(pp, ee);
      await delay(500);

    } else if (a.ability === AB.START_SNIPE) {
      const currentTargets = isPlayer ? ee : pp;
      const aliveTargets = currentTargets.filter((x) => x.curHp > 0);
      if (aliveTargets.length === 0) { triggerAnim(a.id, null); continue; }
      const snipeTarget = aliveTargets[aliveTargets.length - 1];
      // FIX 2: DOM kontrolü — görünür değilse alternatif ara
      const finalTarget = isPetVisibleInDOM(snipeTarget.id)
        ? snipeTarget
        : [...aliveTargets].reverse().find((x) => isPetVisibleInDOM(x.id));
      if (!finalTarget) { triggerAnim(a.id, null); continue; }
      spawnProjectile(a.id, finalTarget.id, "start_snipe", null, true);
      addBattleLog(`🎯 ${isPlayer ? "" : "Düşman "}${a.nick} -> ${finalTarget.nick}'e ${AM.START_SNIPE_DMG * m} hasar`);
      await delay(PROJ_FLY_MS);
      finalTarget.curHp -= 5 * m;
      triggerAnim(finalTarget.id, "damage");
      syncBattleTeams(pp, ee);
      await delay(500);

    } else if (a.ability === AB.START_MULTI_SNIPE) {
      const alive = targets.filter((x) => x.curHp > 0);
      const targetCount = Math.min(m + 1, alive.length);
      const selectedTargets = [...alive]
        .sort(() => Math.random() - 0.5)
        .slice(0, targetCount);

      for (let j = 0; j < selectedTargets.length; j++) {
        const t = selectedTargets[j];
        const stillAlive = targets.find((x) => x.id === t.id && x.curHp > 0);
        if (!stillAlive || !isPetVisibleInDOM(t.id)) continue;
        spawnProjectile(a.id, t.id, "start_multi_snipe", null, true);
        addBattleLog(`🦑 ${isPlayer ? "" : "Düşman "}${a.nick} -> ${t.nick}'e ${AM.START_MULTI_SNIPE_DMG * m} hasar`);
        await delay(PROJ_FLY_MS);
        const currentT = targets.find((x) => x.id === t.id);
        if (currentT && currentT.curHp > 0) {
          currentT.curHp -= 10 * m;
          triggerAnim(currentT.id, "damage");
          syncBattleTeams(pp, ee);
        }
        await delay(300);
      }

    } else if (a.ability === AB.START_DMG) {
      const currentTargets = isPlayer ? ee : pp;
      const alive = currentTargets.filter((x) => x.curHp > 0 && isPetVisibleInDOM(x.id));
      if (alive.length === 0) { triggerAnim(a.id, null); continue; }
      const t = alive[Math.floor(Math.random() * alive.length)];
      spawnProjectile(a.id, t.id, "start_dmg", null, true);
      addBattleLog(`💥 ${isPlayer ? "" : "Düşman "}${a.nick} -> ${t.nick}'e ${AM.START_DMG * m} hasar`);
      await delay(PROJ_FLY_MS);
      t.curHp -= 2 * m;
      triggerAnim(t.id, "damage");
      syncBattleTeams(pp, ee);
      await delay(500);

    } else if (a.ability === AB.START_POISON) {
      const aliveTargets = targets.filter((x) => x.curHp > 0);
      if (aliveTargets.length === 0) { triggerAnim(a.id, null); continue; }
      const frontTarget = aliveTargets[0];
      if (isPetVisibleInDOM(frontTarget.id)) spawnProjectile(a.id, frontTarget.id, "start_poison");
      addBattleLog(`🐍 ${isPlayer ? "" : "Düşman "}${a.nick} -> Ön düşmana -${AM.START_POISON_ATK_RED * m} ATK`);
      await delay(PROJ_FLY_MS);
      frontTarget.atk = Math.max(1, frontTarget.atk - m * 2);
      triggerAnim(frontTarget.id, "damage");
      syncBattleTeams(pp, ee);
      await delay(500);

    } else if (a.ability === AB.START_FREEZE_ENEMY) {
      const aliveTargets = targets.filter((x) => x.curHp > 0);
      if (aliveTargets.length === 0) { triggerAnim(a.id, null); continue; }
      const reduction = (m * 30) / 100;
      const frontT = aliveTargets[0];
      const backT  = aliveTargets.length > 1 ? aliveTargets[aliveTargets.length - 1] : null;
      if (isPetVisibleInDOM(frontT.id)) spawnProjectile(a.id, frontT.id, "start_freeze_enemy");
      if (backT && isPetVisibleInDOM(backT.id)) spawnProjectile(a.id, backT.id, "start_freeze_enemy");
      addBattleLog(`🦣 ${isPlayer ? "" : "Düşman "}${a.nick} -> Ön ve arka düşmanı %${m * 30} yavaşlattı`);
      await delay(PROJ_FLY_MS);
      frontT.atk = Math.max(1, Math.floor(frontT.atk * (1 - reduction)));
      triggerAnim(frontT.id, "damage");
      if (backT) {
        backT.atk = Math.max(1, Math.floor(backT.atk * (1 - reduction)));
        triggerAnim(backT.id, "damage");
      }
      syncBattleTeams(pp, ee);
      await delay(500);

    } else if (a.ability === AB.WEAKEN_STRONG) {
      const aliveTargets = targets.filter((x) => x.curHp > 0);
      if (aliveTargets.length === 0) { triggerAnim(a.id, null); continue; }
      const strongestTarget = aliveTargets.reduce(
        (best, en) => (en.atk + en.curHp > best.atk + best.curHp ? en : best),
        aliveTargets[0]
      );
      if (isPetVisibleInDOM(strongestTarget.id)) spawnProjectile(a.id, strongestTarget.id, "weaken_strong");
      addBattleLog(`🐧 ${isPlayer ? "" : "Düşman "}${a.nick} -> ${strongestTarget.nick}'i %${25 * m} zayıflattı`);
      await delay(PROJ_FLY_MS);
      const r = (25 * m) / 100;
      strongestTarget.atk   = Math.max(1, Math.floor(strongestTarget.atk   * (1 - r)));
      strongestTarget.curHp = Math.max(1, Math.floor(strongestTarget.curHp * (1 - r)));
      triggerAnim(strongestTarget.id, "damage");
      syncBattleTeams(pp, ee);
      await delay(500);
    }

    // ── ADIM 3: Hayvan normale dönüyor (GSAP kendi bitiyor, sıradakine geçiyoruz) ──
    // GSAP animasyonunun küçülme aşaması ~280ms — ölenleri temizlemeden önce kısa bekle.
    await delay(320);

    // Ölenleri temizle
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
