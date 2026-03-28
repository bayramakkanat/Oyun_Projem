import { useState, useEffect } from "react";
import { getRank, RANKS, loadStats, loadTasks } from "../utils/helpers";
import { getCurrentMonthLabel } from "../hooks/useArena";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ProfileScreen({ onClose, user, stats }) {
const [xp, setXp] = useState(0);
const [arenaWins, setArenaWins] = useState(0);
const [bestTurn, setBestTurn] = useState(0);
const [totalGames, setTotalGames] = useState(0);
const [totalTurns, setTotalTurns] = useState(0);
const [firebaseAchievements, setFirebaseAchievements] = useState(null);
  const [loading, setLoading] = useState(true);
  const taskData = loadTasks(user?.uid);

  useEffect(() => {
  console.log("useEffect tetiklendi, user:", user?.uid);
   const fetchXP = async () => {
  console.log("fetchXP çalıştı, user:", user?.uid);
  if (!user) { setLoading(false); return; }
  try {
        const monthKey = `${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, "0")}`;
       const ref = doc(db, `arena_leaderboard_${monthKey}`, user.uid);
const snap = await getDoc(ref);
if (snap.exists()) {
  setXp(snap.data().xp || 0);
  setArenaWins(snap.data().totalWins || 0);
  setTotalGames(snap.data().totalGames || 0);
setTotalTurns(snap.data().totalTurns || 0);
}

const profileRef = doc(db, "user_profiles", user.uid);
const profileSnap = await getDoc(profileRef);
console.log("Profile snap:", profileSnap.exists(), profileSnap.data());
if (profileSnap.exists()) {
  setBestTurn(profileSnap.data().allTimeBestTurn || 0);
  if (profileSnap.data().achievements) {
    setFirebaseAchievements(profileSnap.data().achievements);
  }
}
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchXP();
  }, [user]);

  const rank = getRank(xp);
  const nextRank = RANKS.find(r => r.min > rank.min);
  const xpToNext = nextRank ? nextRank.min - xp : 0;
  const xpProgress = nextRank
    ? ((xp - rank.min) / (nextRank.min - rank.min)) * 100
    : 100;

  const dailyDone = taskData?.daily?.tasks?.filter(t => t.done).length || 0;
  const dailyTotal = taskData?.daily?.tasks?.length || 0;
  const weeklyDone = taskData?.weekly?.tasks?.filter(t => t.done).length || 0;
  const weeklyTotal = taskData?.weekly?.tasks?.length || 0;

  const avatar = (user?.displayName || "🐺").split(" ")[0];
  const username = (user?.displayName || user?.email?.split("@")[0] || "Misafir").split(" ").slice(1).join(" ") || user?.email?.split("@")[0];

  return (
    <div className="min-h-screen text-white p-4" style={{
      background: "radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 100%)"
    }}>
      <div className="max-w-lg mx-auto">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-yellow-300">👤 Profil</h1>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl hover:bg-gray-700 transition-all font-bold"
          >
            ✕ Kapat
          </button>
        </div>

       {/* Avatar + İsim — Modern Kart */}
        <div
          className="relative rounded-3xl p-6 mb-4 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(30,10,60,0.95) 0%, rgba(10,10,30,0.95) 100%)`,
            border: `2px solid ${rank.color}40`,
            boxShadow: `0 0 30px ${rank.color}20`,
          }}
        >
          {/* Arka plan parlaması */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: `radial-gradient(circle at 30% 50%, ${rank.color} 0%, transparent 60%)` }}
          />
          <div className="relative flex items-center gap-5">
            {/* Büyük Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center text-6xl"
                style={{
                  background: `radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.3) 100%)`,
                  border: `3px solid ${rank.color}80`,
                  boxShadow: `0 0 25px ${rank.color}40, inset 0 0 20px rgba(0,0,0,0.3)`,
                }}
              >
                {avatar}
              </div>
              {/* Rank rozeti */}
              <div
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-lg border-2 border-black"
                style={{ background: `linear-gradient(135deg, ${rank.color}, rgba(0,0,0,0.8))` }}
              >
                {rank.icon}
              </div>
            </div>
            {/* İsim & Rank */}
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-black text-white truncate">{username}</div>
              <div className="text-gray-400 text-xs truncate mb-2">{user?.email}</div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-black"
                style={{
                  background: `${rank.color}20`,
                  border: `1px solid ${rank.color}60`,
                  color: rank.color,
                }}
              >
                <span>{rank.icon}</span>
                <span>{rank.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">
              {getCurrentMonthLabel()} XP
            </div>
            <div className="text-xl font-black text-yellow-300">{xp.toLocaleString()} XP</div>
          </div>
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${xpProgress}%`, backgroundColor: rank.color }}
            />
          </div>
          {nextRank ? (
            <div className="flex justify-between text-xs text-gray-500">
              <span>{rank.icon} {rank.name}</span>
              <span>{xpToNext} XP → {nextRank.icon} {nextRank.name}</span>
            </div>
          ) : (
            <div className="text-xs text-yellow-400 text-center font-bold">👑 Maksimum Rank!</div>
          )}
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-3xl font-black text-white">{totalGames}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Toplam Oyun</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
           <div className="text-3xl font-black text-green-400">{arenaWins}</div>
           <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Tur Galibiyeti</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
         <div className="text-3xl font-black text-blue-400">{bestTurn || 0}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Rekor Tur</div>
          </div>
         <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
  <div className="text-3xl font-black text-yellow-400">
    {totalGames > 0 ? Math.round(totalTurns / totalGames) : 0}
  </div>
  <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Ort. Tur</div>
</div>
        </div>

        {/* Görev Özeti */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-4">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-4">Görev Durumu</div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">☀️ Günlük</span>
                <span className="font-bold text-yellow-300">{dailyDone}/{dailyTotal}</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all"
                  style={{ width: `${dailyTotal ? (dailyDone / dailyTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">📆 Haftalık</span>
                <span className="font-bold text-purple-300">{weeklyDone}/{weeklyTotal}</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${weeklyTotal ? (weeklyDone / weeklyTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}