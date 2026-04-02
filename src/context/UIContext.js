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
import { clearGameState } from "../utils/localSave";
import { logError, safeNumber, saveStats } from "../utils/helpers";
import { playSound } from "../hooks/useSound";
import { ACHIEVEMENTS_DEF, MAX_STAT, WIN_TURN } from "../data/gameData";
import { useFriends } from "../hooks/useFriends";

export const UIContext = createContext();

export const UIProvider = ({ children }) => {
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

  // ─── UI / Meta state ─────────────────────────────────────────────────────
  const [gameStarted,       setGameStarted]       = useState(false);
  const [menuView,          setMenuView]           = useState("main");
  const [soundEnabled,      setSoundEnabled]       = useState(true);
  const [achievementPopup,  setAchievementPopup]   = useState(null);
  const [over,              setOver]               = useState(false);
  const [victory,           setVictory]            = useState(false);
  const [lives,             setLives]              = useState(5);
  const [wins,              setWins]               = useState(0);
  const [guide,             setGuide]              = useState(false);
  const [guideLvl,          setGuideLvl]           = useState({});
  const [openTiers,         setOpenTiers]          = useState([1, 2, 3, 4, 5, 6]);
  const [lastError,         setLastError]          = useState(null);
  const [showCollection,    setShowCollection]     = useState(false);
  const [showDebugPanel,    setShowDebugPanel]     = useState(false);
  const [isDebugBattle,     setIsDebugBattle]      = useState(false);
  const [gameMode,          setGameMode]           = useState("standard");
  const [versusPhase,       setVersusPhase]        = useState(null);
  const [versusRoom,        setVersusRoom]         = useState(null);
  const [versusAutoJoin,    setVersusAutoJoin]     = useState(null);
  const [difficultyLevel,   setDifficultyLevel]    = useState(
    () => localStorage.getItem("petgame_difficulty") || "normal"
  );
  const [anims,             setAnims]              = useState({});
  const [isPaused,          setIsPaused]           = useState(false);
  const [newTier,           setNewTier]            = useState(null);
  const [lastT,             setLastT]              = useState(1);
  const [newlyOpenedSlot,   setNewlyOpenedSlot]    = useState(null);

  const friendsData = useFriends({
    user,
    onChallengeAccepted: null,
  });

  // ─── Ref'ler ──────────────────────────────────────────────────────────────
  const battleSpeedRef       = useRef(
    parseFloat(localStorage.getItem("petgame_battle_speed")) || 1
  );
  const isPausedRef          = useRef(false);
  const achievementQueueRef  = useRef([]);
  const achievementShowingRef = useRef(false);

  // ─── localStorage kalıcılığı ──────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("petgame_difficulty", difficultyLevel);
  }, [difficultyLevel]);

  useEffect(() => {
    localStorage.setItem("petgame_battle_speed", battleSpeedRef.current);
  }, []);

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

  // ─── Yardımcı saf fonksiyonlar ────────────────────────────────────────────
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

  // ─── Oyun sonu istatistik güncellemesi ───────────────────────────────────
  const updateStatsOnEnd = useCallback((won, currentTurn, currentWins, currentLives) => {
    clearGameState();
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

  // ─── Context value ────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    // UI state
    gameStarted, setGameStarted,
    menuView, setMenuView,
    soundEnabled, setSoundEnabled,
    achievementPopup, setAchievementPopup,
    over, setOver,
    victory, setVictory,
    lives, setLives,
    wins, setWins,
    guide, setGuide,
    guideLvl, setGuideLvl,
    openTiers, setOpenTiers,
    lastError, setLastError,
    showCollection, setShowCollection,
    showDebugPanel, setShowDebugPanel,
    isDebugBattle, setIsDebugBattle,
    gameMode, setGameMode,
    versusPhase, setVersusPhase,
    versusRoom, setVersusRoom,
    versusAutoJoin, setVersusAutoJoin,
    difficultyLevel, setDifficultyLevel,
    anims, setAnims,
    isPaused, setIsPaused,
    newTier, setNewTier,
    lastT, setLastT,
    newlyOpenedSlot, setNewlyOpenedSlot,
    // Refs
    battleSpeedRef, isPausedRef,
    achievementQueueRef, achievementShowingRef,
    // Utilities
    pwr, sellP, clampStat, triggerAnim,
    unlockAchievement, showNextAchievement, updateStatsOnEnd,
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
    friendsData,
  }), [
    gameStarted, menuView, soundEnabled, achievementPopup,
    over, victory, lives, wins,
    guide, guideLvl, openTiers, lastError,
    showCollection, showDebugPanel, isDebugBattle,
    gameMode, versusPhase, versusRoom, versusAutoJoin, difficultyLevel,
    anims, isPaused, newTier, lastT, newlyOpenedSlot,
    // Auth
    user, displayName, stats,
    showAuthModal, authEmail, authPass, authMode,
    authUsername, authAvatar, showSettingsModal,
    settingsUsername, settingsAvatar,
    // Stable callbacks
    pwr, sellP, clampStat, triggerAnim,
   unlockAchievement, showNextAchievement, updateStatsOnEnd,
    friendsData,
  ]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUIContext = () => useContext(UIContext);
