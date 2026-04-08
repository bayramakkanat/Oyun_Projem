import { useRef, useEffect } from "react";
import PixiBattleScene from "./PixiBattleScene";
import { BOSSES } from "../data/gameData";
import { useGameContext } from "../context/GameContext";

export default function BattleView() {
  const {
    turn, gold, lives, wins, pT, eT, log, step, anims,
    bossChallenge, arenaOpponent, battleSpeedRef, isPaused, setIsPaused, isPausedRef, user,
  } = useGameContext();

  const onPauseToggle = () => {
    if (isPausedRef) isPausedRef.current = !isPausedRef.current;
    if (setIsPaused) setIsPaused((p) => !p);
  };
  // remove trailing lines...
















  const logR = useRef(null);
useEffect(() => {
    if (logR.current) {
      logR.current.scrollTop = logR.current.scrollHeight;
    }
  }, [log]);
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden animated-bg"
    >
      {/* Üst bilgi barı */}
      <div className="flex justify-between items-center px-8 py-3 bg-gradient-to-r from-black/70 via-purple-950/50 to-black/70 backdrop-blur-xl border-b border-purple-500/20 z-10 flex-shrink-0">
        <div className="flex gap-6 items-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              Aşama
            </span>
            <span className="font-black text-xl tracking-tighter text-white">
              TUR {turn}
            </span>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-yellow-500/60 font-bold">
                💰 Altın
              </span>
              <span className="text-lg font-black text-yellow-400">{gold}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-red-500/60 font-bold">
                ❤️ Can
              </span>
              <span className="text-lg font-black text-red-400">{lives}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-green-500/60 font-bold">
                ✓ Zafer
              </span>
              <span className="text-lg font-black text-green-400">{wins}</span>
            </div>
          </div>
        </div>

        {bossChallenge === "battle" && BOSSES[turn] && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 bg-red-950/40 border border-red-500/50 px-6 py-2 rounded-full backdrop-blur-lg animate-pulse">
            <span className="text-2xl">{BOSSES[turn].emoji}</span>
            <span className="text-sm font-black text-white tracking-widest uppercase">
              {BOSSES[turn].name} BOSS SAVAŞI
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
         <div className="flex items-center mr-2">
            <div className="flex gap-1 items-center bg-black/40 border border-white/10 rounded-xl p-1 backdrop-blur-sm">
             {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    battleSpeedRef.current = s;
                    localStorage.setItem("petgame_battle_speed", s);
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                    battleSpeedRef.current === s
                      ? "bg-white text-black shadow-lg"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {s}x
                </button>
              ))}
              <div className="w-px h-6 bg-white/10"></div>
             <button
                onClick={onPauseToggle}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black transition-all ${
                  isPaused
                    ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/40"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
                title={isPaused ? "Devam Et" : "Duraklat"}
              >
                {isPaused ? "▶" : "⏸"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ana savaş alanı */}
      <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden min-h-0">
        {/* Atmosfer katman 1: ust koyu sis */}
        <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/60 via-purple-950/30 to-transparent pointer-events-none"></div>
        {/* Atmosfer katman 2: merkez radial parlakligi */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(109,40,217,0.18)_0%,transparent_65%)] pointer-events-none"></div>
        {/* Atmosfer katman 3: oyuncu tarafi yesil sis */}
        <div className="absolute bottom-1/4 left-0 w-1/2 h-64 bg-gradient-to-r from-emerald-500/8 via-green-500/5 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        {/* Atmosfer katman 4: dusaman tarafi kirmizi sis */}
        <div className="absolute bottom-1/4 right-0 w-1/2 h-64 bg-gradient-to-l from-red-500/8 via-rose-500/5 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: "1.2s" }}></div>
        {/* Atmosfer katman 5: alt zemin isigi */}
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-purple-950/40 via-purple-900/10 to-transparent pointer-events-none"></div>
       <div
          className="absolute bottom-0 w-[150%] h-[40%] border-t border-white/10"
          style={{
            transform: "perspective(1000px) rotateX(60deg)",
            transformOrigin: "bottom center",
            background:
              "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, rgba(139,92,246,0.03) 40%, transparent 80%)",
            animation: "groundReflection 4s ease-in-out infinite",
          }}
        ></div>
        {/* Zemin grid çizgileri */}
        <div
          className="absolute bottom-0 w-[150%] h-[40%] opacity-20 pointer-events-none"
          style={{
            transform: "perspective(1000px) rotateX(60deg)",
            transformOrigin: "bottom center",
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(139,92,246,0.1) 50px, rgba(139,92,246,0.1) 51px)",
          }}
        ></div>
        <div className="relative z-10 flex flex-col items-center gap-2 w-full px-4 mt-24">
          {/* Takım İsimleri */}
          <div className="w-full max-w-2xl flex justify-between px-16 mb-2">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] text-green-400 font-black uppercase tracking-widest glass-panel px-3 py-1 rounded-md" style={{ animation: "labelSlideDown 0.4s ease-out" }}>
  Takımın
</span>
              <span
               className="text-base font-black text-green-300 glass-panel-strong px-4 py-1.5 rounded-full border-2 border-green-400/80 shadow-lg shadow-green-500/30 uppercase tracking-wide hover-glow"
style={{ 
  textShadow: "0 0 10px rgba(74,222,128,0.8), 0 0 20px rgba(74,222,128,0.5)",
  animation: "neonPulse 2s ease-in-out infinite"
}}
              >
              
                 {user
  ? user.displayName || user.email.split("@")[0]
  : "TAKIMIN"}
              </span>
            </div>
           <div className="flex flex-col items-center gap-2">
             <span className="text-[11px] text-red-400 font-black uppercase tracking-widest glass-panel px-3 py-1 rounded-md" style={{ animation: "labelSlideDown 0.4s ease-out" }}>
  Rakip
</span>
              <span
                className="text-base font-black text-red-300 glass-panel-strong px-4 py-1.5 rounded-full border-2 border-red-400/80 shadow-lg shadow-red-500/30 hover-glow"
                style={{ 
                  textShadow: "0 0 10px rgba(248,113,113,0.8), 0 0 20px rgba(248,113,113,0.5)",
                  animation: "neonPulse 2s ease-in-out infinite",
                  animationDelay: "1s"
                }}
              >
                {arenaOpponent
                  ? arenaOpponent.userName || "Rakip"
                  : bossChallenge === "battle"
                  ? BOSSES[turn]?.name
                  : "DÜŞMAN"}
              </span>
            </div>
          </div>

          {/* Savaş Sahnesi */}
          <div className="flex flex-row items-center justify-center w-full max-w-7xl gap-4">
               <PixiBattleScene pT={pT} eT={eT} anims={anims} step={step} turn={turn} />
          </div>
        </div>
      </div>

      {/* Alt log paneli */}
      <div
        className="flex-shrink-0 glass-panel-strong border-t-2 border-purple-500/40 z-10"
        style={{ 
          height: "22vh",
          boxShadow: "0 -4px 30px rgba(139, 92, 246, 0.15)"
        }}
      >
        <div className="flex justify-between items-center px-4 pt-1.5 pb-1">
          <span className="text-xs text-purple-400 font-bold">
            📜 Savaş Logları
          </span>
          <span className="text-xs text-yellow-400 font-bold">TUR {turn}</span>
        </div>
        <div
          ref={logR}
         className="mx-3 mb-2 bg-gray-900/80 rounded-xl p-2 overflow-y-auto font-mono border border-purple-800/30"
          style={{ height: "calc(22vh - 36px)" }}
        >
         {log.map((l, i) => {
  const isVictory = l.includes("🎉 ZAFER");
  const isDefeat  = l.includes("💀 Yenilgi") || l.includes("BOSS SAVAŞI");
  let color = "text-gray-300";
  if (isVictory)
    color = "text-yellow-300 font-black text-base";
  else if (isDefeat)
    color = "text-red-400 font-black";
  else if (l.includes("KALICI")) color = "text-purple-300 font-bold";
  else if (l.includes("🦤 Dodo")) color = "text-orange-300 font-bold";
  else if (
    l.includes("hasar") ||
    l.includes("Hasar") ||
    l.includes("☠️") ||
    l.includes("🌊")
  )
    color = "text-red-300";
  else if (l.includes("+")) color = "text-green-300";
  else if (l.includes("Düşman")) color = "text-orange-200 opacity-80";
  return (
    <div
      key={i}
      className={`${color} py-0.5 border-b border-gray-800/20 last:border-b-0 ${
        isVictory ? "log-flash-victory" : isDefeat ? "log-flash-defeat" : ""
      }`}
      style={{ animation: isVictory || isDefeat ? "logEntryBig 0.4s ease-out" : "fadeIn 0.2s ease-out" }}
    >
      {l}
    </div>
  );
})}
        </div>
      </div>
    </div>
  );
}
