import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

import { useBattle } from "../hooks/useBattle";
import { useArena } from "../hooks/useArena";
import { useEndTurn } from "../hooks/useEndTurn";
import { useMusic } from "../hooks/useMusic";
import { spawnBuffAnimation } from "../utils/animations";
import { applyEndTurnBuffs } from "../utils/battleUtils";
import { playSound } from "../hooks/useSound";
import { DIFFICULTY_CONFIGS } from "../data/gameData";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

import { useUIContext } from "./UIContext";
import { useShopContext } from "./ShopContext";

export const BattleContext = createContext();

export const BattleProvider = ({ children }) => {
  // ─── Bağımlı context'lerden state/setter al ───────────────────────────────
  const {
    pwr, clampStat, triggerAnim, unlockAchievement,
    soundEnabled,
    gameStarted, setGameStarted,
    over, setOver,
    victory, setVictory,
    lives, setLives,
    wins, setWins,
    gameMode,
    isDebugBattle, setIsDebugBattle,
    showDebugPanel, setShowDebugPanel,
    versusPhase, setVersusPhase,
    versusRoom,
    newTier, setNewTier,
    lastT, setLastT,
    newlyOpenedSlot, setNewlyOpenedSlot,
    difficultyLevel,
    isPausedRef, battleSpeedRef,
    setAnims,
    setIsPaused,
    user,
    updateStatsOnEnd,
    setGuideLvl,
  } = useUIContext();

  const {
    team, setTeam,
    gold, setGold,
    turn,
    turnRef, setTurnAndRef,
    rewards, setRewards,
    teamSlots, maxT,
    setShop, setShopResetKey,
  } = useShopContext();

  // ─── Savaş state'leri ─────────────────────────────────────────────────────
  const [phase,               setPhase]               = useState("shop");
  const [pT,                  setPT]                  = useState([]);
  const [eT,                  setET]                  = useState([]);
  const [log,                 setLog]                 = useState([]);
  const [step,                setStep]                = useState(0);
  const [isBattleOver,        setIsBattleOver]        = useState(false);
  const [bossChallenge,       setBossChallenge]       = useState(null);
  const [bossResult,          setBossResult]          = useState(null);
  const [bossRewards,         setBossRewards]         = useState([]);
  const [arenaResult,         setArenaResult]         = useState(null);
  const [arenaOpponent,       setArenaOpponent]       = useState(null);
  const [pGold,               setPGold]               = useState(0);
  const [showSwordClash,      setShowSwordClash]      = useState(false);
  const [pendingEndTurnAnims, setPendingEndTurnAnims] = useState(false);
  const [versusReady,         setVersusReady]         = useState(false);
  const [opponentReady,       setOpponentReady]       = useState(false);

  // ─── Ref'ler ──────────────────────────────────────────────────────────────
  const logR                 = useRef(null);
  const battleGoldRef        = useRef(0);
  const lastProcessedStepRef = useRef(-1);
  const lastBattleIdRef      = useRef(null);

  // ─── Türetilmiş değerler ──────────────────────────────────────────────────
  const isBossTurn = useMemo(
    () => [5, 10, 15].includes(turn) && gameMode === "standard",
    [turn, gameMode]
  );
  const { currentDiffConfig, diffMult, difficulty } = useMemo(() => {
    const cfg = gameMode === "versus"
      ? DIFFICULTY_CONFIGS.normal
      : (DIFFICULTY_CONFIGS[difficultyLevel] || DIFFICULTY_CONFIGS.normal);
    return {
      currentDiffConfig: cfg,
      diffMult:          cfg.enemyStatMultiplier,
      difficulty:        (1 + Math.floor(turn / 3) * 0.2) * cfg.enemyStatMultiplier,
    };
  }, [difficultyLevel, turn, gameMode]);
  // ─── Log otomatik kaydırma ────────────────────────────────────────────────
  useEffect(() => {
    if (logR.current) logR.current.scrollTop = logR.current.scrollHeight;
  }, [log]);

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
  }, [phase, gameMode]);

  // ─── Hooks ────────────────────────────────────────────────────────────────
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

  // ─── Boss fonksiyonları ───────────────────────────────────────────────────
  const offerBoss   = useCallback(() => setBossChallenge("offer"), []);
  const acceptBoss  = useCallback(() => { setBossChallenge("battle"); startBossBattle(); }, [startBossBattle]);
  const declineBoss = useCallback(() => { setBossChallenge(null); battle(); }, [battle]);

  // ─── goToShop ─────────────────────────────────────────────────────────────
  const goToShop = useCallback(() => {
    setBossChallenge(null);
    setBossResult(null);
    setBossRewards([]);
    setTurnAndRef(turnRef.current + 1);
    setGold((g) => g + 10);
    setTeam((currentTeam) => applyEndTurnBuffs(currentTeam));
    setPendingEndTurnAnims(true);
    setPhase("shop");
  }, [setTurnAndRef, setGold, setTeam]);

  // ─── Oyunu sıfırla ────────────────────────────────────────────────────────
  const reset = useCallback((forceMode) => {
    const effectiveMode = forceMode || gameMode;
    const cfg = effectiveMode === "versus"
      ? DIFFICULTY_CONFIGS.normal
      : (DIFFICULTY_CONFIGS[difficultyLevel] || DIFFICULTY_CONFIGS.normal);

    // Versus maçından menüye/yeniden başlatmaya çıkışta rakibi beklemede bırakma.
    if (!forceMode && gameMode === "versus" && versusPhase === "playing" && versusRoom?.code && versusRoom?.role) {
      updateDoc(doc(db, "versus_rooms", versusRoom.code), {
        disconnected: versusRoom.role,
      }).catch(() => {});
    }

    // ShopContext state
    setGold(cfg.startingGold);
    setTurnAndRef(1);
    setWins(0);
    setLives(cfg.startingLives);
    setTeam([null, null, null, null, null, null]);
    setShop([]);
    setShopResetKey((k) => k + 1);
    setRewards([]);

    // UIContext state
    setGuideLvl({});
    setAnims({});

    // BattleContext state
    setPhase("shop");
    setOver(false);
    setVictory(false);
    setNewTier(null);
    setLastT(1);
    setPGold(0);
    setBossChallenge(null);
    setBossResult(null);
    setBossRewards([]);
    lastProcessedStepRef.current = -1;
    setIsBattleOver(false);
    playSound("shop_open");
  }, [
    difficultyLevel, setTurnAndRef,
    setGold, setWins, setLives, setTeam, setShop, setShopResetKey, setRewards,
    setGuideLvl, setAnims,
    setOver, setVictory, setNewTier, setLastT,
    gameMode, versusPhase, versusRoom?.code, versusRoom?.role,
  ]);
  const restoreGame = useCallback((saved) => {
  const cfg = DIFFICULTY_CONFIGS[saved.difficultyLevel] || DIFFICULTY_CONFIGS.normal;
  // ShopContext
  setGold(saved.gold ?? cfg.startingGold);
  setTurnAndRef(saved.turn ?? 1);
  setTeam(saved.team ?? [null, null, null, null, null, null]);
  setShop([]);
  setShopResetKey((k) => k + 1);
  setRewards([]);
  // UIContext
  setWins(saved.wins ?? 0);
  setLives(saved.lives ?? cfg.startingLives);
  setAnims({});
  setGuideLvl({});
  // BattleContext
  setPhase(saved.phase ?? "shop");
  setOver(false);
  setVictory(false);
  setNewTier(null);
  setLastT(Math.min(Math.ceil((saved.turn ?? 1) / 2), 6));
  setPGold(0);
  setBossChallenge(null);
  setBossResult(null);
  setBossRewards([]);
  lastProcessedStepRef.current = -1;
  setIsBattleOver(false);
}, [
  setGold, setTurnAndRef, setTeam, setShop, setShopResetKey, setRewards,
  setWins, setLives, setAnims, setGuideLvl,
  setOver, setVictory, setNewTier, setLastT,
]);
  // ─── Context value ────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    // Battle state
    phase, setPhase,
    pT, setPT,
    eT, setET,
    log, setLog,
    step, setStep,
    isBattleOver, setIsBattleOver,
    bossChallenge, setBossChallenge,
    bossResult, setBossResult,
    bossRewards, setBossRewards,
    arenaResult, setArenaResult,
    arenaOpponent, setArenaOpponent,
    pGold, setPGold,
    showSwordClash, setShowSwordClash,
    pendingEndTurnAnims, setPendingEndTurnAnims,
    versusReady, setVersusReady,
    opponentReady, setOpponentReady,
    // Refs
    logR, battleGoldRef, lastProcessedStepRef, lastBattleIdRef,
    // Derived
    isBossTurn, currentDiffConfig, diffMult, difficulty,
    // Actions
    battle, startBossBattle, startVersusBattle, versusSetReady,
    offerBoss, acceptBoss, declineBoss, goToShop,
    reset,
    restoreGame,
    // Arena
    saveArenaTeam, fetchArenaOpponent, updateLeaderboard,
    loadTasksFromDB, saveTasksToDB,
  }), [
    phase, pT, eT, log, step,
    isBattleOver, bossChallenge, bossResult, bossRewards,
    arenaResult, arenaOpponent, pGold, showSwordClash,
    pendingEndTurnAnims, versusReady, opponentReady,
    isBossTurn, currentDiffConfig, diffMult, difficulty,
    battle, startBossBattle, startVersusBattle, versusSetReady,
    offerBoss, acceptBoss, declineBoss, goToShop, reset, restoreGame,
    saveArenaTeam, fetchArenaOpponent, updateLeaderboard,
    loadTasksFromDB, saveTasksToDB,
  ]);

  return (
    <BattleContext.Provider value={value}>
      {children}
    </BattleContext.Provider>
  );
};

export const useBattleContext = () => useContext(BattleContext);
