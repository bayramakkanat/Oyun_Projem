import React, { useEffect, useState } from "react";

export default function ArenaIntro({ playerName, onDone }) {
  const [phase, setPhase] = useState("dark");
  const [visibleCards, setVisibleCards] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 700);
    const t2 = setTimeout(() => setPhase("info"),   2800);
    const c1 = setTimeout(() => setVisibleCards(1), 3050);
    const c2 = setTimeout(() => setVisibleCards(2), 3500);
    const c3 = setTimeout(() => setVisibleCards(3), 3950);
    const c4 = setTimeout(() => setVisibleCards(4), 4400);
    const c5 = setTimeout(() => setVisibleCards(5), 4850);
    return () => {
      [t1,t2,c1,c2,c3,c4,c5].forEach(clearTimeout);
    };
  }, []);

  const isOut = phase === "out";

  const parseAvatar = (name = "") => {
    const p = name.trim().split(" ");
    return p[0]?.length <= 2 ? p[0] : "🐾";
  };
  const parseUsername = (name = "") => {
    const p = name.trim().split(" ");
    return p.length > 1 ? p.slice(1).join(" ") : name.trim();
  };

  const avatar   = parseAvatar(playerName || "");
  const username = parseUsername(playerName || "");

  const infoCards = [
    {
      icon:  "∞",
      iconStyle: { fontFamily: "serif", fontSize: "clamp(28px, 7vw, 42px)", lineHeight: 1 },
      title: "SONSUZ TUR",
      desc:  "Canın tükenene kadar tırmanmaya devam et. Hiçbir tur sınırı yok.",
      color: "#a78bfa",
      glow:  "rgba(167,139,250,0.35)",
      border:"rgba(167,139,250,0.4)",
    },
    {
      icon:  "🏆",
      title: "SIRALAMADA ZİRVEYE ULAŞ",
      desc:  "En yüksek tura ulaşan oyuncu lider tablosunun tepesinde.",
      color: "#fbbf24",
      glow:  "rgba(251,191,36,0.35)",
      border:"rgba(251,191,36,0.4)",
    },
    {
      icon:  "📊",
      title: "XP & RANK",
      desc:  "Her savaş XP kazandırır. Rank atla, koleksiyonunu güçlendir.",
      color: "#34d399",
      glow:  "rgba(52,211,153,0.35)",
      border:"rgba(52,211,153,0.4)",
    },
    {
      icon:  "🤝",
      title: "GERÇEK RAKİPLER",
      desc:  "Diğer oyuncuların kurduğu takımlarla asenkron olarak karşılaşırsın.",
      color: "#f87171",
      glow:  "rgba(248,113,113,0.35)",
      border:"rgba(248,113,113,0.4)",
    },
    {
      // 5. kart — 17. tur can bonusu
      icon:  "❤️",
      title: "17. TUR BONUSU",
      desc:  "17. tura ulaştığında +1 can kazanırsın. Sonsuz bir döngüde tırmanmaya devam edebilirsin!",
      color: "#fb7185",
      glow:  "rgba(251,113,133,0.35)",
      border:"rgba(251,113,133,0.4)",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#05020f",
        opacity: isOut ? 0 : 1,
        transition: isOut ? "opacity 0.5s ease-in" : "opacity 0.4s ease-out",
        pointerEvents: "all",
      }}
    >
      {/* Arka plan ışın çizgileri */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {RAYS.map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "200vmax",
              height: "1px",
              background: `linear-gradient(90deg, transparent 0%, ${r.color} 40%, transparent 100%)`,
              transform: `rotate(${r.angle}deg)`,
              transformOrigin: "0 0",
              opacity: phase === "dark" ? 0 : r.opacity,
              transition: `opacity 1.2s ease ${r.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Merkez ışık hâlesi */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(124,58,237,0.22) 0%, transparent 70%)",
          opacity: phase === "dark" ? 0 : 1,
          transition: "opacity 1s ease 0.3s",
          pointerEvents: "none",
        }}
      />

      {/* Üst: oyuncu adı */}
      {username && (
        <div
          style={{
            position: "absolute",
            top: "clamp(20px, 5vh, 40px)",
            right: "clamp(20px, 5vw, 48px)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            opacity: phase === "dark" ? 0 : 1,
            transform: phase === "dark" ? "translateY(-12px)" : "translateY(0)",
            transition: "opacity 0.6s ease 0.8s, transform 0.6s ease 0.8s",
          }}
        >
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"10px", color:"rgba(148,163,184,0.5)", letterSpacing:"0.3em", textTransform:"uppercase", fontFamily:"monospace" }}>
              OYUNCU
            </div>
            <div style={{ fontSize:"clamp(13px,3vw,16px)", fontWeight:800, color:"#e2e8f0", textShadow:"0 0 12px rgba(167,139,250,0.6)" }}>
              {username}
            </div>
          </div>
          <div style={{
            width:"clamp(36px,8vw,44px)", height:"clamp(36px,8vw,44px)",
            borderRadius:"50%",
            background:"rgba(124,58,237,0.25)",
            border:"2px solid rgba(167,139,250,0.5)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"clamp(18px,4vw,22px)",
            boxShadow:"0 0 16px rgba(167,139,250,0.3)",
          }}>
            {avatar}
          </div>
        </div>
      )}

      {/* Ana içerik */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(6px, 2vh, 14px)",
          marginBottom: phase === "info" ? "clamp(12px, 3vh, 24px)" : "0",
          transition: "margin-bottom 0.5s ease",
        }}
      >
        <div
          style={{
            fontSize: "clamp(64px, 16vw, 110px)",
            lineHeight: 1,
            transform: phase === "dark" ? "scale(0.2)" : "scale(1)",
            opacity: phase === "dark" ? 0 : 1,
            transition: "transform 0.55s cubic-bezier(0.34,1.5,0.64,1), opacity 0.4s ease",
            filter: "drop-shadow(0 0 30px rgba(167,139,250,0.7)) drop-shadow(0 0 60px rgba(124,58,237,0.4))",
            animation: phase !== "dark" ? "arenaIconPulse 3s ease-in-out infinite" : "none",
          }}
        >
          🏟️
        </div>

        <div
          style={{
            fontSize: "clamp(9px,2vw,11px)",
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            color: "rgba(167,139,250,0.7)",
            fontFamily: "monospace",
            opacity: phase === "dark" ? 0 : 1,
            transition: "opacity 0.5s ease 0.4s",
          }}
        >
          ✦ ANIMATHON ✦
        </div>

        <h1
          style={{
            fontSize: "clamp(38px, 12vw, 88px)",
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            textAlign: "center",
            background: "linear-gradient(135deg, #e879f9 0%, #a78bfa 40%, #38bdf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            opacity: phase === "dark" ? 0 : 1,
            transform: phase === "dark" ? "translateY(20px) scale(0.9)" : "translateY(0) scale(1)",
            transition: "opacity 0.6s ease 0.5s, transform 0.6s cubic-bezier(0.34,1.2,0.64,1) 0.5s",
            filter: "drop-shadow(0 0 20px rgba(167,139,250,0.5))",
            margin: 0,
          }}
        >
          ARENA
        </h1>

        <div
          style={{
            fontSize: "clamp(11px, 2.5vw, 15px)",
            color: "rgba(203,213,225,0.65)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textAlign: "center",
            fontWeight: 600,
            opacity: phase === "dark" ? 0 : 1,
            transition: "opacity 0.6s ease 1.2s",
          }}
        >
          Ne kadar dayanabilirsin?
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "clamp(4px,1vh,8px)",
            opacity: phase === "dark" ? 0 : 1,
            transform: phase === "dark" ? "scaleX(0.4)" : "scaleX(1)",
            transition: "opacity 0.5s ease 1.5s, transform 0.5s cubic-bezier(0.34,1.4,0.64,1) 1.5s",
          }}
        >
          <div style={{ height:"1px", width:"clamp(30px,8vw,60px)", background:"linear-gradient(90deg,transparent,rgba(248,113,113,0.6))" }} />
          <div
            style={{
              fontSize: "clamp(9px,2vw,11px)",
              fontWeight: 900,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "#f87171",
              fontFamily: "monospace",
              padding: "4px 12px",
              border: "1px solid rgba(248,113,113,0.4)",
              borderRadius: "4px",
              background: "rgba(248,113,113,0.08)",
            }}
          >
            SONSUZ MoD
          </div>
          <div style={{ height:"1px", width:"clamp(30px,8vw,60px)", background:"linear-gradient(90deg,rgba(248,113,113,0.6),transparent)" }} />
        </div>
      </div>

      {/* Bilgi kartları — 5 kart, 3+2 grid */}
      <div
        style={{
          width: "clamp(280px, 88vw, 620px)",
          opacity: phase === "info" ? 1 : 0,
          transform: phase === "info" ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
          pointerEvents: "none",
        }}
      >
        {/* İlk 4 kart — 2x2 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "clamp(6px, 1.5vw, 10px)",
            marginBottom: "clamp(6px, 1.5vw, 10px)",
          }}
        >
          {infoCards.slice(0, 4).map((card, i) => (
            <InfoCard key={i} card={card} visible={visibleCards > i} />
          ))}
        </div>
        {/* 5. kart — tam genişlik */}
        <div
          style={{
            opacity: visibleCards > 4 ? 1 : 0,
            transform: visibleCards > 4 ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
            transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.3,0.64,1)",
          }}
        >
          <div
            style={{
              background: "rgba(15,5,30,0.85)",
              border: `1px solid ${infoCards[4].border}`,
              borderRadius: "clamp(10px,2vw,16px)",
              padding: "clamp(10px,2.5vw,14px)",
              display: "flex",
              alignItems: "center",
              gap: "clamp(10px,2vw,16px)",
              boxShadow: `0 0 20px ${infoCards[4].glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
          >
            <span style={{ fontSize: "clamp(22px,5vw,32px)", filter: `drop-shadow(0 0 8px ${infoCards[4].glow})`, flexShrink: 0 }}>
              {infoCards[4].icon}
            </span>
            <div>
              <div style={{ fontSize:"clamp(9px,2vw,11px)", fontWeight:900, letterSpacing:"0.15em", textTransform:"uppercase", color: infoCards[4].color, marginBottom:"4px" }}>
                {infoCards[4].title}
              </div>
              <div style={{ fontSize:"clamp(10px,2.2vw,12px)", color:"rgba(203,213,225,0.7)", lineHeight:1.45 }}>
                {infoCards[4].desc}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alt buton */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(20px, 5vh, 40px)",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: phase === "info" && visibleCards >= 5 ? 1 : 0,
          transform: phase === "info" && visibleCards >= 5 ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          pointerEvents: phase === "info" && visibleCards >= 5 ? "all" : "none",
        }}
      >
        <button
          onClick={() => {
            setPhase("out");
            setTimeout(() => onDone(), 500);
          }}
          style={{
            padding: "clamp(12px,3vw,16px) clamp(28px,7vw,48px)",
            fontSize: "clamp(13px,3vw,16px)",
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#fff",
            background: "linear-gradient(135deg, rgba(124,58,237,0.85) 0%, rgba(168,85,247,0.85) 100%)",
            border: "1px solid rgba(167,139,250,0.6)",
            borderRadius: "clamp(10px,2vw,14px)",
            cursor: "pointer",
            boxShadow: "0 0 24px rgba(124,58,237,0.5), 0 0 60px rgba(124,58,237,0.2)",
            animation: "arenaEnterPulse 1.8s ease-in-out infinite",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          🏟️ &nbsp;Arenaya Gir &nbsp;»
        </button>
      </div>

      <style>{`
        @keyframes arenaIconPulse {
          0%, 100% { filter: drop-shadow(0 0 30px rgba(167,139,250,0.7)) drop-shadow(0 0 60px rgba(124,58,237,0.4)); }
          50%       { filter: drop-shadow(0 0 44px rgba(167,139,250,0.95)) drop-shadow(0 0 90px rgba(124,58,237,0.6)); }
        }
        @keyframes arenaEnterPulse {
          0%, 100% { box-shadow: 0 0 24px rgba(124,58,237,0.5), 0 0 60px rgba(124,58,237,0.2); }
          50%       { box-shadow: 0 0 36px rgba(124,58,237,0.8), 0 0 80px rgba(124,58,237,0.35); }
        }
      `}</style>
    </div>
  );
}

function InfoCard({ card, visible }) {
  return (
    <div
      style={{
        background: "rgba(15,5,30,0.85)",
        border: `1px solid ${card.border}`,
        borderRadius: "clamp(10px,2vw,16px)",
        padding: "clamp(10px,2.5vw,16px)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        boxShadow: `0 0 20px ${card.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
        transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.3,0.64,1)",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
        <span style={{
          fontSize: card.iconStyle ? undefined : "clamp(20px,5vw,28px)",
          color: card.color,
          filter: `drop-shadow(0 0 8px ${card.glow})`,
          lineHeight: 1,
          ...card.iconStyle,
        }}>
          {card.icon}
        </span>
        <div style={{ fontSize:"clamp(9px,2vw,11px)", fontWeight:900, letterSpacing:"0.15em", textTransform:"uppercase", color: card.color }}>
          {card.title}
        </div>
      </div>
      <div style={{ fontSize:"clamp(10px,2.2vw,12px)", color:"rgba(203,213,225,0.7)", lineHeight:1.45 }}>
        {card.desc}
      </div>
    </div>
  );
}

const RAYS = [
  { angle:  15, color:"rgba(167,139,250,0.18)", opacity:0.9, delay:0.2 },
  { angle:  45, color:"rgba(236,72,153,0.12)",  opacity:0.7, delay:0.4 },
  { angle:  75, color:"rgba(56,189,248,0.10)",  opacity:0.6, delay:0.6 },
  { angle: 105, color:"rgba(167,139,250,0.14)", opacity:0.8, delay:0.3 },
  { angle: 135, color:"rgba(248,113,113,0.10)", opacity:0.5, delay:0.5 },
  { angle: 165, color:"rgba(56,189,248,0.12)",  opacity:0.7, delay:0.7 },
  { angle: 195, color:"rgba(167,139,250,0.18)", opacity:0.9, delay:0.2 },
  { angle: 225, color:"rgba(236,72,153,0.12)",  opacity:0.7, delay:0.4 },
  { angle: 255, color:"rgba(56,189,248,0.10)",  opacity:0.6, delay:0.6 },
  { angle: 285, color:"rgba(167,139,250,0.14)", opacity:0.8, delay:0.3 },
  { angle: 315, color:"rgba(248,113,113,0.10)", opacity:0.5, delay:0.5 },
  { angle: 345, color:"rgba(56,189,248,0.12)",  opacity:0.7, delay:0.7 },
];
