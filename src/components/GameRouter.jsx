import React from "react";
import { useGameContext } from "../context/GameContext";
import BattleView from "./BattleView";
import GuideScreen from "./GuideScreen";
import CollectionScreen from "./CollectionScreen";
import VersusLobby from "./VersusLobby";
import MenuScreen from "./MenuScreen";
import VictoryScreen from "./VictoryScreen";
import GameOverScreen from "./GameOverScreen";
import BossOfferScreen from "./BossOfferScreen";
import NewTierScreen from "./NewTierScreen";
import ShopView from "./ShopView";
import StarField from "./StarField";
import DebugPanel from "./DebugPanel";
import { playSound } from "../hooks/useSound";
import { BOSSES, DIFFICULTY_CONFIGS, WIN_TURN } from "../data/gameData";

export default function GameRouter() {
  const {
    // Oyun temel state'leri
    gameMode,
    setGameMode,
    gameStarted,
    setGameStarted,
    reset,
    menuView,
    setMenuView,
    victory,
    wins,
    lives,
    team,
    arenaResult,
    setArenaResult,
    over,
    bossChallenge,
    acceptBoss,
    declineBoss,
    showCollection,
    setShowCollection,
    guide,
    setGuide,
    openTiers,
    setOpenTiers,
    guideLvl,
    setGuideLvl,
    newTier,
    setNewTier,
    phase,
    showDebugPanel,
    setShowDebugPanel,
    lastError,
    setLastError,
    achievementPopup,
    setAchievementPopup,
    soundEnabled,
    setSoundEnabled,
    user,
    displayName,
    stats,
    difficultyLevel,
    setDifficultyLevel,
    loadTasksFromDB,
    saveTasksToDB,
    unlockAchievement,
    // BattleView için gerekenler
    turn,
    gold,
    pT,
    eT,
    log,
    step,
    anims,
    arenaOpponent,
    battleSpeedRef,
    isPaused,
    setIsPaused,
    isPausedRef,
    // Versus
    versusPhase,
    setVersusPhase,
    setVersusRoom,
    // Diğer yardımcılar
    setBossChallenge,
    setBossResult,
    setBossRewards,
    setTurnAndRef,
    setGold,
    setTeam,
    setPendingEndTurnAnims,
    setPhase,
    setRewards,
    teamSlots,
    setVersusReady,
    // Auth modal için gerekenler
    showAuthModal,
    setShowAuthModal,
    authEmail,
    setAuthEmail,
    authPass,
    setAuthPass,
    authMode,
    setAuthMode,
    authUsername,
    setAuthUsername,
    authAvatar,
    setAuthAvatar,
    showSettingsModal,
    setShowSettingsModal,
    settingsUsername,
    setSettingsUsername,
    settingsAvatar,
    setSettingsAvatar,
    handleGoogleLogin,
    handleEmailAuth,
    handleLogout,
    handleUpdateProfile,
  } = useGameContext();

  // versus lobby
  if (gameMode === "versus" && versusPhase === "lobby") {
    return (
      <VersusLobby
        user={user}
        onRoomReady={(roomInfo) => {
          setVersusRoom(roomInfo);
          setVersusPhase("playing");
          reset();
          setGameStarted(true);
        }}
        onCancel={() => {
          setVersusPhase(null);
          setVersusRoom(null);
        }}
      />
    );
  }

  // ana menü
  if (!gameStarted) {
    return (
      <>
        {showDebugPanel && (
          <DebugPanel
            onClose={() => setShowDebugPanel(false)}
            onStartBattle={(playerTeam, enemyTeam, bossTurn) => {
              // Debug başlatma (kısa)
              setShowDebugPanel(false);
            }}
          />
        )}
        <MenuScreen
          menuView={menuView}
          setMenuView={setMenuView}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          stats={stats}
          difficultyLevel={difficultyLevel}
          setDifficultyLevel={setDifficultyLevel}
          gameMode={gameMode}
          setGameMode={setGameMode}
          user={user}
          displayName={displayName}
          achievementPopup={achievementPopup}
          showAuthModal={showAuthModal}
          setShowAuthModal={setShowAuthModal}
          showSettingsModal={showSettingsModal}
          setShowSettingsModal={setShowSettingsModal}
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
          settingsUsername={settingsUsername}
          setSettingsUsername={setSettingsUsername}
          settingsAvatar={settingsAvatar}
          setSettingsAvatar={setSettingsAvatar}
          handleEmailAuth={handleEmailAuth}
          handleGoogleLogin={handleGoogleLogin}
          handleLogout={handleLogout}
          handleUpdateProfile={() => handleUpdateProfile(user)}
          onStart={() => {
            if (gameMode === "versus") {
              setVersusPhase("lobby");
            } else {
              reset();
              setGameStarted(true);
              unlockAchievement("first_game");
              playSound("shop_open");
            }
          }}
          onDebug={() => setShowDebugPanel(true)}
          loadTasksFromDB={loadTasksFromDB}
          saveTasksToDB={saveTasksToDB}
        />
      </>
    );
  }

  // zafer ekranı
  if (victory) {
    return (
      <VictoryScreen
        wins={wins}
        lives={lives}
        team={team}
        perfectRun={lives === (DIFFICULTY_CONFIGS[difficultyLevel]?.startingLives || 5)}
        onRestart={reset}
        onMenu={() => { reset(); setGameStarted(false); }}
        gameMode={gameMode}
        onRematch={() => {
          reset();
          setVersusPhase("lobby");
        }}
      />
    );
  }

  // arena sonuç ekranı
  if (arenaResult) {
    const { reachedTurn, totalWins, totalLosses, earnedXP, isNewRecord, xpBreakdown } = arenaResult;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 100%)" }}>
        <div className="relative w-full max-w-md mx-4 flex flex-col items-center gap-6">
          {isNewRecord && (
            <div className="text-center animate-bounce">
              <div className="text-5xl mb-1">🏆</div>
              <div className="text-yellow-300 font-black text-xl tracking-widest uppercase" style={{ textShadow: "0 0 20px rgba(253,224,71,0.8)" }}>YENİ REKOR!</div>
              <div className="text-yellow-400/70 text-sm">Bu tura ilk kez ulaştınız!</div>
            </div>
          )}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full backdrop-blur-xl flex flex-col items-center gap-4">
            <div className="text-center">
              <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Arena Sonucu</div>
              <div className="text-white font-black text-6xl">{reachedTurn}</div>
              <div className="text-gray-400 text-sm">. Tura Ulaştın</div>
            </div>
            <div className="flex gap-6 w-full justify-center">
              <div className="flex flex-col items-center">
                <span className="text-green-400 font-black text-2xl">{totalWins}</span>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Zafer</span>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="flex flex-col items-center">
                <span className="text-red-400 font-black text-2xl">{totalLosses}</span>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Yenilgi</span>
              </div>
            </div>
            <div className="w-full bg-white/5 rounded-2xl p-4 flex flex-col gap-2">
              <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Kazanılan XP</div>
              {xpBreakdown.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-300">{item.label}</span>
                  <span className={`font-bold ${item.xp < 0 ? "text-red-400" : "text-purple-300"}`}>
                    {item.xp > 0 ? "+" : ""}{item.xp} XP
                  </span>
                </div>
              ))}
              <div className="border-t border-white/10 mt-1 pt-2 flex justify-between font-black">
                <span className="text-white">Toplam</span>
                <span className="text-yellow-300 text-lg">+{earnedXP} XP</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={() => { setArenaResult(null); reset(); }} className="flex-1 py-3 rounded-2xl bg-white/10 border border-white/20 font-bold text-white hover:bg-white/20 transition-all">🔁 Tekrar</button>
            <button onClick={() => { setArenaResult(null); reset(); setMenuView("main"); setGameStarted(false); }} className="flex-1 py-3 rounded-2xl bg-purple-600 border border-purple-400/50 font-bold text-white hover:bg-purple-500 transition-all">🏠 Ana Menü</button>
          </div>
        </div>
      </div>
    );
  }

  // oyun bitti
  if (over) {
    return (
      <GameOverScreen
        turn={turn}
        wins={wins}
        stats={stats}
        team={team}
        onRestart={reset}
        onMenu={() => { reset(); setGameStarted(false); }}
        gameMode={gameMode}
        onRematch={() => {
          reset();
          setVersusPhase("lobby");
        }}
      />
    );
  }

  // boss teklif ekranı
  if (bossChallenge === "offer" && gameMode === "standard") {
    return (
      <BossOfferScreen
        boss={BOSSES[turn]}
        onAccept={acceptBoss}
        onDecline={declineBoss}
      />
    );
  }

  // koleksiyon
  if (showCollection) {
    return (
      <CollectionScreen
        onClose={() => setShowCollection(false)}
        userId={user?.uid}
      />
    );
  }

  // rehber
  if (guide) {
    return (
      <GuideScreen
        onClose={() => setGuide(false)}
        openTiers={openTiers}
        setOpenTiers={setOpenTiers}
        guideLvl={guideLvl}
        setGuideLvl={setGuideLvl}
      />
    );
  }

  // yeni kademe
  if (newTier) {
    return (
      <NewTierScreen
        newTier={newTier}
        onContinue={() => {
          setNewTier(null);
          setPhase("shop");
        }}
      />
    );
  }

  // ana oyun ekranı (shop veya battle)
  return (
    <div
      className="min-h-screen text-white p-2 flex flex-col justify-center"
      style={{
        backgroundImage: `url(/images/themes/battle_bg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <StarField />
      {showDebugPanel && (
        <DebugPanel
          onClose={() => setShowDebugPanel(false)}
          onStartBattle={(playerTeam, enemyTeam, bossTurn) => {
            // debug başlatma
            setShowDebugPanel(false);
          }}
        />
      )}
      {lastError && (
        <div className="fixed top-4 left-4 z-[9999] bg-red-900 border-2 border-red-500 rounded-lg p-3 max-w-md shadow-2xl">
          <div className="font-bold text-red-300 mb-1">⚠️ Hata</div>
          <div className="text-sm text-white">{lastError.message}</div>
          <button onClick={() => setLastError(null)} className="mt-2 px-2 py-1 bg-red-700 rounded text-xs">Kapat</button>
        </div>
      )}
      {achievementPopup && (
        <div className="fixed top-6 right-6 z-50 bg-gradient-to-br from-yellow-900 to-orange-900 border-2 border-yellow-400 rounded-xl p-4 shadow-2xl flex items-center gap-3">
          <span className="text-3xl">{achievementPopup.icon}</span>
          <div><div className="text-yellow-300 font-bold text-sm">Başarım Kazandın!</div><div className="text-white font-bold">{achievementPopup.name}</div></div>
        </div>
      )}

      {phase === "shop" ? (
        <ShopView />
      ) : (
        <BattleView
          turn={turn}
          gold={gold}
          lives={lives}
          wins={wins}
          pT={pT}
          eT={eT}
          log={log}
          step={step}
          anims={anims}
          bossChallenge={bossChallenge}
          arenaOpponent={arenaOpponent}
          battleSpeedRef={battleSpeedRef}
          isPaused={isPaused}
          onPauseToggle={() => {
            isPausedRef.current = !isPausedRef.current;
            setIsPaused((p) => !p);
          }}
          user={user}
        />
      )}
    </div>
  );
}