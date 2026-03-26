import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";

import { useShop } from "../hooks/useShop";
import { spawnBuffAnimation } from "../utils/animations";
import { useUIContext } from "./UIContext";

export const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const {
    pwr, sellP, clampStat, triggerAnim,
    unlockAchievement,
    difficultyLevel,
  } = useUIContext();

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
    // Derived
    maxT, teamSlots, shopSlots, empty, hasR,
    // Shop actions
    refresh, toggleFreeze, buy, mergeT, sell, swap,
  }), [
    gold, shop, team, sel, selI, rewards,
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
