import { applyPermanentBuffs, applyEndTurnBuffs } from "../utils/battleUtils";

// gameData'nın TIERS'ını mock'la (genE testleri ayrı dosyada)
// applyPermanentBuffs ve applyEndTurnBuffs için TIERS gerekmez
jest.mock("../data/gameData", () => ({
  AB: {
    START_FIRE:     "start_fire",
    END_HEAL_ONE:   "end_heal_one",
    END_TEAM_BUFF:  "end_team_buff",
    END_ALL:        "end_all",
    END_BUFF_AHEAD: "end_buff_ahead",
    END_SELF_BUFF:  "end_self_buff",
    // Diğer ability'ler — testlerde kullanılmıyor, boş string yeterli
    START_BUFF:          "start_buff",
    START_TEAM_SHIELD:   "start_team_shield",
    START_TRIPLE:        "start_triple",
    START_ALL_PERM:      "start_all_perm",
    START_SNIPE:         "start_snipe",
    START_MULTI_SNIPE:   "start_multi_snipe",
    START_FEAR:          "start_fear",
    START_TRAMPLE:       "start_trample",
    START_CHARGE:        "start_charge",
    START_TANK:          "start_tank",
    START_DMG:           "start_dmg",
    START_POISON:        "start_poison",
    START_FREEZE_ENEMY:  "start_freeze_enemy",
    STAG_COMBO:          "stag_combo",
    WEAKEN_STRONG:       "weaken_strong",
    FRIEND_FAINT:        "friend_faint",
    FRIEND_SUMMON:       "friend_summon",
    FAINT_BUFF:          "faint_buff",
    END_GAIN_GOLD:       "end_gain_gold",
  },
  TIERS: {},
}));

// ─── Test yardımcıları ────────────────────────────────────────────────────────
const makePet = (overrides = {}) => ({
  id:     Math.random(),
  nick:   "TestPet",
  atk:    10,
  hp:     20,
  curHp:  20,
  lvl:    1,
  exp:    0,
  ability: "",
  ...overrides,
});

// ─── applyPermanentBuffs ──────────────────────────────────────────────────────
describe("applyPermanentBuffs", () => {
  test("START_FIRE ability'si olan pet lvl1 → +4 ATK alır", () => {
    const team = [makePet({ ability: "start_fire", atk: 10 })];
    const result = applyPermanentBuffs(team);
    expect(result[0].atk).toBe(14); // 10 + 4*1
  });

  test("START_FIRE lvl2 → +8 ATK alır", () => {
    const team = [makePet({ ability: "start_fire", atk: 10, lvl: 2 })];
    const result = applyPermanentBuffs(team);
    expect(result[0].atk).toBe(18); // 10 + 4*2
  });

  test("START_FIRE lvl3 → +12 ATK alır", () => {
    const team = [makePet({ ability: "start_fire", atk: 10, lvl: 3 })];
    const result = applyPermanentBuffs(team);
    expect(result[0].atk).toBe(22); // 10 + 4*3
  });

  test("START_FIRE olmayan pet değişmez", () => {
    const team = [makePet({ ability: "start_buff", atk: 10 })];
    const result = applyPermanentBuffs(team);
    expect(result[0].atk).toBe(10);
  });

  test("null slotları korur", () => {
    const team = [null, makePet({ ability: "start_fire", atk: 5 }), null];
    const result = applyPermanentBuffs(team);
    expect(result[0]).toBeNull();
    expect(result[2]).toBeNull();
    expect(result[1].atk).toBe(9); // 5 + 4
  });

  test("orijinal diziyi mutate etmez", () => {
    const pet = makePet({ ability: "start_fire", atk: 10 });
    const team = [pet];
    applyPermanentBuffs(team);
    expect(pet.atk).toBe(10); // orijinal değişmemiş olmalı
  });

  test("ATK 500 (MAX_STAT) üzerine çıkmaz", () => {
    const team = [makePet({ ability: "start_fire", atk: 499, lvl: 3 })];
    const result = applyPermanentBuffs(team);
    expect(result[0].atk).toBe(500); // 499 + 12 → clamp → 500
  });

  test("boş takım sorunsuz işlenir", () => {
    expect(() => applyPermanentBuffs([])).not.toThrow();
    expect(applyPermanentBuffs([])).toEqual([]);
  });
});

// ─── applyEndTurnBuffs ────────────────────────────────────────────────────────
describe("applyEndTurnBuffs", () => {

  // END_HEAL_ONE
  describe("END_HEAL_ONE", () => {
    test("rastgele bir müttefike +1 HP verir (lvl1)", () => {
      const healer = makePet({ id: 1, ability: "end_heal_one", hp: 10, curHp: 10 });
      const ally   = makePet({ id: 2, ability: "", hp: 10, curHp: 5 });
      const result = applyEndTurnBuffs([healer, ally]);
      // ally curHp artmış olmalı
      expect(result[1].curHp).toBe(6); // 5 + 1
      expect(result[1].hp).toBe(11);   // max hp de artar
    });

    test("takımda başka pet yoksa bir şey yapmaz", () => {
      const healer = makePet({ id: 1, ability: "end_heal_one", hp: 10, curHp: 10 });
      const result = applyEndTurnBuffs([healer]);
      expect(result[0].hp).toBe(10);
    });
  });

  // END_SELF_BUFF
  describe("END_SELF_BUFF", () => {
    test("lvl1 → kendine +3 ATK ve +3 HP verir", () => {
      const pet = makePet({ ability: "end_self_buff", atk: 10, hp: 10, curHp: 10 });
      const result = applyEndTurnBuffs([pet]);
      expect(result[0].atk).toBe(13);
      expect(result[0].hp).toBe(13);
      expect(result[0].curHp).toBe(13);
    });

    test("lvl2 → +6 ATK ve +6 HP verir", () => {
      const pet = makePet({ ability: "end_self_buff", atk: 10, hp: 10, curHp: 10, lvl: 2 });
      const result = applyEndTurnBuffs([pet]);
      expect(result[0].atk).toBe(16);
      expect(result[0].hp).toBe(16);
    });
  });

  // END_ALL
  describe("END_ALL", () => {
    test("tüm petlere +3 HP/curHp verir (lvl1)", () => {
      const buffer = makePet({ ability: "end_all", hp: 10, curHp: 10 });
      const ally1  = makePet({ hp: 10, curHp: 10 });
      const ally2  = makePet({ hp: 10, curHp: 10 });
      const result = applyEndTurnBuffs([buffer, ally1, ally2]);
      result.forEach((p) => {
        expect(p.hp).toBe(13);
        expect(p.curHp).toBe(13);
      });
    });
  });

  // END_TEAM_BUFF
  describe("END_TEAM_BUFF", () => {
    test("önündeki 2 pete +2 ATK/HP verir (lvl1)", () => {
      // index 2'deki pet (sonuncu) buffer, önündeki indexler 0 ve 1
      const ally1  = makePet({ id: 1, atk: 10, hp: 10, curHp: 10 });
      const ally2  = makePet({ id: 2, atk: 10, hp: 10, curHp: 10 });
      const buffer = makePet({ id: 3, ability: "end_team_buff", atk: 5, hp: 5, curHp: 5 });
      const result = applyEndTurnBuffs([ally1, ally2, buffer]);
      expect(result[0].atk).toBe(12); // +2
      expect(result[1].atk).toBe(12); // +2
      expect(result[2].atk).toBe(5);  // buffer kendini etkilemez
    });

    test("buffer en önde ise kimseyi etkilemez", () => {
      const buffer = makePet({ id: 1, ability: "end_team_buff", atk: 5 });
      const ally   = makePet({ id: 2, atk: 10 });
      const result = applyEndTurnBuffs([buffer, ally]);
      expect(result[0].atk).toBe(5);
      expect(result[1].atk).toBe(10); // değişmez
    });
  });

  // END_BUFF_AHEAD
  describe("END_BUFF_AHEAD", () => {
    test("arkasındaki (daha yüksek index) 3 pete +2 ATK/HP verir (lvl1)", () => {
      const buffer = makePet({ id: 1, ability: "end_buff_ahead", atk: 5 });
      const ally1  = makePet({ id: 2, atk: 10, hp: 10, curHp: 10 });
      const ally2  = makePet({ id: 3, atk: 10, hp: 10, curHp: 10 });
      const result = applyEndTurnBuffs([buffer, ally1, ally2]);
      expect(result[1].atk).toBe(12); // +2
      expect(result[2].atk).toBe(12); // +2
    });
  });

  // Genel
  describe("genel", () => {
    test("orijinal diziyi mutate etmez", () => {
      const pet = makePet({ ability: "end_self_buff", atk: 10, hp: 10, curHp: 10 });
      const team = [pet];
      applyEndTurnBuffs(team);
      expect(pet.atk).toBe(10);
    });

    test("null slotları atlar", () => {
      const pet = makePet({ ability: "end_self_buff", atk: 10, hp: 10, curHp: 10 });
      const team = [null, pet, null];
      expect(() => applyEndTurnBuffs(team)).not.toThrow();
      expect(applyEndTurnBuffs(team)[1].atk).toBe(13);
    });

    test("stat 500 (MAX_STAT) üzerine çıkmaz", () => {
      const pet = makePet({ ability: "end_self_buff", atk: 499, hp: 499, curHp: 499, lvl: 3 });
      const result = applyEndTurnBuffs([pet]);
      expect(result[0].atk).toBe(500);
      expect(result[0].hp).toBe(500);
    });

    test("boş takım sorunsuz işlenir", () => {
      expect(() => applyEndTurnBuffs([])).not.toThrow();
      expect(applyEndTurnBuffs([])).toEqual([]);
    });
  });
});
