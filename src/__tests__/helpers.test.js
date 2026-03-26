import {
  safeNumber,
  safeClamp,
  getRank,
  calcArenaXP,
  getStatFontSize,
} from "../utils/helpers";

// ─── safeNumber ──────────────────────────────────────────────────────────────
describe("safeNumber", () => {
  test("normal sayıyı olduğu gibi döner", () => {
    expect(safeNumber(42)).toBe(42);
    expect(safeNumber(0)).toBe(0);
    expect(safeNumber(-5)).toBe(-5);
  });

  test("undefined → defaultValue döner", () => {
    expect(safeNumber(undefined)).toBe(0);
    expect(safeNumber(undefined, 10)).toBe(10);
  });

  test("null → defaultValue döner", () => {
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(null, 99)).toBe(99);
  });

  test("NaN → defaultValue döner", () => {
    expect(safeNumber(NaN)).toBe(0);
    expect(safeNumber(NaN, 5)).toBe(5);
  });

  test("string sayı — JS'in implicit dönüşümüne bırakılır", () => {
    // safeNumber sadece undefined/null/NaN kontrol eder
    expect(safeNumber("42")).toBe("42");
  });
});

// ─── safeClamp ───────────────────────────────────────────────────────────────
describe("safeClamp", () => {
  test("min–max aralığındaki değeri olduğu gibi döner", () => {
    expect(safeClamp(50, 0, 100)).toBe(50);
    expect(safeClamp(0, 0, 100)).toBe(0);
    expect(safeClamp(100, 0, 100)).toBe(100);
  });

  test("min'in altındakini min'e çeker", () => {
    expect(safeClamp(-10, 0, 100)).toBe(0);
    expect(safeClamp(-1, 0, 100)).toBe(0);
  });

  test("max'ın üstündekini max'e çeker", () => {
    expect(safeClamp(150, 0, 100)).toBe(100);
    expect(safeClamp(101, 0, 100)).toBe(100);
  });

  test("default range 0–100", () => {
    expect(safeClamp(50)).toBe(50);
    expect(safeClamp(-5)).toBe(0);
    expect(safeClamp(200)).toBe(100);
  });

  test("undefined girişi → 0 döner (safeNumber üzerinden)", () => {
    expect(safeClamp(undefined, 0, 100)).toBe(0);
  });
});

// ─── getRank ─────────────────────────────────────────────────────────────────
describe("getRank", () => {
  test("0 XP → Çaylak", () => {
    expect(getRank(0).name).toBe("Çaylak");
  });

  test("199 XP → hâlâ Çaylak (sınır dahil değil)", () => {
    expect(getRank(199).name).toBe("Çaylak");
  });

  test("200 XP → Bronz (sınırın tam kendisi)", () => {
    expect(getRank(200).name).toBe("Bronz");
  });

  test("1000 XP → Altın", () => {
    expect(getRank(1000).name).toBe("Altın");
  });

  test("10000 XP → Efsane", () => {
    expect(getRank(10000).name).toBe("Efsane");
  });

  test("çok yüksek XP → Efsane (Infinity max)", () => {
    expect(getRank(999999).name).toBe("Efsane");
  });

  test("her rank'ın gerekli alanları var (name, icon, color)", () => {
    [0, 200, 500, 1000, 2000, 4000, 7000, 10000].forEach((xp) => {
      const rank = getRank(xp);
      expect(rank).toHaveProperty("name");
      expect(rank).toHaveProperty("icon");
      expect(rank).toHaveProperty("color");
    });
  });
});

// ─── calcArenaXP ─────────────────────────────────────────────────────────────
describe("calcArenaXP", () => {
  test("kazanış: +2 katılım +5 zafer = 7 XP", () => {
    expect(calcArenaXP({ won: true, turn: 1, isNewBestTurn: false })).toBe(7);
  });

  test("yenilgi: +2 katılım -2 yenilgi = 0 XP (negatife düşmez)", () => {
    expect(calcArenaXP({ won: false, turn: 1, isNewBestTurn: false })).toBe(0);
  });

  test("kazanış + rekor: 7 + 50 = 57 XP", () => {
    expect(calcArenaXP({ won: true, turn: 5, isNewBestTurn: true })).toBe(57);
  });

  test("yenilgi + rekor: 0 + 50 = 50 XP", () => {
    expect(calcArenaXP({ won: false, turn: 3, isNewBestTurn: true })).toBe(50);
  });

  test("sonuç hiçbir zaman negatif olmaz", () => {
    const result = calcArenaXP({ won: false, turn: 1, isNewBestTurn: false });
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

// ─── getStatFontSize ─────────────────────────────────────────────────────────
describe("getStatFontSize", () => {
  describe("compact mod (isCompact = true)", () => {
    test("1 haneli sayı → 18px", () => {
      expect(getStatFontSize(5, true)).toBe("18px");
    });

    test("2 haneli sayı → 15px", () => {
      expect(getStatFontSize(42, true)).toBe("15px");
    });

    test("3+ haneli sayı → 13px", () => {
      expect(getStatFontSize(100, true)).toBe("13px");
      expect(getStatFontSize(500, true)).toBe("13px");
    });
  });

  describe("normal mod (isCompact = false)", () => {
    test("1 haneli sayı → 22px", () => {
      expect(getStatFontSize(5, false)).toBe("22px");
    });

    test("2 haneli sayı → 18px", () => {
      expect(getStatFontSize(42, false)).toBe("18px");
    });

    test("3+ haneli sayı → 15px", () => {
      expect(getStatFontSize(100, false)).toBe("15px");
      expect(getStatFontSize(500, false)).toBe("15px");
    });
  });
});
