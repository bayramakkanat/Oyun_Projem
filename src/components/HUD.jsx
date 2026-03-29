import React from "react";
import { useShopContext } from "../context/ShopContext";
import { useUIContext } from "../context/UIContext";
import { BOSSES, WIN_TURN } from "../data/gameData";

export default function HUD({ reset }) {
  const { turn, maxT, gold } = useShopContext();
  const {
    gameMode,
    setGuide,
    setShowCollection,
    lives,
    wins,
    soundEnabled,
    setSoundEnabled,
    setMenuView,
    setGameStarted,
  } = useUIContext();

  return (
    <div className="flex flex-col gap-1.5 mb-3 px-1">
      
      {/* SATIR 1: Tur + Kademe + Rehber/Koleksiyon + Boss uyarısı */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Tur */}
        <div
          className="flex flex-col items-center bg-gray-900/80 border border-white/20 px-2.5 rounded-2xl shadow-inner w-[44px] h-[44px] justify-center flex-shrink-0"
          style={{ animation: "hudItemGlow 3s ease-in-out infinite" }}
        >
          <span className="text-[8px] text-gray-400 uppercase tracking-widest font-black">TUR</span>
          <span className="text-white font-black text-sm leading-none">
            {turn}
            {gameMode === "standard" && (
              <span className="text-gray-500 text-[9px] font-bold">/{WIN_TURN}</span>
            )}
          </span>
        </div>

        {/* Kademe */}
        <div className="flex flex-col items-center bg-purple-900/60 border border-purple-400/30 px-2 rounded-2xl shadow-inner h-[44px] justify-center">
          <span className="text-[8px] text-purple-300 uppercase tracking-widest font-black mb-0.5">KADEME</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs transition-all
                  ${i <= maxT
                    ? "bg-purple-600 border-2 border-purple-300 text-white shadow-lg shadow-purple-500/40"
                    : "bg-gray-800 border-2 border-gray-600 text-gray-500"}
                  ${i === maxT ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-black" : ""}`}
              >
                {i}
              </div>
            ))}
          </div>
        </div>

        {/* Rehber + Koleksiyon */}
        <button
          onClick={() => setGuide(true)}
          className="bg-gray-900/70 rounded-xl text-sm hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30 w-[40px] h-[44px] flex items-center justify-center flex-shrink-0"
        >🗺️</button>
        <button
          onClick={() => setShowCollection(true)}
          className="bg-gray-900/70 rounded-xl text-sm hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30 w-[40px] h-[44px] flex items-center justify-center flex-shrink-0"
        >📖</button>

        {/* Boss uyarısı */}
        {gameMode === "standard" && BOSSES[turn + 1] && (
          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-900/80 to-orange-900/80 border border-red-500/60 rounded-2xl shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse">
            <span className="text-sm">{BOSSES[turn + 1].emoji}</span>
            <div className="flex flex-col leading-none">
              <span className="text-[8px] text-red-300 font-black uppercase tracking-widest">Sonraki</span>
              <span className="text-red-100 font-black text-[10px]">BOSS!</span>
            </div>
          </div>
        )}
      </div>

      {/* SATIR 2: Altın + Can + Zafer + [boşluk] + Ses + Menü */}
      <div className="flex items-center gap-1.5">
        {/* Altın */}
        <div className="flex items-center gap-1 bg-yellow-900/60 border border-yellow-500/40 px-2.5 py-1 rounded-xl">
          <span className="text-base">💰</span>
          <div className="flex flex-col leading-none">
            <span className="text-[8px] text-yellow-400 uppercase font-black">ALTIN</span>
            <span className="text-yellow-200 font-black text-sm">{gold}</span>
          </div>
        </div>

        {/* Can */}
        <div className="flex items-center gap-1 bg-red-900/60 border border-red-500/40 px-2.5 py-1 rounded-xl">
          <span className="text-base">❤️</span>
          <div className="flex flex-col leading-none">
            <span className="text-[8px] text-red-400 uppercase font-black">CAN</span>
            <span className="text-red-200 font-black text-sm">{lives}</span>
          </div>
        </div>

        {/* Zafer */}
        <div className="flex items-center gap-1 bg-green-900/60 border border-green-500/40 px-2.5 py-1 rounded-xl">
          <span className="text-base">✓</span>
          <div className="flex flex-col leading-none">
            <span className="text-[8px] text-green-400 uppercase font-black">ZAFER</span>
            <span className="text-green-200 font-black text-sm">{wins}</span>
          </div>
        </div>

        {/* Sağa yasla: Ses + Menü */}
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="p-2 bg-gray-900/70 rounded-xl text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30 w-[40px] h-[36px] flex items-center justify-center"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
          <button
            onClick={() => { reset(); setMenuView("main"); setGameStarted(false); }}
            className="p-2 bg-gray-900/70 rounded-xl text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30 w-[40px] h-[36px] flex items-center justify-center"
          >
            🏠
          </button>
        </div>
      </div>

    </div>
  );
}