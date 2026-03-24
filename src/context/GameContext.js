import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

import "../styles.css";
import {
  logError,
  safeNumber,
  loadStats,
  saveStats,
} from "../utils/helpers";
import Card from "../components/Card";
import StarField from "../components/StarField";
import BattleView from "../components/BattleView";
import GuideScreen from "../components/GuideScreen";
import NewTierScreen from "../components/NewTierScreen";
import BossOfferScreen from "../components/BossOfferScreen";
import BossRewardScreen from "../components/BossRewardScreen";
import VictoryScreen from "../components/VictoryScreen";
import GameOverScreen from "../components/GameOverScreen";
import MenuScreen from "../components/MenuScreen";
import CollectionScreen from "../components/CollectionScreen";
import VersusLobby from "../components/VersusLobby";
import DebugPanel from "../components/DebugPanel";
import { getDesc } from "../utils/getDesc";
import { applyEndTurnBuffs } from "../utils/battleUtils";
import { playSound } from "../hooks/useSound";
import { useBattle } from "../hooks/useBattle";
import { useShop } from "../hooks/useShop";
import { useAuth } from "../hooks/useAuth";
import { useArena } from "../hooks/useArena";
import { calcArenaXP, getRank } from "../utils/helpers";
import { useEndTurn } from "../hooks/useEndTurn";
import { useMusic } from "../hooks/useMusic";
import { spawnParticles, spawnBuffAnimation } from "../utils/animations";
import { auth, db } from "../firebase";

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
} from "../data/gameData";
import SettingsModal from "../components/SettingsModal";



export const GameContext = createContext();

export const GameProvider = ({ children }) => {

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
  const [targetBuffHint, setTargetBuffHint] = useState(false);
  const [selI, setSelI] = useState(null);
  const [over, setOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [newTier, setNewTier] = useState(null);
  const [lastT, setLastT] = useState(1);
  const [arenaResult, setArenaResult] = useState(null);
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
  const [showCollection, setShowCollection] = useState(false);

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
      "/images/animals/phoenix.png",
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
const { saveArenaTeam, fetchArenaOpponent, updateLeaderboard, loadTasksFromDB, saveTasksToDB } = useArena({ user, turnRef });
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
  saveArenaTeam, fetchArenaOpponent, updateLeaderboard, setArenaResult, saveTasksToDB,
  user,
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
      // Gizli başarım: tüm başarımları topla
      const nonSecretIds = ACHIEVEMENTS_DEF
        .filter(a => !a.secret)
        .map(a => a.id);
      const hasAll = nonSecretIds.every(id =>
        (next.achievements || []).includes(id)
      );
      if (hasAll) unlockAchievement("secret_all");
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
    if (gameMode === "arena") {
      const isNewBestTurn = turn > (stats.bestTurn || 0);
      updateLeaderboard({ won: true, isNewBestTurn });
    }
  }
}, [victory]);
useEffect(() => {
  if (over) {
    playSound("defeat");
    updateStatsOnEnd(false, turn, wins, lives);
    if (gameMode === "arena") {
      const isNewBestTurn = turn > (stats.bestTurn || 0);
      updateLeaderboard({ won: false, isNewBestTurn });
    }
  }
}, [over]);

  const empty = team.filter((x) => x === null).length;
  const hasR = rewards.length > 0;

  return (
    <GameContext.Provider value={{
        acceptBoss,
    achievementPopup,
    achievementQueueRef,
    achievementShowingRef,
    anims,
    arenaOpponent,
    arenaResult,
    authAvatar,
    authEmail,
    authMode,
    authPass,
    authUsername,
    battle,
    battleGoldRef,
    battleSpeedRef,
    bossChallenge,
    bossResult,
    bossRewards,
    buy,
    clampStat,
    currentDiffConfig,
    declineBoss,
    diffMult,
    difficulty,
    difficultyLevel,
    discountNext,
    displayName,
    eT,
    empty,
    fetchArenaOpponent,
    gameMode,
    gameStarted,
    gold,
    guide,
    guideLvl,
    handleEmailAuth,
    handleGoogleLogin,
    handleLogout,
    handleUpdateProfile,
    hasR,
    isBattleOver,
    isBossTurn,
    isDebugBattle,
    isPaused,
    isPausedRef,
    lastBattleIdRef,
    lastError,
    lastProcessedStepRef,
    lastT,
    lives,
    loadTasksFromDB,
    log,
    logR,
    maxT,
    menuView,
    mergeT,
    newTier,
    newlyOpenedSlot,
    offerBoss,
    openTiers,
    opponentReady,
    over,
    pGold,
    pT,
    pendingEndTurnAnims,
    phase,
    pwr,
    refresh,
    reset,
    rewards,
    saveArenaTeam,
    saveTasksToDB,
    sel,
    selI,
    sell,
    sellP,
    setAchievementPopup,
    setAnims,
    setArenaOpponent,
    setArenaResult,
    setAuthAvatar,
    setAuthEmail,
    setAuthMode,
    setAuthPass,
    setAuthUsername,
    setBossChallenge,
    setBossResult,
    setBossRewards,
    setDifficultyLevel,
    setDiscountNext,
    setDisplayName,
    setET,
    setGameMode,
    setGameStarted,
    setGold,
    setGuide,
    setGuideLvl,
    setIsBattleOver,
    setIsDebugBattle,
    setIsPaused,
    setLastError,
    setLastT,
    setLives,
    setLog,
    setMenuView,
    setNewTier,
    setNewlyOpenedSlot,
    setOpenTiers,
    setOpponentReady,
    setOver,
    setPGold,
    setPT,
    setPendingEndTurnAnims,
    setPhase,
    setRewards,
    setSel,
    setSelI,
    setSettingsAvatar,
    setSettingsUsername,
    setShop,
    setShopResetKey,
    setShowAuthModal,
    setShowCollection,
    setShowDebugPanel,
    setShowSettingsModal,
    setShowSwordClash,
    setSoundEnabled,
    setStats,
    setStep,
    setTargetBuffHint,
    setTeam,
    setTurn,
    setTurnAndRef,
    setUser,
    setVersusPhase,
    setVersusReady,
    setVersusRoom,
    setVictory,
    setWins,
    settingsAvatar,
    settingsUsername,
    shop,
    shopResetKey,
    shopSlots,
    showAuthModal,
    showCollection,
    showDebugPanel,
    showNextAchievement,
    showSettingsModal,
    showSwordClash,
    soundEnabled,
    startBossBattle,
    startVersusBattle,
    stats,
    step,
    swap,
    targetBuffHint,
    team,
    teamSlots,
    toggleFreeze,
    triggerAnim,
    turn,
    turnRef,
    unlockAchievement,
    updateLeaderboard,
    updateStatsOnEnd,
    user,
    versusPhase,
    versusReady,
    versusRoom,
    versusSetReady,
    victory,
    wins
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => useContext(GameContext);
