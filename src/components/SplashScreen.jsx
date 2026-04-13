import React, { useEffect, useState } from "react";

/**
 * Favicon'daki A harfi tasarımını yansıtan özel A bileşeni.
 * Koyu/indigo arka plan üzerinde beyaz bold "A" + altında yeşil gülümseyen yay.
 * em tabanlı boyutlandırma ile çevre font-size'a otomatik uyum sağlar.
 */
export function AnimathonA({ style = {} }) {
  return (
    <svg
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "inline-block",
        width: "0.88em",
        height: "0.97em",
        verticalAlign: "middle",
        position: "relative",
        top: "0.06em",
        ...style,
      }}
    >
      <defs>
        <linearGradient id="aBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3730a3" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#aBg)" />
      <text
        x="50"
        y="68"
        fontFamily="Arial, sans-serif"
        fontSize="62"
        fontWeight="bold"
        fill="#fff"
        textAnchor="middle"
      >
        A
      </text>
      <path
        d="M18 80 Q50 97 82 80"
        fill="none"
        stroke="#4ade80"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── AY Games yayın logosu ─── */
function AyGamesLogo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0px",
        animation: "ayLogoFadeIn 1.2s ease-out 0.5s both",
        userSelect: "none",
      }}
    >
      {/* Hilal SVG */}
      <svg
        width="50"
        height="42"
        viewBox="0 0 50 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: "5px" }}
      >
        <defs>
          <radialGradient id="moonGrad" cx="38%" cy="32%" r="62%">
            <stop offset="0%"   stopColor="#fef9e7" />
            <stop offset="40%"  stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <filter id="moonGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="21" cy="21" r="17" fill="url(#moonGrad)" filter="url(#moonGlow)" />
        <circle cx="29" cy="17" r="15" fill="#0a0a1a" />
      </svg>

      {/* AY yazısı */}
      <div
        style={{
          fontSize: "clamp(20px, 5.5vw, 26px)",
          fontWeight: 900,
          letterSpacing: "0.30em",
          color: "#fbbf24",
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1,
          textShadow: "0 0 10px rgba(251,191,36,0.65), 0 0 30px rgba(251,191,36,0.22)",
          marginBottom: "3px",
        }}
      >
        AY
      </div>

      {/* GAMES yazısı */}
      <div
        style={{
          fontSize: "clamp(7px, 1.6vw, 9px)",
          fontWeight: 600,
          letterSpacing: "0.40em",
          color: "rgba(251,191,36,0.50)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textTransform: "uppercase",
        }}
      >
        GAMES
      </div>
    </div>
  );
}

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
          🐾
        </div>

        {/* Oyun adı */}
        <div
          style={{
            fontSize: "clamp(34px, 8.5vw, 54px)",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            animation: "splashTitleGlow 3s ease-in-out infinite",
            marginBottom: "6px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.05em",
          }}
        >
          <AnimathonA />
          <span
            style={{
              background: "linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            nimathon
          </span>
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

      {/* AY Games logosu — ekranın altında ortalı */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(22px, 5vh, 42px)",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <AyGamesLogo />
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
        @keyframes ayLogoFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
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
