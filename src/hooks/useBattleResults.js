import { useCallback, useRef, useEffect } from "react";
import {
  loadCollection,
  saveCollection,
  getDefaultAnimalData,
  loadTasks,
  saveTasks,
} from "../utils/helpers";

export function useBattleResults({
  user,
  gameMode,
  turn,
  lives,
  wins,
  unlockAchievement,
  updateLeaderboard,
  setArenaResult,
  setLives,
  setOver,
  versusRoom,
}) {
  // ─── Ref'ler: closure stale sorununu önler ───────────────────────────────
  const gameModeRef     = useRef(gameMode);
  const turnRef         = useRef(turn);
  const livesRef        = useRef(lives);
  const userRef         = useRef(user);

  useEffect(() => { gameModeRef.current    = gameMode;     }, [gameMode]);
  useEffect(() => { turnRef.current        = turn;         }, [turn]);
  useEffect(() => { livesRef.current       = lives;        }, [lives]);
  useEffect(() => { userRef.current        = user;         }, [user]);
  const updateCollectionStats = useCallback(
    (updatedTeam, won) => {
      if (gameMode !== "arena") return;

      const col = loadCollection(user?.uid);
      updatedTeam.forEach((pet) => {
        if (!pet) return;
        const key = pet.nick;
        const data = col[key] || getDefaultAnimalData();
        data.used += 1;
        if (won) data.wins += 1;
        if (pet.lvl > data.maxLvl) data.maxLvl = pet.lvl;
        if (pet.lvl === 3) data.unlocked = true;
        if (data.used >= 3) data.task1 = true;
        if (data.wins >= 5) data.task2 = true;
        if (data.unlocked) data.task3 = true;
        col[key] = data;
      });
      saveCollection(col, user?.uid);

      if (user?.uid) {
        import("../firebase").then(({ db }) => {
          import("firebase/firestore").then(({ doc, setDoc, increment }) => {
            updatedTeam.forEach(async (pet) => {
              if (!pet) return;
              const ref = doc(db, "animal_stats", pet.nick);
              await setDoc(ref, { used: increment(1), wins: increment(won ? 1 : 0) }, { merge: true });
            });
          });
        });
      }

      const toId = (nick) =>
        nick
          .toLowerCase()
          .replace(/\u015F/g, "s").replace(/\u011F/g, "g").replace(/\u00FC/g, "u")
          .replace(/\u00F6/g, "o").replace(/\u0131/g, "i").replace(/\u00E7/g, "c")
          .replace(/\s+/g, "_");

      updatedTeam.forEach((pet) => {
        if (!pet) return;
        const c = col[pet.nick];
        if (!c) return;
        const id = toId(pet.nick);
        if (c.wins >= 1) unlockAchievement(`use_${id}`);
        if (c.maxLvl >= 2 && c.wins >= 1) unlockAchievement(`lvl2_${id}`);
        if (c.maxLvl >= 3) unlockAchievement(`lvl3_${id}`);
      });
    },
    [gameMode, user, unlockAchievement]
  );

  // updateTaskProgress: tüm değerleri ref'ten okur → stale closure yok
  const updateTaskProgress = useCallback(
    (updatedTeam, won) => {
      const uid      = userRef.current?.uid;
      const mode     = gameModeRef.current;
      const curTurn  = turnRef.current;
      const curLives = livesRef.current;

      const taskData = loadTasks(uid);
      if (!taskData) return;

      const updateTask = (tasks) =>
        tasks.map((t) => {
          if (t.done) return t;
          let progress = t.progress;
          if (t.type === "battles" && mode === "arena") progress += 1;
          if (t.type === "wins" && won && mode === "arena") progress += 1;
          if (t.type === "arena_wins" && won && mode === "arena") progress += 1;
          if (t.type === "tier1_wins" && won && updatedTeam.some((p) => p?.tier === 1)) progress += 1;
          if (t.type === "lvl2" && updatedTeam.some((p) => p?.lvl >= 2)) progress = Math.max(progress, 1);
          if (t.type === "comeback" && won && curLives === 1) progress += 1;
          if (t.type === "unique_animals") {
            const used = new Set(updatedTeam.filter(Boolean).map((p) => p.nick));
            progress = Math.max(progress, used.size);
          }
          if (t.type === "reach_turn10" && curTurn >= 10 && mode === "arena") progress = 1;
          const done = progress >= t.target;
          return { ...t, progress: Math.min(progress, t.target), done };
        });

      taskData.daily.tasks  = updateTask(taskData.daily.tasks);
      taskData.weekly.tasks = updateTask(taskData.weekly.tasks);
      saveTasks(taskData, uid);
      // Görevler sadece localStorage — DB çağrısı yok
    },
    [] // Tüm değerler ref üzerinden okunuyor — dependency yok
  );

  const handleArenaGameOver = useCallback(
    (finalWins, finalTurn, arenaStats = {}) => {
      const freshTaskData = loadTasks(user?.uid);
      const pendingTaskXP = freshTaskData
        ? [
            ...(freshTaskData.daily?.tasks || []),
            ...(freshTaskData.weekly?.tasks || []),
          ]
            .filter((t) => t.done && !t.xpClaimed)
            .reduce((s, t) => s + t.reward, 0)
        : 0;

      if (freshTaskData) {
        freshTaskData.daily.tasks = freshTaskData.daily.tasks.map((t) =>
          t.done ? { ...t, xpClaimed: true } : t
        );
        freshTaskData.weekly.tasks = freshTaskData.weekly.tasks.map((t) =>
          t.done ? { ...t, xpClaimed: true } : t
        );
        saveTasks(freshTaskData, user?.uid);
        // Görevler sadece localStorage — DB çağrısı yok
      }

      const totalWins = Number.isFinite(arenaStats.wins) ? arenaStats.wins : finalWins;
      const totalLosses = Number.isFinite(arenaStats.losses)
        ? arenaStats.losses
        : Math.max(0, finalTurn - finalWins);
      const totalDraws = Number.isFinite(arenaStats.draws)
        ? arenaStats.draws
        : Math.max(0, finalTurn - totalWins - totalLosses);

      updateLeaderboard({
        won: totalWins > 0,
        totalWins,
        totalLosses,
        totalDraws,
        totalTurns: finalTurn,
        taskXP: pendingTaskXP,
      }).then((result) => {
        const isNewRecord = result?.isNewRecord || false;

        // ─── FIX: Görev XP'si breakdown'a ve earnedXP hesabına dahil edildi ───
        // Önce task XP hariç breakdown oluştur
        const xpBreakdown = [
          { label: `${finalTurn} Tur x 2 XP`, xp: finalTurn * 2 },
          { label: `${totalWins} Zafer x 5 XP`, xp: totalWins * 5 },
          { label: `${totalLosses} Yenilgi x -2 XP`, xp: -(totalLosses * 2) },
          { label: `${totalDraws} Beraberlik x 1 XP`, xp: totalDraws * 1 },
          ...(isNewRecord ? [{ label: "Yeni Rekor Bonusu", xp: 50 }] : []),
          // Görev XP'si sadece sıfırdan büyükse göster — kullanıcı ne kazandığını net görsün
          ...(pendingTaskXP > 0 ? [{ label: "Görev Ödülleri", xp: pendingTaskXP }] : []),
        ];

        // earnedXP artık breakdown'daki tüm kalemleri topluyor (görev XP dahil)
        const earnedXP = xpBreakdown.reduce((s, x) => s + x.xp, 0);

        setArenaResult({
          reachedTurn: finalTurn,
          totalWins,
          totalLosses,
          totalDraws,
          earnedXP,
          isNewRecord,
          xpBreakdown,
        });
      });
    },
    [user, updateLeaderboard, setArenaResult]
  );

  const handleGameOver = useCallback(
    async (newLives, currentWins, currentTurn, arenaStats) => {
      if (newLives > 0) return false;

      if (gameMode === "arena") {
        handleArenaGameOver(currentWins, currentTurn, arenaStats);
        return true;
      }

      if (gameMode === "versus" && versusRoom) {
        const { code, role } = versusRoom;
        const { updateDoc, doc } = await import("firebase/firestore");
        const { db } = await import("../firebase");
        updateDoc(doc(db, "versus_rooms", code), { loser: role }).catch(console.error);
        return true;
      }

      setOver(true);
      return true;
    },
    [gameMode, versusRoom, handleArenaGameOver, setOver]
  );

  return {
    updateCollectionStats,
    updateTaskProgress,
    handleArenaGameOver,
    handleGameOver,
  };
}
