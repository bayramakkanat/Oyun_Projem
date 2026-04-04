import React, { useEffect, useState } from "react";

// Tur geçiş banner'ı — battle bittikten sonra shop açılmadan önce gösterilir.
// phase: "in" | "hold" | "out"
export default function TurnBanner({ turn, onDone }) {
  const [phase, setPhase] = useState("in");

  useEffect(() => {
    // in  → 400ms
    // hold → 900ms
    // out → 450ms  → onDone
    const t1 = setTimeout(() => setPhase("hold"), 400);
    const t2 = setTimeout(() => setPhase("out"),  1300);
    const t3 = setTimeout(() => onDone(),         1750);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const overlayOpacity =
    phase === "in"   ? 1 :
    phase === "hold" ? 1 :
    0;

  const contentScale =
    phase === "in"   ? 1 :
    phase === "hold" ? 1 :
    1.08;

  const contentOpacity =
    phase === "in"   ? 1 :
    phase === "hold" ? 1 :
    0;

  const translateY =
    phase === "in"   ? 0 :
    phase === "hold" ? 0 :
    -24;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at center, rgba(15,10,40,0.97) 0%, rgba(5,5,20,0.99) 100%)",
        opacity: overlayOpacity,
        transition: phase === "out"
          ? "opacity 0.45s ease-in"
          : "opacity 0.25s ease-out",
        pointerEvents: "all",
      }}
    >
      {/* Işık çizgileri arka plan */}
      <LightRays />

      {/* İçerik */}
      <div
        style={{
          textAlign: "center",
          opacity: contentOpacity,
          transform: `scale(${contentScale}) translateY(${translateY}px)`,
          transition: phase === "out"
            ? "opacity 0.35s ease-in, transform 0.4s ease-in"
            : phase === "in"
            ? "opacity 0.3s ease-out, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)"
            : "none",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* "TUR" yazısı */}
        <div
          style={{
            fontSize: "clamp(13px, 3.5vw, 18px)",
            fontWeight: 700,
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            color: "rgba(148, 163, 184, 0.7)",
            marginBottom: "8px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          TUR
        </div>

        {/* Tur numarası */}
        <div
          style={{
            fontSize: "clamp(80px, 22vw, 140px)",
            fontWeight: 900,
            lineHeight: 1,
            background: "linear-gradient(135deg, #e879f9 0%, #818cf8 40%, #38bdf8 80%, #34d399 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontFamily: "system-ui, -apple-system, sans-serif",
            filter: "drop-shadow(0 0 40px rgba(139,92,246,0.5))",
            animation: phase === "hold" ? "turnNumPulse 0.9s ease-in-out infinite" : "none",
          }}
        >
          {turn}
        </div>

        {/* Alt çizgi */}
        <Divider active={phase === "hold"} />

        {/* Alt yazı */}
        <div
          style={{
            marginTop: "20px",
            fontSize: "clamp(11px, 2.5vw, 14px)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(148, 163, 184, 0.5)",
          }}
        >
          Hazırlan
        </div>
      </div>

      <style>{`
        @keyframes turnNumPulse {
          0%, 100% { filter: drop-shadow(0 0 30px rgba(139,92,246,0.4)); }
          50%       { filter: drop-shadow(0 0 60px rgba(139,92,246,0.8)) drop-shadow(0 0 100px rgba(56,189,248,0.3)); }
        }
        @keyframes rayRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dividerExpand {
          from { width: 0%; opacity: 0; }
          to   { width: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Dönen ışık çizgileri arka plan efekti
function LightRays() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity: 0.15,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "200vmax",
          height: "200vmax",
          marginLeft: "-100vmax",
          marginTop: "-100vmax",
          background: `repeating-conic-gradient(
            rgba(139,92,246,0.3) 0deg,
            transparent 3deg,
            transparent 15deg,
            rgba(56,189,248,0.2) 18deg,
            transparent 21deg,
            transparent 30deg
          )`,
          animation: "rayRotate 12s linear infinite",
        }}
      />
    </div>
  );
}

// Genişleyen yatay çizgi
function Divider({ active }) {
  return (
    <div
      style={{
        height: "2px",
        background: "linear-gradient(90deg, transparent, #818cf8, #38bdf8, #818cf8, transparent)",
        borderRadius: "99px",
        margin: "16px auto 0",
        width: active ? "min(280px, 60vw)" : "0px",
        opacity: active ? 1 : 0,
        transition: "width 0.5s cubic-bezier(0.34,1.2,0.64,1), opacity 0.3s ease",
        overflow: "hidden",
      }}
    />
  );
}
