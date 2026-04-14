import { useState } from "react";
import StarField from "./StarField";
import AuthModal from "./AuthModal";
import SettingsModal from "./SettingsModal";
import {
  DIFFICULTY_CONFIGS,
  GAME_MODES,
  ACHIEVEMENTS_DEF,
} from "../data/gameData";
import { auth } from "../firebase";
import LeaderboardScreen from "./LeaderboardScreen";
import CollectionScreen from "./CollectionScreen";
import TasksScreen from "./TasksScreen";
import ProfileScreen from "./ProfileScreen";
import FeedbackScreen from "./FeedbackScreen";
import { hasSavedGame, loadGameState, isArenaUnlocked } from "../utils/localSave";
import { useGameContext } from "../context/GameContext";
import { playSound } from "../hooks/useSound";

export default function MenuScreen({ onArenaStart }) {
  const { 
    menuView, setMenuView, soundEnabled, setSoundEnabled, stats, 
    difficultyLevel, setDifficultyLevel, gameMode, setGameMode, 
    user, displayName, achievementPopup, showAuthModal, setShowAuthModal, 
    showSettingsModal, setShowSettingsModal, authMode, setAuthMode, 
    authEmail, setAuthEmail, authPass, setAuthPass, authUsername, 
    setAuthUsername, authAvatar, setAuthAvatar, settingsUsername, 
    setSettingsUsername, settingsAvatar, setSettingsAvatar, 
    handleEmailAuth, handleGoogleLogin, handleLogout, handleUpdateProfile, 
    friendsData,
    setVersusPhase, reset, setGameStarted, unlockAchievement, 
    setVersusAutoJoin, restoreGame, setShowDebugPanel 
  } = useGameContext();

  const onStart = () => {
    if (gameMode === "arena" && !isArenaUnlocked()) return;
    if (gameMode === "versus") {
      setVersusPhase("lobby");
    } else if (gameMode === "arena" && onArenaStart) {
      // Arena: önce sinematik intro göster, intro bitince GameRouter oyunu başlatır
      onArenaStart();
    } else {
      reset();
      setGameStarted(true);
      unlockAchievement("first_game");
      playSound("shop_open");
    }
  };

  const onStartVersus = (roomCode, role) => {
    setGameMode("versus");
    setVersusAutoJoin({ roomCode, role });
    setVersusPhase("lobby");
  };

  const onContinue = (saved) => {
    setGameMode(saved.gameMode ?? "standard");
    setDifficultyLevel(saved.difficultyLevel ?? "normal");
    restoreGame(saved);
    setGameStarted(true);
  };

  const onDebug = () => setShowDebugPanel(true);

  const [achCat, setAchCat] = useState("any");
  const currentDiffConfig =
    DIFFICULTY_CONFIGS[difficultyLevel] || DIFFICULTY_CONFIGS.normal;

  return (
    <div className="min-h-screen animated-bg text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-outfit">
      <StarField />
      {achievementPopup && (
        <div
          className="fixed top-6 right-6 z-50 bg-gradient-to-br from-yellow-900 to-orange-900 border-2 border-yellow-400 rounded-2xl p-4 shadow-2xl flex items-center gap-3"
          style={{ animation: "slideInRightNotif 0.4s ease-out" }}
        >
          <span className="text-4xl">{achievementPopup.icon}</span>
          <div>
            <div className="text-yellow-300 font-bold text-xs uppercase tracking-tighter">
              Başarım Açıldı!
            </div>
            <div className="text-white font-black text-lg">
              {achievementPopup.name}
            </div>
          </div>
        </div>
      )}

      {/* Üst Bar */}
      <div className="absolute top-6 right-6 z-20">
        {user ? (
         <div className="flex items-center gap-3 bg-black/40 p-2 pl-4 rounded-full border border-white/10 backdrop-blur-xl cursor-pointer hover:bg-black/60 transition-all" onClick={() => setMenuView("profile")}>
            <div className="flex flex-col items-end">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Oyuncu
              </div>
              <div className="text-sm font-black text-yellow-300">
                {(
                  displayName ||
                  auth.currentUser?.displayName ||
                  user.displayName ||
                  user.email.split("@")[0]
                )
                  .split(" ")
                  .slice(1)
                  .join(" ") || user.email.split("@")[0]}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-yellow-500 shadow-lg bg-white/10 flex items-center justify-center text-xl">
              {(
                displayName ||
                auth.currentUser?.displayName ||
                user.displayName ||
                "🐺"
              ).split(" ")[0].length > 2
                ? "🐾"
                : (
                    displayName ||
                    auth.currentUser?.displayName ||
                    user.displayName ||
                    "🐺"
                  ).split(" ")[0]}
            </div>
            <button
              onClick={() => {
                setSettingsUsername(
                  (user.displayName || "").split(" ").slice(1).join(" ")
                );
                setSettingsAvatar(
                  (user.displayName || "🐾").split(" ")[0].length <= 2
                    ? (user.displayName || "🐾").split(" ")[0]
                    : "🐺"
                );
                setShowSettingsModal(true);
              }}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              ⚙️
            </button>
            <button
              onClick={handleLogout}
              className="p-2 ml-1 text-gray-400 hover:text-red-400 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-black shadow-2xl hover:scale-105 transition-all active:scale-95"
          >
            🔑 Giriş Yap
          </button>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
        {menuView === "main" && (
          <div
            className="flex flex-col items-center w-full"
            style={{ animation: "fadeIn 0.5s ease-out" }}
          >
            <div className="relative mb-8 pt-10">
              <div
                className="text-[160px] leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] select-none"
                style={{
                  animation: "menuLogoFloat 4s ease-in-out infinite",
                  filter: "drop-shadow(0 0 30px rgba(255,255,255,0.25)) drop-shadow(0 0 60px rgba(139,92,246,0.2))",
                }}
              >
                🐾
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-6 bg-black/50 blur-2xl rounded-full"></div>
            </div>
           <h1
              className="text-6xl font-black mb-2 text-center bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent drop-shadow-2xl italic tracking-tighter"
              style={{ animation: "menuTitleGlow 3s ease-in-out infinite" }}
            >
              ANIMATHON
            </h1>
            <p className="text-gray-400 mb-12 text-center font-medium tracking-wide uppercase text-xs opacity-60">
              Takımını Kur • Stratejini Belirle • Arenaya Hükmet
            </p>
            <div className="grid grid-cols-1 gap-4 w-full">
              {hasSavedGame() && (
  <button
    onClick={() => onContinue(loadGameState())}
    className="group relative w-full py-5 bg-gradient-to-br from-teal-600 to-green-700 rounded-3xl font-black text-xl shadow-xl hover:scale-[1.03] transition-all active:scale-95 border border-teal-500/50 flex items-center justify-center gap-3"
  >
    ▶️ Kaldığın Yerden Devam Et
    {(() => {
      const s = loadGameState();
      return s ? (
        <span className="text-sm font-bold opacity-70">
          (Tur {s.turn} • {s.gameMode === "arena" ? "🏟️" : "⚔️"})
        </span>
      ) : null;
    })()}
  </button>
)}
             <button
                onClick={() => { playSound("ui_click"); setMenuView("play_setup"); }}
                className="group relative w-full py-6 bg-white text-black rounded-3xl font-black text-3xl shadow-[0_20px_40px_rgba(255,255,255,0.15)] hover:scale-[1.03] transition-all active:scale-95 overflow-hidden"
                style={{ boxShadow: "0 0 30px rgba(255,255,255,0.1), 0 20px 60px rgba(255,255,255,0.15)" }}
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  ⚔️ OYNA
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </button>
            <div className="grid grid-cols-4 gap-2 w-full">
  <button
    onClick={() => { playSound("ui_click"); setMenuView("achievements"); }}
    className="py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-white/10 transition-all active:scale-95"
  >
    <span className="text-2xl">🏆</span>
    <span className="text-xs uppercase tracking-widest opacity-60">
      Başarımlar
    </span>
  </button>
  <button
    onClick={() => { playSound("ui_click"); setMenuView("leaderboard"); }}
    className="py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-white/10 transition-all active:scale-95"
  >
    <span className="text-2xl">🏅</span>
    <span className="text-xs uppercase tracking-widest opacity-60">
      Sıralama
    </span>
  </button>
  <button
    onClick={() => { playSound("ui_click"); setMenuView("tasks"); }}
    className="py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-white/10 transition-all active:scale-95"
  >
    <span className="text-2xl">📅</span>
    <span className="text-xs uppercase tracking-widest opacity-60">
      Görevler
    </span>
  </button>
  <button
    onClick={() => { playSound("ui_click"); setMenuView("collection"); }}
    className="py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-white/10 transition-all active:scale-95"
  >
    <span className="text-2xl">📖</span>
    <span className="text-xs uppercase tracking-widest opacity-60">
      Koleksiyon
    </span>
  </button>
</div>
              <button
                onClick={() => setSoundEnabled((s) => !s)}
                className="py-3 bg-black/20 rounded-2xl text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                {soundEnabled ? "🔊 SES AÇIK" : "🔇 SES KAPALI"}
              </button>
            </div>
          </div>
        )}

        {menuView === "play_setup" && (
          <div
            className="w-full"
            style={{ animation: "slideInLeft 0.3s ease-out" }}
          >
            <button
              onClick={() => setMenuView("main")}
              className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Geri Dön
            </button>
            <h2 className="text-4xl font-black mb-8 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              SAVAŞ AYARLARI
            </h2>
          {gameMode === "standard" && <div className="mb-8">
  <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">
    Zorluk Seviyesi
  </div>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(DIFFICULTY_CONFIGS).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setDifficultyLevel(key)}
                    className={`relative py-3 px-2 rounded-2xl border-2 transition-all duration-300 flex flex-row items-center justify-center gap-2 ${
                      difficultyLevel === key
                        ? "bg-white border-white scale-105 shadow-2xl"
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <span className="text-2xl">{cfg.label.split(" ")[0]}</span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-tighter ${
                        difficultyLevel === key ? "text-black" : "text-white"
                      }`}
                    >
                      {cfg.label.split(" ")[1]}
                    </span>
                    {difficultyLevel === key && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full border-2 border-black flex items-center justify-center text-[8px] text-white">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] text-gray-400 text-center italic">
                "{currentDiffConfig.description}"
                <br />
                <span className="font-bold text-gray-500 mt-1 block">
                  ❤️{currentDiffConfig.startingLives} CAN | 💰
                  {currentDiffConfig.startingGold} ALTIN | x
                  {currentDiffConfig.enemyStatMultiplier} GÜÇ
                </span>
             </div>
            </div>}
           {gameMode === "arena" && (
  <div className="mb-8 p-5 rounded-2xl border border-purple-500/30 bg-purple-900/20">
    <div className="text-purple-300 font-black text-sm uppercase tracking-widest mb-3">🏟️ Arena Modu</div>
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-sm text-gray-300">
        <span className="text-xl">🏆</span>
        <span>Başarımlar Arena'da oynayarak açılır</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-300">
        <span className="text-xl">📅</span>
        <span>Günlük ve haftalık görevler sadece Arena'da ilerler</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-300">
        <span className="text-xl">📖</span>
        <span>Koleksiyon istatistiklerin Arena'da güncellenir</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-300">
        <span className="text-xl">📊</span>
        <span>XP kazan, rank atla ve lider tablosuna gir!</span>
      </div>
    </div>
  </div>
)}
{gameMode === "versus" && (
  <div className="mb-8 p-5 rounded-2xl border border-blue-500/30 bg-blue-900/20">
    <div className="text-blue-300 font-black text-sm uppercase tracking-widest mb-3">⚔️ Karşılaşma Modu</div>
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-sm text-gray-300">
        <span className="text-xl">👥</span>
        <span>Gerçek oyuncularla anlık savaş</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-300">
        <span className="text-xl">🔑</span>
        <span>Oda kodu ile arkadaşını davet et</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-300">
        <span className="text-xl">🛒</span>
        <span>Her tur ayrı ayrı alışveriş yaparsınız</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-300">
        <span className="text-xl">💀</span>
        <span>Canın bitince oyun sona erer, rakibin kazanır</span>
      </div>
    </div>
  </div>
)}
            <div className="mb-10">
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">
                Savaş Modu
              </div>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(GAME_MODES).map(([key, mode]) => {
                  const isLocked = mode.requiresAuth && !user;
                  const isArenaLocked = key === "arena" && !isArenaUnlocked();
                  const isSelected = gameMode === key;
                  return (
                    <button
                      key={key}
                      disabled={!mode.available || isArenaLocked}
                     onClick={() => {
  if (isLocked) setShowAuthModal(true);
  else if (isArenaLocked) return;
  else if (mode.available) {
    setGameMode(key);
    if (key !== "standard") setDifficultyLevel("normal");
  }
}}
                      className={`relative w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        isSelected && mode.available && !isArenaLocked
                          ? "bg-white border-white translate-x-1"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      } ${!mode.available || isArenaLocked ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <div className="text-3xl">{mode.icon}</div>
                      <div className="text-left">
                        <div
                          className={`font-black text-sm uppercase italic ${
                            isSelected && mode.available && !isArenaLocked
                              ? "text-black"
                              : "text-white"
                          }`}
                        >
                          {mode.label}
                        </div>
                        <div
                          className={`text-[10px] ${
                            isSelected && mode.available && !isArenaLocked
                              ? "text-gray-600"
                              : "text-gray-400"
                          }`}
                        >
                          {isArenaLocked ? "Standart modu bitirerek aç" : mode.description}
                        </div>
                      </div>
                      {isLocked && (
                        <div className="ml-auto bg-black/40 p-2 rounded-lg text-xs">
                          🔒 Giriş Gerekli
                        </div>
                      )}
                      {isArenaLocked && (
                        <div className="ml-auto bg-purple-900/60 border border-purple-500/40 p-2 rounded-lg text-xs text-purple-300 font-black">
                          🔒 Kilitli
                        </div>
                      )}
                      {!mode.available && !isArenaLocked && (
                        <div className="ml-auto text-[8px] font-black tracking-widest bg-white/10 px-2 py-1 rounded">
                          YAKINDA
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={onStart}
              className="w-full py-6 bg-green-500 text-black rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 transition-all active:scale-95"
            >
              BAŞLA! 🚀
            </button>
          </div>
        )}

        {menuView === "achievements" && (() => {
          const categories = [
            { key: "any",      label: "🌍 Genel",    activeColor: "bg-gray-600  border-gray-400",  inactiveColor: "bg-gray-900/60 border-gray-700/60 text-gray-400", textColor: "text-white" },
            { key: "standard", label: "⚔️ Standart", activeColor: "bg-blue-700  border-blue-400",  inactiveColor: "bg-gray-900/60 border-gray-700/60 text-gray-400", textColor: "text-white" },
            { key: "arena",    label: "🏟️ Arena",    activeColor: "bg-purple-700 border-purple-400", inactiveColor: "bg-gray-900/60 border-gray-700/60 text-gray-400", textColor: "text-white" },
          ];
          const catBorders = { any: "border-gray-500/30", standard: "border-blue-500/30", arena: "border-purple-500/30" };
          const catBgs     = { any: "bg-gray-800/30",     standard: "bg-blue-900/20",     arena: "bg-purple-900/20" };
          const catColors  = { any: "text-gray-300",      standard: "text-blue-300",       arena: "text-purple-300" };
          const activeCat = achCat;
          const setActiveCat = (k) => setAchCat(k);
          const catAchievements = ACHIEVEMENTS_DEF.filter(a => a.mode === activeCat);
          const catEarned = catAchievements.filter(a => stats.achievements.includes(a.id)).length;
          return (
          <div
            className="w-full"
            style={{ animation: "slideInRight 0.3s ease-out" }}
          >
            <button
              onClick={() => setMenuView("main")}
              className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
              </svg>
              Geri Dön
            </button>
            <h2 className="text-4xl font-black mb-1">BAŞARIMLAR</h2>
           <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
            {ACHIEVEMENTS_DEF.filter(a => ["any","standard","arena"].includes(a.mode) && stats.achievements.includes(a.id)).length} / {ACHIEVEMENTS_DEF.filter(a => ["any","standard","arena"].includes(a.mode)).length} açıldı
            </p>

            <div className="flex gap-2 mb-4">
              {categories.map(cat => {
                const isActive = activeCat === cat.key;
                const allInCat = ACHIEVEMENTS_DEF.filter(a => a.mode === cat.key);
                const earnedInCat = allInCat.filter(a => stats.achievements.includes(a.id)).length;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCat(cat.key)}
                    className={`flex-1 flex flex-col items-center py-2.5 px-2 rounded-2xl border-2 transition-all font-bold text-xs ${
                      isActive
                        ? cat.activeColor + " text-white shadow-lg scale-[1.03]"
                        : cat.inactiveColor + " hover:border-white/20"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] mt-0.5 ${isActive ? "text-white/70" : "text-gray-600"}`}>
                      {earnedInCat}/{allInCat.length}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`flex items-center gap-3 mb-4 px-3 py-2 rounded-xl border ${catBorders[activeCat]} ${catBgs[activeCat]}`}>
              <span className={`font-black text-xs uppercase tracking-widest ${catColors[activeCat]}`}>
                {catEarned}/{catAchievements.length} tamamlandı
              </span>
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full transition-all"
                  style={{ width: `${catAchievements.length ? (catEarned / catAchievements.length) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="max-h-[52vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                {catAchievements.map((a) => {
                  const earned = stats.achievements.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        earned
                          ? "bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/5"
                          : "bg-white/3 border-white/8 opacity-40"
                      }`}
                    >
                      <div className="text-2xl flex-shrink-0">{earned ? a.icon : "🔒"}</div>
                      <div className="text-left min-w-0">
                        <div className={`font-black text-xs uppercase leading-tight ${earned ? "text-yellow-300" : "text-gray-400"}`}>
                          {a.name}
                        </div>
                        <div className="text-[10px] text-gray-500 leading-tight mt-0.5 line-clamp-2">{a.desc}</div>
                      </div>
                      {earned && <div className="ml-auto text-yellow-500 flex-shrink-0 text-xs">✓</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          );
        })()}
        {menuView === "leaderboard" && (
          <LeaderboardScreen
            onBack={() => setMenuView("main")}
            user={user}
            onShowAuth={() => setShowAuthModal(true)}
          />
        )}
       {menuView === "collection" && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <CollectionScreen
              onClose={() => setMenuView("main")}
              userId={user?.uid}
            />
          </div>
        )}
        {menuView === "tasks" && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
          <TasksScreen
  onClose={() => setMenuView("main")}
  userId={user?.uid}
/>
          </div>
        )}
        {menuView === "profile" && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <ProfileScreen
      onClose={() => setMenuView("main")}
      user={user}
      stats={stats}
      onStartVersus={onStartVersus}
      friendsData={friendsData}
    />
  </div>
)}
        {menuView === "feedback" && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <FeedbackScreen
      onClose={() => setMenuView("main")}
      user={user}
    />
  </div>
)}
      </div>
      <div className="absolute bottom-6 left-6 z-20">
        {process.env.NODE_ENV !== "production" && (
          <button
            onClick={() => setShowDebugPanel(true)}
            className="px-4 py-2 bg-purple-900/40 border border-purple-500/20 rounded-xl text-purple-400 text-xs font-bold hover:bg-purple-800/60 transition-all"
          >
            🧪 Debug
          </button>
        )}
        <button
          onClick={() => setMenuView("feedback")}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-xs font-bold hover:bg-white/10 transition-all"
        >
          💬 Geri Bildirim
        </button>
      </div>
      {showSettingsModal && (
        <SettingsModal
          user={user}
          settingsUsername={settingsUsername}
          setSettingsUsername={setSettingsUsername}
          settingsAvatar={settingsAvatar}
          setSettingsAvatar={setSettingsAvatar}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          handleUpdateProfile={handleUpdateProfile}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
      {showAuthModal && (
        <AuthModal
          authMode={authMode}
          setAuthMode={setAuthMode}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPass={authPass}
          setAuthPass={setAuthPass}
          authUsername={authUsername}
          setAuthUsername={setAuthUsername}
          authAvatar={authAvatar}
          setAuthAvatar={setAuthAvatar}
          handleEmailAuth={handleEmailAuth}
          handleGoogleLogin={handleGoogleLogin}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
