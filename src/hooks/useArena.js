import {
  collection,
  setDoc,
  doc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { logError } from "../utils/helpers";

export function useArena({ user, turn }) {

  const saveArenaTeam = async (currentTeam, difficulty) => {
    if (!user) return;
    try {
      const teamData = currentTeam
        .filter((p) => p)
        .map((p) => ({
          name: p.name,
          nick: p.nick,
          atk: p.atk,
          hp: p.hp,
          curHp: p.hp,
          ability: p.ability || "none",
          tier: p.tier,
          lvl: p.lvl || 1,
          exp: p.exp || 0,
          id: Math.random(),
          isBossUnit: false,
        }));

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
      const finalPool = others.length > 0 ? others : teams;

      return finalPool[Math.floor(Math.random() * finalPool.length)];
    } catch (err) {
      logError(err, "Arena Fetch");
      return null;
    }
  };

  return { saveArenaTeam, fetchArenaOpponent };
}
