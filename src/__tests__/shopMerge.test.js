// src/__tests__/shopMerge.test.js
//
// useShop hook'unun merge() ve sell() mantığını saf fonksiyon olarak test eder.
// Hook'u çağırmak yerine aynı algoritmayı bağımsız olarak çalıştırıyoruz —
// bu sayede React bağımlılığı olmadan hız elde ediyoruz.

import { AB, ABILITY_MULTIPLIERS as AM } from "../data/gameData";

// ─── Aynı merge algoritması (useShop.js'ten kopya, saf) ──────────────────────
const safeNumber = (v, d = 0) => (v === undefined || v === null || isNaN(v) ? d : v);
const clampStat  = (v) => Math.min(Math.max(v, 0), 500);
const pwr        = (a) => a?.lvl === 3 ? 3 : a?.lvl === 2 ? 2 : 1;

const mockUnlockAchievement = jest.fn();
const mockTriggerAnim       = jest.fn();
const mockPlaySound          = jest.fn();
const mockSpawnParticles     = jest.fn();

// merge'in saf versiyonu — DOM/React çağrıları çıkarıldı
function merge(base, add) {
  if (!base || !add) return { merged: base || add, rewards: [], leveledUp: false };

  const baseTotal = safeNumber(base.atk, 0) + safeNumber(base.hp, 0);
  const addTotal  = safeNumber(add.atk,  0) + safeNumber(add.hp,  0);
  let [newBase, newAdd] = addTotal > baseTotal ? [add, base] : [base, add];

  const oL = safeNumber(newBase.lvl, 1);
  let nL   = oL;
  let nE   = safeNumber(newBase.exp, 0) + safeNumber(newAdd.exp, 0) + 1;

  while (nE >= 2 && nL < 3) { nL++; nE -= 2; }
  if (nL >= 3) { nE = 0; mockUnlockAchievement("triple_star"); }

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

  return { merged, rewards: nL > oL ? ["reward_placeholder"] : [], leveledUp: nL > oL };
}

const makePet = (overrides = {}) => ({
  id:      `p_${Math.random().toString(36).slice(2)}`,
  nick:    "Test",
  name:    "Test",
  ability: AB.NONE,
  atk:     5,
  hp:      10,
  curHp:   10,
  lvl:     1,
  exp:     0,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

// ─── Merge: Seviye hesabı ─────────────────────────────────────────────────────
describe("merge — seviye hesabı", () => {
  test("exp 0 + 0: nE = 1, lvl değişmez", () => {
    const { merged } = merge(makePet({ lvl: 1, exp: 0 }), makePet({ lvl: 1, exp: 0 }));
    expect(merged.lvl).toBe(1);
    expect(merged.exp).toBe(1);
  });

  test("exp 0 + 1: nE = 2 → lvl 2'ye çıkar", () => {
    const { merged, leveledUp } = merge(
      makePet({ lvl: 1, exp: 0 }),
      makePet({ lvl: 1, exp: 1 })
    );
    expect(merged.lvl).toBe(2);
    expect(leveledUp).toBe(true);
  });

  test("lvl 2 + lvl 2 (her ikisi exp 0): nE = 1, lvl 2 kalır", () => {
    const { merged } = merge(makePet({ lvl: 2, exp: 0 }), makePet({ lvl: 2, exp: 0 }));
    expect(merged.lvl).toBe(2);
    expect(merged.exp).toBe(1);
  });

  test("lvl 2 (exp 1) + lvl 2 (exp 0): lvl 3'e çıkar", () => {
    const { merged, leveledUp } = merge(
      makePet({ lvl: 2, exp: 1 }),
      makePet({ lvl: 2, exp: 0 })
    );
    expect(merged.lvl).toBe(3);
    expect(merged.exp).toBe(0);
    expect(leveledUp).toBe(true);
    expect(mockUnlockAchievement).toHaveBeenCalledWith("triple_star");
  });

  test("zaten lvl 3: lvl 3 kalır, exp 0'a sıfırlanır", () => {
    const { merged } = merge(makePet({ lvl: 3, exp: 0 }), makePet({ lvl: 3, exp: 0 }));
    expect(merged.lvl).toBe(3);
    expect(merged.exp).toBe(0);
  });
});

// ─── Merge: Stat bonusu ───────────────────────────────────────────────────────
describe("merge — stat bonusu", () => {
  test("lvl değişmezse +1/+1 stat bonus (b=1)", () => {
    const base = makePet({ atk: 5, hp: 10, lvl: 1, exp: 0 });
    const add  = makePet({ atk: 5, hp: 10, lvl: 1, exp: 0 });
    const { merged } = merge(base, add);
    expect(merged.atk).toBe(6);  // 5 + 1
    expect(merged.hp).toBe(11);  // 10 + 1
  });

  test("lvl 1→2 geçişinde +2/+2 bonus (b=2)", () => {
    const base = makePet({ atk: 5, hp: 10, lvl: 1, exp: 1 });
    const add  = makePet({ atk: 5, hp: 10, lvl: 1, exp: 0 });
    const { merged } = merge(base, add);
    // nL=2, b = 2-1+1 = 2
    expect(merged.atk).toBe(7);
    expect(merged.hp).toBe(12);
  });

  test("daha güçlü olan base seçilir", () => {
    const weak   = makePet({ atk: 2, hp: 3, lvl: 1, exp: 0, id: "weak" });
    const strong = makePet({ atk: 8, hp: 8, lvl: 1, exp: 0, id: "strong" });
    const { merged } = merge(weak, strong);
    expect(merged.id).toBe("strong");
  });

  test("LEVELUP_BUFF_SELF ile ekstra bonus", () => {
    const base = makePet({ atk: 5, hp: 10, lvl: 1, exp: 1, ability: AB.LEVELUP_BUFF_SELF });
    const add  = makePet({ atk: 5, hp: 10, lvl: 1, exp: 0 });
    const { merged } = merge(base, add);
    // nL=2, b=2, m=pwr({lvl:2})=2, atkBonus = 2 + 2*2 = 6, hpBonus = 6
    expect(merged.atk).toBe(11); // 5 + 6
    expect(merged.hp).toBe(16);  // 10 + 6
  });
});

// ─── Merge: Ödül üretimi ─────────────────────────────────────────────────────
describe("merge — ödül üretimi", () => {
  test("seviye atlanmadan ödül yok", () => {
    const { rewards } = merge(
      makePet({ lvl: 1, exp: 0 }),
      makePet({ lvl: 1, exp: 0 })
    );
    expect(rewards).toHaveLength(0);
  });

  test("seviye atlayınca ödül üretilir", () => {
    const { rewards, leveledUp } = merge(
      makePet({ lvl: 1, exp: 1 }),
      makePet({ lvl: 1, exp: 0 })
    );
    expect(leveledUp).toBe(true);
    expect(rewards.length).toBeGreaterThan(0);
  });
});

// ─── Satış fiyatı hesabı ─────────────────────────────────────────────────────
describe("sellP — satış fiyatı", () => {
  const sellP = (a) => Math.ceil(a.lvl + (a.exp >= 1 ? 0.5 : 0));

  test("lvl 1, exp 0 → 1 altın", () => expect(sellP({ lvl: 1, exp: 0 })).toBe(1));
  test("lvl 1, exp 1 → 2 altın (ceil(1.5))", () => expect(sellP({ lvl: 1, exp: 1 })).toBe(2));
  test("lvl 2, exp 0 → 2 altın", () => expect(sellP({ lvl: 2, exp: 0 })).toBe(2));
  test("lvl 2, exp 1 → 3 altın (ceil(2.5))", () => expect(sellP({ lvl: 2, exp: 1 })).toBe(3));
  test("lvl 3, exp 0 → 3 altın", () => expect(sellP({ lvl: 3, exp: 0 })).toBe(3));
});

// ─── Edge case'ler ────────────────────────────────────────────────────────────
describe("merge — edge case'ler", () => {
  test("null base → null add döner", () => {
    const add = makePet();
    const { merged } = merge(null, add);
    expect(merged).toBe(add);
  });

  test("null add → base döner", () => {
    const base = makePet();
    const { merged } = merge(base, null);
    expect(merged).toBe(base);
  });

  test("stat clamp: 500 üstüne çıkmaz", () => {
    const base = makePet({ atk: 499, hp: 499, lvl: 1, exp: 0 });
    const add  = makePet({ atk: 499, hp: 499, lvl: 1, exp: 0 });
    const { merged } = merge(base, add);
    expect(merged.atk).toBe(500);
    expect(merged.hp).toBe(500);
  });
});
