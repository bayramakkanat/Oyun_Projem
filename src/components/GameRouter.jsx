import React, { useState, useEffect, Suspense, lazy } from "react";
import { useUIContext } from "../context/UIContext";
import { useShopContext } from "../context/ShopContext";
import { useBattleContext } from "../context/BattleContext";
import VersusIntro from "./VersusIntro";
import ArenaIntro from "./ArenaIntro";
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
const DebugPanel = lazy(() => import("./DebugPanel"));
import { playSound } from "../hooks/useSound";
import { BOSSES, DIFFICULTY_CONFIGS } from "../data/gameData";
import { shouldShowArenaIntro, incrementArenaIntroCount } from "../utils/localSave";

export default function GameRouter() {
  const {
    gameMode, setGameMode,
    gameStarted, setGameStarted,
    reset, restoreGame,
    friendsData,
    versusAutoJoin, setVersusAutoJoin,
    menuView, setMenuView,
    victory, wins, lives, team,
    arenaResult,
    over,
    bossChallenge, acceptBoss, declineBoss,
    showCollection, setShowCollection,
    guide, setGuide,
    openTiers, setOpenTiers,
    guideLvl, setGuideLvl,
    newTier, setNewTier,
    phase,
    showDebugPanel, setShowDebugPanel,
    lastError, setLastError,
    achievementPopup,
    soundEnabled, setSoundEnabled,
    user, displayName, stats,
    difficultyLevel, setDifficultyLevel,
    unlockAchievement,
    turn, gold, pT, eT, log, step, anims,
    arenaOpponent, battleSpeedRef,
    isPaused, setIsPaused, isPausedRef,
    versusPhase, setVersusPhase, setVersusRoom,
    setBossChallenge, setPhase, setPT, setET, setIsDebugBattle,
    showAuthModal, setShowAuthModal,
    authEmail, setAuthEmail, authPass, setAuthPass,
    authMode, setAuthMode,
    authUsername, setAuthUsername, authAvatar, setAuthAvatar,
    showSettingsModal, setShowSettingsModal,
    settingsUsername, setSettingsUsername, settingsAvatar, setSettingsAvatar,
    handleGoogleLogin, handleEmailAuth, handleLogout, handleUpdateProfile,
  } = { ...useUIContext(), ...useShopContext(), ...useBattleContext() };

  const [versusIntroRoom, setVersusIntroRoom] = useState(null);
  const [showArenaIntro, setShowArenaIntro]   = useState(false);

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
          onRoomReady={(roomInfo) => setVersusIntroRoom(roomInfo)}
          onCancel={() => { setVersusPhase(null); setVersusRoom(null); }}
        />
        {versusIntroRoom && (
          <VersusIntro
            roomInfo={versusIntroRoom}
            user={user}
            onDone={() => {
              const roomInfo = versusIntroRoom;
              setVersusIntroRoom(null);
              setVersusAutoJoin(null);
              setVersusRoom(roomInfo);
              setVersusPhase("playing");
              reset("versus");
              setGameStarted(true);
            }}
          />
        )}
      </>
    );
  }

  // ana menü
  if (!gameStarted) {
    return (
      <>
        {notifications}
        {/* Arena intro aktifken MenuScreen gizlenir — geçişte flash olmaz */}
        {!showArenaIntro && (
          <MenuScreen
            onArenaStart={() => {
              // İlk 3 girişte intro göster, sonra doğrudan başlat
              if (shouldShowArenaIntro()) {
                setShowArenaIntro(true);
              } else {
                reset();
                setGameStarted(true);
                unlockAchievement("first_game");
                playSound("shop_open");
              }
            }}
          />
        )}
        {showDebugPanel && (
          <Suspense fallback={<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 text-white">Yükleniyor...</div>}>
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
          </Suspense>
        )}
        {showArenaIntro && (
          <ArenaIntro
            playerName={displayName || user?.displayName || ""}
            onDone={() => {
              incrementArenaIntroCount(); // Sayacı artır
              setShowArenaIntro(false);
              reset();
              setGameStarted(true);
              unlockAchievement("first_game");
              playSound("shop_open");
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
        onRematch={() => { reset(); setVersusPhase("lobby"); }}
      />
    );
  }

  if (arenaResult) return <ArenaResultScreen />;

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
        onRematch={() => { reset(); setVersusPhase("lobby"); }}
      />
    );
  }

  if (bossChallenge === "offer" && gameMode === "standard") {
    return (
      <BossOfferScreen
        boss={BOSSES[turn]}
        onAccept={acceptBoss}
        onDecline={declineBoss}
      />
    );
  }

  if (showCollection) {
    return <CollectionScreen onClose={() => setShowCollection(false)} userId={user?.uid} />;
  }

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

  if (newTier) {
    return (
      <NewTierScreen
        newTier={newTier}
        onContinue={() => { setNewTier(null); setPhase("shop"); }}
      />
    );
  }

  // ana oyun ekranı
  return (
    <div className="min-h-screen text-white p-2 flex flex-col justify-center overflow-x-hidden animated-bg">
      {notifications}
      <StarField />
      {showDebugPanel && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 text-white">Yükleniyor...</div>}>
          <DebugPanel
            onClose={() => setShowDebugPanel(false)}
            onStartBattle={(playerTeam, enemyTeam, bossTurn) => {
              setShowDebugPanel(false);
              setIsDebugBattle(true);
              setPT(playerTeam);
              setET(enemyTeam);
              if (bossTurn) setBossChallenge("battle");
              setPhase("battle");
              setGameStarted(true);
            }}
          />
        </Suspense>
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
          <div>
            <div className="text-yellow-300 font-bold text-sm">Başarım Kazandın!</div>
            <div className="text-white font-bold">{achievementPopup.name}</div>
          </div>
        </div>
      )}
      {phase === "shop" ? <ShopView /> : <BattleView />}
    </div>
  );
}
