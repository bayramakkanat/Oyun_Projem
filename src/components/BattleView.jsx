import { useRef, useEffect } from "react";
import battleBg from "../battleBg";
import Card from "./Card";
import StarField from "./StarField";
import { BOSSES } from "../data/gameData";

export default function BattleView({
  turn,
  gold,
  lives,
  wins,
  pT,
  eT,
  log,
  step,
  anims,
  bossChallenge,
  arenaOpponent,
 battleSpeedRef,
  isPaused,
  onPauseToggle,
  user,
}) {
  const logR = useRef(null);
useEffect(() => {
    if (logR.current) {
      logR.current.scrollTop = logR.current.scrollHeight;
    }
  }, [log]);
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${battleBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
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
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(60,20,100,0.15)_0%,transparent_70%)] pointer-events-none"></div>
        <div
          className="absolute bottom-0 w-[150%] h-[40%] bg-white/5 border-t border-white/10"
          style={{
            transform: "perspective(1000px) rotateX(60deg)",
            transformOrigin: "bottom center",
            background:
              "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 80%)",
          }}
        ></div>
        <div className="relative z-10 flex flex-col items-center gap-2 w-full px-4 mt-24">
          {/* Takım İsimleri */}
          <div className="w-full max-w-2xl flex justify-between px-16 mb-2">
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-green-400 font-black uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
  Takımın
</span>
              <span
               className="text-base font-black text-green-300 bg-black/80 px-4 py-1.5 rounded-full border-2 border-green-400/80 backdrop-blur-sm shadow-lg shadow-green-500/30 uppercase tracking-wide"
style={{ textShadow: "0 0 10px rgba(74,222,128,0.8)" }}
              >
                {user
                  ? (user.displayName || user.email.split("@")[0])
                      .split(" ")
                      .slice(1)
                      .join(" ") || user.email.split("@")[0]
                  : "TAKIMIN"}
              </span>
            </div>
            <div className="flex flex-col items-center">
             <span className="text-[11px] text-red-400 font-black uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
  Rakip
</span>
              <span
                className="text-base font-black text-red-300 bg-black/70 px-4 py-1.5 rounded-full border-2 border-red-400/80 backdrop-blur-sm shadow-lg shadow-red-500/30"
                style={{ textShadow: "0 0 10px rgba(248,113,113,0.8)" }}
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
          <div className="flex flex-row items-center justify-center w-full max-w-5xl gap-4">
            {/* Oyuncu takımı (SOLDA) */}
            <div className="flex items-center justify-start flex-nowrap flex-row-reverse min-h-[160px] pb-4 relative z-20 w-[45%] pr-4 gap-1 sm:gap-2">
              {pT.map((a, idx) => {
                const healthPercent = Math.max(0, (a.curHp / a.hp) * 100);
                return (
                  <div
                    key={a.id}
                    className="flex flex-col items-center transition-all duration-500 ease-out"
                    style={{ zIndex: 50 - idx }}
                  >
                    <div className="flex flex-col items-center mb-2 gap-0.5">
                     <div className="w-16 h-3 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            healthPercent > 50
                              ? "bg-green-500"
                              : healthPercent > 25
                              ? "bg-yellow-500"
                              : "bg-red-500 animate-pulse"
                          }`}
                          style={{ width: `${healthPercent}%` }}
                        />
                      </div>
                    </div>
                    <div
                      data-pet-id={a.id}
                      style={{
                        transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                        filter:
                          anims[a.id] === "damage"
                            ? "brightness(2) drop-shadow(0 0 15px white)"
                            : "none",
                      animation: step === 0 ? "dropIn 0.8s ease-out both" : "none",
                        animationDelay: step === 0 ? `${idx * 0.15}s` : "0s",
                      }}
                    >
                      <Card
                        a={{ ...a, curHp: a.curHp }}
                        anim={anims[a.id]}
                        onClick={() => {}}
                        selected={false}
                        compact={false}
                        battle={true}
                        mirror={true}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VS ortası */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className="text-5xl drop-shadow-2xl select-none"
                style={{
                  animation:
                    step % 2 === 0 ? "scaleAttack 0.5s ease-out" : "none",
                }}
              >
                ⚔️
              </div>
              <div className="text-sm text-white font-black tracking-widest bg-white/15 border border-white/20 px-3 py-1 rounded-full shadow-lg">
  VS
</div>
            </div>

            {/* Düşman takımı (SAĞDA) */}
            <div className="flex items-center justify-start flex-nowrap min-h-[160px] pb-6 relative z-20 w-[45%] pl-4 gap-1 sm:gap-2">
              {[...eT].map((a, idx) => {
                const isFront = idx === 0;
                const healthPercent = Math.max(0, (a.curHp / a.hp) * 100);
                return (
                  <div
                    key={a.id}
                    className="flex flex-col items-center transition-all duration-500 ease-out"
                    style={{ zIndex: 50 - idx }}
                  >
                    <div className="flex flex-col items-center mb-2 gap-0.5">
                     <div className="w-16 h-3 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            healthPercent > 50
                              ? "bg-red-500"
                              : healthPercent > 25
                              ? "bg-orange-500"
                              : "bg-red-800 animate-pulse"
                          }`}
                          style={{ width: `${healthPercent}%` }}
                        />
                      </div>
                    </div>
                    <div
                      data-pet-id={a.id}
                      style={{
                        transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                        filter:
                          anims[a.id] === "damage"
                            ? "brightness(2) drop-shadow(0 0 15px white)"
                            : "none",
                      animation: step === 0 ? "dropIn 0.8s ease-out both" : "none",
                        animationDelay: step === 0 ? `${idx * 0.15}s` : "0s",
                      }}
                    >
                      {a.isBossUnit && BOSSES[turn]?.image ? (
                        <div className="relative flex flex-col items-center justify-center">
                          <div className="relative flex items-center justify-center w-36 h-36">
                            <div
                              className="absolute w-28 h-28 rounded-full"
                              style={{
                                background: `radial-gradient(circle, ${BOSSES[turn].glow} 0%, transparent 70%)`,
                                animation: "glowPulse 2s ease-in-out infinite",
                              }}
                            />
                            <img
                              src={BOSSES[turn].image}
                              alt={a.nick}
                              className="relative z-10 w-28 h-28 object-contain"
                              style={{
                                filter: `drop-shadow(0 0 15px ${BOSSES[turn].glow})`,
                                animation:
                                  "victoryBounce 3s ease-in-out infinite",
                              }}
                            />
                          </div>
                          <div className="flex gap-1.5 items-center mt-1 z-20">
                            <div className="flex items-center gap-0.5 px-2 py-1 bg-orange-600/90 rounded-full border border-orange-400 shadow-sm">
                              <span className="text-sm">⚔️</span>
                              <span className="text-xs font-bold text-white">
                                {a.atk}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 px-2 py-1 bg-green-600/90 rounded-full border border-green-400 shadow-sm">
                              <span className="text-sm">❤️</span>
                              <span className="text-xs font-bold text-white">
                                {Math.max(0, a.curHp ?? 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Card
                          a={{ ...a, curHp: a.curHp }}
                          anim={anims[a.id]}
                          onClick={() => {}}
                          selected={false}
                          compact={false}
                          battle={true}
                          mirror={false}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Alt log paneli */}
      <div
        className="flex-shrink-0 bg-gradient-to-r from-black/70 via-purple-950/40 to-black/70 backdrop-blur-md border-t border-purple-500/30 z-10"
        style={{ height: "22vh" }}
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
  let color = "text-gray-300";
  if (l.includes("🎉 ZAFER"))
    color = "text-yellow-300 font-black text-base";
  else if (l.includes("💀 Yenilgi") || l.includes("BOSS SAVAŞI"))
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
      className={`${color} py-0.5 border-b border-gray-800/20 last:border-b-0`}
      style={{ animation: "fadeIn 0.2s ease-out" }}
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
