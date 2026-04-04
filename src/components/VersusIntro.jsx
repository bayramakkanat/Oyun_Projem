import React, { useEffect, useState } from "react";

// roomInfo: { role: "host"|"guest", roomData: { host: {name}, guest: {name} } }
export default function VersusIntro({ roomInfo, user, onDone }) {
  const [phase, setPhase] = useState("slide");   // slide → clash → hold → out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("clash"), 600);
    const t2 = setTimeout(() => setPhase("hold"),  900);
    const t3 = setTimeout(() => setPhase("out"),  1700);
    const t4 = setTimeout(() => onDone(),         2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const { host, guest } = roomInfo.roomData;
  const myName  = roomInfo.role === "host" ? host?.name : guest?.name;
  const oppName = roomInfo.role === "host" ? guest?.name : host?.name;

  const parsePlayer = (name = "") => {
    const trimmed = name.trim();
    // İlk segment emoji/avatar, geri kalanı kullanıcı adı
    const parts = trimmed.split(" ");
    const avatar = parts[0] || "🐺";
    const username = parts.slice(1).join(" ") || trimmed;
    return { avatar, username };
  };

  const me  = parsePlayer(myName);
  const opp = parsePlayer(oppName);

  const overlayOpacity = phase === "out" ? 0 : 1;
  const overlayTransition = phase === "out" ? "opacity 0.5s ease-in" : "opacity 0.3s ease-out";

  // Oyuncu soldan, rakip sağdan gelir
  const playerX =
    phase === "slide" ? "-110%" :
    phase === "clash" ? "-8%"   :
    phase === "hold"  ? "-12%"  : "-110%";

  const oppX =
    phase === "slide" ? "110%"  :
    phase === "clash" ? "8%"    :
    phase === "hold"  ? "12%"   : "110%";

  const cardTransition =
    phase === "slide" ? "transform 0.55s cubic-bezier(0.22,1,0.36,1)"  :
    phase === "clash" ? "transform 0.18s cubic-bezier(0.34,1.4,0.64,1)" :
    phase === "hold"  ? "transform 0.25s ease-out" :
    "transform 0.45s ease-in";

  const vsScale =
    phase === "slide" ? 0   :
    phase === "clash" ? 1.5 :
    phase === "hold"  ? 1   : 0;

  const vsOpacity = phase === "slide" ? 0 : phase === "out" ? 0 : 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at center, #0f0520 0%, #050510 100%)",
        opacity: overlayOpacity,
        transition: overlayTransition,
        pointerEvents: "all",
        overflow: "hidden",
      }}
    >
      {/* Işık çizgileri */}
      <ScanLines active={phase === "clash"} />

      {/* Zemin parlaması — çarpışma anında */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.25) 0%, transparent 65%)",
          opacity: phase === "clash" ? 1 : 0,
          transition: "opacity 0.15s ease",
          pointerEvents: "none",
        }}
      />

      {/* Oyuncu — sol */}
      <PlayerCard
        player={me}
        side="left"
        translateX={playerX}
        transition={cardTransition}
        label="SEN"
      />

      {/* VS */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          transform: `scale(${vsScale})`,
          opacity: vsOpacity,
          transition: phase === "clash"
            ? "transform 0.2s cubic-bezier(0.34,1.8,0.64,1), opacity 0.1s"
            : "transform 0.3s ease-out, opacity 0.3s ease",
          minWidth: "80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "clamp(36px, 10vw, 56px)",
            fontWeight: 900,
            letterSpacing: "0.05em",
            background: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: phase === "clash"
              ? "drop-shadow(0 0 20px rgba(249,115,22,0.8))"
              : "none",
            transition: "filter 0.2s",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          VS
        </div>
        {phase === "hold" && (
          <div
            style={{
              fontSize: "clamp(9px, 2vw, 11px)",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.6)",
              animation: "versusReadyFade 0.4s ease-out",
            }}
          >
            HAZIR OL
          </div>
        )}
      </div>

      {/* Rakip — sağ */}
      <PlayerCard
        player={opp}
        side="right"
        translateX={oppX}
        transition={cardTransition}
        label="RAKİP"
      />

      <style>{`
        @keyframes versusReadyFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanMove {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

function PlayerCard({ player, side, translateX, transition, label }) {
  const isLeft = side === "left";
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: isLeft ? "flex-end" : "flex-start",
        paddingInline: "clamp(12px, 4vw, 48px)",
        transform: `translateX(${translateX})`,
        transition,
        zIndex: 5,
      }}
    >
      {/* Etiket */}
      <div
        style={{
          fontSize: "clamp(9px, 2vw, 11px)",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: isLeft ? "rgba(56,189,248,0.7)" : "rgba(248,113,113,0.7)",
          marginBottom: "8px",
          fontFamily: "monospace",
        }}
      >
        {label}
      </div>

      {/* Avatar */}
      <div
        style={{
          fontSize: "clamp(52px, 14vw, 88px)",
          lineHeight: 1,
          filter: `drop-shadow(0 0 20px ${isLeft ? "rgba(56,189,248,0.5)" : "rgba(248,113,113,0.5)"})`,
          marginBottom: "10px",
        }}
      >
        {player.avatar}
      </div>

      {/* İsim */}
      <div
        style={{
          fontSize: "clamp(13px, 3.5vw, 18px)",
          fontWeight: 800,
          color: "white",
          letterSpacing: "0.05em",
          textAlign: isLeft ? "right" : "left",
          maxWidth: "clamp(100px, 25vw, 180px)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textShadow: `0 0 20px ${isLeft ? "rgba(56,189,248,0.6)" : "rgba(248,113,113,0.6)"}`,
        }}
      >
        {player.username}
      </div>

      {/* Alt çizgi renk şeridi */}
      <div
        style={{
          marginTop: "8px",
          height: "3px",
          width: "clamp(60px, 15vw, 100px)",
          borderRadius: "99px",
          background: isLeft
            ? "linear-gradient(90deg, #38bdf8, transparent)"
            : "linear-gradient(90deg, transparent, #f87171)",
        }}
      />
    </div>
  );
}

// Çarpışma anında yatay tarama çizgisi
function ScanLines({ active }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        opacity: active ? 1 : 0,
        transition: "opacity 0.1s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "60%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
          animation: active ? "scanMove 0.4s ease-out" : "none",
        }}
      />
    </div>
  );
}
