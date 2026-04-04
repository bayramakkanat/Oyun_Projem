// src/__tests__/battleTurnPhase.test.js
//
// runBattleTurnPhase için birim testler.
// async delay mock'lanıyor; ability mantığı test ediliyor.

import { runBattleTurnPhase } from "../utils/battleTurnPhase";
import { AB } from "../data/gameData";

// ─── Test yardımcıları ────────────────────────────────────────────────────────
const makePet = (overrides = {}) => ({
  id:      `pet_${Math.random().toString(36).slice(2)}`,
  nick:    "Test",
  ability: AB.NONE,
  atk:     5,
  hp:      10,
  curHp:   10,
  lvl:     1,
  exp:     0,
  trample: false,
  ...overrides,
});

const clampStat  = (v) => Math.min(Math.max(v, 0), 500);
const pwr        = (a) => a?.lvl === 3 ? 3 : a?.lvl === 2 ? 2 : 1;

// delay'i senkron yap — her ms değeri için hemen resolve
const fastDelay  = () => Promise.resolve();

let logMessages  = [];
let ptState      = [];
let etState      = [];
let stepState    = 0;

const setLog     = jest.fn((fn) => { logMessages = fn(logMessages); });
const setPT      = jest.fn((team) => { ptState = team; });
const setET      = jest.fn((team) => { etState = team; });
const setStep    = jest.fn((fn)   => { stepState = typeof fn === "function" ? fn(stepState) : fn; });
const setIsBattleOver = jest.fn();
const setTeam    = jest.fn();
const triggerAnim = jest.fn();

const battleGoldRef = { current: 0 };

const faint = jest.fn().mockReturnValue({ lg: [], sm: [], gG: 0 });

const baseArgs = (pT, eT) => ({
  pT, eT,
  delay:    fastDelay,
  isCancelled: () => false,
  triggerAnim,
  clampStat,
  pwr,
  battleSpeedRef: { current: 1 },
  setLog, setPT, setET, setStep,
  setIsBattleOver, setTeam,
  battleGoldRef,
  faint,
  isDebugBattle:        false,
  announceDebugWinner:  jest.fn(),
  scheduleDebugBattleReset: jest.fn(),
});

beforeEach(() => {
  logMessages = [];
  ptState     = [];
  etState     = [];
  stepState   = 0;
  battleGoldRef.current = 0;
  jest.clearAllMocks();
  faint.mockReturnValue({ lg: [], sm: [], gG: 0 });
});

// ─── Temel savaş turu ─────────────────────────────────────────────────────────
describe("runBattleTurnPhase — temel hasar", () => {
  test("her iki ön hayvan birbirine atk kadar hasar verir", async () => {
    const p = [makePet({ atk: 4, curHp: 10 })];
    const e = [makePet({ atk: 3, curHp: 8  })];

    await runBattleTurnPhase(baseArgs(p, e));

    // p[0].curHp: 10 - 3 = 7, e[0].curHp: 8 - 4 = 4
    expect(p[0].curHp).toBe(7);
    expect(e[0].curHp).toBe(4);
  });

  test("ölen birim için faint çağrılır", async () => {
    const p = [makePet({ atk: 20, curHp: 10 })]; // anlık öldürür
    const e = [makePet({ atk: 1,  curHp: 3  })];

    await runBattleTurnPhase(baseArgs(p, e));

    expect(faint).toHaveBeenCalled();
  });

  test("boş takım durumunda setIsBattleOver çağrılır", async () => {
    await runBattleTurnPhase(baseArgs([], [makePet()]));
    expect(setIsBattleOver).toHaveBeenCalledWith(true);
  });
});

// ─── ATK_BUFF ────────────────────────────────────────────────────────────────
describe("runBattleTurnPhase — ATK_BUFF", () => {
  test("her vuruştan sonra saldırgana +1 ATK verir (yaşıyorsa)", async () => {
    const p = [makePet({ ability: AB.ATK_BUFF, atk: 5, curHp: 20 })];
    const e = [makePet({ atk: 1, curHp: 10 })];

    const atkBefore = p[0].atk;
    await runBattleTurnPhase(baseArgs(p, e));

    expect(p[0].atk).toBe(atkBefore + 1);
  });

  test("ATK_BUFF ölürse tetiklenmez", async () => {
    // Düşman fazla hasar verecek → p öler
    const p = [makePet({ ability: AB.ATK_BUFF, atk: 1, curHp: 2 })];
    const e = [makePet({ atk: 50, curHp: 10 })];

    const atkBefore = p[0].atk;
    await runBattleTurnPhase(baseArgs(p, e));

    // Öldü, ATK_BUFF tetiklenmemeli
    expect(p[0].atk).toBe(atkBefore);
  });
});

// ─── KILL_BUFF ────────────────────────────────────────────────────────────────
describe("runBattleTurnPhase — KILL_BUFF", () => {
  test("düşmanı öldürünce +3/+3 buff alır", async () => {
    const p = [makePet({ ability: AB.KILL_BUFF, atk: 20, curHp: 10 })];
    const e = [makePet({ atk: 1, curHp: 3 })]; // öldürecek

    const atkBefore = p[0].atk;
    const hpBefore  = p[0].curHp;
    await runBattleTurnPhase(baseArgs(p, e));

    expect(p[0].atk).toBe(atkBefore + 3);
    expect(p[0].curHp).toBe(hpBefore - 1 + 3); // hasar aldı + buff
  });
});

// ─── HURT_REFLECT ─────────────────────────────────────────────────────────────
describe("runBattleTurnPhase — HURT_REFLECT", () => {
  test("hasar alınca yüzde oranında geri yansıtır (lvl 1 = %33)", async () => {
    const p = [makePet({ ability: AB.HURT_REFLECT, atk: 1, curHp: 20 })];
    const e = [makePet({ atk: 9, curHp: 20 })]; // 9 hasar verir → %33 = 3 yansır

    const eHpBefore = e[0].curHp;
    await runBattleTurnPhase(baseArgs(p, e));

    const normalDmg = 1; // p'nin atk'ı
    const reflectDmg = Math.max(1, Math.floor(9 * 0.33)); // 2
    expect(e[0].curHp).toBe(eHpBefore - normalDmg - reflectDmg);
  });
});

// ─── HURT_TEAM_BUFF ──────────────────────────────────────────────────────────
describe("runBattleTurnPhase — HURT_TEAM_BUFF", () => {
  test("hasar alınca tüm takıma +3/+3 buff verir", async () => {
    const teammate = makePet({ atk: 2, curHp: 5 });
    const p = [
      makePet({ ability: AB.HURT_TEAM_BUFF, atk: 2, curHp: 20 }),
      teammate,
    ];
    const e = [makePet({ atk: 5, curHp: 20 })];

    await runBattleTurnPhase(baseArgs(p, e));

    expect(p[0].atk).toBe(2 + 3);
    expect(p[0].curHp).toBeGreaterThanOrEqual(20 - 5 + 3);
  });
});

// ─── DEVOUR ───────────────────────────────────────────────────────────────────
describe("runBattleTurnPhase — DEVOUR", () => {
  test("düşmanı öldürünce stat yutulur", async () => {
    const p = [makePet({ ability: AB.DEVOUR, atk: 20, curHp: 20 })];
    const e = [makePet({ atk: 1, hp: 6, curHp: 3 })]; // öldürülecek

    const atkBefore = p[0].atk;
    await runBattleTurnPhase(baseArgs(p, e));

    // %40 (30 + 10*1) stat yutulur
    const pct = (30 + 10 * 1) / 100;
    const expectedAtkGain = Math.floor(e[0].atk * pct);
    expect(p[0].atk).toBeGreaterThan(atkBefore);
    expect(p[0].atk).toBe(atkBefore + expectedAtkGain);
  });
});

// ─── Trample (çiğneme) ────────────────────────────────────────────────────────
describe("runBattleTurnPhase — Trample", () => {
  test("ön düşmanı öldürünce fazla hasar arkaya geçer", async () => {
    const p = [makePet({ ability: AB.START_TRAMPLE, atk: 15, curHp: 20, trample: true })];
    const e = [
      makePet({ atk: 1, curHp: 5  }), // 15 hasar → ölür, 10 fazla
      makePet({ atk: 1, curHp: 20 }), // arkadaki → 10 hasar alır
    ];

    await runBattleTurnPhase(baseArgs(p, e));

    expect(e[1].curHp).toBe(10); // 20 - 10 = 10
  });
});
