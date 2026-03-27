/**
 * PixiBattleScene.jsx — Pixi.js tabanlı savaş sahnesi
 *
 * Bu bileşen:
 * - Pixi canvas'ını mount eder ve PixiEngine'i başlatır
 * - pT/eT/anims değişimlerini engine'e iletir
 * - Mevcut BattleView API'siyle tam uyumludur (prop değişikliği gerekmez)
 */

import React, { useEffect, useRef, useCallback } from "react";
import { PixiEngine } from "../utils/pixiEngine";

export default function PixiBattleScene({ pT, eT, anims, step, turn }) {
  const canvasRef  = useRef(null);
  const engineRef  = useRef(null);

  // ── Engine başlatma ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new PixiEngine();
    engineRef.current = engine;

    // init() tamamlandığında engine kendi pending kuyruğunu uygular
    // (pT/eT effect mount'ta çağrıldığında engine hazır değilse kuyruğa alır)
    engine.init(canvasRef.current).catch((err) => {
      console.error("[PixiBattleScene] Engine başlatılamadı:", err);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []); // Sadece mount/unmount

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
      className="w-full flex justify-center items-center overflow-hidden"
      style={{ height: "320px" }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width:  "900px",
          height: "320px",
          maxWidth: "100%",
          display: "block",
          background: "transparent",
        }}
      />
    </div>
  );
}
