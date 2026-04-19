import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { saveGameState } from "../utils/localSave";
import { useShop } from "../hooks/useShop";
import { spawnBuffAnimation } from "../utils/animations";
import { useUIContext } from "./UIContext";
import { loadTasks, saveTasks } from "../utils/helpers";

export const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const {
    pwr, sellP, clampStat, triggerAnim,
    unlockAchievement,
    difficultyLevel,
    user,
    gameStarted,
    gameMode,
    lives,
    wins,
    // DÜZELTME: `phase` UIContext'te tanımlı değil, BattleContext'e ait.
    // UIContext'ten okumak her zaman undefined döndürüyordu.
    // saveGameState çağrısı zaten sadece shop fazında yapılmalı;
    // bu context shop'a özel olduğundan phase sabit "shop" olarak yazılıyor.
  } = useUIContext();

  // Altın harcama görev takibi
  const onGoldSpent = useCallback((amount) => {
    const taskData = loadTasks(user?.uid);
    if (!taskData) return;
    taskData.daily.tasks = taskData.daily.tasks.map((t) => {
      if (t.done || t.type !== "gold_spent") return t;
      const progress = Math.min(t.progress + amount, t.target);
      return { ...t, progress, done: progress >= t.target };
    });
    saveTasks(taskData, user?.uid);
  }, [user]);

  // ─── Mağaza / Takım state ─────────────────────────────────────────────────
  const [gold,          setGold]          = useState(10);
  const [shop,          setShop]          = useState([]);
  const [team,          setTeam]          = useState([null, null, null, null, null, null]);
  const [sel,           setSel]           = useState(null);
  const [selI,          setSelI]          = useState(null);
  const [rewards,       setRewards]       = useState([]);
  const [discountNext,  setDiscountNext]  = useState(false);
  const [shopResetKey,  setShopResetKey]  = useState(0);
  const [targetBuffHint,setTargetBuffHint]= useState(false);
  const [turn,          setTurn]          = useState(1);

  // ─── Ref'ler ──────────────────────────────────────────────────────────────
  const turnRef = useRef(1);
  // Kayıtlı oyun yüklenirken refresh()'i atlamak için kullanılır.
  // BattleContext'teki restoreGame buraya kaydedilen shop'u yazar;
  // useShop'taki effect ilk tetiklendiğinde refresh() yerine bunu kullanır.
  const restoredShopRef    = useRef(null);
  // Tutorial aktifken refresh() bu ref'i okur ve random pool yerine tutorial hayvanını inject eder
  const tutorialAnimalRef  = useRef(null);

  // ─── Türetilmiş değerler ──────────────────────────────────────────────────
  const maxT      = useMemo(() => Math.min(Math.ceil(turn / 2), 6), [turn]);
  const teamSlots = useMemo(() => (turn >= 7 ? 6 : turn >= 5 ? 5 : 4), [turn]);
  const shopSlots = useMemo(() => (turn >= 7 ? 5 : turn >= 5 ? 4 : 3), [turn]);
  const empty     = useMemo(() => team.filter((x) => x === null).length, [team]);
  const hasR      = useMemo(() => rewards.length > 0, [rewards]);

  // ─── turnRef senkronizasyonu ──────────────────────────────────────────────
  const setTurnAndRef = useCallback((newTurn) => {
    setTurn(newTurn);
    turnRef.current = newTurn;
  }, []);

  // ─── Oyun durumu kaydet (yalnızca shop fazında anlamlı) ───────────────────
  useEffect(() => {
    if (!gameStarted) return;
    if (gameMode === "versus") return; // Versus kaydedilmez
    saveGameState({
      turn,
      gold,
      lives,
      wins,
      team,
      shop,
      phase: "shop",
      gameMode,
      difficultyLevel,
    });
  }, [turn, gold, team, shop, gameStarted, gameMode, lives, wins, difficultyLevel]);

  // ─── Shop hook ────────────────────────────────────────────────────────────
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
    onGoldSpent,
    restoredShopRef,
    tutorialAnimalRef,
    setShopResetKey,
  });

  // ─── Context value ────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    // State
    gold, setGold,
    shop, setShop,
    team, setTeam,
    sel, setSel,
    selI, setSelI,
    rewards, setRewards,
    discountNext, setDiscountNext,
    shopResetKey, setShopResetKey,
    targetBuffHint, setTargetBuffHint,
    turn, setTurn, setTurnAndRef,
    // Refs
    turnRef,
    restoredShopRef,
    tutorialAnimalRef,
    // Derived
    maxT, teamSlots, shopSlots, empty, hasR,
    // Shop actions
    refresh, toggleFreeze, buy, mergeT, sell, swap,
  }), [
    gold, shop, setShop, team, sel, selI, rewards,
    discountNext, shopResetKey, targetBuffHint, turn,
    maxT, teamSlots, shopSlots, empty, hasR,
    setTurnAndRef,
    refresh, toggleFreeze, buy, mergeT, sell, swap,
  ]);

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShopContext = () => useContext(ShopContext);
