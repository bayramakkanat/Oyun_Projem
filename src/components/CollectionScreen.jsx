import { useState } from "react";
import { TIERS } from "../data/gameData";
import { loadCollection, getDefaultAnimalData } from "../utils/helpers";

export default function CollectionScreen({ onClose, userId }) {
  const [selectedTier, setSelectedTier] = useState(1);
  const collection = loadCollection(userId);

  const tiers = [1, 2, 3, 4, 5, 6];
  const animals = TIERS[selectedTier] || [];

  const getTaskLabel = (idx) => {
    if (idx === 0) return "Arena'da 3 kez kullan";
    if (idx === 1) return "Arena'da 5 galibiyet kazan";
    return "3. seviyeye çıkar";
  };

  const getTaskProgress = (data, idx) => {
    if (idx === 0) return { current: Math.min(data.used, 3), max: 3, done: data.task1 };
    if (idx === 1) return { current: Math.min(data.wins, 5), max: 5, done: data.task2 };
    return { current: data.unlocked ? 1 : 0, max: 1, done: data.task3 };
  };

  return (
    <div className="min-h-screen text-white p-4" style={{
      background: "radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 100%)"
    }}>
      <div className="max-w-4xl mx-auto">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-yellow-300">📖 Koleksiyon Defteri</h1>
            <p className="text-gray-400 text-sm mt-1">Arena'da hayvanları kullanarak koleksiyonunu tamamla!</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl hover:bg-gray-700 transition-all font-bold"
          >
            ✕ Kapat
          </button>
        </div>

        {/* Kademe Seçici */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tiers.map((t) => {
            const tierAnimals = TIERS[t] || [];
            const unlockedCount = tierAnimals.filter((a) => {
              const data = collection[a.nick] || getDefaultAnimalData();
              return data.unlocked;
            }).length;
            return (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                className={`flex flex-col items-center px-4 py-2 rounded-xl border-2 transition-all font-bold ${
                  selectedTier === t
                    ? "bg-purple-700 border-purple-400 text-white"
                    : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                <span className="text-lg">💎{t}</span>
                <span className="text-xs">{unlockedCount}/{tierAnimals.length}</span>
              </button>
            );
          })}
        </div>

        {/* Hayvan Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {animals.map((animal) => {
            const data = collection[animal.nick] || getDefaultAnimalData();
            const isUnlocked = data.unlocked;
            const completedTasks = [data.task1, data.task2, data.task3].filter(Boolean).length;
            const isComplete = completedTasks === 3;

            return (
              <div
                key={animal.nick}
                className={`rounded-2xl border-2 p-4 transition-all relative overflow-hidden ${
                  isComplete
                    ? "bg-gradient-to-br from-yellow-900/50 to-amber-900/40 border-yellow-400/70 shadow-lg shadow-yellow-500/10"
                    : isUnlocked
                    ? "bg-gradient-to-br from-purple-900/60 to-blue-900/60 border-purple-400/60"
                    : "bg-gray-900/60 border-gray-700/60"
                }`}
              >
                {/* Altın rozet — tam koleksiyon */}
                {isComplete && (
                  <div className="absolute top-2 right-2 text-yellow-400 text-lg" style={{ filter: "drop-shadow(0 0 6px rgba(251,191,36,0.8))" }}>👑</div>
                )}

                {/* Hayvan Görseli — büyük ve merkezi */}
                <div className="flex justify-center mb-3 relative">
                  <div className={`relative ${isComplete ? "ring-2 ring-yellow-400/60 rounded-full p-1" : ""}`}>
                    {animal.img ? (
                      <img
                        src={`/images/animals/${animal.img}`}
                        alt={animal.nick}
                        className={`w-20 h-20 object-contain drop-shadow-xl transition-all ${
                          !isUnlocked
                            ? "brightness-0 opacity-30 scale-95"
                            : isComplete
                            ? "drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                            : ""
                        }`}
                        style={!animal.flip ? { transform: `scaleX(-1)${!isUnlocked ? " blur(1px)" : ""}` } : (!isUnlocked ? { filter: "blur(1px)" } : {})}
                      />
                    ) : (
                      <span className={`text-5xl block text-center ${!isUnlocked ? "opacity-20 grayscale" : ""}`}>
                        {animal.name}
                      </span>
                    )}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">🔒</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hayvan Bilgisi */}
                <div className="text-center mb-3">
                  <div className={`font-black text-sm ${isUnlocked ? "text-white" : "text-gray-500"}`}>
                    {isUnlocked ? animal.nick : "???"}
                  </div>
                  <div className="text-xs text-gray-400">Kademe {animal.tier}</div>
                  {isComplete && <div className="text-xs text-yellow-400 font-bold mt-0.5">✨ Tam Koleksiyon!</div>}
                  {isUnlocked && !isComplete && <div className="text-xs text-green-400/80 mt-0.5">✓ Koleksiyonda</div>}
                </div>

                {/* İstatistikler */}
                <div className="flex gap-3 mb-3 text-xs">
                  <div className="flex flex-col items-center bg-black/30 rounded-lg px-2 py-1">
                    <span className="text-gray-400">Kullanım</span>
                    <span className="text-white font-bold">{data.used}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black/30 rounded-lg px-2 py-1">
                    <span className="text-gray-400">Galibiyet</span>
                    <span className="text-green-400 font-bold">{data.wins}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black/30 rounded-lg px-2 py-1">
                    <span className="text-gray-400">Max Seviye</span>
                    <span className="text-purple-400 font-bold">{data.maxLvl || "-"}</span>
                  </div>
                </div>

                {/* Görevler */}
                <div className="flex flex-col gap-1.5">
                  {[0, 1, 2].map((idx) => {
                    const progress = getTaskProgress(data, idx);
                    return (
                      <div key={idx} className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] ${progress.done ? "text-green-400" : "text-gray-400"}`}>
                            {progress.done ? "✅" : "⬜"} {getTaskLabel(idx)}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {progress.current}/{progress.max}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${progress.done ? "bg-green-500" : "bg-purple-500"}`}
                            style={{ width: `${(progress.current / progress.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-right text-[10px] text-gray-500 mt-1">
                    {completedTasks}/3 görev tamamlandı
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}