import Card from "./Card";
import StarField from "./StarField";
import { getDesc } from "../utils/getDesc";

export default function BossRewardScreen({
  boss,
  bossRewards,
  teamFull,
  onSelectReward,
  onSkip,
}) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${boss.color} text-white flex flex-col items-center justify-center p-4 relative overflow-hidden`}
    >
      <StarField />
      <div className="relative z-10 max-w-2xl w-full text-center">
        <div
          className="text-6xl mb-3"
          style={{ animation: "victoryBounce 1s ease-in-out infinite" }}
        >
          🏆
        </div>
        <div className="text-3xl font-black mb-1 text-yellow-300">
          {boss.name} Yenildi!
        </div>
        <div className="text-base text-gray-300 mb-6">
          +5 Altın kazandın! Aşağıdaki hayvanlardan birini seç:
        </div>
        <div className="bg-gradient-to-br from-yellow-900/60 to-orange-900/60 border-2 border-yellow-500 rounded-2xl p-5 mb-4 backdrop-blur-sm shadow-xl">
          <div className="text-sm text-yellow-300 mb-4 font-bold">
            🎁 Boss Ödülü — 1 hayvan seç!
            {teamFull && (
              <span className="text-red-400 ml-2">
                Takım dolu! Mağazadan yerleştir.
              </span>
            )}
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            {bossRewards.map((a) => (
              <div
                key={a.id}
                className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform group"
                onClick={() => onSelectReward(a)}
              >
                <Card
                  a={a}
                  onClick={() => {}}
                  selected={false}
                  showName={false}
                  getDesc={getDesc}
                  mirror={true}
                />
                <span className="text-xs text-green-300 font-bold mt-1">
                  Kademe {a.rT}
                </span>
                <span className="text-[10px] text-gray-400 group-hover:text-yellow-300 transition-colors mt-0.5">
                  Tıkla → Seç
                </span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={onSkip}
          className="px-8 py-3 bg-gray-700/80 rounded-xl font-bold hover:bg-gray-600 transition-all border border-gray-500 text-sm"
        >
          Geç (Hayvan Alma)
        </button>
      </div>
    </div>
  );
}
