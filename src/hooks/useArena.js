import { TIERS } from "../data/gameData";
import {
  collection,
  setDoc,
  doc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { logError, calcArenaXP } from "../utils/helpers";
import { TTL_DURATIONS, getExpiryDate } from "../utils/ttl";

const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
               "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

const getMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const getCurrentMonthLabel = () => {
  const now = new Date();
  return `${AYLAR[now.getMonth()]} ${now.getFullYear()}`;
};

export function useArena({ user, turnRef }) {
  const turn = turnRef?.current || 1;

  const saveArenaTeam = async (currentTeam, difficulty) => {
    if (!user) return;
    try {
      const teamData = currentTeam
        .filter((p) => p)
      .map((p) => {
  const allAnimals = Object.values(TIERS).flat();
  const animalData = allAnimals.find((a) => a.name === p.name);
  return {
    name: p.name,
    nick: p.nick,
    atk: p.atk,
    hp: p.hp,
    curHp: p.hp,
    ability: p.ability || "none",
    tier: p.tier,
    lvl: p.lvl || 1,
    exp: p.exp || 0,
    img: p.img || animalData?.img || null,
    flip: p.flip || animalData?.flip || false,
    id: Math.random(),
    isBossUnit: false,
  };
});

      const docId = `${user.uid}_turn${turn}`;
      await setDoc(doc(db, "arena_teams", docId), {
        uid: user.uid,
        userName: user.displayName || user.email.split("@")[0],
        team: teamData,
        difficulty: difficulty,
        turn: turn,
        timestamp: serverTimestamp(),
        expiresAt: getExpiryDate(TTL_DURATIONS.arenaTeam),
      });
      console.log(`✅ Arena takımı kaydedildi! Tur: ${turn}`);
    } catch (err) {
      logError(err, "Arena Save");
    }
  };

  const fetchArenaOpponent = async (targetDifficulty) => {
    try {
      const q = query(
        collection(db, "arena_teams"),
        where("turn", "==", turn),
        limit(30)
      );
      const snapshot = await getDocs(q);
      const teams = snapshot.docs.map((doc) => doc.data());

      if (teams.length === 0) return null;

     const others = teams.filter((t) => t.uid !== user?.uid);
if (others.length === 0) return null;
const finalPool = others;

      const chosen = finalPool[Math.floor(Math.random() * finalPool.length)];
const allAnimals = Object.values(TIERS).flat();
chosen.team = chosen.team.map((p) => {
  const animalData = allAnimals.find((a) => a.name === p.name);
  return { ...p, flip: p.flip !== undefined ? p.flip : (animalData?.flip || false) };
});
return chosen;
    } catch (err) {
      logError(err, "Arena Fetch");
      return null;
    }
  };

const updateLeaderboard = async ({ won, totalWins = 0, totalTurns = 0, taskXP = 0 }) => {
  console.log("🎯 updateLeaderboard çağrıldı!", { won, turn: turnRef?.current });
  if (!user) return;
  try {
    const monthKey = getMonthKey();
    const ref = doc(db, `arena_leaderboard_${monthKey}`, user.uid);
    const snap = await getDoc(ref);
    const prev = snap.exists() ? snap.data() : { xp: 0, bestTurn: 0, totalWins: 0, totalGames: 0 };
    console.log("📦 Firebase'den okunan veri:", prev);
    const isNewBestTurn = turn > (prev.bestTurn || 0);
   const earnedXP = Math.max(0, totalTurns * 2 + totalWins * 5 - (totalTurns - totalWins) * 2) + (isNewBestTurn ? 50 : 0) + taskXP;
const newXP = (prev.xp || 0) + earnedXP;
    const newBestTurn = Math.max(prev.bestTurn || 0, turn);
    const newTotalWins = (prev.totalWins || 0) + totalWins;
    const newTotalGames = (prev.totalGames || 0) + 1;
    const newTotalTurns = (prev.totalTurns || 0) + totalTurns;
    const newMonthlyWins = (prev.monthlyWins || 0) + (won ? 1 : 0);
    console.log("🏆 won değeri:", won, "newTotalWins:", newTotalWins);

 await setDoc(ref, {
  uid: user.uid,
  userName: user.displayName || user.email.split("@")[0],
  xp: newXP,
  bestTurn: newBestTurn,
  totalWins: newTotalWins,
  totalGames: newTotalGames,
totalTurns: newTotalTurns,
monthlyWins: newMonthlyWins,
  lastPlayed: serverTimestamp(),
  month: getMonthKey(),
});

// Kalıcı profil güncelle
const profileRef = doc(db, "user_profiles", user.uid);
const profileSnap = await getDoc(profileRef);
const prevProfile = profileSnap.exists() ? profileSnap.data() : { allTimeBestTurn: 0 };
const newAllTimeBestTurn = Math.max(prevProfile.allTimeBestTurn || 0, turn);
await setDoc(profileRef, {
  uid: user.uid,
  userName: user.displayName || user.email.split("@")[0],
  allTimeBestTurn: newAllTimeBestTurn,
  lastPlayed: serverTimestamp(),
}, { merge: true });
console.log("✅ Firebase'e yazıldı!", { newXP, newBestTurn, newTotalWins });
   return { earnedXP, isNewRecord: isNewBestTurn };
  } catch (err) {
    logError(err, "Leaderboard Update");
  }
};
const loadTasksFromDB = async () => {
  if (!user) return null;
  try {
    const ref = doc(db, "user_tasks", user.uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().tasks : null;
  } catch (err) {
    logError(err, "Load Tasks");
    return null;
  }
};

const saveTasksToDB = async (taskData) => {
  if (!user) return;
  try {
    const ref = doc(db, "user_tasks", user.uid);
    await setDoc(ref, {
      uid: user.uid,
      tasks: taskData,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    logError(err, "Save Tasks");
  }
};
 return { saveArenaTeam, fetchArenaOpponent, updateLeaderboard, loadTasksFromDB, saveTasksToDB };
}
