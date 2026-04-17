import { AB, ABILITY_MULTIPLIERS as AM } from "../data/gameData";
import { getFearAllDebuff, getFaintWeakenAllDebuff } from "./battleEffectUtils";
import { spawnFloatingText, spawnDeathEffect, spawnProjectile } from "./animations";

export async function runBattleTurnPhase({
  pT, eT,
  delay,
  isCancelled,
  triggerAnim, clampStat, pwr,
  battleSpeedRef,
  setLog, setPT, setET, setStep, setIsBattleOver, setTeam,
  battleGoldRef,
  faint,
  isDebugBattle,
  announceDebugWinner,
  scheduleDebugBattleReset,
}) {
  const applyDamageAnimToTeam = (team) => {
    team.forEach((pet) => triggerAnim(pet.id, "damage"));
  };

  const applyFearToTeam = (team, power, minHp = 0) => {
    const debuff = getFearAllDebuff(power);
    team.forEach((pet) => {
      pet.atk = Math.max(1, pet.atk - debuff);
      pet.curHp = Math.max(minHp, pet.curHp - debuff);
      triggerAnim(pet.id, "damage");
    });
    return debuff;
  };

  const applyFaintWeakenToTeam = (team, power, minHp = 0) => {
    const debuff = getFaintWeakenAllDebuff(power);
    team.forEach((pet) => {
      pet.atk = Math.max(1, pet.atk - debuff);
      pet.curHp = Math.max(minHp, pet.curHp - debuff);
      triggerAnim(pet.id, "damage");
    });
    return debuff;
  };

  const applyHurtTeamBuff = (team, amount) => {
    team.forEach((pet) => {
      if (pet && pet.curHp > 0) {
        pet.atk = clampStat(pet.atk + amount);
        pet.curHp = clampStat(pet.curHp + amount);
        triggerAnim(pet.id, "buff");
      }
    });
  };

  const addBattleLog = (message) => setLog((l) => [...l, message]);

  const playBattleLogs = async (messages, waitMs) => {
    for (const logMsg of messages) {
      addBattleLog(logMsg);
      await delay(waitMs);
    }
  };

  const playDeathAnim = (petId, direction) => {
    triggerAnim(petId, direction);
    spawnDeathEffect(petId);
  };

  const resolveFaintResult = async (result, waitMs) => {
    await playBattleLogs(result.lg, waitMs);
    if (result.gG > 0) battleGoldRef.current += result.gG;
    return result.sm;
  };

  const syncBattleTeams = (playerTeam, enemyTeam) => {
    if (playerTeam) setPT([...playerTeam]);
    if (enemyTeam) setET([...enemyTeam]);
  };

  const runFaintResolution = async ({ deadUnit, allyTeam, enemyTeam, isPlayer, killer, waitMs }) => {
    const result = faint(deadUnit, allyTeam, enemyTeam, isPlayer, killer);
    return resolveFaintResult(result, waitMs);
  };

  // --- Standart Savaş Turu ---
  let p = [...pT].filter((x) => x.curHp > 0);
  let e = [...eT].filter((x) => x.curHp > 0);
  if (p.length === 0 || e.length === 0) {
    setIsBattleOver(true);
    return;
  }

  if (!p[0] || p[0].curHp <= 0) { setIsBattleOver(true); return; }
  if (!e[0] || e[0].curHp <= 0) { setIsBattleOver(true); return; }

  let lg = [];
  const a = p[0];
  const d = e[0];
  let pS = [];
  let eS = [];
  const oldAId = a.id;
  const oldDId = d.id;
  let aD = a.atk;
  let dD = d.atk;

  triggerAnim(a.id, "attackLeft");
  triggerAnim(d.id, "attackRight");
  await delay(2000);
  if (isCancelled()) return;

  p[0].curHp -= dD;
  e[0].curHp -= aD;

  // FIX: Hasar sayıları ekranına HP azalmadan önce göster (sadece floating text)
  // syncBattleTeams burada ÇAĞRILMIYOR — önce hasar animasyonu başlasın
  setTimeout(() => {
    const aEl = document.querySelector(`[data-pet-id="${a.id}"]`);
    const dEl = document.querySelector(`[data-pet-id="${d.id}"]`);
    if (aEl && dD > 0) {
      const rect = aEl.getBoundingClientRect();
      spawnFloatingText(`-${dD}`, rect.left + rect.width / 2, rect.top, "damage");
    }
    if (dEl && aD > 0) {
      const rect = dEl.getBoundingClientRect();
      spawnFloatingText(`-${aD}`, rect.left + rect.width / 2, rect.top, "damage");
    }
  }, 300 / battleSpeedRef.current);

  if (a.trample && e[0].curHp <= 0 && e.length > 1) {
    const excess = Math.abs(e[0].curHp);
    e[1].curHp -= excess;
    lg.push(`🦏 ${a.nick} -> Arka düşmana ${excess} hasar (çiğneme)`);
  }
  if (d.trample && p[0].curHp <= 0 && p.length > 1) {
    const excess = Math.abs(p[0].curHp);
    p[1].curHp -= excess;
    lg.push(`🦏 Düşman ${d.nick} -> Arka takım birimine ${excess} hasar (çiğneme)`);
  }

  triggerAnim(a.id, "damage");
  triggerAnim(d.id, "damage");
  // FIX: HP güncellemesi hasar animasyonu tetiklendikten sonra yapılıyor
  // Böylece "projektil uçarken HP zaten azalmış" sorunu ortadan kalkıyor
  syncBattleTeams(p, e);
  await delay(1400);
  if (isCancelled()) return;

  setLog((l) => [...l, ...lg]);

  // Savaş sırası yetenekleri
  if (a.ability === AB.ATK_BUFF && p[0].curHp > 0) {
    p[0].atk = clampStat(p[0].atk + pwr(a));
    triggerAnim(a.id, "buff");
    setLog((l) => [...l, `💪 ${a.nick} -> +${pwr(a)} ATK`]);
    await delay(500);
  }
  if (a.ability === AB.START_CHARGE && p[0].curHp > 0) {
    p[0].atk = clampStat(p[0].atk + AM.START_CHARGE_AMT * pwr(a));
    triggerAnim(a.id, "buff");
    setLog((l) => [...l, `🐗 ${a.nick} -> +${AM.START_CHARGE_AMT * pwr(a)} ATK`]);
    await delay(500);
  }
  if (a.ability === AB.FAINT_WEAKEN_ALL && p[0].curHp <= 0) {
    const debuff = getFaintWeakenAllDebuff(pwr(a));
    e.forEach((enemy) => {
      enemy.atk = Math.max(1, enemy.atk - debuff);
      enemy.curHp = Math.max(0, enemy.curHp - debuff);
    });
    applyDamageAnimToTeam(e);
    setLog((l) => [...l, `💀 ${a.nick} → Düşman takımına -${debuff}/-${debuff} (tüm zayıflama)`]);
    await delay(600);
  }
  if (a.ability === AB.HURT_TEAM_BUFF && p[0].curHp > 0 && dD > 0) {
    const m = pwr(a);
    applyHurtTeamBuff(p, 3 * m);
    setLog((l) => [...l, `🦬 ${a.nick} hasar aldı -> Takıma +${3 * pwr(a)}/+${3 * pwr(a)} buff`]);
    await delay(500);
  }
  if (a.ability === AB.HURT_DMG && p[0].curHp > 0 && dD > 0 && e.length > 0) {
    const aliveE = e.filter((x) => x.curHp > 0);
    if (aliveE.length > 0) {
      const target = aliveE[Math.floor(Math.random() * aliveE.length)];
      const targetIdx = e.findIndex((x) => x.id === target.id);
      const damage = 9 * pwr(a);
      e[targetIdx].curHp -= damage;
      triggerAnim(e[targetIdx].id, "damage");
      setLog((l) => [...l, `🐘 ${a.nick} -> ${e[targetIdx].nick}'e ${damage} hasar`]);
      await delay(600);
    }
  }
  if (d.ability === AB.HURT_DMG && e[0].curHp > 0 && aD > 0 && p.length > 0) {
    const aliveP = p.filter((x) => x.curHp > 0);
    if (aliveP.length === 0) {
      await delay(500);
    } else {
      const target = aliveP[Math.floor(Math.random() * aliveP.length)];
      const targetIdx = p.findIndex((x) => x.id === target.id);
      const damage = 9 * pwr(d);
      p[targetIdx].curHp -= damage;
      triggerAnim(p[targetIdx].id, "damage");
      setLog((l) => [...l, `🐘 Düşman ${d.nick} -> ${p[targetIdx].nick}'e ${damage} hasar`]);
      await delay(600);
    }
  }

  // ── KOKARCA (HURT_REFLECT) — yansıma hasarı saldıranın ARKASINDAKİ hayvana gider ──
  // Gergedan çiğnemesine benzer: Kokarca'ya saldıran hayvanın hemen arkasındaki düşman zarar görür.
  // Saldıran ön hayvan ise (e[0]) arkasındaki e[1]'e hasar gider.
  // Eğer saldıranın arkası yoksa (tek hayvan kaldıysa) hasarı saldıranın kendisi alır.
  if (a.ability === AB.HURT_REFLECT && p[0].curHp > 0 && dD > 0 && p[0].id === a.id) {
    const pct = pwr(a) === 1 ? 0.33 : pwr(a) === 2 ? 0.66 : 0.99;
    const reflectDmg = Math.max(1, Math.floor(dD * pct));
    if (e.length > 1 && e[1].curHp > 0) {
      // Ön düşmanın arkasındaki hedefe yansıt
      e[1].curHp = Math.max(0, e[1].curHp - reflectDmg);
      spawnProjectile(a.id, e[1].id, "hurt_dmg", null, true);
      triggerAnim(e[1].id, "damage");
      setLog((l) => [...l, `🪞 ${a.nick} -> ${e[0].nick}'in arkasındaki ${e[1].nick}'e ${reflectDmg} yansıma hasarı`]);
    } else {
      // Arkada kimse yoksa saldıranın kendisine
      e[0].curHp = Math.max(0, e[0].curHp - reflectDmg);
      triggerAnim(e[0].id, "damage");
      setLog((l) => [...l, `🪞 ${a.nick} -> ${e[0].nick}'e ${reflectDmg} yansıma hasarı`]);
    }
    await delay(500);
  }
  if (a.ability === AB.KILL_BUFF && e[0].curHp <= 0) {
    p[0].atk = clampStat(p[0].atk + 3 * pwr(a));
    p[0].curHp = clampStat(p[0].curHp + 3 * pwr(a));
    triggerAnim(a.id, "buff");
    setLog((l) => [...l, `🦈 ${a.nick} -> +${3 * pwr(a)}/+${3 * pwr(a)}`]);
    await delay(500);
  }
  if (a.ability === AB.KILL_HEAL_TEAM && e[0].curHp <= 0) {
    const m = pwr(a);
    p.forEach((pet, idx) => {
      if (pet && pet.curHp > 0) {
        p[idx] = { ...pet, atk: clampStat(pet.atk + 3 * m), hp: clampStat(pet.hp + 3 * m), curHp: clampStat(pet.curHp + 3 * m) };
        triggerAnim(pet.id, "buff");
      }
    });
    setTeam((prevTeam) =>
      prevTeam.map((pet) => {
        if (!pet) return pet;
        const alive = p.some((bp) => bp && bp.id === pet.id && bp.curHp > 0);
        return alive ? { ...pet, atk: clampStat(pet.atk + 3 * m), hp: clampStat(pet.hp + 3 * m), curHp: clampStat(pet.curHp + 3 * m) } : pet;
      })
    );
    setLog((l) => [...l, `🦭 ${a.nick} -> Takıma +${3 * pwr(a)}/+${3 * pwr(a)} KALICI`]);
    await delay(800);
  }
  if (a.ability === AB.KILL_FEAR_ALL && e[0].curHp <= 0 && p[0].curHp > 0 && p[0].id === a.id) {
    const debuff = applyFearToTeam(e, pwr(a));
    e.forEach((enemy) => {
      spawnProjectile(a.id, enemy.id, "kill_fear_all");
    });
    setLog((l) => [...l, `😱 ${a.nick} → Düşman takımına -${debuff}/-${debuff} (korku efekti)`]);
    await delay(500);
  }
  if (d.ability === AB.DEVOUR && p[0].curHp <= 0 && e[0].curHp > 0) {
    const pctD = (30 + 10 * pwr(d)) / 100;
    const atkGainD = Math.floor(p[0].atk * pctD);
    const hpGainD = Math.floor((p[0].hp || p[0].curHp) * pctD);
    e[0].atk = clampStat(e[0].atk + atkGainD);
    e[0].hp = clampStat(e[0].hp + hpGainD);
    e[0].curHp = clampStat(e[0].curHp + hpGainD);
    triggerAnim(d.id, "buff");
    setLog((l) => [...l, `👹 Düşman ${d.nick} -> +${atkGainD}/+${hpGainD}`]);
    await delay(500);
  }
  if (d.ability === AB.KILL_BUFF && p[0].curHp <= 0) {
    e[0].atk = clampStat(e[0].atk + 3 * pwr(d));
    e[0].curHp = clampStat(e[0].curHp + 3 * pwr(d));
    triggerAnim(d.id, "buff");
    setLog((l) => [...l, `🦈 Düşman ${d.nick} -> +${3 * pwr(d)}/+${3 * pwr(d)}`]);
    await delay(500);
  }
  if (d.ability === AB.KILL_HEAL_TEAM && p[0].curHp <= 0) {
    const km = pwr(d);
    e.forEach((pet, idx) => {
      if (pet && pet.curHp > 0) {
        e[idx] = { ...pet, atk: clampStat(pet.atk + 3 * km), hp: clampStat(pet.hp + 3 * km), curHp: clampStat(pet.curHp + 3 * km) };
        triggerAnim(pet.id, "buff");
      }
    });
    setLog((l) => [...l, `🦭 Düşman ${d.nick} -> Takıma +${3 * km}/+${3 * km} KALICI`]);
    await delay(800);
  }
  if (d.ability === AB.KILL_FEAR_ALL && p[0].curHp <= 0 && e[0].curHp > 0) {
    const debuff = applyFearToTeam(p.filter((pet) => pet.curHp > 0), pwr(d), 1);
    setLog((l) => [...l, `😱 Düşman ${d.nick} → Oyuncu takımına -${debuff}/-${debuff} (korku efekti)`]);
    await delay(500);
  }
  if (d.ability === AB.ATK_BUFF && e[0].curHp > 0) {
    e[0].atk = clampStat(e[0].atk + pwr(d));
    triggerAnim(d.id, "buff");
    setLog((l) => [...l, `💪 Düşman ${d.nick} -> +${pwr(d)} ATK`]);
    await delay(500);
  }
  if (d.ability === AB.FAINT_WEAKEN_ALL && e[0].curHp <= 0) {
    const debuff = applyFaintWeakenToTeam(p, pwr(d));
    setLog((l) => [...l, `💀 Düşman ${d.nick} → Oyuncu takımına -${debuff}/-${debuff} (tüm zayıflama)`]);
    await delay(600);
  }
  if (d.ability === AB.HURT_TEAM_BUFF && e[0].curHp > 0 && aD > 0) {
    const htm = pwr(d);
    applyHurtTeamBuff(e, 3 * htm);
    setLog((l) => [...l, `🦬 Düşman ${d.nick} hasar aldı -> Düşman takımına +${3 * pwr(d)}/+${3 * pwr(d)} buff`]);
    await delay(500);
  }
  // Düşman Kokarcası — yansıma arkadaki OYUNCU hayvanına gider
  if (d.ability === AB.HURT_REFLECT && e[0].curHp > 0 && aD > 0 && e[0].id === d.id) {
    const dpct = pwr(d) === 1 ? 0.33 : pwr(d) === 2 ? 0.66 : 0.99;
    const dreflectDmg = Math.max(1, Math.floor(aD * dpct));
    if (p.length > 1 && p[1].curHp > 0) {
      p[1].curHp = Math.max(0, p[1].curHp - dreflectDmg);
      spawnProjectile(d.id, p[1].id, "hurt_dmg", null, true);
      triggerAnim(p[1].id, "damage");
      setLog((l) => [...l, `🪞 Düşman ${d.nick} -> ${p[0].nick}'in arkasındaki ${p[1].nick}'e ${dreflectDmg} yansıma hasarı`]);
    } else {
      p[0].curHp = Math.max(0, p[0].curHp - dreflectDmg);
      triggerAnim(p[0].id, "damage");
      setLog((l) => [...l, `🪞 Düşman ${d.nick} -> ${p[0].nick}'e ${dreflectDmg} yansıma hasarı`]);
    }
    await delay(500);
  }
  if (d.ability === AB.START_CHARGE && e[0].curHp > 0) {
    e[0].atk = clampStat(e[0].atk + AM.START_CHARGE_AMT * pwr(d));
    triggerAnim(d.id, "buff");
    setLog((l) => [...l, `🐗 Düşman ${d.nick} -> +${AM.START_CHARGE_AMT * pwr(d)} ATK`]);
    await delay(500);
  }
  if (a.ability === AB.DEVOUR && e[0].curHp <= 0 && p[0].curHp > 0) {
    const pct = (30 + 10 * pwr(a)) / 100;
    const atkGain = Math.floor(e[0].atk * pct);
    const hpGain = Math.floor((e[0].hp || e[0].curHp) * pct);
    p[0].atk = clampStat(p[0].atk + atkGain);
    p[0].hp = clampStat(p[0].hp + hpGain);
    p[0].curHp = clampStat(p[0].curHp + hpGain);
    spawnProjectile(e[0].id, a.id, "devour");
    triggerAnim(a.id, "buff");
    setLog((l) => [...l, `👹 ${a.nick} -> yuttu, +${atkGain}/+${hpGain} stat kazandı`]);
    await delay(500);
  }

  // Ara ölüm kontrolleri
  for (let i = 1; i < p.length; i++) {
    if (p[i].curHp <= 0) {
      playDeathAnim(p[i].id, "deathLeft");
      const deadPet = p[i];
      p = p.filter((_, idx) => idx !== i);
      pS = [...pS, ...(await runFaintResolution({ deadUnit: deadPet, allyTeam: p, enemyTeam: e, isPlayer: true, killer: e.length > 0 ? e[0] : null, waitMs: 800 }))];
      i--;
    }
  }
  for (let i = 1; i < e.length; i++) {
    if (e[i].curHp <= 0) {
      playDeathAnim(e[i].id, "deathRight");
      const deadEnemy = e[i];
      e = e.filter((_, idx) => idx !== i);
      eS = [...eS, ...(await runFaintResolution({ deadUnit: deadEnemy, allyTeam: e, enemyTeam: p, isPlayer: false, killer: null, waitMs: 300 }))];
      i--;
    }
  }

  // Ön hayvan ölüm kontrolleri
  if (p[0] && p[0].curHp <= 0) {
    playDeathAnim(p[0].id, "deathLeft");
    const deadPet = p[0];
    p = p.slice(1);
    pS = [...pS, ...(await runFaintResolution({ deadUnit: deadPet, allyTeam: p, enemyTeam: e, isPlayer: true, killer: e.length > 0 && e[0].curHp > 0 ? e[0] : null, waitMs: 800 }))];
    await delay(500);
  }
  if (e[0] && e[0].curHp <= 0) {
    playDeathAnim(e[0].id, "deathRight");
    const deadEnemy = e[0];
    e = e.slice(1);
    eS = [...eS, ...(await runFaintResolution({ deadUnit: deadEnemy, allyTeam: e, enemyTeam: p, isPlayer: false, killer: p.length > 0 && p[0].curHp > 0 ? p[0] : null, waitMs: 300 }))];
    await delay(500);
  }

  pS = pS.filter((x) => x.curHp > 0);
  eS = eS.filter((x) => x.curHp > 0);
  for (let i = 0; i < eS.length; i++) {
    if (eS[i].curHp <= 0) {
      playDeathAnim(eS[i].id, "deathRight");
      const deadEnemy = eS[i];
      eS = eS.filter((_, idx) => idx !== i);
      eS = [...eS, ...(await runFaintResolution({ deadUnit: deadEnemy, allyTeam: [...eS, ...e], enemyTeam: p, isPlayer: false, killer: null, waitMs: 300 }))];
      i--;
    }
  }

  const newP = [...pS, ...p].filter((x) => x.curHp > 0);
  const newE = [...eS, ...e].filter((x) => x.curHp > 0);

  if (newP.length === 0 || newE.length === 0) {
    syncBattleTeams(newP, newE);
    if (isDebugBattle) {
      announceDebugWinner(newP.length, newE.length);
      scheduleDebugBattleReset();
      return;
    }
    setStep((s) => s + 1);
    return;
  }

  if (newP.length > 0 && newP[0].id !== oldAId) triggerAnim(newP[0].id, "slideInLeft");
  if (newE.length > 0 && newE[0].id !== oldDId) triggerAnim(newE[0].id, "slideInRight");

  await delay(150);
  syncBattleTeams(newP, newE);
  setStep((s) => s + 1);
}
