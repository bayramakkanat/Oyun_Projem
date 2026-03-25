import { useAuthContext } from "./AuthContext";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

import { logError, safeNumber, saveStats } from "../utils/helpers";
import { playSound } from "../hooks/useSound";
import { useBattle } from "../hooks/useBattle";
import { useShop } from "../hooks/useShop";
import { useArena } from "../hooks/useArena";
import { useEndTurn } from "../hooks/useEndTurn";
import { useMusic } from "../hooks/useMusic";
import { spawnBuffAnimation } from "../utils/animations";

import {
  DIFFICULTY_CONFIGS,
  ACHIEVEMENTS_DEF,
  BOSSES,
  MAX_STAT,
  WIN_TURN,
} from "../data/gameData";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  // ─── Auth (AuthContext'ten) ──────────────────────────────────────────────
  const {
    user, setUser,
    showAuthModal, setShowAuthModal,
    authEmail, setAuthEmail,
    authPass, setAuthPass,
    authMode, setAuthMode,
    authUsername, setAuthUsername,
    authAvatar, setAuthAvatar,
    showSettingsModal, setShowSettingsModal,
    settingsUsername, setSettingsUsername,
    settingsAvatar, setSettingsAvatar,
    displayName, setDisplayName,
    stats, setStats,
    handleGoogleLogin,
    handleEmailAuth,
    handleLogout,
    handleUpdateProfile,
  } = useAuthContext();

  // ─── Oyun durumu ─────────────────────────────────────────────────────────
  const [gameStarted,         setGameStarted]         = useState(false);
  const [menuView,             setMenuView]             = useState("main");
  const [soundEnabled,         setSoundEnabled]         = useState(true);
  const [achievementPopup,     setAchievementPopup]     = useState(null);
  const [gold,                 setGold]                 = useState(10);
  const [turn,                 setTurn]                 = useState(1);
  const [wins,                 setWins]                 = useState(0);
  const [lives,                setLives]                = useState(5);
  const [team,                 setTeam]                 = useState([null, null, null, null, null, null]);
  const [shop,                 setShop]                 = useState([]);
  const [phase,                setPhase]                = useState("shop");
  const [log,                  setLog]                  = useState([]);
  const [pT,                   setPT]                   = useState([]);
  const [eT,                   setET]                   = useState([]);
  const [step,                 setStep]                 = useState(0);
  const [sel,                  setSel]                  = useState(null);
  const [targetBuffHint,       setTargetBuffHint]       = useState(false);
  const [selI,                 setSelI]                 = useState(null);
  const [over,                 setOver]                 = useState(false);
  const [victory,              setVictory]              = useState(false);
  const [rewards,              setRewards]              = useState([]);
  const [newTier,              setNewTier]              = useState(null);
  const [lastT,                setLastT]                = useState(1);
  const [arenaResult,          setArenaResult]          = useState(null);
  const [pGold,                setPGold]                = useState(0);
  const [showSwordClash,       setShowSwordClash]       = useState(false);
  const [guide,                setGuide]                = useState(false);
  const [guideLvl,             setGuideLvl]             = useState({});
  const [anims,                setAnims]                = useState({});
  const [isBattleOver,         setIsBattleOver]         = useState(false);
  const [discountNext,         setDiscountNext]         = useState(false);
  const [openTiers,            setOpenTiers]            = useState([1, 2, 3, 4, 5, 6]);
  const [bossChallenge,        setBossChallenge]        = useState(null);
  const [bossResult,           setBossResult]           = useState(null);
  const [bossRewards,          setBossRewards]          = useState([]);
  const [gameMode,             setGameMode]             = useState("standard");
  const [versusPhase,          setVersusPhase]          = useState(null);
  const [versusRoom,           setVersusRoom]           = useState(null);
  const [versusReady,          setVersusReady]          = useState(false);
  const [opponentReady,        setOpponentReady]        = useState(false);
  const [showDebugPanel,       setShowDebugPanel]       = useState(false);
  const [isDebugBattle,        setIsDebugBattle]        = useState(false);
  const [newlyOpenedSlot,      setNewlyOpenedSlot]      = useState(null);
  const [lastError,            setLastError]            = useState(null);
  const [arenaOpponent,        setArenaOpponent]        = useState(null);
  const [pendingEndTurnAnims,  setPendingEndTurnAnims]  = useState(false);
  const [shopResetKey,         setShopResetKey]         = useState(0);
  const [showCollection,       setShowCollection]       = useState(false);
  const [isPaused,             setIsPaused]             = useState(false);
  const [difficultyLevel,      setDifficultyLevel]      = useState(
    () => localStorage.getItem("petgame_difficulty") || "normal"
  );

  // ─── Ref'ler ──────────────────────────────────────────────────────────────
  const logR                 = useRef(null);
  const battleGoldRef        = useRef(0);
  const turnRef              = useRef(turn);
  const lastProcessedStepRef = useRef(-1);
  const lastBattleIdRef      = useRef(null);
  const isPausedRef          = useRef(false);
  const battleSpeedRef       = useRef(
    parseFloat(localStorage.getItem("petgame_battle_speed")) || 1
  );
  const achievementQueueRef   = useRef([]);
  const achievementShowingRef = useRef(false);

  // ─── Türetilmiş değerler (useMemo) ───────────────────────────────────────
  const maxT = useMemo(() => Math.min(Math.ceil(turn / 2), 6), [turn]);

  const { currentDiffConfig, diffMult, difficulty } = useMemo(() => {
    const cfg  = DIFFICULTY_CONFIGS[difficultyLevel] || DIFFICULTY_CONFIGS.normal;
    return {
      currentDiffConfig: cfg,
      diffMult:          cfg.enemyStatMultiplier,
      difficulty:        (1 + Math.floor(turn / 3) * 0.2) * cfg.enemyStatMultiplier,
    };
  }, [difficultyLevel, turn]);

  const teamSlots = useMemo(() => (turn >= 7 ? 6 : turn >= 5 ? 5 : 4), [turn]);
  const shopSlots = useMemo(() => (turn >= 7 ? 5 : turn >= 5 ? 4 : 3), [turn]);
  const isBossTurn = useMemo(
    () => [5, 10, 15].includes(turn) && gameMode === "standard",
    [turn, gameMode]
  );
  const empty = useMemo(() => team.filter((x) => x === null).length, [team]);
  const hasR  = useMemo(() => rewards.length > 0, [rewards]);

  // ─── turnRef senkronizasyonu ──────────────────────────────────────────────
  const setTurnAndRef = useCallback((newTurn) => {
    setTurn(newTurn);
    turnRef.current = newTurn;
  }, []);

  useEffect(() => { turnRef.current = turn; }, [turn]);

  // ─── localStorage kalıcılığı ──────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("petgame_difficulty", difficultyLevel);
  }, [difficultyLevel]);

  useEffect(() => {
    localStorage.setItem("petgame_battle_speed", battleSpeedRef.current);
  }, []);

  // ─── Pause sıfırlama (shop fazına geçince) ───────────────────────────────
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

  // ─── Resim ön yükleme ─────────────────────────────────────────────────────
  useEffect(() => {
    [
      "/images/animals/phoenix.png",
      "https://i.ibb.co/BVvZ1GnD/Erlik.png",
      "https://i.ibb.co/MDrgjfTR/Asena-Canva.png",
    ].forEach((src) => { const img = new Image(); img.src = src; });
  }, []);

  // ─── Global hata yakalayıcı ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (event) => {
      console.error("Global hata:", event.error);
      setLastError({ message: event.error?.message || "Bilinmeyen hata", stack: event.error?.stack });
      setTimeout(() => setLastError(null), 3000);
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  // ─── Yardımcı fonksiyonlar (useCallback) ─────────────────────────────────
  const pwr = useCallback((a) => {
    if (!a) return 1;
    if (a.lvl === 3) return 3;
    if (a.lvl === 2) return 2;
    return 1;
  }, []);

  const sellP = useCallback(
    (a) => Math.ceil(a.lvl + (a.exp >= 1 ? 0.5 : 0)),
    []
  );

  const clampStat = useCallback((v) => {
    try {
      return Math.min(Math.max(safeNumber(v, 0), 0), MAX_STAT);
    } catch (e) {
      logError(e, "clampStat");
      return 0;
    }
  }, []);

  const triggerAnim = useCallback((id, type) => {
    setAnims((prev) => ({ ...prev, [id]: type }));
    setTimeout(
      () => setAnims((prev) => ({ ...prev, [id]: null })),
      1000 / battleSpeedRef.current
    );
    playSound(type);
  }, []);

  // ─── Başarım sistemi ──────────────────────────────────────────────────────
  const showNextAchievement = useCallback(() => {
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
  }, []);

  const unlockAchievement = useCallback((id) => {
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
  }, [user, showNextAchievement]);

  // ─── Altın başarımı ───────────────────────────────────────────────────────
  useEffect(() => {
    if (gold >= 15) unlockAchievement("rich");
  }, [gold]);

  // ─── Yeni kademe bildirimi ────────────────────────────────────────────────
  useEffect(() => {
    const currentMaxT = Math.min(Math.ceil(turn / 2), 6);
    if (currentMaxT > lastT && phase === "shop") {
      setNewTier(currentMaxT);
      setLastT(currentMaxT);
    }
  }, [turn, phase, lastT]);

  // ─── Log otomatik kaydırma ────────────────────────────────────────────────
  useEffect(() => {
    if (logR.current) logR.current.scrollTop = logR.current.scrollHeight;
  }, [log]);

  // ─── Hook'lar ─────────────────────────────────────────────────────────────
  useMusic({ soundEnabled, phase, gameStarted });

  const {
    saveArenaTeam,
    fetchArenaOpponent,
    updateLeaderboard,
    loadTasksFromDB,
    saveTasksToDB,
  } = useArena({ user, turnRef });

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
    pT, setPT,
    eT, setET,
    log, setLog,
    team, setTeam,
    lives, setLives,
    wins, setWins,
    turn, gold, setGold,
    isBattleOver, setIsBattleOver,
    bossChallenge, setBossChallenge, setBossResult, setBossRewards,
    gameMode, isDebugBattle, setIsDebugBattle, setPGold, setRewards,
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

  // ─── Boss fonksiyonları ───────────────────────────────────────────────────
  const offerBoss   = useCallback(() => setBossChallenge("offer"), []);
  const acceptBoss  = useCallback(() => { setBossChallenge("battle"); startBossBattle(); }, [startBossBattle]);
  const declineBoss = useCallback(() => { setBossChallenge(null); battle(); }, [battle]);

  // ─── Oyunu sıfırla ────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    const cfg = DIFFICULTY_CONFIGS[difficultyLevel] || DIFFICULTY_CONFIGS.normal;
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
  }, [difficultyLevel, setTurnAndRef]);

  // ─── Oyun sonu istatistik güncellemesi ───────────────────────────────────
  const updateStatsOnEnd = useCallback((won, currentTurn, currentWins, currentLives) => {
    setStats((prev) => {
      const next = {
        ...prev,
        totalGames: prev.totalGames + 1,
        totalWins:  prev.totalWins + (won ? 1 : 0),
        bestTurn:   Math.max(prev.bestTurn, currentTurn),
        bestWins:   Math.max(prev.bestWins, currentWins),
      };
      saveStats(next, user?.uid);
      const nonSecretIds = ACHIEVEMENTS_DEF.filter((a) => !a.secret).map((a) => a.id);
      if (nonSecretIds.every((id) => (next.achievements || []).includes(id))) {
        unlockAchievement("secret_all");
      }
      return next;
    });
    unlockAchievement("first_game");
    if (won) unlockAchievement("first_win");
    if (won && currentTurn >= WIN_TURN) unlockAchievement("champion");
    if (won && currentLives === 5) unlockAchievement("perfect");
    if (currentWins >= 5) unlockAchievement("five_wins");
    if (currentLives <= 1) unlockAchievement("survivor");
  }, [user, unlockAchievement]);

  // ─── Zafer / yenilgi efektleri ────────────────────────────────────────────
  useEffect(() => {
    if (!victory) return;
    playSound("victory");
    updateStatsOnEnd(true, turn, wins, lives);
    if (gameMode === "arena") {
      updateLeaderboard({ won: true, isNewBestTurn: turn > (stats.bestTurn || 0) });
    }
  }, [victory]);

  useEffect(() => {
    if (!over) return;
    playSound("defeat");
    updateStatsOnEnd(false, turn, wins, lives);
    if (gameMode === "arena") {
      updateLeaderboard({ won: false, isNewBestTurn: turn > (stats.bestTurn || 0) });
    }
  }, [over]);

  // ─── Context value (useMemo ile sabitlenmiş) ─────────────────────────────
  const value = useMemo(() => ({
    // Boss
    acceptBoss, declineBoss, offerBoss,
    // Başarımlar
    achievementPopup, achievementQueueRef, achievementShowingRef,
    anims,
    // Arena
    arenaOpponent, arenaResult,
    fetchArenaOpponent, saveArenaTeam,
    updateLeaderboard, loadTasksFromDB, saveTasksToDB,
    // Savaş
    battle, battleGoldRef, battleSpeedRef,
    bossChallenge, bossResult, bossRewards,
    // Shop
    buy, refresh, toggleFreeze, mergeT, sell, swap,
    clampStat,
    currentDiffConfig, diffMult, difficulty, difficultyLevel,
    discountNext,
    eT, empty,
    gameMode, gameStarted, gold,
    guide, guideLvl,
    hasR,
    isBattleOver, isBossTurn, isDebugBattle,
    isPaused, isPausedRef,
    lastBattleIdRef, lastError, lastProcessedStepRef, lastT,
    lives, log, logR,
    maxT, menuView,
    newTier, newlyOpenedSlot,
    openTiers, opponentReady, over,
    pGold, pT, pendingEndTurnAnims, phase, pwr,
    reset, rewards,
    sel, selI, sellP,
    setAchievementPopup, setAnims, setArenaOpponent, setArenaResult,
    setBossChallenge, setBossResult, setBossRewards,
    setDifficultyLevel, setDiscountNext,
    setET, setGameMode, setGameStarted, setGold,
    setGuide, setGuideLvl,
    setIsBattleOver, setIsDebugBattle, setIsPaused, setLastError, setLastT,
    setLives, setLog, setMenuView,
    setNewTier, setNewlyOpenedSlot, setOpenTiers, setOpponentReady, setOver,
    setPGold, setPT, setPendingEndTurnAnims, setPhase, setRewards,
    setSel, setSelI, setShop, setShopResetKey,
    setShowCollection, setShowDebugPanel, setShowSwordClash, setSoundEnabled,
    setStep, setTargetBuffHint, setTeam, setTurn, setTurnAndRef,
    setVersusPhase, setVersusReady, setVersusRoom, setVictory, setWins,
    shop, shopResetKey, shopSlots, showCollection, showDebugPanel,
    showNextAchievement, showSwordClash: showSwordClash, soundEnabled,
    startBossBattle, startVersusBattle, step,
    targetBuffHint, team, teamSlots,
    triggerAnim, turn, turnRef,
    unlockAchievement, updateLeaderboard, updateStatsOnEnd,
    versusPhase, versusReady, versusRoom, versusSetReady,
    victory, wins,
    // Auth (AuthContext'ten köprülenenler)
    user, displayName,
    stats, setStats,
    showAuthModal, setShowAuthModal,
    authEmail, setAuthEmail,
    authPass, setAuthPass,
    authMode, setAuthMode,
    authUsername, setAuthUsername,
    authAvatar, setAuthAvatar,
    showSettingsModal, setShowSettingsModal,
    settingsUsername, setSettingsUsername,
    settingsAvatar, setSettingsAvatar,
    handleGoogleLogin, handleEmailAuth, handleLogout, handleUpdateProfile,
  }), [
    // Primitive state'ler — bunlar değişince context güncellenir
    gold, turn, wins, lives, phase, step, over, victory,
    gameMode, gameStarted, isBattleOver, isBossTurn, isPaused,
    difficultyLevel, discountNext, lastT, newTier, newlyOpenedSlot,
    bossChallenge, bossResult, versusPhase, versusReady, opponentReady,
    soundEnabled, showDebugPanel, isDebugBattle, showCollection,
    showSwordClash, pGold, arenaResult, menuView, guide, lastError,
    achievementPopup, empty, hasR, maxT, teamSlots, shopSlots,
    // Diziler / objeler — referans değişince güncellenir
    team, shop, rewards, log, pT, eT, anims, bossRewards,
    guideLvl, openTiers, sel, selI,
    // Auth
    user, displayName, stats,
    showAuthModal, authEmail, authPass, authMode,
    authUsername, authAvatar, showSettingsModal,
    settingsUsername, settingsAvatar,
    // Stabil callback'ler
    pwr, sellP, clampStat, triggerAnim,
    unlockAchievement, showNextAchievement,
    reset, updateStatsOnEnd,
    offerBoss, acceptBoss, declineBoss,
    battle, startBossBattle, startVersusBattle, versusSetReady,
    refresh, toggleFreeze, buy, mergeT, sell, swap,
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => useContext(GameContext);
