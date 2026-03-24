import Card from "./Card";
import StarField from "./StarField";
import { getDesc } from "../utils/getDesc";

export default function GameOverScreen({
  turn,
  wins,
  stats,
  team,
  onRestart,
  onMenu,
  gameMode,
  onRematch,
}) {
  const survived = turn - 1;
  const teamSnapshot = team.filter((x) => x);
  return (
    <div className="min-h-screen animated-bg text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <StarField />
      <div
        className="relative z-10 max-w-lg w-full text-center mx-auto"
        style={{ animation: "fadeIn 0.5s ease-out" }}
      >
        <div
          className="text-8xl mb-4"
          style={{ animation: "shake 0.5s ease-out" }}
        >
          💀
        </div>
        <div className="text-4xl font-black mb-1 text-red-400">OYUN BİTTİ</div>
        <div className="text-gray-400 mb-6 text-sm uppercase tracking-widest">
          Savaşçı düştü ama efsane yaşıyor
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-2xl font-black text-white">{survived}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
              Tur Hayatta
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-2xl font-black text-green-400">{wins}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
              Galibiyet
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-2xl font-black text-blue-400">
              {Math.max(stats.bestTurn, turn)}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
              Rekor Tur
            </div>
          </div>
        </div>
        {teamSnapshot.length > 0 && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 mb-6 max-w-lg mx-auto">
            <div className="text-[10px] text-yellow-500/60 uppercase tracking-widest mb-3">
              Son Takımın
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
          {wins >= 8
            ? "🔥 Muhteşem bir savaştı! Neredeyse zirveye ulaştın."
            : wins >= 5
            ? "⚔️ Güçlü bir performans! Bir dahaki sefere daha da iyi olacak."
            : wins >= 3
            ? "🛡️ İyi bir başlangıç. Strateji geliştirmeye devam et."
            : "🌱 Her savaş bir öğretmendir. Tekrar dene!"}
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
    <button onClick={onRestart} className="flex-1 py-4 bg-green-600 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl">
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
