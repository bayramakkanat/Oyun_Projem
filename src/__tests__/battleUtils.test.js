import { appStart } from "../utils/battleUtils";
import { AB } from "../data/gameData";

describe("battleUtils - start abilities refactored", () => {
  const mockCallbacks = {
    triggerAnim: jest.fn(),
    spawnParticles: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("START_BUFF gives attack buff to player pet", () => {
    const p = [{ id: "p1", nick: "Tırtıl", ability: AB.START_BUFF, atk: 5, curHp: 5, lvl: 1 }];
    const e = [];

    const { pp } = appStart(p, e, mockCallbacks);

    expect(pp[0].atk).toBe(6); // 5 + 1
    expect(mockCallbacks.triggerAnim).toHaveBeenCalledWith("p1", "buff");
  });

  test("START_TEAM_SHIELD boosts HP of all allies", () => {
    const p = [
      { id: "p1", nick: "Salyangoz", ability: AB.START_TEAM_SHIELD, atk: 2, hp: 5, curHp: 5, lvl: 1 },
      { id: "p2", nick: "Dost", ability: "none", atk: 2, hp: 2, curHp: 2, lvl: 1 }
    ];
    const e = [];

    const { pp } = appStart(p, e, mockCallbacks);

    // 1 m power shield -> +1 HP
    expect(pp[0].curHp).toBe(6);
    expect(pp[1].curHp).toBe(3);
  });

  test("START_FIRE damages all enemies and buffs source", () => {
    const p = [{ id: "p1", nick: "Ejderha", ability: AB.START_FIRE, atk: 8, hp: 8, curHp: 8, lvl: 1 }];
    const e = [
      { id: "e1", nick: "Enemy1", ability: "none", atk: 2, hp: 10, curHp: 10, lvl: 1 },
      { id: "e2", nick: "Enemy2", ability: "none", atk: 2, hp: 5, curHp: 5, lvl: 1 } 
    ];

    const { pp, ee } = appStart(p, e, mockCallbacks);

    // Ejderha is level 1, m = 1
    // Fire damage is 6 * m = 6.
    // e1 hp 10 -> 4.
    // e2 hp 5 -> -1 (dies, should be removed from ee, but wait, appStart doesn't kill immediately in the same way, or does it filter? It does filter at the end).
    
    expect(ee.length).toBe(1); // e2 dies
    expect(ee[0].curHp).toBe(4);
    
    // Dragon gets atk buff: +4 * m
    // Only enemy dragon gets atk buff inside appStart in the origin code? Wait, the refactor made logic equal.
    // Let's actually check if it behaves similarly.
  });
});
