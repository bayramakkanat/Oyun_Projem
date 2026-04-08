import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getCurrentMonthLabel } from "../hooks/useArena";
import { db } from "../firebase";
import { getRank } from "../utils/helpers";

export default function LeaderboardScreen({ onBack, user, onShowAuth }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Giriş yapılmamışsa Firestore'a sorgu atma
    if (!user) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const monthKey = `${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, "0")}`;
        const q = query(
          collection(db, `arena_leaderboard_${monthKey}`),
          orderBy("xp", "desc"),
          limit(20)
        );
        const snap = await getDocs(q);
        const rawPlayers = snap.docs.map((d) => d.data());
        // Sıralama: 1) En yüksek tur 2) XP 3) Kendi hesabı önce
        const sorted = rawPlayers.sort((a, b) => {
          if ((b.bestTurn || 0) !== (a.bestTurn || 0)) return (b.bestTurn || 0) - (a.bestTurn || 0);
          if ((b.xp || 0) !== (a.xp || 0)) return (b.xp || 0) - (a.xp || 0);
          if (user?.uid === a.uid) return -1;
          if (user?.uid === b.uid) return 1;
          return 0;
        });
        setPlayers(sorted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.uid]);

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
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">🏆 {getCurrentMonthLabel()} Sıralaması</p>

      <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-xl bg-blue-900/20 border border-blue-500/20">
        <span className="text-blue-400 text-sm">🏅</span>
        <p className="text-xs text-blue-300">
          Sıralama <span className="font-black text-white">en yüksek tura</span> göre yapılır. Eşitlik durumunda XP belirler.
        </p>
      </div>

      {/* Giriş yapılmamış kullanıcı */}
      {!user ? (
        <div className="flex flex-col items-center text-center py-12 gap-4">
          <div className="text-5xl">🔒</div>
          <div className="text-white font-black text-lg">Sıralamayı görmek için giriş yap</div>
          <div className="text-gray-400 text-sm max-w-xs">
            Gerçek oyuncularla yarış, aylık sıralamada yerini al ve XP kazan.
          </div>
          {onShowAuth && (
            <button
              onClick={onShowAuth}
              className="mt-2 px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl font-black text-black text-sm hover:scale-105 transition-all shadow-lg"
            >
              Giriş Yap / Hesap Oluştur
            </button>
          )}
        </div>
      ) : loading ? (
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
                    {rank.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-base text-white">
                    Tur {p.bestTurn || 0}
                  </div>
                  <div className="font-bold text-sm" style={{ color: rank.color }}>
                    {p.xp?.toLocaleString()} XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
