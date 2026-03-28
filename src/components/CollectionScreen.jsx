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
        className="rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col"
        style={
          isComplete
            ? { background: "linear-gradient(135deg, #3a2000 0%, #1a0a00 100%)", borderColor: "rgba(251,191,36,0.7)", boxShadow: "0 0 24px rgba(251,191,36,0.15), inset 0 0 30px rgba(251,191,36,0.05)" }
            : isUnlocked
            ? { background: "linear-gradient(135deg, #1e0a3c 0%, #0a0a2e 100%)", borderColor: "rgba(167,139,250,0.5)", boxShadow: "0 0 16px rgba(167,139,250,0.1)" }
            : { background: "rgba(17,17,27,0.8)", borderColor: "rgba(75,85,99,0.4)" }
        }
      >
        {/* Üst görsel alanı — dikdörtgen çerçeve */}
        <div
          className="relative w-full overflow-hidden flex items-center justify-center"
          style={{
            aspectRatio: "4/3",
            background: isComplete
              ? "radial-gradient(ellipse at center, rgba(251,191,36,0.12) 0%, transparent 70%)"
              : isUnlocked
              ? "radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)"
              : "rgba(0,0,0,0.3)",
          }}
        >
          {/* Tam koleksiyon rozeti */}
          {isComplete && (
            <div className="absolute top-2 right-2 z-10 text-xl" style={{ filter: "drop-shadow(0 0 8px rgba(251,191,36,0.9))" }}>👑</div>
          )}

          {animal.img ? (
            <img
              src={`/images/animals/${animal.img}`}
              alt={animal.nick}
              className="transition-all duration-300"
              style={{
                width: "75%",
                height: "75%",
                objectFit: "contain",
                filter: !isUnlocked
                  ? "brightness(0) opacity(0.2) blur(1px)"
                  : isComplete
                  ? "drop-shadow(0 0 16px rgba(251,191,36,0.7))"
                  : "drop-shadow(0 0 8px rgba(167,139,250,0.4))",
                transform: !animal.flip ? "scaleX(-1)" : "none",
              }}
            />
          ) : (
            <span className={`text-6xl ${!isUnlocked ? "opacity-20 grayscale" : ""}`}>
              {animal.name}
            </span>
          )}

          {/* Kilit overlay */}
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">🔒</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Kilitli</span>
              </div>
            </div>
          )}

          {/* Unlocked parlama efekti — alt kenar */}
          {isUnlocked && (
            <div
              className="absolute bottom-0 left-0 right-0 h-8"
              style={{
                background: isComplete
                  ? "linear-gradient(to top, rgba(251,191,36,0.15), transparent)"
                  : "linear-gradient(to top, rgba(139,92,246,0.15), transparent)",
              }}
            />
          )}
        </div>

        {/* Alt bilgi alanı */}
        <div className="p-3">
          <div className={`font-black text-sm text-center ${isUnlocked ? "text-white" : "text-gray-600"}`}>
            {isUnlocked ? animal.nick : "???"}
          </div>
          <div className="text-xs text-gray-500 text-center mb-2">Kademe {animal.tier}</div>
          {isComplete && <div className="text-xs text-yellow-400 font-bold text-center">✨ Tam Koleksiyon!</div>}
          {isUnlocked && !isComplete && <div className="text-xs text-green-400/70 text-center">✓ Koleksiyonda</div>}
        </div>

            {/* İstatistikler */}
                <div className="flex gap-2 mb-3 text-xs px-1">
                  <div className="flex-1 flex flex-col items-center bg-black/30 rounded-lg px-1 py-1.5">
                    <span className="text-gray-500 text-[10px]">Kullanım</span>
                    <span className="text-white font-bold">{data.used}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center bg-black/30 rounded-lg px-1 py-1.5">
                    <span className="text-gray-500 text-[10px]">Galibiyet</span>
                    <span className="text-green-400 font-bold">{data.wins}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center bg-black/30 rounded-lg px-1 py-1.5">
                    <span className="text-gray-500 text-[10px]">Max Seviye</span>
                    <span className="text-purple-400 font-bold">{data.maxLvl || "-"}</span>
                  </div>
                </div>

                {/* Görevler */}
                <div className="flex flex-col gap-1.5 px-1 pb-1">
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
                  <div className="text-right text-[10px] mt-1">
                    <span className={completedTasks === 3 ? "text-yellow-400 font-bold" : "text-gray-500"}>
                      {completedTasks}/3 görev tamamlandı
                    </span>
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