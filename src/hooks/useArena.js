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
import { logError } from "../utils/helpers";
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
      const allAnimals = Object.values(TIERS).flat();
      const teamData = currentTeam
        .filter((p) => p)
        .map((p) => {
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
    } catch (err) {
      logError(err, "Arena Save");
    }
  };

  // DÜZELTME: targetDifficulty parametresi alınıyor ama hiç kullanılmıyordu (dead code).
  // Rakip havuzu zaten tur numarasına göre filtreleniyor; zorluk filtresi
  // havuzu gereksiz yere daraltacağından kaldırıldı.
  // DÜZELTME: `const finalPool = others` satırı da kaldırıldı — others'ın
  // birebir kopyasıydı, hiçbir fark yaratmıyordu.
  const fetchArenaOpponent = async () => {
    try {
      const q = query(
        collection(db, "arena_teams"),
        where("turn", "==", turn),
        limit(30)
      );
      const snapshot = await getDocs(q);
      const teams = snapshot.docs.map((d) => d.data());

      if (teams.length === 0) return null;

      const others = teams.filter((t) => t.uid !== user?.uid);
      if (others.length === 0) return null;

      const chosen = others[Math.floor(Math.random() * others.length)];
      const allAnimals = Object.values(TIERS).flat();
      chosen.team = chosen.team.map((p) => {
        const animalData = allAnimals.find((a) => a.name === p.name);
        return {
          ...p,
          flip: p.flip !== undefined ? p.flip : (animalData?.flip || false),
        };
      });
      return chosen;
    } catch (err) {
      logError(err, "Arena Fetch");
      return null;
    }
  };

  const updateLeaderboard = async ({
    won,
    totalWins = 0,
    totalLosses = 0,
    totalDraws = 0,
    totalTurns = 0,
    taskXP = 0,
  }) => {
    if (!user) return;
    try {
      const monthKey = getMonthKey();
      const ref = doc(db, `arena_leaderboard_${monthKey}`, user.uid);
      const snap = await getDoc(ref);
      const prev = snap.exists()
        ? snap.data()
        : { xp: 0, bestTurn: 0, totalWins: 0, totalGames: 0 };

      const isNewBestTurn = turn > (prev.bestTurn || 0);
      const earnedXP =
        Math.max(0, totalTurns * 2 + totalWins * 5 - totalLosses * 2 + totalDraws * 1) +
        (isNewBestTurn ? 50 : 0) +
        taskXP;

      await setDoc(ref, {
        uid: user.uid,
        userName: user.displayName || user.email.split("@")[0],
        xp: (prev.xp || 0) + earnedXP,
        bestTurn: Math.max(prev.bestTurn || 0, turn),
        totalWins: (prev.totalWins || 0) + totalWins,
        totalGames: (prev.totalGames || 0) + 1,
        totalTurns: (prev.totalTurns || 0) + totalTurns,
        totalLosses: (prev.totalLosses || 0) + totalLosses,
        totalDraws: (prev.totalDraws || 0) + totalDraws,
        monthlyWins: (prev.monthlyWins || 0) + (won ? 1 : 0),
        lastPlayed: serverTimestamp(),
        month: getMonthKey(),
      });

      // Kalıcı profil güncelle
      const profileRef = doc(db, "user_profiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      const prevProfile = profileSnap.exists()
        ? profileSnap.data()
        : { allTimeBestTurn: 0 };
      await setDoc(
        profileRef,
        {
          uid: user.uid,
          userName: user.displayName || user.email.split("@")[0],
          allTimeBestTurn: Math.max(prevProfile.allTimeBestTurn || 0, turn),
          lastPlayed: serverTimestamp(),
        },
        { merge: true }
      );

      return { earnedXP, isNewRecord: isNewBestTurn };
    } catch (err) {
      logError(err, "Leaderboard Update");
    }
  };

  return { saveArenaTeam, fetchArenaOpponent, updateLeaderboard };
}
