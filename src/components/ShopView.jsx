import React, { useState, useEffect } from "react";
import { useGameContext } from "../context/GameContext";
import Card from "./Card";
import BossRewardScreen from "./BossRewardScreen";
import NewTierScreen from "./NewTierScreen";
import { getDesc } from "../utils/getDesc";
import { playSound } from "../hooks/useSound";
import { ABILITY_ICONS, BOSSES, WIN_TURN } from "../data/gameData";
import HUD from "./HUD";

export default function ShopView() {
  const {
    acceptBoss, anims, battle, bossChallenge, bossRewards, buy, gold, hasR,
    isBossTurn, isPausedRef, lives, maxT, mergeT, newTier, newlyOpenedSlot,
    offerBoss, phase, refresh, reset, rewards, sel, selI, sell, setBossChallenge,
    setGameStarted, setGuide, setMenuView, setNewTier, setPhase, setRewards,
    setSel, setSelI, setTeam, setGold, setShowCollection, setSoundEnabled,
    setVersusPhase, setVersusReady, setVersusRoom, shop, shopSlots, soundEnabled,
    team, teamSlots, toggleFreeze, turn, versusReady, wins, gameMode, goToShop,
  } = useGameContext();

  const [showRewards, setShowRewards] = useState(false);
  useEffect(() => {
    if (hasR) {
      const t = setTimeout(() => setShowRewards(true), 900);
      return () => clearTimeout(t);
    } else {
      setShowRewards(false);
    }
  }, [hasR]);

  return (
    <>
      <div className="max-w-4xl mx-auto w-full min-w-0">
        <HUD reset={reset} />

        {/* MAĞAZA */}
        <div className="glass-panel-strong rounded-[2.5rem] p-3 sm:p-4 mb-4 border-2 border-purple-500/20 shadow-2xl hover:border-purple-500/40 transition-all duration-500">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-300" style={{ animation: "shimmer 3s ease-in-out infinite" }}>🛒 HAYVAN MAĞAZASI</span>
            <span className="hidden sm:inline text-blue-300/90 font-bold px-3 py-1.5 glass-panel border border-blue-400/40 rounded-lg hover:border-blue-400/80 transition-all duration-300 hover:shadow-[0_0_15px_rgba(96,165,250,0.4)]">SAĞ TIK = ❄️ DONDUR</span>
          </div>

          {/* flex-1: her item mevcut genişliği eşit paylaşır, taşmaz */}
          <div className="flex gap-1 sm:gap-2 w-full items-end">
            {shop.map((a) => (
              <div key={a.id} className="flex flex-col items-center flex-shrink-0 gap-1 justify-end">
                <div
                  className={`relative w-full transition-all duration-300 ${gold < a.cost ? "opacity-60 grayscale cursor-not-allowed" : "hover:scale-110 hover:-translate-y-2 cursor-pointer hover-lift"}`}
                  onClick={() => setSel(sel?.id === a.id ? null : a)}
                  onContextMenu={(e) => { e.preventDefault(); toggleFreeze(a); }}
                >
                  <Card a={a} anim={anims[a.id]} selected={sel?.id === a.id} showName={false} getDesc={getDesc} shop={shop} team={team} mirror={true} />
                  {a.frozen && <div className="absolute -top-1 -left-1 text-xl animate-pulse" style={{ filter: "drop-shadow(0 0 8px rgba(96, 165, 250, 0.8))" }}>❄️</div>}
                  {sel?.id === a.id && <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 border-2 border-white z-[60]" style={{ animation: "pulse 1s ease-in-out infinite" }}><span className="text-white text-xs font-black">✓</span></div>}
                </div>
                <span className="text-xs sm:text-sm text-yellow-300 font-bold px-1 py-0.5 bg-black/40 rounded-full border border-yellow-500/30 backdrop-blur-sm">{a.cost}💰</span>
              </div>
            ))}

            {shopSlots < 4 && (
              <div className="flex flex-col items-center flex-shrink-0 gap-1 opacity-40 justify-end">
                <div className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center">
                  <span className="text-xl">🔒</span>
                  <span className="text-[9px] font-black mt-1 text-yellow-400 uppercase">Tur 5</span>
                </div>
                <span className="text-xs opacity-0">0💰</span>
              </div>
            )}

            {shopSlots < 5 && (
              <div className="flex flex-col items-center flex-shrink-0 gap-1 opacity-40 justify-end">
                <div className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center">
                  <span className="text-xl">🔒</span>
                  <span className="text-[9px] font-black mt-1 text-yellow-400 uppercase">Tur 7</span>
                </div>
                <span className="text-xs opacity-0">0💰</span>
              </div>
            )}

            {/* Yenile */}
            <div className="flex flex-col items-center flex-shrink-0 gap-1 justify-end">
              <button
                onClick={() => { const unfrozen = shop.filter(s => !s.frozen); if (unfrozen.length === 0 || gold >= 1) { if (unfrozen.length > 0) setGold(g => g - 1); refresh(); playSound("refresh"); } }}
                disabled={gold < 1 && shop.filter(s => !s.frozen).length > 0}
                className="w-full aspect-[3/4] rounded-2xl bg-transparent disabled:opacity-40 flex flex-col items-center justify-center hover:bg-purple-500/10 transition-all duration-300 border-2 border-dashed border-purple-400/30 hover:border-purple-400/60 group/roll"
              >
                <span className="text-2xl sm:text-3xl group-hover/roll:rotate-180 transition-transform duration-500">🔄</span>
                <span className="text-[10px] sm:text-xs font-black mt-1 text-purple-300">{shop.filter(s => !s.frozen).length === 0 ? "BEDAVA" : "1 💰"}</span>
              </button>
              <span className="text-[9px] sm:text-[10px] text-purple-400 font-black tracking-widest uppercase">YENİLE</span>
            </div>
          </div>
        </div>

        {sel && (
          <div className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:right-4 sm:left-auto sm:-translate-y-1/2 sm:w-72 z-50 w-full bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
            <button onClick={() => setSel(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">✕</button>
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-700">
              {sel.img ? <img src={`/images/animals/${sel.img}`} alt={sel.nick} className="w-16 h-16 object-contain drop-shadow-2xl" style={!sel.flip ? { transform: "scaleX(-1)" } : {}} /> : <span className="text-6xl">{sel.name}</span>}
              <div>
                <div className="text-white font-black text-lg">{sel.nick}</div>
                <div className="text-gray-400 text-sm">Kademe {sel.tier}</div>
                <div className="flex gap-2 mt-1"><span className="bg-orange-600/80 px-2 py-0.5 rounded-full text-xs font-bold">⚔️ {sel.atk}</span><span className="bg-green-600/80 px-2 py-0.5 rounded-full text-xs font-bold">❤️ {sel.hp}</span><span className="bg-yellow-600/80 px-2 py-0.5 rounded-full text-xs font-bold">💰 {sel.cost}</span></div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((lvl) => (
                <div key={lvl} className={`rounded-xl p-2.5 border ${lvl === 1 ? "border-gray-500 bg-gray-800/60" : lvl === 2 ? "border-blue-500/60 bg-blue-900/20" : "border-yellow-500/60 bg-yellow-900/20"}`}>
                  <div className="flex items-center gap-2 mb-1"><span className="text-sm">{lvl === 1 ? "⭐" : lvl === 2 ? "💎" : "👑"}</span><span className={`text-xs font-bold ${lvl === 1 ? "text-gray-300" : lvl === 2 ? "text-blue-300" : "text-yellow-300"}`}>{lvl === 1 ? "1. Seviye" : lvl === 2 ? "2. Seviye" : "3. Seviye (MAX)"}</span><span className="ml-auto text-xs text-gray-400">⚔️{sel.atk + lvl - 1} ❤️{sel.hp + lvl - 1}</span></div>
                  <div className="text-xs text-gray-200 leading-relaxed">{ABILITY_ICONS[sel.ability]} {getDesc({ ...sel, lvl }, lvl)}</div>
                </div>
              ))}
            </div>
            <button onClick={() => { const slot = team.findIndex((x, i) => x === null && i < teamSlots); if (slot !== -1 && gold >= sel.cost) buy(sel, slot); }} disabled={gold < sel.cost || team.slice(0, teamSlots).every(x => x !== null)} className="mt-3 w-full py-2 bg-gradient-to-br from-green-600 to-green-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold hover:from-green-500 hover:to-green-700 transition-all border border-green-400 text-sm">{gold < sel.cost ? `💰 Yeterli altın yok (${sel.cost} gerekli)` : team.slice(0, teamSlots).every(x => x !== null) ? "❌ Takım dolu" : `✅ Satın Al (${sel.cost}💰)`}</button>
          </div>
        )}

        {showRewards && (
          <div className="bg-gradient-to-br from-yellow-900/60 to-orange-900/60 border-2 border-yellow-500 rounded-xl p-3 mb-3 shadow-xl" style={{ animation: "fadeIn 0.4s ease-out" }}>
            <div className="text-sm text-yellow-300 mb-2 font-bold">🎁 Seviye Ödülü (1 seç!) {team.filter(x => x).length === teamSlots && <span className="text-red-400">- Slot boşalt!</span>}</div>
            <div className="flex gap-3 justify-center flex-wrap">
              {rewards.map((a) => (
                <div key={a.id} className="flex flex-col items-center relative" onClick={() => setSel(sel?.id === a.id ? null : a)}>
                  <Card a={a} anim={anims[a.id]} selected={sel?.id === a.id} showName={false} getDesc={getDesc} shop={shop} team={team} mirror={true} />
                  {sel?.id === a.id && <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-[60]"><span className="text-white text-xs font-black">✓</span></div>}
                  <span className="text-xs text-green-300 font-bold mt-1">K{a.rT}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SAVAŞ TAKIMI */}
        <div className="glass-panel-strong rounded-[2.5rem] p-3 sm:p-4 mb-3 border-2 border-green-500/20 shadow-2xl hover:border-green-500/40 transition-all duration-500">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-green-400 to-emerald-300" style={{ animation: "shimmer 3s ease-in-out infinite", animationDelay: "0.5s" }}>⚔️ SAVAŞ TAKIMI</span>
            {sel?.pendingTargetBuff ? <span className="text-cyan-300 animate-pulse"> 🎯 Buff vermek için hedef seç!</span> : sel ? <span className="text-yellow-300"> - Slot seç</span> : null}
          </div>
          {sel?.pendingTargetBuff && <div className="mb-3 px-4 py-2 bg-cyan-900/60 border border-cyan-400/50 rounded-xl text-cyan-300 text-sm font-bold text-center">🎯 Buff vermek istediğin hayvana tıkla!</div>}

          <div className="flex gap-1 sm:gap-2 w-full py-3">
            {team.map((a, i) => {
              const isLocked = (i === 4 && turn < 5) || (i === 5 && turn < 7);
              const lockedTurn = i === 4 ? 5 : 7;
              const isJustOpened = (i === 4 && newlyOpenedSlot === "shop_4_team_4") || (i === 5 && newlyOpenedSlot === "shop_5_team_5");

              if (isJustOpened) return (
                <div key={i} className="flex-shrink-0">
                  <button
                    onClick={() => { if (sel) buy(sel, i); else if (selI !== null) mergeT(selI, i); }}
                    className="w-full aspect-[3/4] rounded-2xl border-2 border-green-500/50 text-green-400 transition-all bg-green-500/10 flex flex-col items-center justify-center"
                    style={{ animation: "slotUnlock 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" }}
                  >
                    <span style={{ animation: "lockBreak 0.8s ease-out forwards" }}>🔓</span>
                    <span className="text-[9px] uppercase font-black tracking-widest mt-1">Açıldı!</span>
                  </button>
                </div>
              );

              if (isLocked) return (
                <div key={i} className="flex-shrink-0 opacity-40">
                  <div className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center">
                    <span className="text-xl">🔒</span>
                    <span className="text-[9px] font-black mt-1 text-yellow-400 uppercase">Tur {lockedTurn}</span>
                  </div>
                </div>
              );

              return a ? (
                <div key={a.id} className="flex-shrink-0 flex flex-col items-center" onClick={() => {
                  if (sel?.pendingTargetBuff) {
                    if (team[i] && i !== sel.sourceSlot) {
                      const buffAmount = sel.buffAmount;
                      setTeam(prev => prev.map((pet, idx) => idx === i ? { ...pet, atk: Math.min(pet.atk + buffAmount, 500), hp: Math.min(pet.hp + buffAmount, 500), curHp: Math.min(pet.curHp + buffAmount, 500) } : pet));
                      setSel(null);
                      playSound("buff");
                    }
                  } else if (sel) buy(sel, i);
                  else if (selI !== null && selI !== i) { if (!mergeT(selI, i)) { const newTeam = [...team]; [newTeam[selI], newTeam[i]] = [newTeam[i], newTeam[selI]]; setTeam(newTeam); setSelI(null); } }
                  else setSelI(selI === i ? null : i);
                }}>
                  <div className="relative group w-full flex justify-center">
                    <Card a={a} anim={anims[a.id]} selected={selI === i} onSell={() => sell(i)} showName={false} getDesc={getDesc} mirror={true} />
                    {selI === i && <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-black z-20 flex items-center justify-center text-[8px] font-black text-black">✓</div>}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex-shrink-0">
                  <button
                    onClick={() => { if (sel) buy(sel, i); else if (selI !== null) { const newTeam = [...team]; [newTeam[selI], newTeam[i]] = [newTeam[i], newTeam[selI]]; setTeam(newTeam); setSelI(null); } }}
                    className={`w-full aspect-[3/4] rounded-2xl transition-all flex items-center justify-center group/slot ${sel || selI !== null ? "border-2 border-dashed border-green-400/70 bg-green-500/5 text-green-400/50 hover:border-green-400 hover:bg-green-500/10 hover:scale-105 active:scale-95" : "border-0 bg-transparent"}`}
                  >
                    <span className={`transition-transform duration-300 ${sel || selI !== null ? "group-hover/slot:rotate-90 text-green-400/50" : "text-white/20 text-xs"}`}>+</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {isBossTurn && bossChallenge === null ? (
          <div className="flex gap-4 mt-2">
            <button onClick={offerBoss} disabled={team.filter(x => x).length === 0} className="flex-1 group relative py-4 bg-gradient-to-br from-orange-600 to-red-800 disabled:opacity-40 rounded-2xl font-black text-lg tracking-tight hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_40px_rgba(234,88,12,0.3)] overflow-hidden"><div className="relative z-10 flex items-center justify-center gap-2">🔥 BOSS MEYDAN OKUMASI</div><div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div></button>
            <button onClick={battle} disabled={team.filter(x => x).length === 0 || phase === "battle"} className="flex-1 group relative py-4 bg-gradient-to-br from-green-600 to-emerald-800 disabled:opacity-40 rounded-2xl font-black text-lg tracking-tight hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_40px_rgba(22,163,74,0.3)] overflow-hidden"><div className="relative z-10 flex items-center justify-center gap-2">⚔️ NORMAL SAVAŞ</div><div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div></button>
          </div>
        ) : (
          <button onClick={battle} disabled={team.filter(x => x).length === 0 || phase === "battle" || versusReady} className="w-full group relative py-5 mt-2 bg-gray-800/60 disabled:cursor-not-allowed rounded-2xl font-black text-2xl tracking-tighter hover:scale-[1.01] hover:bg-gray-700/70 hover:border-gray-500/60 active:scale-95 transition-all duration-200 border-2 border-gray-600/40 text-gray-300 overflow-hidden"><div className="relative z-10 flex items-center justify-center gap-3">{team.filter(x => x).length === 0 ? <><span className="text-4xl">🐾</span><span>ÖNCE TAKIMINA HAYVAN EKLE!</span></> : versusReady ? `⏳ Rakip Bekleniyor...` : "⚔️ SAVAŞI BAŞLAT"}</div><div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div></button>
        )}
      </div>

      {bossChallenge === "reward" && (
        <BossRewardScreen
          boss={BOSSES[turn]}
          bossRewards={bossRewards}
          teamFull={team.filter(x => x).length >= teamSlots}
          onSelectReward={(a) => { setRewards(prev => [...prev, { ...a, isR: true }]); goToShop(); }}
          onSkip={goToShop}
        />
      )}
      {newTier && (
        <NewTierScreen
          newTier={newTier}
          onContinue={() => { setNewTier(null); setPhase("shop"); }}
        />
      )}
    </>
  );
}
