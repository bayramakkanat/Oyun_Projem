import React from "react";
import { useGameContext } from "../context/GameContext";
import { BOSSES, WIN_TURN } from "../data/gameData";

export default function HUD() {
  const {
    gameMode,
    turn,
    maxT,
    setGuide,
    setShowCollection,
    gold,
    lives,
    wins,
    soundEnabled,
    setSoundEnabled,
    reset,
    setMenuView,
    setGameStarted,
  } = useGameContext();

  return (
    <div className="flex justify-between items-stretch mb-3 px-1">
      {/* SOL: Tur / Kademe / Rehber / Koleksiyon / Boss uyarısı */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex flex-col items-center bg-gray-900/80 border border-white/20 px-3 rounded-2xl shadow-inner min-w-[52px] h-[52px] justify-center">
          <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">TUR</span>
          <span className="text-white font-black text-base leading-none">
            {turn}
            {gameMode === "standard" && (
              <span className="text-gray-500 text-[10px] font-bold">/{WIN_TURN}</span>
            )}
          </span>
        </div>
        <div className="flex flex-col items-center bg-purple-900/60 border border-purple-400/30 px-3 rounded-2xl shadow-inner h-[52px] justify-center">
          <span className="text-[9px] text-purple-300 uppercase tracking-widest font-black mb-0.5">KADEME</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm transition-all ${i <= maxT ? "bg-purple-600 border-2 border-purple-300 text-white shadow-lg shadow-purple-500/40" : "bg-gray-800 border-2 border-gray-600 text-gray-500"} ${i === maxT ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-black" : ""}`}>{i}</div>
            ))}
          </div>
        </div>
        <button onClick={() => setGuide(true)} className="bg-gray-900/70 rounded-xl text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30 w-[48px] h-[52px] flex items-center justify-center">🗺️</button>
        <button onClick={() => setShowCollection(true)} className="bg-gray-900/70 rounded-xl text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30 w-[48px] h-[52px] flex items-center justify-center">📖</button>
        {gameMode === "standard" && BOSSES[turn + 1] && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-900/80 to-orange-900/80 border border-red-500/60 rounded-2xl shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse">
            <span className="text-base">{BOSSES[turn + 1].emoji}</span>
            <div className="flex flex-col leading-none">
              <span className="text-[9px] text-red-300 font-black uppercase tracking-widest">Sonraki</span>
              <span className="text-red-100 font-black text-xs">BOSS!</span>
            </div>
          </div>
        )}
      </div>

      {/* SAĞ: Altın / Can / Zafer / Ses / Menü */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center bg-yellow-900/60 border border-yellow-500/40 px-3 py-1.5 rounded-2xl min-w-[48px]">
          <span className="text-[9px] text-yellow-400 uppercase tracking-widest font-black">ALTIN</span>
          <span className="text-yellow-200 font-black text-base leading-none">💰{gold}</span>
        </div>
        <div className="flex flex-col items-center bg-red-900/60 border border-red-500/40 px-3 py-1.5 rounded-2xl min-w-[48px]">
          <span className="text-[9px] text-red-400 uppercase tracking-widest font-black">CAN</span>
          <span className="text-red-200 font-black text-base leading-none">❤️{lives}</span>
        </div>
        <div className="flex flex-col items-center bg-green-900/60 border border-green-500/40 px-3 py-1.5 rounded-2xl min-w-[48px]">
          <span className="text-[9px] text-green-400 uppercase tracking-widest font-black">ZAFER</span>
          <span className="text-green-200 font-black text-base leading-none">✓{wins}</span>
        </div>
        <button onClick={() => setSoundEnabled(s => !s)} className="p-2 bg-gray-900/70 rounded-xl text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30">{soundEnabled ? "🔊" : "🔇"}</button>
        <button onClick={() => { reset(); setMenuView("main"); setGameStarted(false); }} className="p-2 bg-gray-900/70 rounded-xl text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30">🏠</button>
      </div>
    </div>
  );
}