import React from "react";
import { useGameContext } from "../context/GameContext";
import Card from "./Card";
import BossRewardScreen from "./BossRewardScreen";
import NewTierScreen from "./NewTierScreen";
import DebugPanel from "./DebugPanel";
import { getDesc } from "../utils/getDesc";
import { playSound } from "../hooks/useSound";
import { ABILITY_ICONS, BOSSES, WIN_TURN } from "../data/gameData";
import { applyEndTurnBuffs } from "../utils/battleUtils";
import HUD from "./HUD";

export default function ShopView() {
  const {
    acceptBoss,
    achievementPopup,
    anims,
    battle,
    bossChallenge,
    bossRewards,
    buy,
    gold,
    hasR,
    isBossTurn,
    isPausedRef,
    lastError,
    lives,
    maxT,
    mergeT,
    newTier,
    newlyOpenedSlot,
    offerBoss,
    phase,
    refresh,
    reset,
    rewards,
    sel,
    selI,
    sell,
    setBossChallenge,
    setBossResult,
    setBossRewards,
    setGameStarted,
    setGold,
    setGuide,
    setLastError,
    setMenuView,
    setNewTier,
    setPhase,
    setPendingEndTurnAnims,
    setRewards,
    setSel,
    setSelI,
    setShowCollection,
    setShowDebugPanel,
    setSoundEnabled,
    setTeam,
    setTurnAndRef,
    setVersusPhase,
    setVersusReady,
    setVersusRoom,
    shop,
    shopSlots,
    showDebugPanel,
    soundEnabled,
    team,
    teamSlots,
    toggleFreeze,
    turn,
    turnRef,
    versusReady,
    wins,
    gameMode,            // ← gameMode eklendi
  } = useGameContext();

  const goToShop = () => {
    setBossChallenge(null);
    setBossResult(null);
    setBossRewards([]);
    const newTurn = turn + 1;
    setTurnAndRef(newTurn);
    setGold((g) => g + 10);
    const updatedTeam = applyEndTurnBuffs(team);
    setTeam(updatedTeam);
    setPendingEndTurnAnims(true);
    setPhase("shop");
  };

  return (
    <>
      {showDebugPanel && (
        <DebugPanel
          onClose={() => setShowDebugPanel(false)}
          onStartBattle={(playerTeam, enemyTeam, bossTurn) => {
            setShowDebugPanel(false);
            // debug savaşı başlatma (kısa)
          }}
        />
      )}

      {lastError && (
        <div className="fixed top-4 left-4 z-[9999] bg-red-900 border-2 border-red-500 rounded-lg p-3 max-w-md shadow-2xl">
          <div className="font-bold text-red-300 mb-1">⚠️ Bir Hata Oluştu</div>
          <div className="text-sm text-white">{lastError.message}</div>
          <button onClick={() => setLastError(null)} className="mt-2 px-2 py-1 bg-red-700 rounded text-xs hover:bg-red-600">Kapat</button>
        </div>
      )}

      {achievementPopup && (
        <div className="fixed top-6 right-6 z-50 bg-gradient-to-br from-yellow-900 to-orange-900 border-2 border-yellow-400 rounded-xl p-4 shadow-2xl flex items-center gap-3" style={{ animation: "slideIn 0.3s ease-out" }}>
          <span className="text-3xl">{achievementPopup.icon}</span>
          <div>
            <div className="text-yellow-300 font-bold text-sm">Başarım Kazandın!</div>
            <div className="text-white font-bold">{achievementPopup.name}</div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <HUD />

        {/* Shop alanı (kısaltılmış hali) */}
        <div className="bg-black/60 rounded-[2.5rem] p-4 mb-4 border border-white/10 shadow-2xl">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
            <span className="text-yellow-300/90">🛒 HAYVAN MAĞAZASI</span>
            <span className="text-blue-300/80 font-bold px-2 py-1 bg-blue-500/10 border border-blue-400/20 rounded-lg">SAĞ TIK = ❄️ DONDUR</span>
          </div>
          <div className="flex gap-2.5 justify-center items-end">
            {shop.map((a) => (
              <div key={a.id} className="flex flex-col items-center flex-shrink-0 gap-1 justify-end">
                <div
                  className={`relative transition-all duration-300 ${a.frozen ? "ring-2 ring-blue-400 shadow-lg shadow-blue-400/50" : ""} ${gold < a.cost ? "opacity-60 grayscale cursor-not-allowed" : "hover:scale-105 cursor-pointer"}`}
                  onClick={() => setSel(sel?.id === a.id ? null : a)}
                  onContextMenu={(e) => { e.preventDefault(); toggleFreeze(a); }}
                >
                  <Card a={a} anim={anims[a.id]} selected={sel?.id === a.id} showName={false} getDesc={getDesc} shop={shop} team={team} mirror={true} />
                  {a.frozen && <div className="absolute -top-1 -left-1 text-xl">❄️</div>}
                  {sel?.id === a.id && <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-[60]"><span className="text-white text-xs font-black">✓</span></div>}
                </div>
                <span className="text-sm text-yellow-300 font-bold">{a.cost}💰</span>
              </div>
            ))}
            {shopSlots < 4 && <div className="flex flex-col items-center flex-shrink-0 gap-1 opacity-40 h-[180px] justify-end"><div className="w-32 h-40 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center"><span className="text-2xl">🔒</span><span className="text-[10px] font-black tracking-tighter mt-1 text-yellow-400 uppercase">Tur 5</span></div><span className="text-sm font-bold opacity-0">0💰</span></div>}
            {shopSlots < 5 && <div className="flex flex-col items-center flex-shrink-0 gap-1 opacity-40 h-[180px] justify-end"><div className="w-32 h-40 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center"><span className="text-2xl">🔒</span><span className="text-[10px] font-black tracking-tighter mt-1 text-yellow-400 uppercase">Tur 7</span></div><span className="text-sm font-bold opacity-0">0💰</span></div>}
            <div className="flex flex-col items-center flex-shrink-0 gap-1 h-[180px] justify-end">
              <button onClick={() => { const unfrozen = shop.filter(s => !s.frozen); if (unfrozen.length === 0 || gold >= 1) { if (unfrozen.length > 0) setGold(g => g - 1); refresh(); playSound("refresh"); } }} disabled={gold < 1 && shop.filter(s => !s.frozen).length > 0} className="w-32 h-40 rounded-2xl bg-transparent disabled:opacity-40 flex flex-col items-center justify-center hover:bg-white/5 transition-all border-2 border-dashed border-white/10 group/roll"><span className="text-3xl group-hover/roll:rotate-180 transition-transform duration-500">🔄</span><span className="text-xs font-black mt-2">{shop.filter(s => !s.frozen).length === 0 ? "BEDAVA" : "1 💰"}</span></button>
              <span className="text-[10px] text-blue-400 font-black tracking-widest uppercase">YENİLE</span>
            </div>
          </div>
        </div>

        {sel && (
          <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-72 bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
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

        {hasR && (
          <div className="bg-gradient-to-br from-yellow-900/60 to-orange-900/60 border-2 border-yellow-500 rounded-xl p-3 mb-3 shadow-xl">
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

        <div className="bg-black/60 rounded-[2.5rem] p-4 mb-3 border border-white/10 shadow-2xl">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-4"><span className="text-yellow-300/90">⚔️ SAVAŞ TAKIMI</span>{sel?.pendingTargetBuff ? <span className="text-cyan-300 animate-pulse"> 🎯 Buff vermek için hedef seç!</span> : sel ? <span className="text-yellow-300"> - Slot seç</span> : null}</div>
          {sel?.pendingTargetBuff && <div className="mb-3 px-4 py-2 bg-cyan-900/60 border border-cyan-400/50 rounded-xl text-cyan-300 text-sm font-bold text-center">🎯 Buff vermek istediğin hayvana tıkla!</div>}
          <div className="flex gap-2.5 justify-center px-1 py-3">
            {team.map((a, i) => {
              const isLocked = (i === 4 && turn < 5) || (i === 5 && turn < 7);
              const lockedTurn = i === 4 ? 5 : 7;
              const isJustOpened = (i === 4 && newlyOpenedSlot === "shop_4_team_4") || (i === 5 && newlyOpenedSlot === "shop_5_team_5");
              if (isJustOpened) return <div key={i} className="flex flex-col items-center flex-shrink-0"><button onClick={() => { if (sel) buy(sel, i); else if (selI !== null) mergeT(selI, i); }} className="w-32 h-40 rounded-2xl border-2 border-green-500/50 text-green-400 text-3xl transition-all bg-green-500/10 backdrop-blur-md flex flex-col items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)]" style={{ animation: "slotUnlock 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" }}><span style={{ animation: "lockBreak 0.8s ease-out forwards" }}>🔓</span><span className="text-[10px] uppercase font-black tracking-widest mt-2">Açıldı!</span></button></div>;
              if (isLocked) return <div key={i} className="flex flex-col items-center flex-shrink-0 gap-1 opacity-40"><div className="w-32 h-40 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center"><span className="text-2xl">🔒</span><span className="text-[10px] font-black tracking-tighter mt-1 text-yellow-400 uppercase">Tur {lockedTurn}</span></div></div>;
              return a ? (
                <div key={a.id} onClick={() => {
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
                }} className="flex flex-col items-center flex-shrink-0">
                  <div className="relative group"><Card a={a} anim={anims[a.id]} selected={selI === i} onSell={() => sell(i)} showName={false} getDesc={getDesc} mirror={true} />{selI === i && <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-black z-20 flex items-center justify-center text-[8px] font-black text-black">✓</div>}</div>
                </div>
              ) : (
                <div key={i} className="flex flex-col items-center flex-shrink-0">
                  <button onClick={() => { if (sel) buy(sel, i); else if (selI !== null) { const newTeam = [...team]; [newTeam[selI], newTeam[i]] = [newTeam[i], newTeam[selI]]; setTeam(newTeam); setSelI(null); } }} className={`w-32 h-40 rounded-2xl transition-all flex items-center justify-center group/slot ${sel || selI !== null ? "border-2 border-dashed border-green-400/70 bg-green-500/5 text-green-400/50 hover:border-green-400 hover:bg-green-500/10 hover:scale-105 active:scale-95" : "border-0 bg-transparent hover:scale-105 active:scale-95"}`}><span className={`transition-transform duration-300 ${sel || selI !== null ? "group-hover/slot:rotate-90 text-green-400/50" : "text-white/20 text-xs"}`}>+</span></button>
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
          <button onClick={battle} disabled={team.filter(x => x).length === 0 || phase === "battle" || (versusReady)} className="w-full group relative py-5 mt-2 bg-gray-800/60 disabled:cursor-not-allowed rounded-2xl font-black text-2xl tracking-tighter hover:scale-[1.01] hover:bg-gray-700/70 hover:border-gray-500/60 active:scale-95 transition-all duration-200 border-2 border-gray-600/40 text-gray-300 overflow-hidden"><div className="relative z-10 flex items-center justify-center gap-3">{team.filter(x => x).length === 0 ? <><span className="text-4xl">🐾</span><span>ÖNCE TAKIMINA HAYVAN EKLE!</span></> : versusReady ? `⏳ Rakip Bekleniyor...` : "⚔️ SAVAŞI BAŞLAT"}</div><div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div></button>
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