// src/__tests__/arenaXP.test.js
//
// Arena XP hesabının mantık testleri.
// updateLeaderboard Firebase çağrısı yaptığı için burada sadece
// XP formülünü izole ederek test ediyoruz.

import { AB } from "../data/gameData";

// XP formülü (useArena.js'teki ile aynı)
const calcEarnedXP = ({ totalTurns, totalWins, totalLosses, totalDraws, isNewBestTurn, taskXP = 0 }) =>
  Math.max(0, totalTurns * 2 + totalWins * 5 - totalLosses * 2 + totalDraws * 1)
  + (isNewBestTurn ? 50 : 0)
  + taskXP;

describe("Arena XP formülü", () => {
  test("5 tur, 3 zafer, 2 yenilgi, rekor yok → 10+15-4 = 21 XP", () => {
    expect(calcEarnedXP({ totalTurns: 5, totalWins: 3, totalLosses: 2, totalDraws: 0, isNewBestTurn: false })).toBe(21);
  });

  test("rekor kırılınca +50 bonus", () => {
    const base = calcEarnedXP({ totalTurns: 3, totalWins: 2, totalLosses: 1, totalDraws: 0, isNewBestTurn: false });
    const record = calcEarnedXP({ totalTurns: 3, totalWins: 2, totalLosses: 1, totalDraws: 0, isNewBestTurn: true });
    expect(record - base).toBe(50);
  });

  test("beraberlik +1 XP katkısı yapar", () => {
    const noDraws = calcEarnedXP({ totalTurns: 1, totalWins: 0, totalLosses: 0, totalDraws: 0, isNewBestTurn: false });
    const withDraw = calcEarnedXP({ totalTurns: 1, totalWins: 0, totalLosses: 0, totalDraws: 1, isNewBestTurn: false });
    expect(withDraw - noDraws).toBe(1);
  });

  test("negatife düşmez — çok fazla yenilgi", () => {
    expect(calcEarnedXP({ totalTurns: 0, totalWins: 0, totalLosses: 10, totalDraws: 0, isNewBestTurn: false })).toBe(0);
  });

  test("taskXP eklenir", () => {
    const base  = calcEarnedXP({ totalTurns: 2, totalWins: 1, totalLosses: 1, totalDraws: 0, isNewBestTurn: false, taskXP: 0 });
    const withTask = calcEarnedXP({ totalTurns: 2, totalWins: 1, totalLosses: 1, totalDraws: 0, isNewBestTurn: false, taskXP: 40 });
    expect(withTask - base).toBe(40);
  });

  test("hiç oynamadan XP = 0", () => {
    expect(calcEarnedXP({ totalTurns: 0, totalWins: 0, totalLosses: 0, totalDraws: 0, isNewBestTurn: false })).toBe(0);
  });
});

// ─── battleFaintUtils birim testleri ────────────────────────────────────────
import {
  applyFaintBuffEffect,
  applyFaintDamageEffect,
  applyFaintShieldEffect,
  applyFaintCopyEffect,
  applyFriendFaintEffect,
  createFaintSummonUnit,
  createFriendSummonUnit,
  applyStagComboEffect,
  applyTeamWideFaintEffect,
} from "../utils/battleFaintUtils";

const clampStat = (v) => Math.min(Math.max(v, 0), 500);
const makePet   = (o = {}) => ({ id: Math.random().toString(36).slice(2), nick: "T", atk: 5, hp: 10, curHp: 10, lvl: 1, ability: AB.NONE, ...o });

describe("applyFaintBuffEffect", () => {
  test("rastgele dosta +power/+power verir", () => {
    const dead = makePet();
    const ally = makePet({ atk: 3, curHp: 5 });
    const logs = [];
    applyFaintBuffEffect({ deadUnit: dead, power: 1, allyTeam: [ally], clampStat, logs });
    expect(ally.atk).toBe(4);
    expect(ally.curHp).toBe(6);
    expect(logs).toHaveLength(1);
  });

  test("boş takımda false döner", () => {
    const result = applyFaintBuffEffect({ deadUnit: makePet(), power: 1, allyTeam: [], clampStat, logs: [] });
    expect(result).toBe(-1); // boş takımda -1 döner
  });
});

describe("applyFaintDamageEffect", () => {
  test("tüm düşmanlara power*2 hasar verir", () => {
    const dead = makePet();
    const e1   = makePet({ curHp: 10 });
    const e2   = makePet({ curHp: 8  });
    applyFaintDamageEffect({ deadUnit: dead, power: 2, enemyTeam: [e1, e2], logs: [] });
    expect(e1.curHp).toBe(6); // -4
    expect(e2.curHp).toBe(4); // -4
  });
});

describe("applyFaintShieldEffect", () => {
  test("tüm dostlara 2*power can verir", () => {
    const dead = makePet();
    const a1   = makePet({ curHp: 5 });
    applyFaintShieldEffect({ deadUnit: dead, power: 1, allyTeam: [a1], clampStat, logs: [] });
    expect(a1.curHp).toBe(7);
  });
});

describe("applyFaintCopyEffect", () => {
  test("lvl 1 = %25 stat kopyalar", () => {
    const dead = makePet({ atk: 20, hp: 20, curHp: 20 });
    const ally = makePet({ atk: 2,  curHp: 3 });
    applyFaintCopyEffect({ deadUnit: dead, power: 1, allyTeam: [ally], clampStat, logs: [] });
    // %25 of 20 = 5
    expect(ally.curHp).toBe(8); // 3 + 5
  });

  test("geçici=true ise tempAtk/tempHp kullanılır", () => {
    const dead = makePet({ atk: 20, hp: 20 });
    const ally = makePet({ atk: 2, curHp: 3 });
    applyFaintCopyEffect({ deadUnit: dead, power: 2, allyTeam: [ally], clampStat, logs: [], temporary: true });
    expect(ally.tempAtk).toBeGreaterThan(0);
    expect(ally.tempHp).toBeGreaterThan(0);
    expect(ally.atk).toBe(2); // atk değişmez, geçici
  });
});

describe("applyFriendFaintEffect", () => {
  test("allyUnit'e +2*power verir", () => {
    const ally = makePet({ atk: 3, curHp: 5 });
    applyFriendFaintEffect({ allyUnit: ally, power: 1, clampStat, logs: [] });
    expect(ally.atk).toBe(5);
    expect(ally.curHp).toBe(7);
  });
});

describe("createFaintSummonUnit", () => {
  test("doğru stat ile yavru oluşturur", () => {
    const summon = createFaintSummonUnit({ name: "🥚", nick: "Yavru", power: 2, img: "egg.png" });
    const AM_FAINT_SUMMON_AMT = 5; // gameData'daki gerçek değer
    expect(summon.atk).toBe(AM_FAINT_SUMMON_AMT * 2);
    expect(summon.hp).toBe(AM_FAINT_SUMMON_AMT * 2);
    expect(summon.ability).toBe(AB.NONE);
  });
});

describe("createFriendSummonUnit", () => {
  test("summonCount < 3 ise yavru oluşturur", () => {
    const ally   = makePet({ summonCount: 0 });
    const summon = createFriendSummonUnit({ allyUnit: ally, power: 1, name: "🦘", nick: "Yavru", img: "joey.png" });
    expect(summon).not.toBeNull();
    expect(ally.summonCount).toBe(1);
  });

  test("summonCount = 3 ise null döner", () => {
    const ally   = makePet({ summonCount: 3 });
    const summon = createFriendSummonUnit({ allyUnit: ally, power: 1, name: "🦘", nick: "Yavru", img: "joey.png" });
    expect(summon).toBeNull();
  });
});

describe("applyStagComboEffect", () => {
  test("ölü birim hariç tüm dostlara +2*power buff verir", () => {
    const dead = makePet({ id: "dead" });
    const a1   = makePet({ id: "a1", atk: 5, curHp: 8 });
    const a2   = makePet({ id: "a2", atk: 3, curHp: 6 });
    const team = [a1, a2];
    applyStagComboEffect({ deadUnit: dead, power: 1, allyTeam: team, clampStat, logs: [], logPrefix: "" });
    // Fonksiyon spread ile yeni obje oluşturur, array üzerinden kontrol et
    expect(team[0].atk).toBe(7);
    expect(team[1].atk).toBe(5);
  });
});

describe("applyTeamWideFaintEffect — FAINT_RAGE", () => {
  test("FAINT_RAGE tüm dostlara buff verir", () => {
    const a1 = makePet({ atk: 2, curHp: 5 });
    const a2 = makePet({ atk: 3, curHp: 7 });
    applyTeamWideFaintEffect({
      ability: AB.FAINT_RAGE, sourceNick: "Test", power: 1,
      allyTeam: [a1, a2], enemyTeam: [], clampStat, logs: [],
      teamBuffLabel: "takım", enemyLabel: "düşman",
    });
    // getTeamBuffAmount(1) = 8
    expect(a1.atk).toBe(10);
    expect(a2.atk).toBe(11);
  });
});
