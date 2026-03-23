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
setArenaWins(snap.data().totalWins || 0);
}

const profileRef = doc(db, "user_profiles", user.uid);
const profileSnap = await getDoc(profileRef);
console.log("Profile snap:", profileSnap.exists(), profileSnap.data());
if (profileSnap.exists()) {
  setBestTurn(profileSnap.data().allTimeBestTurn || 0);
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

        {/* Avatar + İsim */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-6 mb-4">
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-5xl">
            {avatar}
          </div>
          <div>
            <div className="text-2xl font-black text-white">{username}</div>
            <div className="text-gray-400 text-sm">{user?.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl">{rank.icon}</span>
              <span className="font-bold text-sm" style={{ color: rank.color }}>{rank.name}</span>
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

        {/* Başarımlar Özeti */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">
            Başarımlar — {stats.achievements?.length || 0} Kazanıldı
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.achievements?.slice(0, 10).map((id, i) => (
              <div key={i} className="w-10 h-10 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center justify-center text-xl">
                🏆
              </div>
            ))}
            {(stats.achievements?.length || 0) === 0 && (
              <div className="text-gray-500 text-sm">Henüz başarım kazanılmadı</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}