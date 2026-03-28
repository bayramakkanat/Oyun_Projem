import Card from "./Card";
import StarField from "./StarField";
import { getDesc } from "../utils/getDesc";
import { WIN_TURN } from "../data/gameData";

export default function VictoryScreen({
  wins,
  lives,
  team,
  perfectRun,
  onRestart,
  onMenu,
  gameMode,
  onRematch,
}) {
  const teamSnapshot = team.filter((x) => x);
  return (
   <div className="min-h-screen text-white flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{background: "radial-gradient(ellipse at top, #1a0533 0%, #0d0d1a 40%, #1a1000 100%)"}}>
      <StarField />
      <div
     className="relative z-10 max-w-lg w-full text-center mx-auto"
        style={{ animation: "fadeIn 0.5s ease-out" }}
      >
        <div
         className="text-8xl mb-4"
          style={{ animation: "trophyFloat 3s ease-in-out infinite" }}
        >
          🏆
        </div>
        {perfectRun && (
          <div className="text-yellow-400 font-black text-sm uppercase tracking-widest mb-2 animate-pulse">
            ✨ MÜKEMMEL OYUN ✨
          </div>
        )}
        <div
          className="text-4xl font-black mb-1 text-yellow-300"
          style={{ animation: "victoryGlow 2s ease-in-out infinite" }}
        >
          TEBRİKLER! 🎊
        </div>
        <div className="text-gray-400 mb-6 text-sm uppercase tracking-widest">
          Arenaya hükmettin
        </div>
       <div className="grid grid-cols-3 gap-3 mb-6">
          <div
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 backdrop-blur-sm"
            style={{ animation: "statCardPop 0.5s ease-out 0.1s both" }}
          >
            <div className="text-2xl font-black text-yellow-300">
              {WIN_TURN}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
              Tur Tamamlandı
            </div>
          </div>
          <div
            className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 backdrop-blur-sm"
            style={{ animation: "statCardPop 0.5s ease-out 0.25s both" }}
          >
            <div className="text-2xl font-black text-green-400">{wins}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
              Galibiyet
            </div>
          </div>
          <div
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 backdrop-blur-sm"
            style={{ animation: "statCardPop 0.5s ease-out 0.4s both" }}
          >
            <div className="text-2xl font-black text-red-400">{lives} ❤️</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
              Kalan Can
            </div>
          </div>
        </div>
        {teamSnapshot.length > 0 && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 mb-6">
            <div className="text-[10px] text-yellow-500/60 uppercase tracking-widest mb-3">
              Şampiyon Takımın
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              {teamSnapshot.map((pet) => (
                <div key={pet.id} className="flex-shrink-0">
                 <Card
  a={pet}
  onClick={() => {}}
  selected={false}
  compact={false}
  battle={true}
  showName={false}
  getDesc={getDesc}
  mirror={true}
/>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mb-6 p-3 bg-white/5 rounded-xl border border-white/10 text-sm italic text-gray-400">
          {perfectRun
            ? "👑 Hiç can kaybetmeden zafere ulaştın. Efsanesin!"
            : lives >= 4
            ? "🔥 Neredeyse kusursuz bir zafer!"
            : lives >= 2
            ? "⚔️ Zorlu bir yolculuktu ama sonunda kazandın!"
            : "💀 Son nefeste bile pes etmedin. Gerçek bir savaşçı!"}
        </div>
       <div className="flex gap-3">
  {gameMode === "versus" && onRematch ? (
    <button
      onClick={onRematch}
      className="flex-1 py-4 bg-purple-600 border border-purple-400/50 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl"
    >
      ⚡ Tekrar Oyna
    </button>
  ) : (
    <button onClick={onRestart} className="flex-1 py-4 bg-yellow-500 text-black rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl">
      🔄 Tekrar Oyna
    </button>
  )}
  <button onClick={onMenu} className="flex-1 py-4 bg-white/10 border border-white/20 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all">
    🏠 Ana Menü
  </button>
</div>
      </div>
    </div>
  );
}
