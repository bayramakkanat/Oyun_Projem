import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import gsap from "gsap";
import { BOSSES } from "../data/gameData";

// Helper function to draw a rounded card
function createCardTexture(app, width, height, radius, color) {
  const graphics = new PIXI.Graphics();
  graphics.roundRect(0, 0, width, height, radius);
  graphics.fill({ color, alpha: 0.8 });
  graphics.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
  return app.renderer.generateTexture(graphics);
}

export default function PixiBattleScene({ pT, eT, anims, step, turn }) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const petsLayerRef = useRef(null);
  const particlesLayerRef = useRef(null);
  const mapRef = useRef({}); // { id: { container, atkText, hpText, baseScale } }
  const animStateRef = useRef({}); // { id: { lastAnim: "attackLeft" } }

  useEffect(() => {
    let isMounted = true;
    const app = new PIXI.Application();
    
    const init = async () => {
      await app.init({
        width: 1000,
        height: 350,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
      
      if (!isMounted) {
        app.destroy(true);
        return;
      }
      appRef.current = app;
      
      if (containerRef.current && containerRef.current.children.length === 0) {
        containerRef.current.appendChild(app.canvas);
      }

      // Layers
      const petsLayer = new PIXI.Container();
      const particlesLayer = new PIXI.Container();
      app.stage.addChild(petsLayer);
      app.stage.addChild(particlesLayer);
      petsLayerRef.current = petsLayer;
      particlesLayerRef.current = particlesLayer;
      
      app.ticker.add(() => {
        // Ticker for persistent effects if needed
      });
    };
    
    init();

    return () => {
      isMounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
    };
  }, []);

  // Synchronize State to PIXI
  useEffect(() => {
    if (!appRef.current || !petsLayerRef.current) return;
    const app = appRef.current;
    const petsLayer = petsLayerRef.current;
    
    const currentIds = new Set();
    const centerX = 500;
    const centerY = 175;

    const buildOrUpdatePet = (pet, isPlayer, index) => {
      currentIds.add(pet.id);
      let pData = mapRef.current[pet.id];

      // Sabit pozisyon hesaplamaları
      const gap = 120;
      const targetX = isPlayer ? centerX - 80 - (index * gap) : centerX + 80 + (index * gap);
      const targetY = centerY;

      if (!pData) {
        // İlk kez oluşturuluyor
        const container = new PIXI.Container();
        container.x = targetX;
        container.y = targetY - 200; // Yukarıdan düşme efekti için
        container.alpha = 0;
        
        // Pivot'ı tam merkeze al
        container.pivot.x = 55;
        container.pivot.y = 75;

        // Kart Arka Planı
        const isDead = pet.curHp <= 0;
        const bgColor = isPlayer ? 0x1e3a8a : 0x7f1d1d; // Mavi vs Kırmızımtırak
        const cardBg = new PIXI.Graphics();
        cardBg.roundRect(0, 0, 110, 150, 16);
        cardBg.fill({ color: bgColor, alpha: 0.8 });
        cardBg.stroke({ width: 3, color: isPlayer ? 0x3b82f6 : 0xef4444, alpha: 0.5 });
        container.addChild(cardBg);

        // Emoji / Görsel (Geçici olarak PixiJS Text kullanılarak emojiler harika işleniyor)
        const emojiText = new PIXI.Text({
          text: pet.img ? "🐾" : pet.name, // Resim eklenene dek emoji veya fallback
          style: { fontSize: 50, align: "center" }
        });
        emojiText.anchor.set(0.5);
        emojiText.x = 55;
        emojiText.y = 55;
        if (!isPlayer && !pet.flip) emojiText.scale.x = -1; // Rakip hayvana ters bakma (CSS flip eşdeğeri)
        container.addChild(emojiText);

        // İstatistik Arkaplanları
        const statBg = new PIXI.Graphics();
        statBg.roundRect(5, 110, 100, 32, 8);
        statBg.fill({ color: 0x000000, alpha: 0.6 });
        container.addChild(statBg);

        // ATK Metni
        const atkText = new PIXI.Text({
          text: `⚔️ ${pet.atk}`,
          style: { fontSize: 16, fill: 0xfca5a5, fontWeight: "bold" }
        });
        atkText.anchor.set(0.5);
        atkText.x = 30;
        atkText.y = 126;
        container.addChild(atkText);

        // HP Metni
        const hpText = new PIXI.Text({
          text: `❤️ ${Math.max(0, pet.curHp)}`,
          style: { fontSize: 16, fill: 0x86efac, fontWeight: "bold" }
        });
        hpText.anchor.set(0.5);
        hpText.x = 80;
        hpText.y = 126;
        container.addChild(hpText);

        petsLayer.addChild(container);
        
        pData = { container, atkText, hpText, baseScale: 1, cardBg };
        mapRef.current[pet.id] = pData;

        // Düşüş Animasyonu (Doğuş)
        gsap.to(container, { y: targetY, alpha: 1, duration: 0.6, delay: index * 0.1, ease: "bounce.out" });
      } else {
        // Güncelleme
        pData.atkText.text = `⚔️ ${pet.atk}`;
        pData.hpText.text = `❤️ ${Math.max(0, pet.curHp)}`;
        
        // Hasar aldıysa renk/boyut güncelle
        if (pet.curHp <= 0) {
           gsap.to(pData.container, { y: targetY + 100, alpha: 0, duration: 0.5, ease: "power2.in" });
        } else {
           gsap.to(pData.container, { x: targetX, y: targetY, duration: 0.4, ease: "power2.out" });
        }
      }

      // Savaş Animasyonlarını Tetikle (anims prop'undan gelen anlık state'e göre)
      const currentAnim = anims[pet.id];
      const animState = animStateRef.current;
      
      if (currentAnim && currentAnim !== animState[pet.id]) {
         animState[pet.id] = currentAnim; // Animasyonun oynatıldığını işaretle.
         
         const cont = pData.container;
         if (currentAnim === "attackRight") {
             gsap.timeline()
                 .to(cont, { x: "+=60", y: "-=20", rotation: 0.15, duration: 0.15, ease: "power1.in" })
                 .to(cont, { x: "-=60", y: "+=20", rotation: 0, duration: 0.25, ease: "power2.out" });
         } else if (currentAnim === "attackLeft") {
             gsap.timeline()
                 .to(cont, { x: "-=60", y: "-=20", rotation: -0.15, duration: 0.15, ease: "power1.in" })
                 .to(cont, { x: "+=60", y: "+=20", rotation: 0, duration: 0.25, ease: "power2.out" });
         } else if (currentAnim === "damage") {
             // Kırmızı parlayıp küçülme efekti
             gsap.timeline()
                 .to(pData.cardBg, { alpha: 1, duration: 0.1 })
                 .to(cont.scale, { x: 0.85, y: 0.85, duration: 0.1 })
                 .to(cont.scale, { x: 1, y: 1, duration: 0.2, ease: "elastic.out(1, 0.3)" });
         } else if (currentAnim === "buff" || currentAnim === "heal") {
             // Yeşil parlayıp büyüme efekti
             gsap.timeline()
                 .to(cont.scale, { x: 1.15, y: 1.15, duration: 0.15 })
                 .to(cont.scale, { x: 1, y: 1, duration: 0.3, ease: "bounce.out" });
         }
      } else if (!currentAnim) {
         animState[pet.id] = null; // Reset
      }
    };

    // Tüm takımı doldur
    pT.forEach((p, i) => buildOrUpdatePet(p, true, i));
    eT.forEach((p, i) => buildOrUpdatePet(p, false, i));

    // Ölen veya haritadan silinen eski birimlerin temizliği (Çöp toplama)
    Object.keys(mapRef.current).forEach(id => {
       const numId = Number(id);
       if (!currentIds.has(numId) && !currentIds.has(id)) {
           const pData = mapRef.current[id];
           if (pData && pData.container.parent) {
               pData.container.parent.removeChild(pData.container);
               pData.container.destroy({ children: true });
           }
           delete mapRef.current[id];
       }
    });

  }, [pT, eT, anims, step]);

  return (
    <div className="w-full flex justify-center my-4 overflow-hidden relative border-y-2 border-white/10 bg-black/40 backdrop-blur-xl rounded-3xl" style={{ boxShadow: "0 0 50px rgba(0,0,0,0.5) inset" }}>
       {/* React tarafındaki arka plan gradyanları buradan besleyebiliriz */}
       <div ref={containerRef} className="z-10 relative pointer-events-none" />
       <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 to-transparent z-20" />
    </div>
  );
}
