import React, { useEffect, useState } from "react";

export default function SplashScreen({ fading }) {
  const [dotIndex, setDotIndex] = useState(0);

  // Yükleme noktaları animasyonu
  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((d) => (d + 1) % 4);
    }, 380);
    return () => clearInterval(interval);
  }, []);

  const dots = ".".repeat(dotIndex + 1).padEnd(3, "\u00A0");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a1a 0%, #0f1535 40%, #1a0a2e 70%, #0a0a1a 100%)",
        opacity: fading ? 0 : 1,
        transition: fading ? "opacity 0.65s ease-out" : "opacity 0.2s ease-in",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <Stars />

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>

        {/* Ana ikon */}
        <div
          style={{
            fontSize: "clamp(64px, 15vw, 96px)",
            animation: "splashBounce 2s ease-in-out infinite",
            display: "inline-block",
            filter: "drop-shadow(0 0 30px rgba(139, 92, 246, 0.8)) drop-shadow(0 0 60px rgba(139, 92, 246, 0.4))",
            marginBottom: "8px",
            lineHeight: 1,
          }}
        >
          ⚔️
        </div>

        {/* Oyun adı */}
        <div
          style={{
            fontSize: "clamp(28px, 7vw, 44px)",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            background: "linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #38bdf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "splashTitleGlow 3s ease-in-out infinite",
            marginBottom: "6px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Pet Arena
        </div>

        {/* Alt başlık */}
        <div
          style={{
            fontSize: "clamp(10px, 2.5vw, 13px)",
            color: "rgba(148, 163, 184, 0.6)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: "52px",
          }}
        >
          Kart Savaş Oyunu
        </div>

        {/* Yükleme çubuğu */}
        <div
          style={{
            width: "clamp(160px, 38vw, 220px)",
            height: "3px",
            background: "rgba(255,255,255,0.07)",
            borderRadius: "99px",
            overflow: "hidden",
            margin: "0 auto 14px",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #818cf8, #c084fc, #38bdf8)",
              borderRadius: "99px",
              animation: "splashBar 1.6s ease-in-out infinite",
            }}
          />
        </div>

        {/* Yükleniyor metni */}
        <div
          style={{
            fontSize: "clamp(10px, 2.5vw, 12px)",
            color: "rgba(148, 163, 184, 0.45)",
            letterSpacing: "0.18em",
            fontFamily: "monospace",
          }}
        >
          YÜKLENİYOR{dots}
        </div>
      </div>

      <style>{`
        @keyframes splashBounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-14px) scale(1.08); }
        }
        @keyframes splashTitleGlow {
          0%, 100% { filter: brightness(1); }
          50%       { filter: brightness(1.3) drop-shadow(0 0 20px rgba(192, 132, 252, 0.4)); }
        }
        @keyframes splashBar {
          0%   { width: 0%;   margin-left: 0%;    }
          50%  { width: 65%;  margin-left: 18%;   }
          100% { width: 0%;   margin-left: 100%;  }
        }
        @keyframes splashStar {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50%       { opacity: 0.85; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}

function Stars() {
  const stars = React.useMemo(() =>
    Array.from({ length: 65 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.8 + 0.8,
      delay: Math.random() * 5,
      duration: 2.5 + Math.random() * 3,
    }))
  , []);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: "50%",
            background: "white",
            animation: `splashStar ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
