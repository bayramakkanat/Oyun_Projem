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

export default function MenuScreen({
  menuView,
  setMenuView,
  soundEnabled,
  setSoundEnabled,
  stats,
  difficultyLevel,
  setDifficultyLevel,
  gameMode,
  setGameMode,
  user,
  displayName,
  achievementPopup,
  showAuthModal,
  setShowAuthModal,
  showSettingsModal,
  setShowSettingsModal,
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPass,
  setAuthPass,
  authUsername,
  setAuthUsername,
  authAvatar,
  setAuthAvatar,
  settingsUsername,
  setSettingsUsername,
  settingsAvatar,
  setSettingsAvatar,
  handleEmailAuth,
  handleGoogleLogin,
  handleLogout,
  handleUpdateProfile,
 onStart,
  onDebug,
}) {
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
          <div className="flex items-center gap-3 bg-black/40 p-2 pl-4 rounded-full border border-white/10 backdrop-blur-xl">
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
                  animation: "pulse 2.5s ease-in-out infinite",
                  filter: "drop-shadow(0 0 20px rgba(255,255,255,0.2))",
                }}
              >
                🐾
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-6 bg-black/50 blur-2xl rounded-full"></div>
            </div>
            <h1 className="text-6xl font-black mb-2 text-center bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent drop-shadow-2xl italic tracking-tighter">
              HAYVAN SAVAŞÇILARI
            </h1>
            <p className="text-gray-400 mb-12 text-center font-medium tracking-wide uppercase text-xs opacity-60">
              Takımını Kur • Stratejini Belirle • Arenaya Hükmet
            </p>
            <div className="grid grid-cols-1 gap-4 w-full">
              <button
                onClick={() => setMenuView("play_setup")}
                className="group relative w-full py-6 bg-white text-black rounded-3xl font-black text-3xl shadow-[0_20px_40px_rgba(255,255,255,0.15)] hover:scale-[1.03] transition-all active:scale-95 overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  ⚔️ OYNA
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </button>
             <div className="grid grid-cols-3 gap-4 w-full">
  <button
    onClick={() => setMenuView("achievements")}
    className="py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-white/10 transition-all active:scale-95"
  >
    <span className="text-2xl">🏆</span>
    <span className="text-xs uppercase tracking-widest opacity-60">
      Başarımlar
    </span>
  </button>
  <button
    onClick={() => setMenuView("leaderboard")}
    className="py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-white/10 transition-all active:scale-95"
  >
    <span className="text-2xl">🏅</span>
    <span className="text-xs uppercase tracking-widest opacity-60">
      Sıralama
    </span>
  </button>
  <button
    onClick={() => setMenuView("collection")}
    className="py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-white/10 transition-all active:scale-95"
  >
    <span className="text-2xl">📖</span>
    <span className="text-xs uppercase tracking-widest opacity-60">
      Koleksiyon
    </span>
  </button>
  <button
    onClick={() => setMenuView("stats")}
    className="py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-white/10 transition-all active:scale-95"
  >
    <span className="text-2xl">📊</span>
    <span className="text-xs uppercase tracking-widest opacity-60">
      İstatistikler
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
            <div className="mb-10">
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">
                Savaş Modu
              </div>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(GAME_MODES).map(([key, mode]) => {
                  const isLocked = mode.requiresAuth && !user;
                  const isSelected = gameMode === key;
                  return (
                    <button
                      key={key}
                      disabled={!mode.available}
                     onClick={() => {
  if (isLocked) setShowAuthModal(true);
  else if (mode.available) {
    setGameMode(key);
    if (key !== "standard") setDifficultyLevel("normal");
  }
}}
                      className={`relative w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        isSelected && mode.available
                          ? "bg-white border-white translate-x-1"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      } ${!mode.available ? "opacity-30" : ""}`}
                    >
                      <div className="text-3xl">{mode.icon}</div>
                      <div className="text-left">
                        <div
                          className={`font-black text-sm uppercase italic ${
                            isSelected && mode.available
                              ? "text-black"
                              : "text-white"
                          }`}
                        >
                          {mode.label}
                        </div>
                        <div
                          className={`text-[10px] ${
                            isSelected && mode.available
                              ? "text-gray-600"
                              : "text-gray-400"
                          }`}
                        >
                          {mode.description}
                        </div>
                      </div>
                      {isLocked && (
                        <div className="ml-auto bg-black/40 p-2 rounded-lg text-xs">
                          🔒 Giriş Gerekli
                        </div>
                      )}
                      {!mode.available && (
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
            <button
              onClick={onDebug}
              className="w-full py-3 bg-purple-700/60 text-white rounded-2xl font-black text-sm hover:bg-purple-600/80 transition-all border border-purple-500/30"
            >
              🧪 Debug Paneli
            </button>
          </div>
        )}

        {menuView === "achievements" && (
          <div
            className="w-full"
            style={{ animation: "slideInRight 0.3s ease-out" }}
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
            <h2 className="text-4xl font-black mb-6">BAŞARIMLAR</h2>
            <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {ACHIEVEMENTS_DEF.map((a) => {
                const earned = stats.achievements.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border ${
                      earned
                        ? "bg-yellow-500/10 border-yellow-500/20"
                        : "bg-white/5 border-white/10 opacity-40"
                    }`}
                  >
                    <div className="text-4xl">{earned ? a.icon : "🔒"}</div>
                    <div className="text-left">
                      <div
                        className={`font-black uppercase italic ${
                          earned ? "text-yellow-300" : "text-gray-400"
                        }`}
                      >
                        {a.name}
                      </div>
                      <div className="text-xs text-gray-500">{a.desc}</div>
                    </div>
                    {earned && <div className="ml-auto text-yellow-500">✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {menuView === "stats" && (
          <div
            className="w-full"
            style={{ animation: "slideInUp 0.3s ease-out" }}
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
            <h2 className="text-4xl font-black mb-8">İSTATİSTİKLER</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <div className="text-3xl font-black text-white mb-1">
                  {stats.totalGames}
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Toplam Oyun
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <div className="text-3xl font-black text-green-400 mb-1">
                  {stats.totalWins}
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Zafere Ulaşıldı
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <div className="text-3xl font-black text-blue-400 mb-1">
                  {stats.bestTurn}
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Rekor Tur
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <div className="text-3xl font-black text-yellow-400 mb-1">
                  {Math.round((stats.totalWins / stats.totalGames) * 100) || 0}%
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Kazanma Oranı
                </div>
              </div>
            </div>
          </div>
       )}

        {menuView === "leaderboard" && (
          <LeaderboardScreen
            onBack={() => setMenuView("main")}
            user={user}
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
