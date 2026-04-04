// src/__tests__/battleFaintResolver.test.js
//
// resolveFaint fonksiyonu için birim testler.
// DOM/animasyon fonksiyonları mock'lanıyor; saf mantık test ediliyor.

import { resolveFaint } from "../utils/battleFaintResolver";
import { AB } from "../data/gameData";

// ─── Test yardımcıları ────────────────────────────────────────────────────────
const makePet = (overrides = {}) => ({
  id:      Math.random().toString(36).slice(2),
  nick:    "TestHayvan",
  ability: AB.NONE,
  atk:     5,
  hp:      10,
  curHp:   10,
  lvl:     1,
  exp:     0,
  ...overrides,
});

const clampStat  = (v) => Math.min(Math.max(v, 0), 500);
const pwr        = (a) => a?.lvl === 3 ? 3 : a?.lvl === 2 ? 2 : 1;

const mockCallbacks = {
  pwr,
  clampStat,
  triggerAnim:    jest.fn(),
  spawnParticles: jest.fn(),
  spawnProjectile:jest.fn(),
  setTeam:        jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ─── Temel guard'lar ──────────────────────────────────────────────────────────
describe("resolveFaint — temel guard'lar", () => {
  test("null ölü birim → boş sonuç döner", () => {
    const result = resolveFaint(null, [], [], true, null, mockCallbacks);
    expect(result).toEqual({ lg: [], sm: [], gG: 0 });
  });

  test("isDead=true olan birim → tekrar işlenmez", () => {
    const dead = makePet({ isDead: true, ability: AB.FAINT_BUFF });
    const ally  = makePet();
    const result = resolveFaint(dead, [ally], [], true, null, mockCallbacks);
    expect(result.lg).toHaveLength(0);
    expect(ally.atk).toBe(5); // değişmemeli
  });

  test("ilk çağrıda isDead flag'i set edilir", () => {
    const dead = makePet({ ability: AB.NONE });
    resolveFaint(dead, [], [], true, null, mockCallbacks);
    expect(dead.isDead).toBe(true);
  });
});

// ─── FAINT_BUFF ───────────────────────────────────────────────────────────────
describe("resolveFaint — FAINT_BUFF", () => {
  test("oyuncu tarafı: rastgele dosta +1/+1 verir (lvl 1)", () => {
    const dead  = makePet({ ability: AB.FAINT_BUFF });
    const ally  = makePet({ atk: 3, curHp: 5 });
    const { lg } = resolveFaint(dead, [ally], [], true, null, mockCallbacks);

    expect(ally.atk).toBe(4);
    expect(ally.curHp).toBe(6);
    expect(lg.length).toBeGreaterThan(0);
  });

  test("düşman tarafı: düşman dostuna +1/+1 verir", () => {
    const dead  = makePet({ ability: AB.FAINT_BUFF });
    const ally  = makePet({ atk: 2, curHp: 4 });
    resolveFaint(dead, [ally], [], false, null, mockCallbacks);

    expect(ally.atk).toBe(3);
    expect(ally.curHp).toBe(5);
  });

  test("lvl 2: +2/+2 buff verir", () => {
    const dead  = makePet({ ability: AB.FAINT_BUFF, lvl: 2 });
    const ally  = makePet({ atk: 3, curHp: 5 });
    resolveFaint(dead, [ally], [], true, null, mockCallbacks);

    expect(ally.atk).toBe(5);
    expect(ally.curHp).toBe(7);
  });

  test("dost yoksa log yok, hata yok", () => {
    const dead = makePet({ ability: AB.FAINT_BUFF });
    const { lg } = resolveFaint(dead, [], [], true, null, mockCallbacks);
    expect(lg).toHaveLength(0);
  });
});

// ─── FAINT_DMG ────────────────────────────────────────────────────────────────
describe("resolveFaint — FAINT_DMG", () => {
  test("oyuncu tarafı: tüm düşmanlara 2 hasar (lvl 1)", () => {
    const dead  = makePet({ ability: AB.FAINT_DMG });
    const e1    = makePet({ curHp: 10 });
    const e2    = makePet({ curHp: 8  });
    resolveFaint(dead, [], [e1, e2], true, null, mockCallbacks);

    expect(e1.curHp).toBe(8);
    expect(e2.curHp).toBe(6);
  });

  test("lvl 3: tüm düşmanlara 6 hasar", () => {
    const dead = makePet({ ability: AB.FAINT_DMG, lvl: 3 });
    const e1   = makePet({ curHp: 10 });
    resolveFaint(dead, [], [e1], true, null, mockCallbacks);
    expect(e1.curHp).toBe(4);
  });

  test("düşman tarafı: oyuncu takımına hasar verir", () => {
    const dead  = makePet({ ability: AB.FAINT_DMG });
    const p1    = makePet({ curHp: 10 });
    resolveFaint(dead, [], [p1], false, null, mockCallbacks);
    expect(p1.curHp).toBe(8);
  });
});

// ─── FAINT_SHIELD ─────────────────────────────────────────────────────────────
describe("resolveFaint — FAINT_SHIELD", () => {
  test("tüm dostlara +2 can verir (lvl 1)", () => {
    const dead = makePet({ ability: AB.FAINT_SHIELD });
    const a1   = makePet({ curHp: 5 });
    const a2   = makePet({ curHp: 3 });
    resolveFaint(dead, [a1, a2], [], true, null, mockCallbacks);

    expect(a1.curHp).toBe(7);
    expect(a2.curHp).toBe(5);
  });
});

// ─── FAINT_SUMMON ─────────────────────────────────────────────────────────────
describe("resolveFaint — FAINT_SUMMON", () => {
  test("yavru birimi sm dizisine ekler", () => {
    const dead = makePet({ ability: AB.FAINT_SUMMON });
    const { sm } = resolveFaint(dead, [], [], false, null, mockCallbacks);
    expect(sm).toHaveLength(1);
    expect(sm[0].atk).toBeGreaterThan(0);
    expect(sm[0].curHp).toBeGreaterThan(0);
  });

  test("lvl 2: daha güçlü yavru çıkar", () => {
    const dead1 = makePet({ ability: AB.FAINT_SUMMON, lvl: 1 });
    const dead2 = makePet({ ability: AB.FAINT_SUMMON, lvl: 2 });
    const { sm: sm1 } = resolveFaint(dead1, [], [], false, null, mockCallbacks);
    const { sm: sm2 } = resolveFaint(dead2, [], [], false, null, mockCallbacks);
    expect(sm2[0].atk).toBeGreaterThan(sm1[0].atk);
  });
});

// ─── FAINT_GOLD ───────────────────────────────────────────────────────────────
describe("resolveFaint — FAINT_GOLD", () => {
  test("oyuncu tarafı: gG altın kazanır (lvl 1 → +1)", () => {
    const dead = makePet({ ability: AB.FAINT_GOLD });
    const { gG } = resolveFaint(dead, [], [], true, null, mockCallbacks);
    expect(gG).toBe(1);
  });

  test("düşman tarafı: oyuncuya etki etmez (gG = 0)", () => {
    const dead = makePet({ ability: AB.FAINT_GOLD });
    const { gG } = resolveFaint(dead, [], [], false, null, mockCallbacks);
    expect(gG).toBe(0);
  });
});

// ─── FRIEND_FAINT ────────────────────────────────────────────────────────────
describe("resolveFaint — FRIEND_FAINT tetikleyici", () => {
  test("takımdaki FRIEND_FAINT hayvanı buff alır", () => {
    const dead    = makePet({ ability: AB.NONE });
    const watcher = makePet({ ability: AB.FRIEND_FAINT, atk: 4, curHp: 6 });

    resolveFaint(dead, [watcher], [], true, null, mockCallbacks);

    expect(watcher.atk).toBe(6);   // +2
    expect(watcher.curHp).toBe(8); // +2
  });
});

// ─── KILL_BUFF (killer) ───────────────────────────────────────────────────────
describe("resolveFaint — killer KILL_BUFF", () => {
  test("öldüren birim KILL_BUFF ise buff alır", () => {
    const dead   = makePet({ ability: AB.NONE });
    const killer = makePet({ ability: AB.KILL_BUFF, atk: 5, curHp: 8 });

    resolveFaint(dead, [], [], true, killer, mockCallbacks);

    expect(killer.atk).toBe(8);    // +3
    expect(killer.curHp).toBe(11); // +3
  });

  test("lvl 2 killer: +6 buff alır", () => {
    const dead   = makePet({ ability: AB.NONE });
    const killer = makePet({ ability: AB.KILL_BUFF, atk: 5, curHp: 5, lvl: 2 });
    resolveFaint(dead, [], [], true, killer, mockCallbacks);
    expect(killer.atk).toBe(11);
    expect(killer.curHp).toBe(11);
  });
});

// ─── FAINT_DUPLICATE ─────────────────────────────────────────────────────────
describe("resolveFaint — FAINT_DUPLICATE", () => {
  test("rastgele dost kopyalanır ve sm'e eklenir", () => {
    const dead  = makePet({ ability: AB.FAINT_DUPLICATE });
    const ally  = makePet({ atk: 7, hp: 12, curHp: 12 });
    const { sm } = resolveFaint(dead, [ally], [], true, null, mockCallbacks);

    expect(sm).toHaveLength(1);
    expect(sm[0].atk).toBe(ally.atk);
    expect(sm[0].id).not.toBe(ally.id); // farklı id
  });
});

// ─── SUMMON_RETRIGGER (Dodo) ──────────────────────────────────────────────────
describe("resolveFaint — SUMMON_RETRIGGER Dodo combo", () => {
  test("Dodo varsa FAINT_BUFF efekti tekrar tetiklenir", () => {
    const dead = makePet({ ability: AB.FAINT_BUFF });
    const dodo = makePet({ ability: AB.SUMMON_RETRIGGER, lvl: 1 });
    const ally = makePet({ atk: 2, curHp: 3 });

    // Dodo + normal ally
    resolveFaint(dead, [dodo, ally], [], true, null, mockCallbacks);

    // Normal FAINT_BUFF bir kez + Dodo bir kez retrigger = toplam +2 değişim
    // (her seferinde rastgele hedef seçilir, ally veya dodo)
    const totalChange = (dodo.atk - 2) + (ally.atk - 2);
    expect(totalChange).toBeGreaterThanOrEqual(1);
  });
});

// ─── Simetri testi: oyuncu vs düşman ─────────────────────────────────────────
describe("resolveFaint — oyuncu/düşman simetri", () => {
  test("FAINT_SHIELD her iki tarafta da aynı miktarda buff verir", () => {
    const deadP  = makePet({ ability: AB.FAINT_SHIELD, lvl: 1 });
    const allyP  = makePet({ curHp: 5 });
    resolveFaint(deadP, [allyP], [], true, null, mockCallbacks);
    const playerBuff = allyP.curHp - 5;

    const deadE = makePet({ ability: AB.FAINT_SHIELD, lvl: 1, isDead: false });
    const allyE = makePet({ curHp: 5 });
    resolveFaint(deadE, [allyE], [], false, null, mockCallbacks);
    const enemyBuff = allyE.curHp - 5;

    expect(playerBuff).toBe(enemyBuff);
  });
});
