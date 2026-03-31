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
import ArenaResultScreen from "./ArenaResultScreen";
import StarField from "./StarField";
import GlobalNotifications from "./GlobalNotifications";
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
    restoreGame,
    friendsData,
    versusAutoJoin,
    setVersusAutoJoin,
    menuView,
    setMenuView,
    victory,
    wins,
    lives,
    team,
    arenaResult,
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
    setPhase,
    setPT,
    setET,
    setIsDebugBattle,
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
  const notifications = (
    <GlobalNotifications
      friendsData={friendsData}
      onChallengeAccept={(roomCode) => {
        setGameMode("versus");
        setVersusPhase("lobby");
        setVersusAutoJoin({ roomCode, role: "guest" });
      }}
    />
  );
  // versus lobby
  if (gameMode === "versus" && versusPhase === "lobby") {
    return (
       <>
        {notifications}
      <VersusLobby
  user={user}
  autoJoin={versusAutoJoin}
  onRoomReady={(roomInfo) => {
    setVersusAutoJoin(null);
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
      </>
    );
  }

  // ana menü
  if (!gameStarted) {
    return (
      <>
        {notifications}
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
          onStartVersus={(roomCode, role) => {
          setGameMode("versus");
          setVersusAutoJoin({ roomCode, role });
          setVersusPhase("lobby");
          }}
          friendsData={friendsData}
          onContinue={(saved) => {
            setGameMode(saved.gameMode ?? "standard");
            setDifficultyLevel(saved.difficultyLevel ?? "normal");
            restoreGame(saved);
            setGameStarted(true);
          }}
          onDebug={() => setShowDebugPanel(true)}
          loadTasksFromDB={loadTasksFromDB}
          saveTasksToDB={saveTasksToDB}
        />
        {showDebugPanel && (
        <DebugPanel
          onClose={() => setShowDebugPanel(false)}
          onStartBattle={(playerTeam, enemyTeam, bossTurn) => {
            setIsDebugBattle(true); 
            setPT(playerTeam);
            setET(enemyTeam);
            if (bossTurn) setBossChallenge("battle");
            setPhase("battle");
            setGameStarted(true);
            setShowDebugPanel(false); 
          }}
        />
      )}
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
       onMenu={() => { reset(); setMenuView("main"); setGameStarted(false); }}
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
    return <ArenaResultScreen />;
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
        onMenu={() => { reset(); setMenuView("main"); setGameStarted(false); }}
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
     className="min-h-screen text-white p-2 flex flex-col justify-center overflow-x-hidden"
      style={{
        backgroundImage: `url(/images/themes/battle_bg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {notifications}
      <StarField />
      {showDebugPanel && (
        <DebugPanel
          onClose={() => setShowDebugPanel(false)}
          onStartBattle={(playerTeam, enemyTeam, bossTurn) => {
            // debug başlatma
            setShowDebugPanel(false);
            setIsDebugBattle(true);
            setPT(playerTeam);
            setET(enemyTeam);
            if (bossTurn) setBossChallenge("battle");
            setPhase("battle");
            setGameStarted(true);
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