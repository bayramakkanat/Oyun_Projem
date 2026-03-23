import { useEffect } from "react";
import { TIERS } from "../data/gameData";
import { logError, safeNumber } from "../utils/helpers";
import {
  spawnParticles,
  spawnFloatingText,
  spawnBuffAnimation,
} from "../utils/animations";
import { playSound } from "../hooks/useSound";

export function useShop({
  // State değerleri
  team, setTeam,
  shop, setShop,
  gold, setGold,
  rewards, setRewards,
  turn,
  discountNext, setDiscountNext,
  sel, setSel,
  selI, setSelI,
  shopResetKey,
  // Hesaplanan değerler
  maxT,
  shopSlots,
  difficultyLevel,
  // Yardımcı fonksiyonlar
  pwr,
  sellP,
  clampStat,
  triggerAnim,
  unlockAchievement,
  spawnBuffAnimation,
}) {

  // --- ÖDÜL HAVUZU OLUŞTURMA ---
  const addRew = () => {
    const rt = Math.min(maxT + 1, 6);
    const pool = [...TIERS[rt]];
    const ch = [];
    const used = new Set();
    const grpId = Math.random();
    for (let i = 0; i < 3; i++) {
      let idx;
      do {
        idx = Math.floor(Math.random() * pool.length);
      } while (used.has(idx) && used.size < pool.length);
      used.add(idx);
      ch.push({
        ...pool[idx],
        id: Math.random(),
        lvl: 1,
        exp: 0,
        curHp: pool[idx].hp,
        isR: true,
        rT: rt,
        grp: grpId,
      });
    }
    return ch;
  };

  // --- KED İ LEVELUP BUFF ---
  const notifyCatOnLevelup = (leveledPetId) => {
    setTimeout(() => {
      setTeam((prevTeam) => {
        if (!prevTeam) return prevTeam;
        const newTeam = [...prevTeam];
        let hasChanges = false;

        newTeam.forEach((pet, index) => {
          if (
            pet &&
            pet.ability === "friend_levelup_buff" &&
            pet.id !== leveledPetId
          ) {
            const m = pwr(pet);
            const buffAmount = m;
            newTeam[index] = {
              ...pet,
              atk: clampStat((pet.atk || 0) + buffAmount),
              hp: clampStat((pet.hp || 0) + buffAmount),
              curHp: clampStat((pet.curHp || 0) + buffAmount),
            };
            hasChanges = true;

            setTimeout(() => {
              const catElement = document.querySelector(`[data-pet-id="${pet.id}"]`);
              if (catElement) {
                triggerAnim(pet.id, "buff");
                spawnParticles(pet.id, "buff");
                const rect = catElement.getBoundingClientRect();
                spawnFloatingText(
                  `+${buffAmount}`,
                  rect.left + rect.width / 2,
                  rect.top - 20,
                  "buff"
                );
                for (let i = 0; i < 5; i++) {
                  setTimeout(() => {
                    const particle = document.createElement("div");
                    particle.textContent = "🐱";
                    particle.style.position = "fixed";
                    particle.style.left = `${rect.left + rect.width / 2}px`;
                    particle.style.top = `${rect.top + rect.height / 2}px`;
                    particle.style.fontSize = "16px";
                    particle.style.pointerEvents = "none";
                    particle.style.zIndex = "1000";
                    particle.style.setProperty("--tx", `${(Math.random() - 0.5) * 100}px`);
                    particle.style.setProperty("--ty", `${-30 - Math.random() * 40}px`);
                    particle.style.animation = "flyToTarget 0.6s ease-out forwards";
                    document.body.appendChild(particle);
                    setTimeout(() => particle.remove(), 600);
                  }, i * 100);
                }
              }
            }, 300 + index * 100);
          }
        });

        return hasChanges ? newTeam : prevTeam;
      });
    }, 100);
  };

  // --- BİRLEŞTİRME ---
  const merge = (base, add) => {
    try {
      if (!base || !add) return { merged: base || add, rewards: [] };

      const baseTotal = safeNumber(base.atk, 0) + safeNumber(base.hp, 0);
      const addTotal = safeNumber(add.atk, 0) + safeNumber(add.hp, 0);

      let newBase = { ...base };
      let newAdd = { ...add };

      if (addTotal > baseTotal) {
        [newBase, newAdd] = [newAdd, newBase];
      }

      const baseId = newBase.id;
      const oL = safeNumber(newBase.lvl, 1);
      let nL = oL;
      let nE = safeNumber(newBase.exp, 0) + safeNumber(newAdd.exp, 0) + 1;

      while (nE >= 2 && nL < 3) {
        nL++;
        nE -= 2;
      }
      if (nL >= 3) {
        nE = 0;
        unlockAchievement("triple_star");
      }

      const b = nL - oL + 1;
      let atkBonus = b;
      let hpBonus = b;

      if (newBase.ability === "levelup_buff_self" && nL > oL) {
        const m = pwr({ ...newBase, lvl: nL });
        atkBonus += m * 2;
        hpBonus += m * 2;
      }

      const merged = {
        ...newBase,
        lvl: nL,
        exp: nE,
        atk: clampStat(safeNumber(newBase.atk, 0) + atkBonus),
        hp: clampStat(safeNumber(newBase.hp, 0) + hpBonus),
        curHp: clampStat(safeNumber(newBase.hp, 0) + hpBonus),
      };

      let newRewards = [];
      if (nL > oL) {
        newRewards = addRew();
        notifyCatOnLevelup(baseId);
      }

      triggerAnim(baseId, "buff");
      playSound("buff");
      spawnParticles(baseId, "buff");

      return { merged, rewards: newRewards };
    } catch (e) {
      logError(e, "merge");
      return { merged: base, rewards: [] };
    }
  };

  // --- MAĞAZA YENİLE ---
  const refresh = () => {
    const currentFrozen = shop.filter((s) => s.frozen);
    setDiscountNext(false);
    const slotsNeeded = shopSlots - currentFrozen.length;
    const pool = [];
    for (let t = 1; t <= maxT; t++) {
      const weight =
        difficultyLevel === "hard"
          ? t * 2
          : difficultyLevel === "easy"
          ? (maxT - t + 1) * 2
          : 1;
      for (let w = 0; w < weight; w++) pool.push(...TIERS[t]);
    }
    const s = [];
    for (let i = 0; i < slotsNeeded; i++) {
      const a = pool[Math.floor(Math.random() * pool.length)];
      let cost = a.cost;
      team.forEach((pet) => {
        if (pet && pet.ability === "buy_discount_next")
          cost = Math.max(1, cost - pwr(pet));
      });
      if (discountNext) {
        team.forEach((pet) => {
          if (pet && pet.ability === "shop_discount") {
            const level = pwr(pet);
            const discountPercent =
              level === 1 ? 0.33 : level === 2 ? 0.66 : 0.99;
            cost = Math.max(1, Math.floor(cost * (1 - discountPercent)));
          }
        });
      }
      s.push({
        ...a,
        id: Math.random(),
        lvl: 1,
        exp: 0,
        curHp: a.hp,
        frozen: false,
        cost,
      });
    }
    if (discountNext) setDiscountNext(false);
    const newShop = [...currentFrozen, ...s];
    setShop(newShop);

    const hasMergeable = newShop.some((shopPet) =>
      team.some(
        (t) =>
          t && t.name === shopPet.name && t.tier === shopPet.tier && t.lvl < 3
      )
    );
    if (hasMergeable) {
      setTimeout(() => playSound("levelup"), 300);
    }
  };

  useEffect(() => {
    refresh();
  }, [turn, shopSlots, shopResetKey]);

  // --- DONDUR ---
  const toggleFreeze = (a) => {
    const willFreeze = !shop.find((s) => s.id === a.id)?.frozen;
    if (willFreeze) playSound("freeze");
    setShop(shop.map((s) => (s.id === a.id ? { ...s, frozen: !s.frozen } : s)));
  };

  // --- SATIN AL ---
  const buy = (a, slot) => {
    if (a.ability.includes("fire")) spawnParticles(a.id, "fire");
    else if (a.ability.includes("shield") || a.ability.includes("tank"))
      spawnParticles(a.id, "shield");
    else if (a.ability.includes("heal")) spawnParticles(a.id, "heal");
    else if (a.ability.includes("buff")) spawnParticles(a.id, "buff");
    else spawnParticles(a.id, "attack");

    const applyBuyBuffs = (nt, newPetIndex) => {
      nt.forEach((pet, idx) => {
        if (pet && pet.ability === "buy_buff_random" && idx !== newPetIndex) {
          const m = pwr(pet);
          const allies = nt.filter((t, i) => t && i !== idx);
          if (allies.length > 0) {
            const target = allies[Math.floor(Math.random() * allies.length)];
            const targetId = target.id;
            if (targetId) {
              spawnBuffAnimation(pet.id, targetId, m, "buff", triggerAnim);
              setTimeout(() => {
                setTeam((prev) => {
                  const updated = [...prev];
                  const tIdx = updated.findIndex((t) => t && t.id === targetId);
                  if (tIdx !== -1) {
                    updated[tIdx] = {
                      ...updated[tIdx],
                      atk: clampStat(updated[tIdx].atk + m),
                      hp: clampStat(updated[tIdx].hp + m),
                      curHp: clampStat(updated[tIdx].curHp + m),
                    };
                  }
                  return updated;
                });
              }, 800);
            }
          }
        }
      });
      nt.forEach((pet, idx) => {
        if (pet && pet.ability === "buy_buff_behind") {
          const m = pwr(pet);
          if (idx > 0 && nt[idx - 1]) {
            const behindId = nt[idx - 1].id;
            spawnBuffAnimation(pet.id, behindId, m, "buff");
            setTimeout(() => {
              setTeam((prev) => {
                const updated = [...prev];
                const tIdx = updated.findIndex((t) => t && t.id === behindId);
                if (tIdx !== -1) {
                  updated[tIdx] = {
                    ...updated[tIdx],
                    atk: clampStat(updated[tIdx].atk + m),
                    hp: clampStat(updated[tIdx].hp + m),
                    curHp: clampStat(updated[tIdx].curHp + m),
                  };
                }
                return updated;
              });
            }, 800);
          }
        }
      });
    };

    if (!a.isR && gold < a.cost) return;
    if (a.ability === "buy_target_buff" && !a.pendingTargetBuff) {
      const nt = [...team];
      const targetPet = nt[slot];

      if (
        targetPet &&
        targetPet.name === a.name &&
        targetPet.tier === a.tier &&
        targetPet.lvl < 3
      ) {
        const { merged, rewards: newRewards } = merge(targetPet, a);
        const mergedPower = pwr(merged);
        const buffAmount =
          mergedPower === 1 ? 1 : mergedPower === 2 ? 2 : 4;

        nt[slot] = merged;
        setTeam(nt);
        if (!a.isR) {
          setGold((g) => g - a.cost);
          setShop(shop.filter((x) => x.id !== a.id));
        } else {
          setRewards((prev) => [
            ...prev.filter((x) => x.grp !== a.grp),
            ...newRewards,
          ]);
        }
        if (!a.isR && newRewards.length > 0) {
          setRewards((prev) => [...prev, ...newRewards]);
        }
        setSel({
          ...merged,
          pendingTargetBuff: true,
          buffAmount,
          sourceSlot: slot,
        });
        setSelI(null);
        return;
      }

      if (targetPet !== null) return;

      const m = pwr({ ...a, lvl: a.lvl || 1 });
      const buffAmount = m === 1 ? 1 : m === 2 ? 2 : 4;
      nt[slot] = {
        ...a,
        lvl: a.lvl || 1,
        exp: a.exp || 0,
        curHp: a.curHp || a.hp,
        isR: undefined,
        rT: undefined,
        grp: undefined,
      };
      if (!a.isR) {
        setGold((g) => g - a.cost);
        setShop(shop.filter((x) => x.id !== a.id));
      } else {
        setRewards(rewards.filter((x) => x.grp !== a.grp));
      }
      setTeam(nt);
      setSel({ ...a, pendingTargetBuff: true, buffAmount, sourceSlot: slot });
      setSelI(null);
      return;
    }
    if (a.tier >= 5) unlockAchievement("lion_heart");
    if (a.name === "🐉") unlockAchievement("dragon");
    const nt = [...team];

    if (
      nt[slot] &&
      nt[slot].name === a.name &&
      nt[slot].tier === a.tier &&
      nt[slot].lvl < 3
    ) {
      const { merged, rewards: newRewards } = merge(nt[slot], a);
      nt[slot] = merged;
      setTeam(nt);
      if (!a.isR) {
        setGold((g) => g - a.cost);
        setShop(shop.filter((x) => x.id !== a.id));
        if (merged.ability === "shop_discount") setDiscountNext(true);
        if (newRewards.length > 0)
          setRewards((prev) => [...prev, ...newRewards]);
      } else {
        setRewards((prev) => [
          ...prev.filter((x) => x.grp !== a.grp),
          ...newRewards,
        ]);
      }
      applyBuyBuffs(nt, slot);
      setTeam(nt);
      setSel(null);
      return;
    }

    if (nt[slot] !== null) return;
    nt[slot] = {
      ...a,
      lvl: a.lvl || 1,
      exp: a.exp || 0,
      curHp: a.curHp || a.hp,
      isR: undefined,
      rT: undefined,
      grp: undefined,
    };
    if (!a.isR) {
      setGold((g) => g - a.cost);
      setShop(shop.filter((x) => x.id !== a.id));
    } else {
      setRewards(rewards.filter((x) => x.grp !== a.grp));
    }
    if (a.ability === "shop_discount") setDiscountNext(true);
    applyBuyBuffs(nt, slot);
    setTeam(nt);
    const remainingShop = shop.filter((x) => x.id !== a.id);
    const stillMergeable = remainingShop.some((shopPet) =>
      nt.some(
        (t) =>
          t && t.name === shopPet.name && t.tier === shopPet.tier && t.lvl < 3
      )
    );
    if (stillMergeable) {
      setTimeout(() => playSound("levelup"), 400);
    }
    setSel(null);
  };

  // --- TAKIMDAKİLERİ BİRLEŞTİR ---
  const mergeT = (fi, ti) => {
    const nt = [...team];
    const f = nt[fi];
    const t = nt[ti];
    if (f && t && f.name === t.name && f.tier === t.tier) {
      if (t.lvl === 3 || f.lvl === 3) {
        [nt[fi], nt[ti]] = [nt[ti], nt[fi]];
        setTeam(nt);
        setSelI(null);
        return true;
      }
      if (t.lvl < 3) {
        const { merged, rewards: newRewards } = merge(t, f);
        nt[ti] = merged;
        nt[fi] = null;
        setTeam(nt);
        if (newRewards.length > 0)
          setRewards((prev) => [...prev, ...newRewards]);
        setSelI(null);
        return true;
      }
    }
    return false;
  };

  // --- SAT ---
  const sell = (i) => {
    if (!team[i]) return;
    const pet = team[i];
    let goldGain = sellP(pet);
    const nt = [...team];
    if (pet.ability === "sell_gold") goldGain += pwr(pet);

    if (pet.ability === "sell_buff_friend") {
      const allies = nt.filter((t, idx) => t && idx !== i);
      if (allies.length > 0) {
        const m = pwr(pet);
        const targets = [...allies]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(m, allies.length));
        const raccoonElement = document.querySelector(`[data-pet-id="${pet.id}"]`);
        const raccoonRect = raccoonElement ? raccoonElement.getBoundingClientRect() : null;
        targets.forEach((target, index) => {
          const targetIdx = nt.findIndex((t) => t && t.id === target.id);
          if (targetIdx !== -1) {
            setTimeout(() => {
              const targetElement = document.querySelector(`[data-pet-id="${nt[targetIdx].id}"]`);
              if (targetElement && raccoonRect) {
                const targetRect = targetElement.getBoundingClientRect();
                ["⚔️", "❤️"].forEach((icon, iconIndex) => {
                  setTimeout(() => {
                    const particle = document.createElement("div");
                    particle.textContent = icon;
                    particle.style.position = "fixed";
                    particle.style.left = `${raccoonRect.left + raccoonRect.width / 2}px`;
                    particle.style.top = `${raccoonRect.top + raccoonRect.height / 2}px`;
                    particle.style.fontSize = "24px";
                    particle.style.pointerEvents = "none";
                    particle.style.zIndex = "1000";
                    particle.style.setProperty("--tx", `${targetRect.left + targetRect.width / 2 - raccoonRect.left - raccoonRect.width / 2}px`);
                    particle.style.setProperty("--ty", `${targetRect.top + targetRect.height / 2 - raccoonRect.top - raccoonRect.height / 2}px`);
                    particle.style.animation = "flyToTarget 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards";
                    document.body.appendChild(particle);
                    setTimeout(() => {
                      const rect = targetElement.getBoundingClientRect();
                      spawnFloatingText("+1", rect.left + rect.width / 2, rect.top, "buff");
                      triggerAnim(nt[targetIdx].id, "buff");
                    }, 700);
                    setTimeout(() => particle.remove(), 800);
                  }, iconIndex * 150);
                });
              }
            }, index * 200);
            setTimeout(() => {
              nt[targetIdx] = {
                ...nt[targetIdx],
                atk: clampStat(nt[targetIdx].atk + m),
                hp: clampStat(nt[targetIdx].hp + m),
                curHp: clampStat(nt[targetIdx].curHp + m),
              };
            }, index * 200 + 800);
          }
        });
        nt[i] = null;
        setTeam(nt);
        setGold((g) => g + goldGain);
        setSelI(null);
        return;
      }
    }

    if (pet.ability === "sell_heal_team") {
      const m = pwr(pet);
      const healAmount = m * 2;
      const lamaElement = document.querySelector(`[data-pet-id="${pet.id}"]`);
      const lamaRect = lamaElement ? lamaElement.getBoundingClientRect() : null;

      team.forEach((ally, idx) => {
        if (ally && idx !== i) {
          if (lamaRect) {
            setTimeout(() => {
              const targetElement = document.querySelector(`[data-pet-id="${ally.id}"]`);
              if (targetElement) {
                const targetRect = targetElement.getBoundingClientRect();
                for (let k = 0; k < 3; k++) {
                  setTimeout(() => {
                    const heart = document.createElement("div");
                    heart.textContent = "💚";
                    heart.style.position = "fixed";
                    heart.style.left = `${lamaRect.left + lamaRect.width / 2}px`;
                    heart.style.top = `${lamaRect.top + lamaRect.height / 2}px`;
                    heart.style.fontSize = "20px";
                    heart.style.pointerEvents = "none";
                    heart.style.zIndex = "1000";
                    heart.style.setProperty("--tx", `${targetRect.left + targetRect.width / 2 - lamaRect.left - lamaRect.width / 2}px`);
                    heart.style.setProperty("--ty", `${targetRect.top + targetRect.height / 2 - lamaRect.top - lamaRect.height / 2}px`);
                    heart.style.animation = "flyToTarget 0.6s ease-out forwards";
                    document.body.appendChild(heart);
                    setTimeout(() => heart.remove(), 600);
                  }, k * 100);
                }
              }
            }, idx * 150);
          }
          setTimeout(() => {
            const targetEl = document.querySelector(`[data-pet-id="${ally.id}"]`);
            if (targetEl) {
              const rect = targetEl.getBoundingClientRect();
              spawnFloatingText(`+${healAmount} HP`, rect.left + rect.width / 2, rect.top - 10, "heal");
              triggerAnim(ally.id, "buff");
            }
          }, idx * 150 + 300);
        }
      });

      const updatedNt = [...team];
      team.forEach((ally, idx) => {
        if (ally && idx !== i) {
          updatedNt[idx] = {
            ...ally,
            hp: clampStat((ally.hp || 0) + healAmount),
            curHp: clampStat((ally.curHp || 0) + healAmount),
          };
        }
      });
      updatedNt[i] = null;
      setTeam(updatedNt);
      setGold((g) => g + goldGain);
      setSelI(null);
      setTimeout(() => { spawnParticles(pet.id, "heal"); }, 100);
      return;
    }

    if (pet.ability === "sell_buff_shop") {
      const m = pwr(pet);
      const petEl = document.querySelector(`[data-pet-id="${pet.id}"]`);
      const petRect = petEl ? petEl.getBoundingClientRect() : null;
      setShop((prevShop) => {
        const updated = prevShop.map((shopPet) => {
          if (!shopPet) return shopPet;
          return {
            ...shopPet,
            atk: clampStat(shopPet.atk + m),
            hp: clampStat(shopPet.hp + m),
            curHp: clampStat(shopPet.curHp + m),
          };
        });
        if (petRect) {
          updated.forEach((shopPet, sIdx) => {
            if (!shopPet) return;
            setTimeout(() => {
              ["⚔️", "❤️"].forEach((icon, iconIndex) => {
                setTimeout(() => {
                  const particle = document.createElement("div");
                  particle.textContent = icon;
                  particle.style.position = "fixed";
                  particle.style.left = `${petRect.left + petRect.width / 2}px`;
                  particle.style.top = `${petRect.top + petRect.height / 2}px`;
                  particle.style.fontSize = "20px";
                  particle.style.pointerEvents = "none";
                  particle.style.zIndex = "1000";
                  const shopCards = document.querySelectorAll(".card-3d");
                  const targetCard = shopCards[sIdx];
                  const targetRect = targetCard ? targetCard.getBoundingClientRect() : null;
                  const targetX = targetRect ? targetRect.left + targetRect.width / 2 : 120 + sIdx * 140;
                  const targetY = targetRect ? targetRect.top + targetRect.height / 2 : 200;
                  particle.style.setProperty("--tx", `${targetX - petRect.left}px`);
                  particle.style.setProperty("--ty", `${targetY - petRect.top}px`);
                  particle.style.animation = "flyToTarget 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards";
                  document.body.appendChild(particle);
                  setTimeout(() => particle.remove(), 700);
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
      return;
    }

    nt[i] = null;
    setTeam(nt);
    setGold((g) => g + goldGain);
    setSelI(null);
  };

  // --- YER DEĞİŞTİR ---
  const swap = (a, b) => {
    const nt = [...team];
    [nt[a], nt[b]] = [nt[b], nt[a]];
    setTeam(nt);
    setSelI(null);
  };

  return { refresh, toggleFreeze, buy, mergeT, sell, swap };
}
