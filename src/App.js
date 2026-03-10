import { useState, useEffect, useRef, useCallback } from "react";
import "./styles.css";
import {
  logError,
  safeNumber,
  loadStats,
  saveStats,
} from "./utils/helpers";
import Card from "./components/Card";
import StarField from "./components/StarField";
import BattleView from "./components/BattleView";
import GuideScreen from "./components/GuideScreen";
import NewTierScreen from "./components/NewTierScreen";
import BossOfferScreen from "./components/BossOfferScreen";
import BossRewardScreen from "./components/BossRewardScreen";
import VictoryScreen from "./components/VictoryScreen";
import GameOverScreen from "./components/GameOverScreen";
import MenuScreen from "./components/MenuScreen";
import VersusLobby from "./components/VersusLobby";
import DebugPanel from "./components/DebugPanel";
import { getDesc } from "./utils/getDesc";
import { applyEndTurnBuffs } from "./utils/battleUtils";
import { playSound } from "./hooks/useSound";
import { useBattle } from "./hooks/useBattle";
import { useShop } from "./hooks/useShop";
import { useAuth } from "./hooks/useAuth";
import { useArena } from "./hooks/useArena";
import { useEndTurn } from "./hooks/useEndTurn";
import { useMusic } from "./hooks/useMusic";
import battleBg from "./battleBg";
import { spawnParticles, spawnBuffAnimation } from "./utils/animations";
import { auth, db } from "./firebase";

import {
  collection,
  setDoc,
  doc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import {
  ABILITY_ICONS,
  DIFFICULTY_CONFIGS,
  ACHIEVEMENTS_DEF,
  BOSSES,
  MAX_STAT,
  WIN_TURN,
} from "./data/gameData";
import SettingsModal from "./components/SettingsModal";

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [menuView, setMenuView] = useState("main"); // "main", "play_setup", "achievements", "stats"
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState(loadStats);
  const [achievementPopup, setAchievementPopup] = useState(null);
  const [gold, setGold] = useState(10);
  const [turn, setTurn] = useState(1);
  const [wins, setWins] = useState(0);
  const [lives, setLives] = useState(5);
  const [team, setTeam] = useState([null, null, null, null, null, null]);
  const [shop, setShop] = useState([]);
  const [phase, setPhase] = useState("shop");
  const [log, setLog] = useState([]);
  const [pT, setPT] = useState([]);
  const [eT, setET] = useState([]);
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState(null);
  const [selI, setSelI] = useState(null);
  const [over, setOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [newTier, setNewTier] = useState(null);
  const [lastT, setLastT] = useState(1);
  const [pGold, setPGold] = useState(0);
  const [showSwordClash, setShowSwordClash] = useState(false);
  const [guide, setGuide] = useState(false);
  const [guideLvl, setGuideLvl] = useState({});
  const [anims, setAnims] = useState({});
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [discountNext, setDiscountNext] = useState(false);
  const [openTiers, setOpenTiers] = useState([1, 2, 3, 4, 5, 6]);
  const logR = useRef(null);
  const battleGoldRef = useRef(0);
  const turnRef = useRef(turn);
const setTurnAndRef = (newTurn) => {
  setTurn(newTurn);
  turnRef.current = newTurn;
};
 const [bossChallenge, setBossChallenge] = useState(null); // null, "offer", "battle", "reward"
  const [bossResult, setBossResult] = useState(null); // "win", "lose"
  const [bossRewards, setBossRewards] = useState([]);
   const [gameMode, setGameMode] = useState("standard"); // "standard" | "arena" | "versus"
  const [versusPhase, setVersusPhase] = useState(null); // null | "lobby" | "playing"
  const [versusRoom, setVersusRoom] = useState(null); // { code, role, roomData }
  const [versusReady, setVersusReady] = useState(false); // bu oyuncu hazır mı
  const [opponentReady, setOpponentReady] = useState(false); // rakip hazır mı
  const lastProcessedStepRef = useRef(-1);
  const lastBattleIdRef = useRef(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isDebugBattle, setIsDebugBattle] = useState(false);
  const [newlyOpenedSlot, setNewlyOpenedSlot] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [difficultyLevel, setDifficultyLevel] = useState(() => {
    return localStorage.getItem("petgame_difficulty") || "normal";
  });
  const battleSpeedRef = useRef(
    parseFloat(localStorage.getItem("petgame_battle_speed")) || 1
  );
  const isPausedRef = useRef(false);
const [isPaused, setIsPaused] = useState(false);
useEffect(() => {
  if (phase === "shop") {
    isPausedRef.current = false;
    setIsPaused(false);
    if (gameMode === "versus") {
      setVersusReady(false);
      setOpponentReady(false);
    }
  }
}, [phase]);

  const [arenaOpponent, setArenaOpponent] = useState(null);
  const [pendingEndTurnAnims, setPendingEndTurnAnims] = useState(false);
  const [shopResetKey, setShopResetKey] = useState(0);

  // --- MULTIPLAYER STATES ---
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authAvatar, setAuthAvatar] = useState("🐺");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsUsername, setSettingsUsername] = useState("");
  const [settingsAvatar, setSettingsAvatar] = useState("🐺");
  const [displayName, setDisplayName] = useState("");


  // Global hata yakalayıcı
  // Resim ön yükleme (düzeltildi - useEffect dışına taşındı)
  useEffect(() => {
    const images = [
      "https://i.ibb.co/LXhW3f9P/ankaboss-removebg.png",
      "https://i.ibb.co/BVvZ1GnD/Erlik.png",
      "https://i.ibb.co/MDrgjfTR/Asena-Canva.png",
    ];
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Global hata yakalayıcı
  useEffect(() => {
    const errorHandler = (event) => {
      console.error("Global hata:", event.error);
      setLastError({
        message: event.error?.message || "Bilinmeyen hata",
        stack: event.error?.stack,
      });
      setTimeout(() => setLastError(null), 3000);
    };
    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, []);
  const maxT = Math.min(Math.ceil(turn / 2), 6);
  const currentDiffConfig =
    DIFFICULTY_CONFIGS[difficultyLevel] || DIFFICULTY_CONFIGS.normal;
  const diffMult = currentDiffConfig.enemyStatMultiplier;
  const difficulty = (1 + Math.floor(turn / 3) * 0.2) * diffMult;
  // ← GÜNCELLENDİ: Tur 9→7 ve Tur 11→9
  const teamSlots = turn >= 7 ? 6 : turn >= 5 ? 5 : 4;
  const shopSlots = turn >= 7 ? 5 : turn >= 5 ? 4 : 3;

  useEffect(() => {
    if (gold >= 15) unlockAchievement("rich");
  }, [gold]);

  useEffect(() => {
    localStorage.setItem("petgame_difficulty", difficultyLevel);
  }, [difficultyLevel]);

  useEffect(() => {
    localStorage.setItem("petgame_battle_speed", battleSpeedRef.current);
  }, []);
  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  const achievementQueueRef = useRef([]);
  const achievementShowingRef = useRef(false);

  const showNextAchievement = () => {
    if (achievementQueueRef.current.length === 0) {
      achievementShowingRef.current = false;
      return;
    }
    achievementShowingRef.current = true;
    const def = achievementQueueRef.current.shift();
    setAchievementPopup(def);
    playSound("achievement");
    setTimeout(() => {
      setAchievementPopup(null);
      setTimeout(() => showNextAchievement(), 400);
    }, 3000);
  };

  const unlockAchievement = (id) => {
    setStats((prev) => {
      if (prev.achievements.includes(id)) return prev;
      const next = { ...prev, achievements: [...prev.achievements, id] };
      saveStats(next, user?.uid);
      const def = ACHIEVEMENTS_DEF.find((a) => a.id === id);
      if (def) {
        setTimeout(() => {
          achievementQueueRef.current.push(def);
          if (!achievementShowingRef.current) showNextAchievement();
        }, 0);
      }
      return next;
    });
  };

  const triggerAnim = (id, type) => {
    setAnims((prev) => ({ ...prev, [id]: type }));
    setTimeout(
      () => setAnims((prev) => ({ ...prev, [id]: null })),
      1000 / battleSpeedRef.current
    );
    playSound(type);
  };

  useEffect(() => {
    const currentMaxT = Math.min(Math.ceil(turn / 2), 6);
    if (currentMaxT > lastT && phase === "shop") {
      setNewTier(currentMaxT);
      setLastT(currentMaxT);
    }
  }, [turn, phase, lastT]);

  const pwr = (a) => {
    if (!a) return 1;
    if (a.lvl === 3) return 3;
    if (a.lvl === 2) return 2;
    return 1;
  };
  const sellP = (a) => Math.ceil(a.lvl + (a.exp >= 1 ? 0.5 : 0));
  const clampStat = (v) => {
    try {
      const num = safeNumber(v, 0);
      return Math.min(Math.max(num, 0), MAX_STAT);
    } catch (e) {
      logError(e, "clampStat");
      return 0;
    }
  };
  useMusic({ soundEnabled, phase, gameStarted });
  const { saveArenaTeam, fetchArenaOpponent } = useArena({ user, turn });
  useEndTurn({
  phase,
  pendingEndTurnAnims,
  setPendingEndTurnAnims,
  team,
  setTeam,
  pwr,
  clampStat,
  triggerAnim,
});
const { battle, startBossBattle, startVersusBattle, versusSetReady } = useBattle({
  phase, setPhase,
  step, setStep,
  pT, setPT, eT, setET,
  log, setLog,
  team, setTeam,
  lives, setLives,
  wins, setWins,
  turn, gold, setGold,
  isBattleOver, setIsBattleOver,
  bossChallenge, setBossChallenge, setBossResult, setBossRewards,
  gameMode, isDebugBattle, setIsDebugBattle,setPGold,setRewards,
  setOver, setVictory, setGameStarted, setShowDebugPanel,
  setNewTier, setLastT, lastT,
  setNewlyOpenedSlot, setPendingEndTurnAnims, setShowSwordClash,
  setArenaOpponent, setVersusReady, setOpponentReady,
  versusReady, versusRoom, versusPhase,
  battleSpeedRef, isPausedRef, battleGoldRef, lastProcessedStepRef,
  turnRef, setTurnAndRef,
  triggerAnim, clampStat, pwr, unlockAchievement, playSound,
  spawnBuffAnimation,
  saveArenaTeam, fetchArenaOpponent,
  difficultyLevel, maxT, teamSlots, difficulty,
  setPGold,
});
const { handleGoogleLogin, handleEmailAuth, handleLogout, handleUpdateProfile } = useAuth({
  authMode,
  authEmail,
  authPass,
  authUsername,
  authAvatar,
  settingsUsername,
  settingsAvatar,
  setUser,
  setShowAuthModal,
  setStats,
  setDisplayName,
  setShowSettingsModal,
});
const { refresh, toggleFreeze, buy, mergeT, sell, swap } = useShop({
  team, setTeam,
  shop, setShop,
  gold, setGold,
  rewards, setRewards,
  turn,
  discountNext, setDiscountNext,
  sel, setSel,
  selI, setSelI,
  shopResetKey,
  maxT,
  shopSlots,
  difficultyLevel,
  pwr,
  sellP,
  clampStat,
  triggerAnim,
  unlockAchievement,
  spawnBuffAnimation,
});
  const isBossTurn = [5, 10, 15].includes(turn) && gameMode === "standard";

  const offerBoss = () => {
    setBossChallenge("offer");
  };

  const acceptBoss = () => {
    setBossChallenge("battle");
    startBossBattle();
  };

  const declineBoss = () => {
    setBossChallenge(null);
    battle();
  };

  useEffect(() => {
    if (logR.current) logR.current.scrollTop = logR.current.scrollHeight;
  }, [log]);


  const reset = () => {
    const cfg =
      DIFFICULTY_CONFIGS[difficultyLevel] || DIFFICULTY_CONFIGS.normal;
    setGold(cfg.startingGold);
    setTurnAndRef(1);
    setWins(0);
    setLives(cfg.startingLives);
    setTeam([null, null, null, null, null, null]);
    setShop([]);
    setShopResetKey((k) => k + 1);
    setPhase("shop");
    setOver(false);
    setVictory(false);
    setRewards([]);
    setNewTier(null);
    setLastT(1);
    setPGold(0);
    setGuideLvl({});
    setAnims({});
    setBossChallenge(null);
    setBossResult(null);
    setBossRewards([]);
    lastProcessedStepRef.current = -1;
    setIsBattleOver(false);
    playSound("shop_open");
  };

  const updateStatsOnEnd = (won, currentTurn, currentWins, currentLives) => {
    setStats((prev) => {
      const next = {
        ...prev,
        totalGames: prev.totalGames + 1,
        totalWins: prev.totalWins + (won ? 1 : 0),
        bestTurn: Math.max(prev.bestTurn, currentTurn),
        bestWins: Math.max(prev.bestWins, currentWins),
      };
      saveStats(next, user?.uid);
      return next;
    });
    unlockAchievement("first_game");
    if (won) unlockAchievement("first_win");
    if (won && currentTurn >= WIN_TURN) unlockAchievement("champion");
    if (won && currentLives === 5) unlockAchievement("perfect");
    if (currentWins >= 5) unlockAchievement("five_wins");
    if (currentLives <= 1) unlockAchievement("survivor");
  };

  useEffect(() => {
    if (victory) {
      playSound("victory");
      updateStatsOnEnd(true, turn, wins, lives);
    }
  }, [victory]);
  useEffect(() => {
    if (over) {
      playSound("defeat");
      updateStatsOnEnd(false, turn, wins, lives);
    }
  }, [over]);
  if (gameMode === "versus" && versusPhase === "lobby") {
    return (
      <VersusLobby
        user={user}
        onRoomReady={(roomInfo) => {
          setVersusRoom(roomInfo);
          setVersusPhase("playing");
          reset();
          setGameStarted(true);
          setTimeout(() => {
            lastBattleIdRef.current = null;
          }, 100);
        }}
        onCancel={() => {
          setVersusPhase(null);
          setVersusRoom(null);
        }}
      />
    );
  }
  if (!gameStarted) {
    return (
      <>
        {showDebugPanel && (
          <DebugPanel
            onClose={() => setShowDebugPanel(false)}
            onStartBattle={(playerTeam, enemyTeam) => {
              setShowDebugPanel(false);
              setIsDebugBattle(true);
              isPausedRef.current = false;
              setIsPaused(false);
              setIsBattleOver(false);
              lastProcessedStepRef.current = -1;
              setRewards([]);
              battleGoldRef.current = 0;
              const pt = [...playerTeam].map((x) => ({ ...x, curHp: x.hp }));
              const et = [...enemyTeam].map((x) => ({ ...x, curHp: x.hp }));
              setET(et);
              setPT(pt);
              setLog(["🧪 DEBUG SAVAŞI BAŞLADI"]);
              setStep(0);
              setPGold(0);
              setPhase("battle");
              setGameStarted(true);
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
        />
      </>
    );
  }
  if (victory) {
    return (
      <VictoryScreen
        wins={wins}
        lives={lives}
        team={team}
        perfectRun={
          lives === (DIFFICULTY_CONFIGS[difficultyLevel]?.startingLives || 5)
        }
        onRestart={reset}
        onMenu={() => {
          reset();
          setGameStarted(false);
        }}
      />
    );
  }

  if (over) {
    return (
      <GameOverScreen
        turn={turn}
        wins={wins}
        stats={stats}
        team={team}
        onRestart={reset}
        onMenu={() => {
          reset();
          setGameStarted(false);
        }}
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

  if (bossChallenge === "reward" && gameMode === "standard") {
    const goToShop = () => {
      setBossChallenge(null);
      setBossResult(null);
      setBossRewards([]);
      const newTurn = turn + 1;
      setTurnAndRef(newTurn);
      setGold((g) => g + 10);
      const finalTeam = applyEndTurnBuffs(team);
      setTeam(finalTeam);
      setPendingEndTurnAnims(true);
      setPhase("shop");
    };
    return (
      <BossRewardScreen
        boss={BOSSES[turn]}
        bossRewards={bossRewards}
        teamFull={team.filter((x) => x).length >= teamSlots}
        onSelectReward={(a) => {
          setRewards((prev) => [...prev, { ...a, isR: true }]);
          goToShop();
        }}
        onSkip={goToShop}
      />
    );
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
        onContinue={() => {
          setNewTier(null);
          setPhase("shop");
        }}
      />
    );
  }

  const empty = team.filter((x) => x === null).length;
  const hasR = rewards.length > 0;

  return (
   <div className="min-h-screen text-white p-2" style={{
  backgroundImage: `url(${battleBg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
}}>
      <StarField />
      {showDebugPanel && (
        <DebugPanel
          onClose={() => setShowDebugPanel(false)}
          onStartBattle={(playerTeam, enemyTeam) => {
            setShowDebugPanel(false);
            setIsDebugBattle(true);
            isPausedRef.current = false;
setIsPaused(false);
            setIsBattleOver(false);
            lastProcessedStepRef.current = -1;
            setRewards([]);
            battleGoldRef.current = 0;
           const pt = [...playerTeam].map((x) => ({ ...x, curHp: x.hp }));
const et = [...enemyTeam].map((x) => ({ ...x, curHp: x.hp }));
            setET(et);
            setPT(pt);
            setLog(["🧪 DEBUG SAVAŞI BAŞLADI"]);
            setStep(0);
            setPGold(0);
            setPhase("battle");
          }}
        />
      )}
      {/* HATA GÖSTERİCİ */}
      {lastError && (
        <div className="fixed top-4 left-4 z-[9999] bg-red-900 border-2 border-red-500 rounded-lg p-3 max-w-md shadow-2xl">
          <div className="font-bold text-red-300 mb-1">⚠️ Bir Hata Oluştu</div>
          <div className="text-sm text-white">{lastError.message}</div>
          <button
            onClick={() => setLastError(null)}
            className="mt-2 px-2 py-1 bg-red-700 rounded text-xs hover:bg-red-600"
          >
            Kapat
          </button>
        </div>
      )}
      {achievementPopup && (
        <div
          className="fixed top-6 right-6 z-50 bg-gradient-to-br from-yellow-900 to-orange-900 border-2 border-yellow-400 rounded-xl p-4 shadow-2xl flex items-center gap-3"
          style={{ animation: "slideIn 0.3s ease-out" }}
        >
          <span className="text-3xl">{achievementPopup.icon}</span>
          <div>
            <div className="text-yellow-300 font-bold text-sm">
              Başarım Kazandın!
            </div>
            <div className="text-white font-bold">{achievementPopup.name}</div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
    <div className="flex justify-between items-center mb-3 px-1">
  {/* SOL: Tur / Kademe / Zorluk / Boss */}
  <div className="flex items-center gap-2 flex-wrap">
    {/* Tur */}
    <div className="flex flex-col items-center bg-gray-900/80 border border-white/20 px-3 py-1.5 rounded-2xl shadow-inner min-w-[52px]">
      <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">TUR</span>
      <span className="text-white font-black text-base leading-none">{turn}<span className="text-gray-500 text-[10px] font-bold">/{WIN_TURN}</span></span>
    </div>
    {/* Kademe */}
   <div className="flex flex-col items-center bg-purple-900/60 border border-purple-400/30 px-3 py-1.5 rounded-2xl shadow-inner">
  <span className="text-[9px] text-purple-300 uppercase tracking-widest font-black mb-1">KADEME</span>
<div className="flex gap-0.5">
  {[1,2,3,4,5,6].map(i => (
    <span
      key={i}
      className={i <= maxT ? "text-sm" : "text-sm opacity-20 grayscale"}
      style={i === maxT ? {
        animation: "tierUnlock 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        display: "inline-block"
      } : {}}
    >⭐</span>
  ))}
</div>
</div>
    {/* Zorluk */}
    {gameMode === "standard" && (
      <div className={`flex flex-col items-center px-3 py-1.5 rounded-2xl border shadow-inner min-w-[52px] ${
        difficultyLevel === "easy" ? "bg-green-900/60 border-green-400/30" :
        difficultyLevel === "hard" ? "bg-red-900/60 border-red-400/30" :
        "bg-yellow-900/60 border-yellow-400/30"
      }`}>
        <span className={`text-[9px] uppercase tracking-widest font-black ${
          difficultyLevel === "easy" ? "text-green-300" :
          difficultyLevel === "hard" ? "text-red-300" : "text-yellow-300"
        }`}>ZORLUK</span>
        <span className="font-black text-sm leading-none text-white">{DIFFICULTY_CONFIGS[difficultyLevel]?.label || "😐 Orta"}</span>
      </div>
    )}
    {/* Boss Uyarısı */}
    {BOSSES[turn + 1] && gameMode === "standard" && (
      <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-900/80 to-orange-900/80 border border-red-500/60 rounded-2xl shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse">
        <span className="text-base">{BOSSES[turn + 1].emoji}</span>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] text-red-300 font-black uppercase tracking-widest">Sonraki</span>
          <span className="text-red-100 font-black text-xs">BOSS!</span>
        </div>
      </div>
    )}
    {/* Rehber */}
    <button
      onClick={() => setGuide(true)}
      className="p-2 bg-gray-900/70 rounded-xl text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30"
      title="Kademe Rehberi"
    >🗺️</button>
  </div>

  {/* SAĞ: Altın / Can / Zafer / Güç / Butonlar */}
  <div className="flex items-center gap-2">
    {/* Altın */}
    <div className="flex flex-col items-center bg-yellow-900/60 border border-yellow-500/40 px-3 py-1.5 rounded-2xl min-w-[48px]">
      <span className="text-[9px] text-yellow-400 uppercase tracking-widest font-black">ALTIN</span>
      <span className="text-yellow-200 font-black text-base leading-none">💰{gold}</span>
    </div>
    {/* Can */}
    <div className="flex flex-col items-center bg-red-900/60 border border-red-500/40 px-3 py-1.5 rounded-2xl min-w-[48px]">
      <span className="text-[9px] text-red-400 uppercase tracking-widest font-black">CAN</span>
      <span className="text-red-200 font-black text-base leading-none">❤️{lives}</span>
    </div>
    {/* Zafer */}
    <div className="flex flex-col items-center bg-green-900/60 border border-green-500/40 px-3 py-1.5 rounded-2xl min-w-[48px]">
      <span className="text-[9px] text-green-400 uppercase tracking-widest font-black">ZAFERLEr</span>
      <span className="text-green-200 font-black text-base leading-none">✓{wins}</span>
    </div>
    {/* Güç */}
    <div className="flex flex-col items-center bg-purple-900/60 border border-purple-500/40 px-3 py-1.5 rounded-2xl min-w-[48px]">
      <span className="text-[9px] text-purple-400 uppercase tracking-widest font-black">GÜÇ</span>
      <span className="text-purple-200 font-black text-base leading-none">⚡{team.filter(x=>x).reduce((s,p)=>s+p.atk+p.hp,0)}</span>
    </div>
    {/* Ses */}
    <button
      title={soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
      onClick={() => setSoundEnabled(s => !s)}
      className="p-2 bg-gray-900/70 rounded-xl text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30"
    >{soundEnabled ? "🔊" : "🔇"}</button>
    {/* Menü */}
    <button
      onClick={() => { reset(); setGameStarted(false); }}
      className="p-2 bg-gray-900/70 rounded-xl text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30"
      title="Ana Menü"
    >🏠</button>
  </div>
</div>
        {phase === "shop" ? (
          <>
      <div className="bg-black/60 rounded-[2.5rem] p-4 mb-4 border border-white/10 shadow-2xl relative group/shop">
              {/* Shop Gradient Glow */}
           <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
  <span className="text-yellow-300/90">🛒 HAYVAN MAĞAZASI</span>
  <span className="text-blue-300/80 font-bold px-2 py-1 bg-blue-500/10 border border-blue-400/20 rounded-lg">
  SAĞ TIK = ❄️ DONDUR
</span>
</div>
          <div className="flex gap-2.5 justify-center items-end">
                {shop.map((a, idx) => (
                  <div
                    key={a.id}
                   className="flex flex-col items-center flex-shrink-0 gap-1 justify-end"
                  >
                    <div
                      className={`relative transition-all duration-300 ${
                        a.frozen
                          ? "ring-2 ring-blue-400 shadow-lg shadow-blue-400/50"
                          : team.some(
                              (t) =>
                                t &&
                                t.name === a.name &&
                                t.tier === a.tier &&
                                t.lvl < 3
                            )
                          ? ""
                          : ""
                      } ${
                        gold < a.cost
                          ? "opacity-60 grayscale cursor-not-allowed"
                          : "hover:scale-105 cursor-pointer"
                      }`}
                     style={
  !a.frozen &&
  team.some(
    (t) =>
      t &&
      t.name === a.name &&
      t.tier === a.tier &&
      t.lvl < 3
  )
 ? { 
    boxShadow: "0 0 12px rgba(168, 85, 247, 0.7), 0 0 24px rgba(168, 85, 247, 0.3)",
    outline: "2px solid rgba(168, 85, 247, 0.6)",
    borderRadius: "1rem"
  }
    : {}
}
                      onClick={() => setSel(sel?.id === a.id ? null : a)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleFreeze(a);
                      }}
                      onTouchStart={(e) => {
                        const timer = setTimeout(() => {
                          toggleFreeze(a);
                        }, 500);
                        e.currentTarget._longPressTimer = timer;
                      }}
                      onTouchEnd={(e) => {
                        clearTimeout(e.currentTarget._longPressTimer);
                      }}
                      onTouchMove={(e) => {
                        clearTimeout(e.currentTarget._longPressTimer);
                      }}
                    >
                      <Card
                        a={a}
                        anim={anims[a.id]}
                        onClick={() => {}}
                        selected={sel?.id === a.id}
                        showName={false}
                        getDesc={getDesc}
                        shop={shop}
                        team={team}
                        mirror={true}
                      />
                     {a.frozen && (
                        <div className="absolute -top-1 -left-1 text-xl">
                          ❄️
                        </div>
                      )}
                      {sel?.id === a.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-[60]">
                          <span className="text-white text-xs font-black">✓</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-yellow-300 font-bold">
                      {a.cost}💰
                    </span>
                  </div>
                ))}
                {shopSlots < 4 && (
                  <div className="flex flex-col items-center flex-shrink-0 gap-1 opacity-40 h-[180px] justify-end">
                    <div className="w-28 h-36 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center">
                    <span className="text-2xl">
                        🔒
                      </span>
                      <span className="text-[10px] font-black tracking-tighter mt-1 text-yellow-400 uppercase">
                        Tur 5
                      </span>
                    </div>
                    <span className="text-sm font-bold opacity-0">0💰</span>
                  </div>
                )}
                {shopSlots < 5 && (
                  <div className="flex flex-col items-center flex-shrink-0 gap-1 opacity-40 h-[180px] justify-end">
                    <div className="w-28 h-36 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center">
                     <span className="text-2xl">
                        🔒
                      </span>
                      <span className="text-[10px] font-black tracking-tighter mt-1 text-yellow-400 uppercase">
                        Tur 7
                      </span>
                    </div>
                    <span className="text-sm font-bold opacity-0">0💰</span>
                  </div>
                )}
               <div className="flex flex-col items-center flex-shrink-0 gap-1 h-[180px] justify-end">
                  <button
                    onClick={() => {
                      const unfrozen = shop.filter((s) => !s.frozen);
                      if (unfrozen.length === 0 || gold >= 1) {
                        if (unfrozen.length > 0) setGold((g) => g - 1);
                        refresh();
                        playSound("refresh");
                      }
                    }}
                    disabled={
                      gold < 1 && shop.filter((s) => !s.frozen).length > 0
                    }
                  className="w-28 h-36 rounded-2xl bg-transparent disabled:opacity-40 flex flex-col items-center justify-center hover:bg-white/5 transition-all border-2 border-dashed border-white/10 group/roll"
                  >
                    <span className="text-3xl group-hover/roll:rotate-180 transition-transform duration-500">
                      🔄
                    </span>
                    <span className="text-xs font-black mt-2">
                      {shop.filter((s) => !s.frozen).length === 0
                        ? "BEDAVA"
                        : "1 💰"}
                    </span>
                  </button>
                  <span className="text-[10px] text-blue-400 font-black tracking-widest uppercase">
                    YENİLE
                  </span>
                </div>
              </div>
            </div>
            {sel && (
              <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-72 bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
                {/* Kapat butonu */}
                <button
                  onClick={() => setSel(null)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
                >
                  ✕
                </button>
                {/* Hayvan büyük görünüm */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-700">
                  <span className="text-6xl">{sel.name}</span>
                  <div>
                    <div className="text-white font-black text-lg">
                      {sel.nick}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Kademe {sel.tier}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-orange-600/80 px-2 py-0.5 rounded-full text-xs font-bold">
                        ⚔️ {sel.atk}
                      </span>
                      <span className="bg-green-600/80 px-2 py-0.5 rounded-full text-xs font-bold">
                        ❤️ {sel.hp}
                      </span>
                      <span className="bg-yellow-600/80 px-2 py-0.5 rounded-full text-xs font-bold">
                        💰 {sel.cost}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Seviye bazlı beceriler */}
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((lvl) => (
                    <div
                      key={lvl}
                      className={`rounded-xl p-2.5 border ${
                        lvl === 1
                          ? "border-gray-500 bg-gray-800/60"
                          : lvl === 2
                          ? "border-blue-500/60 bg-blue-900/20"
                          : "border-yellow-500/60 bg-yellow-900/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">
                          {lvl === 1 ? "⭐" : lvl === 2 ? "💎" : "👑"}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            lvl === 1
                              ? "text-gray-300"
                              : lvl === 2
                              ? "text-blue-300"
                              : "text-yellow-300"
                          }`}
                        >
                          {lvl === 1
                            ? "1. Seviye"
                            : lvl === 2
                            ? "2. Seviye"
                            : "3. Seviye (MAX)"}
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                          ⚔️{sel.atk + lvl - 1} ❤️{sel.hp + lvl - 1}
                        </span>
                      </div>
                      <div className="text-xs text-gray-200 leading-relaxed">
                        {ABILITY_ICONS[sel.ability]}{" "}
                        {getDesc({ ...sel, lvl }, lvl)}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Satın al butonu */}
                <button
                  onClick={() => {
                    const emptySlot = team.findIndex(
                      (x) => x === null && team.indexOf(x) < teamSlots
                    );
                    const validSlot = team.findIndex(
                      (x, i) => x === null && i < teamSlots
                    );
                    if (validSlot !== -1 && gold >= sel.cost)
                      buy(sel, validSlot);
                  }}
                  disabled={
                    gold < sel.cost ||
                    team.slice(0, teamSlots).every((x) => x !== null)
                  }
                  className="mt-3 w-full py-2 bg-gradient-to-br from-green-600 to-green-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold hover:from-green-500 hover:to-green-700 transition-all border border-green-400 text-sm"
                >
                  {gold < sel.cost
                    ? `💰 Yeterli altın yok (${sel.cost} gerekli)`
                    : team.slice(0, teamSlots).every((x) => x !== null)
                    ? "❌ Takım dolu"
                    : `✅ Satın Al (${sel.cost}💰)`}
                </button>
              </div>
            )}
            {hasR && (
              <div className="bg-gradient-to-br from-yellow-900/60 to-orange-900/60 border-2 border-yellow-500 rounded-xl p-3 mb-3 shadow-xl">
                <div className="text-sm text-yellow-300 mb-2 font-bold">
                  🎁 Seviye Ödülü (1 seç!){" "}
                  {empty === 0 && (
                    <span className="text-red-400">- Slot boşalt!</span>
                  )}
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                 {rewards.map((a) => (
  <div
    key={a.id}
    className="flex flex-col items-center relative"
    onClick={() => setSel(sel?.id === a.id ? null : a)}
  >
    <div className="relative">
      <Card
        a={a}
        anim={anims[a.id]}
        onClick={() => {}}
        selected={sel?.id === a.id}
        showName={false}
        getDesc={getDesc}
        shop={shop}
        team={team}
        mirror={true}
      />
      {sel?.id === a.id && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-[60]">
          <span className="text-white text-xs font-black">✓</span>
        </div>
      )}
    </div>
    <span className="text-xs text-green-300 font-bold mt-1">
      K{a.rT}
    </span>
  </div>
))}
                </div>
              </div>
            )}

       <div className="bg-black/60 rounded-[2.5rem] p-4 mb-3 border border-white/10 shadow-2xl relative overflow-visible">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-4">
                <span className="text-yellow-300/90">⚔️ SAVAŞ TAKIMI</span>
                {sel && <span className="text-yellow-300"> - Slot seç</span>}
              </div>
            <div className="flex gap-2.5 justify-center px-1 py-3">
                {team.map((a, i) => {
                  // ← GÜNCELLENDİ: Tur 7 ve Tur 9
                  const isLocked =
                    (i === 4 && turn < 5) || (i === 5 && turn < 7);
                  const lockedTurn = i === 4 ? 5 : 7;
                  const isJustOpened =
                    (i === 4 && newlyOpenedSlot === "shop_4_team_4") ||
                    (i === 5 && newlyOpenedSlot === "shop_5_team_5");

                  if (isJustOpened) {
                    return (
                      <div
                        key={i}
                        className="flex flex-col items-center flex-shrink-0"
                      >
                        <button
                          onClick={() => {
                            if (sel) buy(sel, i);
                            else if (selI !== null) swap(selI, i);
                          }}
                          className="w-28 h-36 rounded-2xl border-2 border-green-500/50 text-green-400 text-3xl transition-all bg-green-500/10 backdrop-blur-md flex flex-col items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                          style={{
                            animation:
                              "slotUnlock 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                          }}
                        >
                          <span
                            style={{
                              animation: "lockBreak 0.8s ease-out forwards",
                              display: "inline-block",
                            }}
                          >
                            🔓
                          </span>
                          <span className="text-[10px] uppercase font-black tracking-widest mt-2">
                            Açıldı!
                          </span>
                        </button>
                      </div>
                    );
                  }
                 if (isLocked) {
                    return (
                      <div
  key={i}
  className="flex flex-col items-center flex-shrink-0 gap-1 opacity-40"
>
  <div className="w-28 h-36 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center">
    <span className="text-2xl">
      🔒
    </span>
    <span className="text-[10px] font-black tracking-tighter mt-1 text-yellow-400 uppercase">
      Tur {lockedTurn}
    </span>
  </div>
</div>
                    );
                  }
                  return a ? (
                    <div
                      key={a.id}
                      onClick={() => {
                        if (sel) buy(sel, i);
                        else if (selI !== null && selI !== i) {
                          if (!mergeT(selI, i)) swap(selI, i);
                        } else setSelI(selI === i ? null : i);
                      }}
                      className="flex flex-col items-center flex-shrink-0"
                    >
                      <div className="relative group">
                        <Card
                          a={a}
                          anim={anims[a.id]}
                          selected={selI === i}
                          onSell={() => sell(i)}
                          onClick={() => {}}
                          showName={false}
                          getDesc={getDesc}
                          mirror={true}
                        />
                        {selI === i && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-black z-20 flex items-center justify-center text-[8px] font-black text-black">
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      key={i}
                      className="flex flex-col items-center flex-shrink-0"
                    >
                      <button
                        onClick={() => {
                          if (sel) buy(sel, i);
                          else if (selI !== null) swap(selI, i);
                        }}
                       className={`w-28 h-36 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center group/slot
${
  sel || selI !== null
    ? "border-green-400/70 bg-green-500/5 text-green-400/50 hover:border-green-400 hover:bg-green-500/10 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
    : "border-white/10 text-white/10 bg-transparent hover:border-white/30 hover:text-white/30 hover:scale-105 active:scale-95"
}`}
                      >
                        <span className="group-hover/slot:rotate-90 transition-transform duration-300">
                          +
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-400 text-center mt-2 flex justify-between px-8"></div>
            </div>

            {isBossTurn && bossChallenge === null ? (
              <div className="flex gap-4 mt-2">
                <button
                  onClick={offerBoss}
                  disabled={team.filter((x) => x).length === 0}
                  className="flex-1 group relative py-4 bg-gradient-to-br from-orange-600 to-red-800 disabled:opacity-40 rounded-2xl font-black text-lg tracking-tight hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_40px_rgba(234,88,12,0.3)] overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    🔥 BOSS MEYDAN OKUMASI
                  </div>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <button
                  onClick={battle}
                  disabled={
                    team.filter((x) => x).length === 0 || phase === "battle"
                  }
                  className="flex-1 group relative py-4 bg-gradient-to-br from-green-600 to-emerald-800 disabled:opacity-40 rounded-2xl font-black text-lg tracking-tight hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_40px_rgba(22,163,74,0.3)] overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    ⚔️ NORMAL SAVAŞ
                  </div>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>
            ) : (
              <button
                onClick={battle}
                disabled={
                  team.filter((x) => x).length === 0 ||
                  phase === "battle" ||
                  (gameMode === "versus" && versusReady)
                }
          className="w-full group relative py-5 mt-2 bg-gray-800/60 disabled:cursor-not-allowed rounded-2xl font-black text-2xl tracking-tighter hover:scale-[1.01] hover:bg-gray-700/70 hover:border-gray-500/60 active:scale-95 transition-all duration-200 border-2 border-gray-600/40 text-gray-300 overflow-hidden"
              >
              <div className="relative z-10 flex items-center justify-center gap-3">
  {team.filter((x) => x).length === 0
   ? <><span className="text-4xl">🐾</span><span>ÖNCE TAKIMINA HAYVAN EKLE!</span></>
                    : gameMode === "versus" && versusReady
                    ? `⏳ Rakip Bekleniyor... ${opponentReady ? "✓" : ""}`
                    : gameMode === "versus"
                    ? "✅ Hazırım!"
                    : "⚔️ SAVAŞI BAŞLAT"}
                </div>
               <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
            )}
          </>
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
   </div>
  );
}