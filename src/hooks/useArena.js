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

export function useArena({ user, turn }) {

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
const updateLeaderboard = async ({ won, isNewBestTurn }) => {
  if (!user) return;
  try {
    const ref = doc(db, "arena_leaderboard", user.uid);
    const snap = await getDoc(ref);
    const prev = snap.exists() ? snap.data() : { xp: 0, bestTurn: 0, totalWins: 0 };

    const earnedXP = calcArenaXP({ won, turn, isNewBestTurn });
    const newXP = (prev.xp || 0) + earnedXP;
    const newBestTurn = Math.max(prev.bestTurn || 0, turn);
    const newTotalWins = (prev.totalWins || 0) + (won ? 1 : 0);

    await setDoc(ref, {
      uid: user.uid,
      userName: user.displayName || user.email.split("@")[0],
      xp: newXP,
      bestTurn: newBestTurn,
      totalWins: newTotalWins,
      lastPlayed: serverTimestamp(),
    });

    return earnedXP;
  } catch (err) {
    logError(err, "Leaderboard Update");
  }
};
 return { saveArenaTeam, fetchArenaOpponent, updateLeaderboard };
}
