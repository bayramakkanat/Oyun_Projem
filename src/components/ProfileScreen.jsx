import { useState, useEffect } from "react";
import { getRank, RANKS, loadTasks } from "../utils/helpers";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ProfileScreen({ onClose, user, stats, onStartVersus, friendsData }) {
  const [xp, setXp] = useState(0);
  const [arenaWins, setArenaWins] = useState(0);
  const [bestTurn, setBestTurn] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [totalTurns, setTotalTurns] = useState(0);
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "friends"
  const [searchInput, setSearchInput] = useState("");
  const [challengingUid, setChallengingUid] = useState(null);

  const taskData = loadTasks(user?.uid);

 const {
    friends,
    incomingRequests,
    incomingChallenges,
    searchResult,
    searchLoading,
    searchError,
    searchUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    challengeFriend,
    acceptChallenge,
    rejectChallenge,
    setSearchResult,
    setSearchError,
  } = friendsData;

  useEffect(() => {
    const fetchXP = async () => {
      if (!user) return;
      try {
        // Tek kalıcı sıralama collection'ı — aylık değil
        const ref = doc(db, "arena_leaderboard", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setXp(snap.data().xp || 0);
          setArenaWins(snap.data().totalWins || 0);
          setTotalGames(snap.data().totalGames || 0);
          setTotalTurns(snap.data().totalTurns || 0);
        }
        const profileRef = doc(db, "user_profiles", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setBestTurn(profileSnap.data().allTimeBestTurn || 0);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchXP();
  }, [user]);

  // Meydan oku: oda kodu oluştur, arkadaşa gönder, versus'a geç
  const handleChallenge = async (friendUid) => {
    setChallengingUid(friendUid);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    await challengeFriend(friendUid, code);
    // Versus lobby'yi oda koduyla başlat
    onClose();
    if (onStartVersus) onStartVersus(code, "host");
    setChallengingUid(null);
  };

  const rank = getRank(xp);
  const nextRank = RANKS.find(r => r.min > rank.min);
  const xpToNext = nextRank ? nextRank.min - xp : 0;
  const xpProgress = nextRank ? ((xp - rank.min) / (nextRank.min - rank.min)) * 100 : 100;

  const dailyDone = taskData?.daily?.tasks?.filter(t => t.done).length || 0;
  const dailyTotal = taskData?.daily?.tasks?.length || 0;
  const weeklyDone = taskData?.weekly?.tasks?.filter(t => t.done).length || 0;
  const weeklyTotal = taskData?.weekly?.tasks?.length || 0;

  const avatar = (user?.displayName || "🐺").split(" ")[0];
  const username = (user?.displayName || user?.email?.split("@")[0] || "Misafir").split(" ").slice(1).join(" ") || user?.email?.split("@")[0];

  const totalNotif = incomingRequests.length + incomingChallenges.length;

  return (
    <div className="min-h-screen text-white p-4" style={{ background: "radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 100%)" }}>
      <div className="max-w-lg mx-auto">

        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-yellow-300">👤 Profil</h1>
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl hover:bg-gray-700 transition-all font-bold">
            ✕ Kapat
          </button>
        </div>

        {/* Sekmeler */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${activeTab === "profile" ? "bg-yellow-500 text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >
            📊 Profil
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all relative ${activeTab === "friends" ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >
            👥 Arkadaşlar
            {totalNotif > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center">
                {totalNotif}
              </span>
            )}
          </button>
        </div>

        {/* ── PROFİL SEKMESİ ─────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <>
            {/* Avatar + İsim */}
            <div className="relative rounded-3xl p-6 mb-4 overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(30,10,60,0.95) 0%, rgba(10,10,30,0.95) 100%)", border: `2px solid ${rank.color}40`, boxShadow: `0 0 30px ${rank.color}20` }}>
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 50%, ${rank.color} 0%, transparent 60%)` }} />
              <div className="relative flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 rounded-full flex items-center justify-center text-6xl"
                    style={{ background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.3) 100%)", border: `3px solid ${rank.color}80`, boxShadow: `0 0 25px ${rank.color}40, inset 0 0 20px rgba(0,0,0,0.3)` }}>
                    {avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-lg border-2 border-black"
                    style={{ background: `linear-gradient(135deg, ${rank.color}, rgba(0,0,0,0.8))` }}>
                    {rank.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-xl font-black text-white truncate break-all leading-tight">{username}</div>
                  <div className="text-gray-400 text-xs truncate mb-2">{user?.email}</div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-black"
                    style={{ background: `${rank.color}20`, border: `1px solid ${rank.color}60`, color: rank.color }}>
                    <span>{rank.icon}</span>
                    <span>{rank.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">Arena XP</div>
                <div className="text-xl font-black text-yellow-300">{xp.toLocaleString()} XP</div>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all" style={{ width: `${xpProgress}%`, backgroundColor: rank.color }} />
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
                <div className="text-3xl font-black text-yellow-400">{totalGames > 0 ? Math.round(totalTurns / totalGames) : 0}</div>
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
                    <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${dailyTotal ? (dailyDone / dailyTotal) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">📆 Haftalık</span>
                    <span className="font-bold text-purple-300">{weeklyDone}/{weeklyTotal}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${weeklyTotal ? (weeklyDone / weeklyTotal) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── ARKADAŞLAR SEKMESİ ──────────────────────────────────────────── */}
        {activeTab === "friends" && (
          <div className="flex flex-col gap-4">

            {/* Gelen meydan okumalar */}
            {incomingChallenges.length > 0 && (
              <div className="bg-orange-900/40 border-2 border-orange-500/60 rounded-2xl p-4">
                <div className="text-orange-300 font-black text-sm mb-3">⚔️ Meydan Okumalar</div>
                {incomingChallenges.map(c => (
                  <div key={c.uid} className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-white text-sm font-bold">{c.displayName}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptChallenge(c, (roomCode) => { onClose(); if (onStartVersus) onStartVersus(roomCode, "guest"); })}
                        className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-black transition-all"
                      >
                        ✅ Kabul
                      </button>
                      <button
                        onClick={() => rejectChallenge(c.uid)}
                        className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded-lg text-xs font-black transition-all"
                      >
                        ❌ Reddet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Gelen arkadaşlık istekleri */}
            {incomingRequests.length > 0 && (
              <div className="bg-blue-900/40 border-2 border-blue-500/60 rounded-2xl p-4">
                <div className="text-blue-300 font-black text-sm mb-3">📨 Arkadaşlık İstekleri</div>
                {incomingRequests.map(r => (
                  <div key={r.uid} className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-white text-sm font-bold">{r.displayName}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptFriendRequest(r)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-black transition-all"
                      >
                        ✅ Kabul
                      </button>
                      <button
                        onClick={() => rejectFriendRequest(r.uid)}
                        className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded-lg text-xs font-black transition-all"
                      >
                        ❌ Reddet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Kullanıcı ara */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">🔍 Arkadaş Ekle</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setSearchResult(null); setSearchError(""); }}
                  onKeyDown={e => e.key === "Enter" && searchUser(searchInput)}
                  placeholder="Kullanıcı adı ara..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-400 transition-all"
                />
                <button
                  onClick={() => searchUser(searchInput)}
                  disabled={searchLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl text-sm font-black transition-all"
                >
                  {searchLoading ? "⏳" : "Ara"}
                </button>
              </div>

              {searchError && (
                <div className="mt-2 text-red-400 text-xs font-bold">{searchError}</div>
              )}

              {searchResult && (
                <div className="mt-3 flex items-center justify-between bg-gray-800 rounded-xl p-3">
                  <div>
                    <div className="text-white font-bold text-sm">{searchResult.displayName}</div>
                    <div className="text-gray-400 text-xs">{searchResult.username}</div>
                  </div>
                  {searchResult.alreadyFriend ? (
                    <span className="text-green-400 text-xs font-bold">✅ Arkadaş</span>
                  ) : searchResult.requestSent ? (
                    <span className="text-yellow-400 text-xs font-bold">⏳ İstek Gönderildi</span>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(searchResult)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-black transition-all"
                    >
                      + Ekle
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Arkadaş listesi */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">
                👥 Arkadaşlarım ({friends.length})
              </div>

              {friends.length === 0 ? (
  <div className="text-center py-8 flex flex-col items-center gap-1">
    <div className="text-5xl mb-1" style={{ filter: "drop-shadow(0 0 10px rgba(139,92,246,0.5))" }}>
      👥
    </div>
    <div className="text-xl -mt-1 opacity-60">✨</div>
    <div className="text-sm text-gray-400 mt-2 font-semibold">Henüz arkadaşın yok.</div>
    <div className="text-xs text-gray-500 mt-0.5">Yukarıdan kullanıcı adıyla ekleyebilirsin!</div>
  </div>
) : (
                <div className="flex flex-col gap-2">
                  {friends.map(f => (
                    <div key={f.uid} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-3 py-2.5">
                      <div className="text-white font-bold text-sm">{f.displayName}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleChallenge(f.uid)}
                          disabled={challengingUid === f.uid}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-lg text-xs font-black transition-all"
                        >
                          {challengingUid === f.uid ? "⏳" : "⚔️ Meydan Oku"}
                        </button>
                        <button
                          onClick={() => removeFriend(f.uid)}
                          className="px-2 py-1.5 bg-gray-700 hover:bg-red-800 rounded-lg text-xs transition-all"
                          title="Arkadaşlıktan çıkar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
