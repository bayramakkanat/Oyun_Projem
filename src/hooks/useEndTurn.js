import { useEffect } from "react";
import { spawnBuffAnimation } from "../utils/animations";
import { spawnParticles } from "../utils/animations";

export function useEndTurn({
  phase,
  pendingEndTurnAnims,
  setPendingEndTurnAnims,
  team,
  setTeam,
  pwr,
  clampStat,
  triggerAnim,
}) {
  useEffect(() => {
    if (phase !== "shop" || !pendingEndTurnAnims) return;

    const timer = setTimeout(() => {
      const currentTeam = team;
      currentTeam.forEach((a, i) => {
        if (!a) return;
        const m = pwr(a);

        if (a.ability === "end_heal_one") {
          const allies = currentTeam.filter((t, idx) => t && idx !== i);
          if (allies.length > 0) {
            const randomAlly =
              allies[Math.floor(Math.random() * allies.length)];
            const tIdx = currentTeam.findIndex(
              (t) => t && t.id === randomAlly.id
            );
            if (tIdx !== -1) {
              spawnBuffAnimation(a.id, currentTeam[tIdx].id, m, "heal");
              setTimeout(() => {
                setTeam((prev) => {
                  const nt = [...prev];
                  const idx = nt.findIndex(
                    (t) => t && t.id === currentTeam[tIdx].id
                  );
                  if (idx !== -1) {
                    nt[idx] = {
                      ...nt[idx],
                      hp: clampStat(nt[idx].hp + m),
                      curHp: clampStat(nt[idx].curHp + m),
                    };
                  }
                  return nt;
                });
              }, 700);
            }
          }
        }

        if (a.ability === "end_team_buff") {
          const targets = currentTeam
            .slice(0, i)
            .filter((x) => x)
            .slice(-2);
          targets.forEach((t, tLoopIdx) => {
            const tIdx = currentTeam.findIndex((x) => x && x.id === t.id);
            if (tIdx !== -1) {
              setTimeout(() => {
                spawnBuffAnimation(a.id, currentTeam[tIdx].id, m * 2, "buff");
                setTimeout(() => {
                  setTeam((prev) => {
                    const nt = [...prev];
                    const idx = nt.findIndex(
                      (x) => x && x.id === currentTeam[tIdx].id
                    );
                    if (idx !== -1) {
                      nt[idx] = {
                        ...nt[idx],
                        atk: clampStat(nt[idx].atk + m * 2),
                        hp: clampStat(nt[idx].hp + m * 2),
                        curHp: clampStat(nt[idx].curHp + m * 2),
                      };
                    }
                    return nt;
                  });
                }, 700);
              }, tLoopIdx * 400);
            }
          });
        }

        if (a.ability === "end_all") {
          currentTeam.forEach((t, j) => {
            if (t) {
              setTimeout(() => {
                spawnBuffAnimation(a.id, t.id, m * 3, "heal");
                setTimeout(() => {
                  setTeam((prev) => {
                    const nt = [...prev];
                    const idx = nt.findIndex((x) => x && x.id === t.id);
                    if (idx !== -1) {
                      nt[idx] = {
                        ...nt[idx],
                        hp: clampStat(nt[idx].hp + m * 3),
                        curHp: clampStat(nt[idx].curHp + m * 3),
                      };
                    }
                    return nt;
                  });
                }, 700);
              }, j * 250);
            }
          });
        }

        if (a.ability === "end_buff_ahead") {
          const targets = currentTeam
            .slice(i + 1)
            .filter((x) => x)
            .slice(0, 3);
          targets.forEach((t, tLoopIdx) => {
            const tIdx = currentTeam.findIndex((x) => x && x.id === t.id);
            if (tIdx !== -1) {
              setTimeout(() => {
                spawnBuffAnimation(a.id, currentTeam[tIdx].id, m * 2, "buff");
                setTimeout(() => {
                  setTeam((prev) => {
                    const nt = [...prev];
                    const idx = nt.findIndex(
                      (x) => x && x.id === currentTeam[tIdx].id
                    );
                    if (idx !== -1) {
                      nt[idx] = {
                        ...nt[idx],
                        atk: clampStat(nt[idx].atk + m * 2),
                        hp: clampStat(nt[idx].hp + m * 2),
                        curHp: clampStat(nt[idx].curHp + m * 2),
                      };
                    }
                    return nt;
                  });
                }, 700);
              }, tLoopIdx * 400);
            }
          });
        }

        if (a.ability === "end_self_buff") {
          spawnParticles(a.id, "buff");
          triggerAnim(a.id, "buff");
          setTimeout(() => {
            setTeam((prev) => {
              const nt = [...prev];
              const idx = nt.findIndex((x) => x && x.id === a.id);
              if (idx !== -1) {
                nt[idx] = {
                  ...nt[idx],
                  atk: clampStat(nt[idx].atk + m * 3),
                  hp: clampStat(nt[idx].hp + m * 3),
                  curHp: clampStat(nt[idx].curHp + m * 3),
                };
              }
              return nt;
            });
          }, 700);
        }
      });

      setPendingEndTurnAnims(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [phase, pendingEndTurnAnims]);
}
