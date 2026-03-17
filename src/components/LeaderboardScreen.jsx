import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getCurrentMonthLabel } from "../hooks/useArena";
import { db } from "../firebase";
import { getRank } from "../utils/helpers";

export default function LeaderboardScreen({ onBack, user }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
       const monthKey = `${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, "0")}`;
      const q = query(
        collection(db, `arena_leaderboard_${monthKey}`),
          orderBy("xp", "desc"),
          limit(20)
        );
        const snap = await getDocs(q);
        setPlayers(snap.docs.map((d) => d.data()));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="w-full" style={{ animation: "slideInRight 0.3s ease-out" }}>
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
        </svg>
        Geri Dön
      </button>

      <h2 className="text-4xl font-black mb-2">LİDERLİK TABLOSU</h2>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">🏆 {getCurrentMonthLabel()} Sıralaması</p>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Yükleniyor...</div>
      ) : players.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <div className="text-4xl mb-3">🏟️</div>
          <div>Henüz kayıt yok. İlk sen ol!</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {players.map((p, i) => {
            const rank = getRank(p.xp || 0);
            const isMe = user?.uid === p.uid;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
            return (
              <div
                key={p.uid}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  isMe
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="text-2xl w-8 text-center">{medal}</div>
                <div className="text-xl">{rank.icon}</div>
                <div className="flex-1 text-left">
                  <div className={`font-black text-sm ${isMe ? "text-yellow-300" : "text-white"}`}>
                    {p.userName} {isMe && <span className="text-[10px] text-yellow-500">(Sen)</span>}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                    {rank.name} • En Yüksek Tur: {p.bestTurn}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg" style={{ color: rank.color }}>
                    {p.xp?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">XP</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}