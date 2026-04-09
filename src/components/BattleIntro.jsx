import React, { useEffect, useState } from "react";

/**
 * BattleIntro — Normal ve Arena modu için kısa savaş başlangıç animasyonu.
 * VersusIntro'nun daha sade versiyonu: oyuncu vs düşman, 1.8 saniye, sonra onDone().
 *
 * Props:
 *   playerName   — oyuncunun displayName'i
 *   opponentName — düşman adı ("AI Komutan", arena rakibi adı, boss adı vb.)
 *   isBoss       — boss savaşı mı? (farklı renk şeması)
 *   onDone       — animasyon bitince çağrılır
 */
export default function BattleIntro({ playerName, opponentName, isBoss, onDone }) {
  const [phase, setPhase] = useState("slide"); // slide → clash → hold → out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("clash"), 500);
    const t2 = setTimeout(() => setPhase("hold"),  750);
    const t3 = setTimeout(() => { setPhase("out"); onDone(); }, 1400);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, []);

  // Avatar ve isim parse — "🐺 Bayram" → { avatar: "🐺", username: "Bayram" }
  const parsePlayer = (name = "") => {
    const parts = name.trim().split(" ");
    const avatar = parts[0] || "🐺";
    const username = parts.slice(1).join(" ") || name.trim();
    return { avatar, username };
  };

  const me  = parsePlayer(playerName);
  // Düşman için sabit ikonlar — boss kırmızı, normal gri
  const oppAvatar = isBoss ? "💀" : "⚔️";

  const overlayOpacity   = phase === "out" ? 0 : 1;
  const overlayTransition = phase === "out" ? "opacity 0.05s ease-in" : "opacity 0.25s ease-out";

  const playerX =
    phase === "slide" ? "-110%" :
    phase === "clash" ? "-10%"  :
    phase === "hold"  ? "-14%"  : "-110%";

  const oppX =
    phase === "slide" ? "110%"  :
    phase === "clash" ? "10%"   :
    phase === "hold"  ? "14%"   : "110%";

  const cardTransition =
    phase === "slide" ? "transform 0.45s cubic-bezier(0.22,1,0.36,1)" :
    phase === "clash" ? "transform 0.15s cubic-bezier(0.34,1.4,0.64,1)" :
    phase === "hold"  ? "transform 0.2s ease-out" :
    "transform 0.4s ease-in";

  const vsScale   = phase === "slide" ? 0 : phase === "out" ? 0 : 1;
  const vsOpacity = phase === "slide" ? 0 : phase === "out" ? 0 : 1;

  // Boss savaşı için kırmızı, normal için mor tema
  const accentColor = isBoss
    ? "rgba(239,68,68,0.25)"
    : "rgba(139,92,246,0.22)";

  const vsGradient = isBoss
    ? "linear-gradient(135deg, #ef4444, #f97316)"
    : "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)";

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
      {/* Zemin parlaması — çarpışma anında */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${accentColor} 0%, transparent 65%)`,
          opacity: phase === "clash" ? 1 : 0,
          transition: "opacity 0.15s ease",
          pointerEvents: "none",
        }}
      />

      {/* Oyuncu — sol */}
      <IntroCard
        avatar={me.avatar}
        name={me.username}
        label="SEN"
        side="left"
        translateX={playerX}
        transition={cardTransition}
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
            ? "transform 0.18s cubic-bezier(0.34,1.8,0.64,1), opacity 0.1s"
            : "transform 0.25s ease-out, opacity 0.25s ease",
          minWidth: "72px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "clamp(32px, 9vw, 52px)",
            fontWeight: 900,
            letterSpacing: "0.05em",
            background: vsGradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: phase === "clash"
              ? "drop-shadow(0 0 18px rgba(249,115,22,0.8))"
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
              fontSize: "clamp(8px, 2vw, 10px)",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.55)",
              animation: "battleIntroFade 0.3s ease-out",
            }}
          >
            SAVAŞ BAŞLIYOR
          </div>
        )}
      </div>

      {/* Düşman — sağ */}
      <IntroCard
        avatar={oppAvatar}
        name={opponentName}
        label={isBoss ? "BOSS" : "DÜŞMAN"}
        side="right"
        translateX={oppX}
        transition={cardTransition}
        isBoss={isBoss}
      />

      <style>{`
        @keyframes battleIntroFade {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function IntroCard({ avatar, name, label, side, translateX, transition, isBoss }) {
  const isLeft = side === "left";
  const color = isLeft
    ? "rgba(56,189,248,0.7)"
    : isBoss
    ? "rgba(239,68,68,0.8)"
    : "rgba(248,113,113,0.7)";

  const glowColor = isLeft
    ? "rgba(56,189,248,0.5)"
    : isBoss
    ? "rgba(239,68,68,0.6)"
    : "rgba(248,113,113,0.5)";

  const lineGradient = isLeft
    ? "linear-gradient(90deg, #38bdf8, transparent)"
    : isBoss
    ? "linear-gradient(90deg, transparent, #ef4444)"
    : "linear-gradient(90deg, transparent, #f87171)";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: isLeft ? "flex-end" : "flex-start",
        paddingInline: "clamp(10px, 4vw, 44px)",
        transform: `translateX(${translateX})`,
        transition,
        zIndex: 5,
      }}
    >
      <div
        style={{
          fontSize: "clamp(9px, 2vw, 11px)",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color,
          marginBottom: "8px",
          fontFamily: "monospace",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "clamp(48px, 13vw, 84px)",
          lineHeight: 1,
          filter: `drop-shadow(0 0 18px ${glowColor})`,
          marginBottom: "10px",
        }}
      >
        {avatar}
      </div>

      <div
        style={{
          fontSize: "clamp(12px, 3.2vw, 17px)",
          fontWeight: 800,
          color: "white",
          letterSpacing: "0.05em",
          textAlign: isLeft ? "right" : "left",
          maxWidth: "clamp(90px, 22vw, 170px)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textShadow: `0 0 18px ${glowColor}`,
        }}
      >
        {name}
      </div>

      <div
        style={{
          marginTop: "8px",
          height: "3px",
          width: "clamp(50px, 13vw, 90px)",
          borderRadius: "99px",
          background: lineGradient,
        }}
      />
    </div>
  );
}
