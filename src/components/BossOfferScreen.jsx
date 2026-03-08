import StarField from "./StarField";

export default function BossOfferScreen({ boss, onAccept, onDecline }) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${boss.color} text-white flex flex-col items-center justify-center p-4 relative overflow-hidden`}
    >
      <StarField />
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-10"
            style={{
              left: `${(i * 5.3) % 100}%`,
              top: `${(i * 7.1) % 100}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.3) % 3}s`,
            }}
          >
            {boss.emoji}
          </div>
        ))}
      </div>
      <div className="relative z-10 max-w-lg w-full text-center">
        <div className="relative flex items-center justify-center mb-4">
          <div
            className="absolute w-64 h-64 rounded-full"
            style={{
              background: `radial-gradient(circle, ${boss.glow} 0%, transparent 70%)`,
              animation: "glowPulse 1.5s ease-in-out infinite",
            }}
          />
          <img
            src={boss.image}
            alt={boss.name}
            className="relative z-10 w-56 h-56 object-contain drop-shadow-2xl"
            style={{
              animation:
                "bossEntrance 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both",
              filter: `drop-shadow(0 0 20px ${boss.glow})`,
            }}
          />
        </div>
        <div
          className="text-4xl font-black mb-1 text-white drop-shadow-lg"
          style={{ textShadow: `0 0 20px ${boss.glow}` }}
        >
          {boss.name}
        </div>
        <div className="text-xl text-gray-300 mb-4 italic">{boss.title}</div>
        <div
          className={`bg-black/40 border ${boss.border} rounded-2xl p-4 mb-6 backdrop-blur-sm`}
        >
          <div className="text-lg text-gray-200 mb-2 italic">
            "{boss.intro}"
          </div>
          <div className="text-xl font-bold text-white">"{boss.intro2}"</div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-red-900/50 border border-red-500 rounded-xl p-4">
            <div className="text-2xl mb-2">💀</div>
            <div className="font-bold text-red-300 mb-1">Kaybedersen</div>
            <div className="text-sm text-gray-300">-2 Can kaybedersin</div>
          </div>
          <div className="bg-green-900/50 border border-green-500 rounded-xl p-4">
            <div className="text-2xl mb-2">🏆</div>
            <div className="font-bold text-green-300 mb-1">Kazanırsan</div>
            <div className="text-sm text-gray-300">
              +5 Altın + Özel Hayvan Seç!
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onAccept}
            className={`flex-1 py-4 bg-gradient-to-br from-orange-600 to-red-800 rounded-2xl font-black text-xl hover:brightness-110 transition-all border-2 ${boss.border} shadow-2xl`}
            style={{ boxShadow: `0 0 30px ${boss.glow}` }}
          >
            ⚔️ Kabul Et!
          </button>
          <button
            onClick={onDecline}
            className="flex-1 py-4 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl font-black text-xl hover:brightness-110 transition-all border-2 border-gray-500"
          >
            🛡️ Geç
          </button>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          "Geç" seçersen normal savaşa devam edersin
        </div>
      </div>
    </div>
  );
}
