import { useState, useEffect, useMemo } from "react";
import Card from "./Card";
import { getDesc } from "../utils/getDesc";
import { TIERS } from "../data/gameData";
import { playSound } from "../hooks/useSound";

const tierColors = ["", "gray", "green", "blue", "purple", "red", "orange"];
const tierBgs = [
  "",
  "from-gray-900 to-gray-800",
  "from-green-950 to-gray-900",
  "from-blue-950 to-gray-900",
  "from-purple-950 to-gray-900",
  "from-red-950 to-gray-900",
  "from-orange-950 to-gray-900",
];
const tierGlows = [
  "",
  "rgba(156,163,175,0.4)",
  "rgba(34,197,94,0.4)",
  "rgba(59,130,246,0.4)",
  "rgba(168,85,247,0.4)",
  "rgba(239,68,68,0.4)",
  "rgba(249,115,22,0.4)",
];
const tierRgb = [
  "",
  "156,163,175",
  "34,197,94",
  "59,130,246",
  "168,85,247",
  "239,68,68",
  "249,115,22",
];

export default function NewTierScreen({ newTier, onContinue }) {
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    playSound("tier_up");
    const t = setTimeout(() => setFlash(false), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${tierBgs[newTier]} text-white flex flex-col items-center justify-center p-4 relative overflow-hidden`}
    >
      {/* Giriş flaşı */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(${tierRgb[newTier]}, 0.35)`,
          opacity: flash ? 1 : 0,
          transition: "opacity 0.35s ease-out",
          pointerEvents: "none",
          zIndex: 50,
        }}
      />

      {/* Konfeti patlaması */}
      <Confetti tier={newTier} />

      {/* Arka plan partikülleri */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            {["✨", "💫", "🌟", "⭐"][i % 4]}
          </div>
        ))}
      </div>

      {/* "YENİ" rozeti */}
      <div
        className="relative mb-2"
        style={{ animation: "victoryBounce 0.6s ease-out" }}
      >
        <div
          className="text-7xl font-black tracking-wider text-transparent bg-clip-text"
          style={{
            backgroundImage: `linear-gradient(135deg, #fff 0%, ${
              ["#9ca3af","#4ade80","#60a5fa","#c084fc","#f87171","#fb923c"][newTier - 1]
            } 50%, #fff 100%)`,
            filter: `drop-shadow(0 0 20px ${tierGlows[newTier]})`,
            animation: "newTierPulse 1.5s ease-in-out infinite",
          }}
        >
          ✦ YENİ ✦
        </div>
      </div>

      {/* Kademe bilgisi */}
      <div
        className={`text-4xl font-black mb-1 text-${tierColors[newTier]}-400`}
        style={{ animation: "slideInFromBottom 0.5s ease-out 0.2s both" }}
      >
        Kademe {newTier} Açıldı!
      </div>

      {/* Bonus slotlar */}
      <div
        className="text-base text-gray-300 mb-6 text-center"
        style={{ animation: "slideInFromBottom 0.5s ease-out 0.4s both" }}
      >
        {newTier === 3 && (
          <span className="text-green-300 font-bold">
            🎁 Mağazanın 4. Slotu + Takımın 5. Slotu Açıldı! (Tur 5)
          </span>
        )}
        {newTier === 4 && (
          <span className="text-blue-300 font-bold">
            🎁 Mağazanın 5. Slotu + Takımın 6. Slotu Açıldı! (Tur 7)
          </span>
        )}
        {newTier === 6 && (
          <span className="text-orange-300 font-bold">
            🎁 Tüm Slotlar Açık!
          </span>
        )}
      </div>

      {/* Hayvan kartları */}
      <div
        className="flex flex-wrap gap-6 justify-center mb-10 max-w-3xl mt-8"
        style={{ animation: "slideInFromBottom 0.5s ease-out 0.5s both" }}
      >
        {TIERS[newTier].map((a, i) => (
          <div
            key={i}
            className="pb-6"
            style={{ animation: `cardFlip 0.5s ease-out ${0.6 + i * 0.08}s both` }}
          >
            <Card
              a={{ ...a, id: i, lvl: 1, exp: 0, curHp: a.hp }}
              onClick={() => {}}
              selected={false}
              showName={true}
              getDesc={getDesc}
              mirror={true}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onContinue}
        className={`px-10 py-4 bg-gradient-to-br from-${tierColors[newTier]}-600 to-${tierColors[newTier]}-800 rounded-2xl font-black text-xl hover:brightness-110 transition-all shadow-2xl border-2 border-${tierColors[newTier]}-400`}
        style={{
          boxShadow: `0 0 30px ${tierGlows[newTier]}`,
          animation: "slideInFromBottom 0.5s ease-out 1s both",
        }}
      >
        🚀 Devam!
      </button>
    </div>
  );
}

// Konfeti patlaması — mount anında bir kez tetiklenir
function Confetti({ tier }) {
  const particles = useMemo(() => {
    const rgb = tierRgb[tier];
    const colors = [
      `rgb(${rgb})`,
      `rgba(${rgb}, 0.7)`,
      "white",
      "rgba(255,255,255,0.6)",
      "#fbbf24",
    ];
    return Array.from({ length: 48 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,          // ekranın %20-%80'i arası
      color: colors[i % colors.length],
      size: 6 + Math.random() * 8,
      angle: -60 - Math.random() * 60,     // -60° ile -120° arası (yukarı)
      distance: 35 + Math.random() * 45,   // vh cinsinden
      duration: 0.8 + Math.random() * 0.7,
      delay: Math.random() * 0.4,
      shape: i % 3 === 0 ? "circle" : i % 3 === 1 ? "square" : "rect",
    }));
  }, [tier]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 40, overflow: "hidden" }}>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance * 0.5; // vw
        const ty = Math.sin(rad) * p.distance;       // vh (negatif = yukarı)
        const borderRadius =
          p.shape === "circle" ? "50%" :
          p.shape === "square" ? "2px" : "1px";
        const width = p.shape === "rect" ? p.size * 0.4 : p.size;
        const height = p.size;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              bottom: "10%",
              left: `${p.x}%`,
              width: `${width}px`,
              height: `${height}px`,
              background: p.color,
              borderRadius,
              animation: `confettiFly ${p.duration}s ease-out ${p.delay}s both`,
              "--tx": `${tx}vw`,
              "--ty": `${ty}vh`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confettiFly {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(720deg) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
