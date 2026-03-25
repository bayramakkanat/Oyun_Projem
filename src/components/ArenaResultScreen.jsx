import React from "react";
import { useGameContext } from "../context/GameContext";

export default function ArenaResultScreen() {
  const {
    arenaResult,
    setArenaResult,
    reset,
    setMenuView,
    setGameStarted,
  } = useGameContext();

  if (!arenaResult) return null;

  const { reachedTurn, totalWins, totalLosses, earnedXP, isNewRecord, xpBreakdown } = arenaResult;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 100%)" }}
    >
      <div className="relative w-full max-w-md mx-4 flex flex-col items-center gap-6">
        {isNewRecord && (
          <div className="text-center animate-bounce">
            <div className="text-5xl mb-1">🏆</div>
            <div
              className="text-yellow-300 font-black text-xl tracking-widest uppercase"
              style={{ textShadow: "0 0 20px rgba(253,224,71,0.8)" }}
            >
              YENİ REKOR!
            </div>
            <div className="text-yellow-400/70 text-sm">Bu tura ilk kez ulaştınız!</div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full backdrop-blur-xl flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">
              Arena Sonucu
            </div>
            <div className="text-white font-black text-6xl">{reachedTurn}</div>
            <div className="text-gray-400 text-sm">. Tura Ulaştın</div>
          </div>

          <div className="flex gap-6 w-full justify-center">
            <div className="flex flex-col items-center">
              <span className="text-green-400 font-black text-2xl">{totalWins}</span>
              <span className="text-gray-500 text-xs uppercase tracking-wide">Zafer</span>
            </div>
            <div className="w-px bg-white/10"></div>
            <div className="flex flex-col items-center">
              <span className="text-red-400 font-black text-2xl">{totalLosses}</span>
              <span className="text-gray-500 text-xs uppercase tracking-wide">Yenilgi</span>
            </div>
          </div>

          <div className="w-full bg-white/5 rounded-2xl p-4 flex flex-col gap-2">
            <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">
              Kazanılan XP
            </div>
            {xpBreakdown.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">{item.label}</span>
                <span className={`font-bold ${item.xp < 0 ? "text-red-400" : "text-purple-300"}`}>
                  {item.xp > 0 ? "+" : ""}{item.xp} XP
                </span>
              </div>
            ))}
            <div className="border-t border-white/10 mt-1 pt-2 flex justify-between font-black">
              <span className="text-white">Toplam</span>
              <span className="text-yellow-300 text-lg">+{earnedXP} XP</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => { setArenaResult(null); reset(); }}
            className="flex-1 py-3 rounded-2xl bg-white/10 border border-white/20 font-bold text-white hover:bg-white/20 transition-all"
          >
            🔁 Tekrar
          </button>
          <button
            onClick={() => { setArenaResult(null); reset(); setMenuView("main"); setGameStarted(false); }}
            className="flex-1 py-3 rounded-2xl bg-purple-600 border border-purple-400/50 font-bold text-white hover:bg-purple-500 transition-all"
          >
            🏠 Ana Menü
          </button>
        </div>
      </div>
    </div>
  );
}
