import React, { useEffect, useRef, useState } from "react";
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

  // ── 17. tur geçince kalp efekti ───────────────────────────────────────────
  // Arena modunda, turn WIN_TURN'ü geçtiğinde can artışını vurgula.
  const prevLivesRef = useRef(lives);
  const [heartBurst, setHeartBurst] = useState(false);

  useEffect(() => {
    if (gameMode === "arena" && lives > prevLivesRef.current) {
      // Can arttı — efekti tetikle
      setHeartBurst(true);
      const t = setTimeout(() => setHeartBurst(false), 2000);
      return () => clearTimeout(t);
    }
    prevLivesRef.current = lives;
  }, [lives, gameMode]);

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-stretch gap-1.5 mb-3 px-1">

      {/* SOL / SATIR 1: Tur / Kademe / Rehber / Koleksiyon / Boss */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Tur */}
        <div
          className="flex flex-col items-center bg-gray-900/80 border border-white/20 px-2.5 rounded-2xl shadow-inner min-w-[44px] h-[44px] sm:min-w-[52px] sm:h-[52px] justify-center flex-shrink-0"
          style={{ animation: "hudItemGlow 3s ease-in-out infinite" }}
        >
          <span className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-widest font-black">TUR</span>
          <span className="text-white font-black text-sm sm:text-base leading-none">
            {turn}
            {gameMode === "standard" && (
              <span className="text-gray-500 text-[9px] sm:text-[10px] font-bold">/{WIN_TURN}</span>
            )}
          </span>
        </div>

        {/* Kademe */}
        <div className="flex flex-col items-center bg-purple-900/60 border border-purple-400/30 px-2 sm:px-3 rounded-2xl shadow-inner h-[44px] sm:h-[52px] justify-center">
          <span className="text-[8px] sm:text-[9px] text-purple-300 uppercase tracking-widest font-black mb-0.5">KADEME</span>
          <div className="flex gap-0.5 sm:gap-1">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center font-black text-xs sm:text-sm transition-all
                  ${i <= maxT ? "bg-purple-600 border-2 border-purple-300 text-white shadow-lg shadow-purple-500/40" : "bg-gray-800 border-2 border-gray-600 text-gray-500"}
                  ${i === maxT ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-black" : ""}`}
              >
                {i}
              </div>
            ))}
          </div>
        </div>

        {/* Rehber */}
        <button
          onClick={() => setGuide(true)}
          className="bg-gray-900/70 rounded-xl text-sm sm:text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30 w-[40px] h-[44px] sm:w-[48px] sm:h-[52px] flex items-center justify-center flex-shrink-0"
        >🗺️</button>

        {/* Koleksiyon */}
        <button
          onClick={() => setShowCollection(true)}
          className="bg-gray-900/70 rounded-xl text-sm sm:text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30 w-[40px] h-[44px] sm:w-[48px] sm:h-[52px] flex items-center justify-center flex-shrink-0"
        >📖</button>

        {/* Boss uyarısı */}
        {gameMode === "standard" && BOSSES[turn + 1] && (
          <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-red-900/80 to-orange-900/80 border border-red-500/60 rounded-2xl shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse">
            <span className="text-sm sm:text-base">{BOSSES[turn + 1].emoji}</span>
            <div className="flex flex-col leading-none">
              <span className="text-[8px] sm:text-[9px] text-red-300 font-black uppercase tracking-widest">Sonraki</span>
              <span className="text-red-100 font-black text-[10px] sm:text-xs">BOSS!</span>
            </div>
          </div>
        )}
      </div>

      {/* SAĞ / SATIR 2: Altın / Can / Zafer / Ses / Menü */}
      <div className="flex items-center gap-1.5">
        {/* Altın */}
        <div className="flex flex-col items-center bg-yellow-900/60 border border-yellow-500/40 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl min-w-[44px] sm:min-w-[48px]">
          <span className="text-[8px] sm:text-[9px] text-yellow-400 uppercase tracking-widest font-black">ALTIN</span>
          <span className="text-yellow-200 font-black text-sm sm:text-base leading-none">💰{gold}</span>
        </div>

        {/* Can — 17. tur geçince parlak efekt */}
        <div
          className="flex flex-col items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl min-w-[44px] sm:min-w-[48px] relative overflow-visible transition-all duration-300"
          style={heartBurst ? {
            background: "linear-gradient(135deg, rgba(190,18,60,0.8) 0%, rgba(239,68,68,0.6) 100%)",
            border: "2px solid rgba(251,113,133,0.9)",
            boxShadow: "0 0 20px rgba(251,113,133,0.8), 0 0 40px rgba(239,68,68,0.5)",
            animation: "hudHeartBurst 0.6s cubic-bezier(0.34,1.5,0.64,1)",
          } : {
            background: "rgba(127,29,29,0.6)",
            border: "1px solid rgba(239,68,68,0.4)",
          }}
        >
          <span className="text-[8px] sm:text-[9px] text-red-400 uppercase tracking-widest font-black">CAN</span>
          <span
            className="text-red-200 font-black text-sm sm:text-base leading-none"
            style={heartBurst ? { animation: "hudHeartScale 0.5s cubic-bezier(0.34,1.5,0.64,1)" } : {}}
          >
            ❤️{lives}
          </span>
          {/* +1 yüzen yazı */}
          {heartBurst && (
            <div
              style={{
                position: "absolute",
                top: "-20px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "13px",
                fontWeight: 900,
                color: "#fda4af",
                textShadow: "0 0 8px rgba(251,113,133,0.9)",
                animation: "hudLifeFloat 1.6s ease-out forwards",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              +1 ❤️
            </div>
          )}
        </div>

        {/* Zafer */}
        <div className="flex flex-col items-center bg-green-900/60 border border-green-500/40 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl min-w-[44px] sm:min-w-[48px]">
          <span className="text-[8px] sm:text-[9px] text-green-400 uppercase tracking-widest font-black">ZAFER</span>
          <span className="text-green-200 font-black text-sm sm:text-base leading-none">✓{wins}</span>
        </div>

        {/* Ses + Menü */}
        <div className="ml-auto sm:ml-0 flex gap-1.5">
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="bg-gray-900/70 rounded-xl text-sm sm:text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30 w-[40px] h-[44px] sm:w-[48px] sm:h-[52px] flex items-center justify-center flex-shrink-0"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
          <button
            onClick={() => { reset(); setMenuView("main"); setGameStarted(false); }}
            className="bg-gray-900/70 rounded-xl text-sm sm:text-base hover:bg-gray-700/80 transition-all border border-white/10 hover:border-white/30 w-[40px] h-[44px] sm:w-[48px] sm:h-[52px] flex items-center justify-center flex-shrink-0"
          >
            🏠
          </button>
        </div>
      </div>

      <style>{`
        @keyframes hudHeartBurst {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        @keyframes hudHeartScale {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        @keyframes hudLifeFloat {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
          70%  { opacity: 1; transform: translateX(-50%) translateY(-28px); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-36px); }
        }
      `}</style>
    </div>
  );
}
