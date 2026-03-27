/**
 * PixiBattleScene.jsx — Pixi.js tabanlı savaş sahnesi
 */

import React, { useEffect, useRef } from "react";
import { PixiEngine } from "../utils/pixiEngine";

export default function PixiBattleScene({ pT, eT, anims }) {
  const containerRef = useRef(null);
  const engineRef    = useRef(null);

  // ── Engine başlatma ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new PixiEngine();
    engineRef.current = engine;

    engine.init(containerRef.current).catch((err) => {
      console.error("[PixiBattleScene] Engine başlatılamadı:", err);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // ── pT/eT güncellemeleri ─────────────────────────────────────────────────
  useEffect(() => {
    engineRef.current?.updateTeams(pT, eT);
  }, [pT, eT]);

  // ── Animasyon tetikleyicileri ─────────────────────────────────────────────
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    Object.entries(anims).forEach(([petId, animType]) => {
      if (animType) engine.playAnim(Number(petId), animType);
    });
  }, [anims]);

  return (
   <div
  ref={containerRef}
  style={{
    width: "900px",
    height: "320px",
    maxWidth: "100%",
    background: "transparent",
    position: "relative",
    overflow: "hidden",
    margin: "0 auto",
  }}
/>
  );
}
