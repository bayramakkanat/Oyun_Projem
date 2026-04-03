import { useEffect } from "react";
import { TIERS, AB } from "../data/gameData";
import { logError, safeNumber } from "../utils/helpers";
import {
  spawnParticles,
  spawnFloatingText,
  spawnBuffAnimation,
  spawnFlyingParticle,
} from "../utils/animations";
import { playSound } from "../hooks/useSound";

/** pet elementinin merkez koordinatlarını döner; bulunamazsa null */
const getPetCenter = (petId) => {
  const el = document.querySelector(`[data-pet-id="${petId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
};

// ─── Satış ability handler'ları ───────────────────────────────────────────
// Her handler: (pet, index, ctx) => boolean (true = erken return)
// ctx: { team, nt, setTeam, setGold, setSelI, goldGain, clampStat, pwr,
//         spawnParticles, spawnFloatingText, spawnFlyingParticle, triggerAnim }

const sellHandlers = {
  [AB.SELL_BUFF_FRIEND]: (pet, i, ctx) => {
    const { nt, team, setTeam, setGold, setSelI, goldGain, clampStat, pwr,
            spawnFloatingText, spawnFlyingParticle, triggerAnim } = ctx;
    const m      = pwr(pet);
    const allies = nt.filter((t, idx) => t && idx !== i);
    if (allies.length === 0) return false;

    const targets    = [...allies].sort(() => Math.random() - 0.5).slice(0, Math.min(m, allies.length));
    const fromCenter = getPetCenter(pet.id);

    targets.forEach((target, index) => {
      const targetIdx = nt.findIndex((t) => t && t.id === target.id);
      if (targetIdx === -1) return;

      setTimeout(() => {
        const toCenter = getPetCenter(nt[targetIdx].id);
        if (fromCenter && toCenter) {
          ["⚔️", "❤️"].forEach((icon, iconIndex) => {
            setTimeout(() => {
              spawnFlyingParticle(icon, fromCenter.x, fromCenter.y, toCenter.x, toCenter.y, 800, () => {
                spawnFloatingText("+1", toCenter.x, toCenter.rect.top, "buff");
                triggerAnim(nt[targetIdx].id, "buff");
              });
            }, iconIndex * 150);
          });
        }
        setTimeout(() => {
          setTeam((prev) => {
            const updated = [...prev];
            const tIdx    = updated.findIndex((t) => t && t.id === target.id);
            if (tIdx !== -1) {
              updated[tIdx] = {
                ...updated[tIdx],
                atk:   clampStat(updated[tIdx].atk   + m),
                hp:    clampStat(updated[tIdx].hp     + m),
                curHp: clampStat(updated[tIdx].curHp  + m),
              };
            }
            return updated;
          });
        }, 800);
      }, index * 200);
    });

    nt[i] = null;
    setTeam(nt);
    setGold((g) => g + goldGain);
    setSelI(null);
    return true;
  },

  [AB.SELL_HEAL_TEAM]: (pet, i, ctx) => {
    const { team, setTeam, setGold, setSelI, goldGain, clampStat, pwr,
            spawnParticles, spawnFloatingText, spawnFlyingParticle, triggerAnim } = ctx;
    const m          = pwr(pet);
    const healAmount = m * 2;
    const fromCenter = getPetCenter(pet.id);

    team.forEach((ally, idx) => {
      if (!ally || idx === i) return;
      setTimeout(() => {
        const toCenter = getPetCenter(ally.id);
        if (fromCenter && toCenter) {
          for (let k = 0; k < 3; k++) {
            setTimeout(() => {
              spawnFlyingParticle("💚", fromCenter.x, fromCenter.y, toCenter.x, toCenter.y, 600);
            }, k * 100);
          }
          setTimeout(() => {
            spawnFloatingText(`+${healAmount} HP`, toCenter.x, toCenter.rect.top - 10, "heal");
            triggerAnim(ally.id, "buff");
          }, 300);
        }
      }, idx * 150);
    });

    const updatedNt = [...team];
    team.forEach((ally, idx) => {
      if (!ally || idx === i) return;
      updatedNt[idx] = {
        ...ally,
        hp:    clampStat((ally.hp    || 0) + healAmount),
        curHp: clampStat((ally.curHp || 0) + healAmount),
      };
    });
    updatedNt[i] = null;
    setTeam(updatedNt);
    setGold((g) => g + goldGain);
    setSelI(null);
    setTimeout(() => spawnParticles(pet.id, "heal"), 100);
    return true;
  },

  [AB.SELL_BUFF_SHOP]: (pet, i, ctx) => {
    const { nt, setTeam, setShop, setGold, setSelI, goldGain, clampStat, pwr,
            spawnParticles, spawnFlyingParticle } = ctx;
    const m          = pwr(pet);
    const shopBuff   = 2 * m; // L1:+2, L2:+4, L3:+6
    const fromCenter = getPetCenter(pet.id);

    setShop((prevShop) => {
      const updated = prevShop.map((sp) => {
        if (!sp) return sp;
        return {
          ...sp,
          atk: clampStat(sp.atk + shopBuff),
          hp: clampStat(sp.hp + shopBuff),
          curHp: clampStat(sp.curHp + shopBuff),
        };
      });
      if (fromCenter) {
        updated.forEach((sp, sIdx) => {
          if (!sp) return;
          setTimeout(() => {
            const shopCards  = document.querySelectorAll(".card-3d");
            const targetCard = shopCards[sIdx];
            if (!targetCard) return;
            const r   = targetCard.getBoundingClientRect();
            const toX = r.left + r.width / 2;
            const toY = r.top  + r.height / 2;
            ["⚔️", "❤️"].forEach((icon, iconIndex) => {
              setTimeout(() => {
                spawnFlyingParticle(icon, fromCenter.x, fromCenter.y, toX, toY, 700);
              }, iconIndex * 100);
            });
          }, sIdx * 150);
        });
      }
      spawnParticles(pet.id, "buff");
      return updated;
    });

    nt[i] = null;
    setTeam(nt);
    setGold((g) => g + goldGain);
    setSelI(null);
    return true;
  },
};

export function useShop({
  team, setTeam,
  shop, setShop,
  gold, setGold,
  rewards, setRewards,
  turn,
  discountNext, setDiscountNext,
  sel, setSel,
  selI, setSelI,
  shopResetKey,
  maxT,
  shopSlots,
  difficultyLevel,
  pwr,
  sellP,
  clampStat,
  triggerAnim,
  unlockAchievement,
  spawnBuffAnimation: _spawnBuffAnimation,
  onGoldSpent,
}) {

  // ─── Ödül havuzu ──────────────────────────────────────────────────────────
  const addRew = () => {
    const rt   = Math.min(maxT + 1, 6);
    const pool = [...TIERS[rt]];
    const used = new Set();
    const grpId = Math.random();
    return Array.from({ length: 3 }, () => {
      let idx;
      do { idx = Math.floor(Math.random() * pool.length); }
      while (used.has(idx) && used.size < pool.length);
      used.add(idx);
      return { ...pool[idx], id: Math.random(), lvl: 1, exp: 0, curHp: pool[idx].hp, isR: true, rT: rt, grp: grpId };
    });
  };

  // ─── Kedi levelup buff animasyonu ─────────────────────────────────────────
  const notifyCatOnLevelup = (leveledPetId) => {
    setTimeout(() => {
      setTeam((prevTeam) => {
        if (!prevTeam) return prevTeam;
        const newTeam  = [...prevTeam];
        let hasChanges = false;

        newTeam.forEach((pet, index) => {
          if (!pet || pet.ability !== AB.FRIEND_LEVELUP_BUFF || pet.id === leveledPetId) return;
          const m = pwr(pet);
          newTeam[index] = {
            ...pet,
            atk:   clampStat((pet.atk   || 0) + m),
            hp:    clampStat((pet.hp    || 0) + m),
            curHp: clampStat((pet.curHp || 0) + m),
          };
          hasChanges = true;

          setTimeout(() => {
            triggerAnim(pet.id, "buff");
            spawnParticles(pet.id, "buff");
            const center = getPetCenter(pet.id);
            if (center) {
              spawnFloatingText(`+${m}`, center.x, center.rect.top - 20, "buff");
              for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                  spawnFlyingParticle(
                    "🐱",
                    center.x, center.y,
                    center.x + (Math.random() - 0.5) * 100,
                    center.y - 30 - Math.random() * 40,
                    600
                  );
                }, i * 100);
              }
            }
          }, 300 + index * 100);
        });

        return hasChanges ? newTeam : prevTeam;
      });
    }, 100);
  };

  // ─── Birleştirme ──────────────────────────────────────────────────────────
  const merge = (base, add) => {
    try {
      if (!base || !add) return { merged: base || add, rewards: [], leveledUp: false };

      const baseTotal = safeNumber(base.atk, 0) + safeNumber(base.hp, 0);
      const addTotal  = safeNumber(add.atk,  0) + safeNumber(add.hp,  0);
      let [newBase, newAdd] = addTotal > baseTotal ? [add, base] : [base, add];

      const baseId = newBase.id;
      const oL     = safeNumber(newBase.lvl, 1);
      let nL = oL;
      let nE = safeNumber(newBase.exp, 0) + safeNumber(newAdd.exp, 0) + 1;

      while (nE >= 2 && nL < 3) { nL++; nE -= 2; }
      if (nL >= 3) { nE = 0; unlockAchievement("triple_star"); }

      const b = nL - oL + 1;
      let atkBonus = b, hpBonus = b;
      if (newBase.ability === AB.LEVELUP_BUFF_SELF && nL > oL) {
        const m = pwr({ ...newBase, lvl: nL });
        atkBonus += m * 2;
        hpBonus  += m * 2;
      }

      const merged = {
        ...newBase, lvl: nL, exp: nE,
        atk:   clampStat(safeNumber(newBase.atk, 0) + atkBonus),
        hp:    clampStat(safeNumber(newBase.hp,  0) + hpBonus),
        curHp: clampStat(safeNumber(newBase.hp,  0) + hpBonus),
      };

      const newRewards = nL > oL ? addRew() : [];
      if (nL > oL) notifyCatOnLevelup(baseId);

      // Merge ışık patlaması — kademeli 3 dalga
      triggerAnim(baseId, "merge");
      playSound("buff");
      spawnParticles(baseId, "buff");
      setTimeout(() => spawnParticles(baseId, "buff"), 120);
      setTimeout(() => spawnParticles(baseId, "buff"), 260);

      return { merged, rewards: newRewards, leveledUp: nL > oL };
    } catch (e) {
      logError(e, "merge");
      return { merged: base, rewards: [], leveledUp: false };
    }
  };

  // ─── Satın alma buff'larını uygula ────────────────────────────────────────
  const applyBuyBuffs = (nt, newPetIndex) => {
    nt.forEach((pet, idx) => {
      if (!pet || pet.ability !== AB.BUY_BUFF_RANDOM || idx === newPetIndex) return;
      const m      = pwr(pet);
      const allies = nt.filter((t, i) => t && i !== idx);
      if (allies.length === 0) return;
      const target = allies[Math.floor(Math.random() * allies.length)];
      spawnBuffAnimation(pet.id, target.id, m, "buff", triggerAnim);
      setTimeout(() => {
        setTeam((prev) => {
          const updated = [...prev];
          const tIdx    = updated.findIndex((t) => t && t.id === target.id);
          if (tIdx !== -1) {
            updated[tIdx] = {
              ...updated[tIdx],
              atk:   clampStat(updated[tIdx].atk   + m),
              hp:    clampStat(updated[tIdx].hp     + m),
              curHp: clampStat(updated[tIdx].curHp  + m),
            };
          }
          return updated;
        });
      }, 800);
    });

    nt.forEach((pet, idx) => {
      if (!pet || pet.ability !== AB.BUY_BUFF_BEHIND) return;
      if (idx === 0 || !nt[idx - 1]) return;
      const behindId = nt[idx - 1].id;
      const m        = pwr(pet);
      spawnBuffAnimation(pet.id, behindId, m, "buff");
      setTimeout(() => {
        setTeam((prev) => {
          const updated = [...prev];
          const tIdx    = updated.findIndex((t) => t && t.id === behindId);
          if (tIdx !== -1) {
            updated[tIdx] = {
              ...updated[tIdx],
              atk:   clampStat(updated[tIdx].atk   + m),
              hp:    clampStat(updated[tIdx].hp     + m),
              curHp: clampStat(updated[tIdx].curHp  + m),
            };
          }
          return updated;
        });
      }, 800);
    });
  };

  // ─── Mağaza yenile ────────────────────────────────────────────────────────
  const refresh = () => {
    const currentFrozen = shop.filter((s) => s && s.frozen);
    setDiscountNext(false);
    const slotsNeeded = shopSlots - currentFrozen.length;
    const pool = [];
    for (let t = 1; t <= maxT; t++) {
      const weight =
        difficultyLevel === "hard"  ? t * 2 :
        difficultyLevel === "easy"  ? (maxT - t + 1) * 2 : 1;
      for (let w = 0; w < weight; w++) pool.push(...TIERS[t]);
    }
    const s = [];
    for (let i = 0; i < slotsNeeded; i++) {
      const a = pool[Math.floor(Math.random() * pool.length)];
      let cost = a.cost;
      team.forEach((pet) => {
        if (pet && pet.ability === AB.BUY_DISCOUNT_NEXT) cost = Math.max(1, cost - pwr(pet));
      });
      if (discountNext) {
        team.forEach((pet) => {
          if (pet && pet.ability === AB.SHOP_DISCOUNT) {
            const pct = pwr(pet) === 1 ? 0.33 : pwr(pet) === 2 ? 0.66 : 0.99;
            cost = Math.max(1, Math.floor(cost * (1 - pct)));
          }
        });
      }
      s.push({ ...a, id: Math.random(), lvl: 1, exp: 0, curHp: a.hp, frozen: false, cost });
    }
    if (discountNext) setDiscountNext(false);
    const newShop = [...currentFrozen, ...s];
    setShop(newShop);

    const hasMergeable = newShop.some((sp) =>
      team.some((t) => t && t.name === sp.name && t.tier === sp.tier && t.lvl < 3)
    );
    if (hasMergeable) setTimeout(() => playSound("levelup"), 300);
  };

  useEffect(() => { refresh(); }, [turn, shopSlots, shopResetKey]);

  // ─── Dondur ───────────────────────────────────────────────────────────────
  const toggleFreeze = (a) => {
  const willFreeze = !shop.find((s) => s && s.id === a.id)?.frozen;
  if (willFreeze) playSound("freeze");
  setShop(shop.map((s) => (s && s.id === a.id ? { ...s, frozen: !s.frozen } : s)));
};

  // ─── Satın al ─────────────────────────────────────────────────────────────
  const buy = (a, slot) => {
    if (a.ability.includes("fire"))                                    spawnParticles(a.id, "fire");
    else if (a.ability.includes("shield") || a.ability.includes("tank")) spawnParticles(a.id, "shield");
    else if (a.ability.includes("heal"))                               spawnParticles(a.id, "heal");
    else if (a.ability.includes("buff"))                               spawnParticles(a.id, "buff");
    else                                                               spawnParticles(a.id, "attack");

    if (!a.isR && gold < a.cost) return;

    if ((a.ability === AB.BUY_TARGET_BUFF || a.ability === AB.BUY_TARGET_HP) && !a.pendingTargetBuff) {
      const nt = [...team];
      const targetPet = nt[slot];
      const getTargetBuff = (petLike) => {
        if (petLike.ability === AB.BUY_TARGET_HP) {
          const m = pwr({ ...petLike, lvl: petLike.lvl || 1 });
          return { atk: 0, hp: 3 * m };
        }
        const m = pwr({ ...petLike, lvl: petLike.lvl || 1 });
        const amount = m === 1 ? 1 : m === 2 ? 2 : 4;
        return { atk: amount, hp: amount };
      };

      if (targetPet && targetPet.name === a.name && targetPet.tier === a.tier && targetPet.lvl < 3) {
        const { merged, rewards: newRewards } = merge(targetPet, a);
        const targetBuff = getTargetBuff(merged);
        nt[slot] = merged;
        applyBuyBuffs(nt, slot);
        setTeam(nt);
        if (!a.isR) {
          setGold((g) => g - a.cost);
          if (onGoldSpent) onGoldSpent(a.cost);
          // ✨ Sabit slot: hayvanı null yap, filter yapma
          setShop(prev => {
            const idx = prev.findIndex(p => p?.id === a.id);
            if (idx !== -1) {
              const newShop = [...prev];
              newShop[idx] = null;
              return newShop;
            }
            return prev;
          });
          if (newRewards.length > 0) setRewards((prev) => [...prev, ...newRewards]);
        } else {
          setRewards((prev) => [...prev.filter((x) => x.grp !== a.grp), ...newRewards]);
        }
        setSel({ ...merged, pendingTargetBuff: true, targetBuff, sourceSlot: slot });
        setSelI(null);
        return;
      }

      if (targetPet !== null) return;

      const targetBuff = getTargetBuff(a);
      nt[slot] = { ...a, lvl: a.lvl || 1, exp: a.exp || 0, curHp: a.curHp || a.hp, isR: undefined, rT: undefined, grp: undefined };
      if (!a.isR) {
        setGold((g) => g - a.cost);
        if (onGoldSpent) onGoldSpent(a.cost);
        // ✨ Sabit slot
        setShop(prev => {
          const idx = prev.findIndex(p => p?.id === a.id);
          if (idx !== -1) {
            const newShop = [...prev];
            newShop[idx] = null;
            return newShop;
          }
          return prev;
        });
      } else {
        setRewards(rewards.filter((x) => x.grp !== a.grp));
      }
      applyBuyBuffs(nt, slot);
      setTeam(nt);
      setSel({ ...a, pendingTargetBuff: true, targetBuff, sourceSlot: slot });
      setSelI(null);
      return;
    }

    if (a.tier >= 5)      unlockAchievement("lion_heart");
    if (a.name === "🐉")  unlockAchievement("dragon");

    const nt = [...team];

    if (nt[slot] && nt[slot].name === a.name && nt[slot].tier === a.tier && nt[slot].lvl < 3) {
      const { merged, rewards: newRewards } = merge(nt[slot], a);
      nt[slot] = merged;
      setTeam(nt);
      if (!a.isR) {
        setGold((g) => g - a.cost);
        if (onGoldSpent) onGoldSpent(a.cost);
        // ✨ Sabit slot
        setShop(prev => {
          const idx = prev.findIndex(p => p?.id === a.id);
          if (idx !== -1) {
            const newShop = [...prev];
            newShop[idx] = null;
            return newShop;
          }
          return prev;
        });
        if (merged.ability === AB.SHOP_DISCOUNT) setDiscountNext(true);
        if (newRewards.length > 0) setRewards((prev) => [...prev, ...newRewards]);
      } else {
        setRewards((prev) => [...prev.filter((x) => x.grp !== a.grp), ...newRewards]);
      }
      applyBuyBuffs(nt, slot);
      setTeam(nt);
      setSel(null);
      return;
    }

    if (nt[slot] !== null) return;

    nt[slot] = { ...a, lvl: a.lvl || 1, exp: a.exp || 0, curHp: a.curHp || a.hp, isR: undefined, rT: undefined, grp: undefined };
    if (!a.isR) {
      setGold((g) => g - a.cost);
      if (onGoldSpent) onGoldSpent(a.cost);
      // ✨ Sabit slot
      setShop(prev => {
        const idx = prev.findIndex(p => p?.id === a.id);
        if (idx !== -1) {
          const newShop = [...prev];
          newShop[idx] = null;
          return newShop;
        }
        return prev;
      });
    } else {
      setRewards(rewards.filter((x) => x.grp !== a.grp));
    }
    if (a.ability === AB.SHOP_DISCOUNT) setDiscountNext(true);
    applyBuyBuffs(nt, slot);
    setTeam(nt);

    const stillMergeable = shop.some(sp => sp && sp.id !== a.id && nt.some(t => t && t.name === sp.name && t.tier === sp.tier && t.lvl < 3));
if (stillMergeable) setTimeout(() => playSound("levelup"), 400);
    setSel(null);
  };

  // ─── Takımdakileri birleştir ──────────────────────────────────────────────
  const mergeT = (fi, ti) => {
    const nt = [...team];
    const f  = nt[fi];
    const t  = nt[ti];
    if (!f || !t || f.name !== t.name || f.tier !== t.tier) return false;

    if (t.lvl === 3 || f.lvl === 3) {
      [nt[fi], nt[ti]] = [nt[ti], nt[fi]];
      setTeam(nt);
      setSelI(null);
      return true;
    }
    if (t.lvl < 3) {
      const { merged, rewards: newRewards, leveledUp } = merge(t, f);
      nt[ti] = merged;
      nt[fi] = null;
      setTeam(nt);
      if (newRewards.length > 0) setRewards((prev) => [...prev, ...newRewards]);
      if (leveledUp && (merged.ability === AB.BUY_TARGET_BUFF || merged.ability === AB.BUY_TARGET_HP)) {
        const targetBuff = merged.ability === AB.BUY_TARGET_HP
          ? { atk: 0, hp: 3 * pwr(merged) }
          : (() => {
              const mergedPower = pwr(merged);
              const amount = mergedPower === 1 ? 1 : mergedPower === 2 ? 2 : 4;
              return { atk: amount, hp: amount };
            })();
        setSel({ ...merged, pendingTargetBuff: true, targetBuff, sourceSlot: ti });
      }
      setSelI(null);
      return true;
    }
    return false;
  };

  // ─── Sat ──────────────────────────────────────────────────────────────────
  const sell = (i) => {
    if (!team[i]) return;
    const pet    = team[i];
    let goldGain = sellP(pet);
    const nt     = [...team];

    if (pet.ability === AB.SELL_GOLD) goldGain += pwr(pet);

    const ctx = {
      team, nt, setTeam, setShop, setGold, setSelI, goldGain,
      clampStat, pwr,
      spawnParticles, spawnFloatingText, spawnFlyingParticle, triggerAnim,
    };

    const handler = sellHandlers[pet.ability];
    if (handler && handler(pet, i, ctx)) return;

    // Normal satış
    nt[i] = null;
    setTeam(nt);
    setGold((g) => g + goldGain);
    setSelI(null);
  };

  // ─── Yer değiştir ─────────────────────────────────────────────────────────
  const swap = (a, b) => {
    const nt = [...team];
    [nt[a], nt[b]] = [nt[b], nt[a]];
    setTeam(nt);
    setSelI(null);
  };

  return { refresh, toggleFreeze, buy, mergeT, sell, swap };
}
