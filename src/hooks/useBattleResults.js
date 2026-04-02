/**
 * useBattleResults
 *
 * useBattle içinden ayrıştırılan üç sorumluluk:
 *  1. Koleksiyon istatistiklerini güncelleme (loadCollection / saveCollection)
 *  2. Görev ilerlemesini güncelleme (loadTasks / saveTasks)
 *  3. Arena sonu leaderboard çağrısı (handleArenaGameOver)
 *
 * useBattle bu hook'u çağırır; ayrı test edilebilir ve değiştirilebilir hale gelir.
 */

import { useCallback } from "react";
import {
  loadCollection,
  saveCollection,
  getDefaultAnimalData,
  loadTasks,
  saveTasks,
} from "../utils/helpers";
import { WIN_TURN } from "../data/gameData";

export function useBattleResults({
  user,
  gameMode,
  turn,
  lives,
  wins,
  unlockAchievement,
  updateLeaderboard,
  saveTasksToDB,
  setArenaResult,
  setLives,
  setOver,
  versusRoom,
}) {
  // ─── Koleksiyon istatistiklerini güncelle ──────────────────────────────────
  const updateCollectionStats = useCallback(
    (updatedTeam, won) => {
      if (gameMode !== "arena") return;

      const col = loadCollection(user?.uid);
      updatedTeam.forEach((pet) => {
        if (!pet) return;
        const key  = pet.nick;
        const data = col[key] || getDefaultAnimalData();
        data.used += 1;
        if (won) data.wins += 1;
        if (pet.lvl > data.maxLvl) data.maxLvl = pet.lvl;
        if (pet.lvl === 3) data.unlocked = true;
        // Hayvan başarım kontrolleri
        if (data.used >= 3)    data.task1 = true;
        if (data.wins >= 5)    data.task2 = true;
        if (data.unlocked)     data.task3 = true;
        col[key] = data;
      });
      saveCollection(col, user?.uid);

      // Firebase global istatistik (fire-and-forget)
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

      // Koleksiyon başarımları
      const toId = (nick) =>
        nick
          .toLowerCase()
          .replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u")
          .replace(/ö/g, "o").replace(/ı/g, "i").replace(/ç/g, "c")
          .replace(/\s+/g, "_");

      updatedTeam.forEach((pet) => {
        if (!pet) return;
        const c  = col[pet.nick];
        if (!c)  return;
        const id = toId(pet.nick);
        if (c.wins >= 1)                  unlockAchievement(`use_${id}`);
        if (c.maxLvl >= 2 && c.wins >= 1) unlockAchievement(`lvl2_${id}`);
        if (c.maxLvl >= 3)                unlockAchievement(`lvl3_${id}`);
      });
    },
    [gameMode, user, unlockAchievement]
  );

  // ─── Görev ilerlemesini güncelle ───────────────────────────────────────────
  const updateTaskProgress = useCallback(
    (updatedTeam, won) => {
      const taskData = loadTasks(user?.uid);
      if (!taskData) return;

      const updateTask = (tasks) =>
        tasks.map((t) => {
          if (t.done) return t;
          let progress = t.progress;
          if (t.type === "battles")                                            progress += 1;
          if (t.type === "wins"      && won)                                   progress += 1;
          if (t.type === "arena_wins"&& won && gameMode === "arena")           progress += 1;
          if (t.type === "tier1_wins"&& won && updatedTeam.some((p) => p?.tier === 1)) progress += 1;
          if (t.type === "lvl2"      && updatedTeam.some((p) => p?.lvl >= 2)) progress = Math.max(progress, 1);
          if (t.type === "comeback"  && won && lives === 1)                    progress += 1;
          if (t.type === "unique_animals") {
            const used = new Set(updatedTeam.filter(Boolean).map((p) => p.nick));
            progress = Math.max(progress, used.size);
          }
          if (t.type === "reach_turn10" && turn >= 10 && gameMode === "arena") progress = 1;
          const done = progress >= t.target;
          return { ...t, progress: Math.min(progress, t.target), done };
        });

      taskData.daily.tasks   = updateTask(taskData.daily.tasks);
      taskData.weekly.tasks  = updateTask(taskData.weekly.tasks);
      saveTasks(taskData, user?.uid);
      if (saveTasksToDB) saveTasksToDB(taskData);
    },
    [user, gameMode, turn, lives, saveTasksToDB]
  );

  // ─── Arena oyun sonu leaderboard ──────────────────────────────────────────
  const handleArenaGameOver = useCallback(
    (finalWins, finalTurn) => {
      const freshTaskData = loadTasks(user?.uid);
      const pendingTaskXP = freshTaskData
        ? [
            ...(freshTaskData.daily?.tasks  || []),
            ...(freshTaskData.weekly?.tasks || []),
          ]
            .filter((t) => t.done && !t.xpClaimed)
            .reduce((s, t) => s + t.reward, 0)
        : 0;

      if (freshTaskData) {
        freshTaskData.daily.tasks  = freshTaskData.daily.tasks.map((t)  => (t.done ? { ...t, xpClaimed: true } : t));
        freshTaskData.weekly.tasks = freshTaskData.weekly.tasks.map((t) => (t.done ? { ...t, xpClaimed: true } : t));
        saveTasks(freshTaskData, user?.uid);
        if (saveTasksToDB) saveTasksToDB(freshTaskData);
      }

      updateLeaderboard({
        won: finalWins > 0,
        totalWins: finalWins,
        totalTurns: finalTurn,
        taskXP: pendingTaskXP,
      }).then((result) => {
        const isNewRecord  = result?.isNewRecord || false;
        const losses       = finalTurn - finalWins;
        const xpBreakdown  = [
          { label: `${finalTurn} Tur × 2 XP`,           xp: finalTurn * 2 },
          { label: `${finalWins} Zafer × 5 XP`,         xp: finalWins * 5 },
          { label: `${losses} Yenilgi × -2 XP`,         xp: -(losses * 2) },
          ...(isNewRecord ? [{ label: "🏆 Yeni Rekor Bonusu", xp: 50 }] : []),
        ];
        const earnedXP = xpBreakdown.reduce((s, x) => s + x.xp, 0);
        setArenaResult({
          reachedTurn: finalTurn,
          totalWins: finalWins,
          totalLosses: losses,
          earnedXP,
          isNewRecord,
          xpBreakdown,
        });
      });
    },
    [user, updateLeaderboard, saveTasksToDB, setArenaResult]
  );

  // ─── setOver yardımcısı (versus + arena ortak) ────────────────────────────
  // useBattle içindeki tekrar eden "newLives <= 0" bloklarını birleştirir
  const handleGameOver = useCallback(
    async (newLives, currentWins, currentTurn) => {
      if (newLives > 0) return false; // oyun bitmedi

      if (gameMode === "arena") {
        handleArenaGameOver(currentWins, currentTurn);
        return true;
      }

      if (gameMode === "versus" && versusRoom) {
        const { code, role } = versusRoom;
        const { updateDoc, doc } = await import("firebase/firestore");
        const { db }             = await import("../firebase");
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
