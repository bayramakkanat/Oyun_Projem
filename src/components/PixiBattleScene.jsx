import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import Card from "./Card";
import { BOSSES } from "../data/gameData";

export default function PixiBattleScene({ pT, eT, anims, step, turn }) {
  const playerRefs = useRef({});
  const enemyRefs = useRef({});
  const animStateRef = useRef({});
  const cameraRef = useRef(null);

  // Dinamik Kamera (Zoom) Efekti
  useEffect(() => {
     if (!cameraRef.current) return;
     const totalAlive = pT.filter(p => p.curHp > 0).length + eT.filter(e => e.curHp > 0).length;
     
     let targetScale = 1;
     if (totalAlive <= 2) targetScale = 1.35;      // 1v1 (Devasa Yakınlaşma)
     else if (totalAlive <= 4) targetScale = 1.2;  // 2v2 (Yakın)
     else if (totalAlive <= 6) targetScale = 1.05; // 3v3 (Standart)
     else if (totalAlive <= 8) targetScale = 0.95; // 4v4 (Uzak)
     else targetScale = 0.85;                      // Tam dolu kalabalık takım (En uzak)

     // Kamera Zoom GSAP Tween
     gsap.to(cameraRef.current, {
         scale: targetScale,
         duration: 1.2,
         ease: "power2.inOut",
         transformOrigin: "center center"
     });
  }, [pT, eT]);

  // Oyuna giriş (Drop-in) ve Hasar animasyonlarının Gsap ile yönetilmesi
  useEffect(() => {
    // Takımlardaki tüm hayvanların animasyonlarını kontrol et
    const handleAnims = (teamArr, refsObj, isPlayer) => {
      teamArr.forEach((pet, idx) => {
        const el = refsObj.current[pet.id];
        if (!el) return;

        // Ölüm Animasyonu
        if (pet.curHp <= 0) {
          if (!el.isDeadAnimated) {
             el.isDeadAnimated = true;
             gsap.to(el, { y: 150, autoAlpha: 0, duration: 0.5, ease: "power2.in" });
          }
          return;
        }

        // Doğuş (Giriş) animasyonu (Sadece step === 0 iken)
        if (step === 0 && !el.isSpawnAnimated) {
             el.isSpawnAnimated = true;
             gsap.fromTo(el, 
                 { y: -300, autoAlpha: 0 }, 
                 { y: 0, autoAlpha: 1, duration: 0.6, delay: idx * 0.15, ease: "bounce.out" }
             );
        }

        const currentAnim = anims[pet.id];
        const animState = animStateRef.current;

        if (currentAnim && currentAnim !== animState[pet.id]) {
            animState[pet.id] = currentAnim; // Animasyonu işaretle
            
            // GSAP Animasyon Zaman Çizelgesi
            const tl = gsap.timeline();
            
            if (currentAnim === "attackRight") {
                tl.to(el, { x: 80, y: -20, rotation: 10, duration: 0.15, ease: "power1.inOut" })
                  .to(el, { x: 0, y: 0, rotation: 0, duration: 0.25, ease: "power2.out" });
            } else if (currentAnim === "attackLeft") {
                tl.to(el, { x: -80, y: -20, rotation: -10, duration: 0.15, ease: "power1.inOut" })
                  .to(el, { x: 0, y: 0, rotation: 0, duration: 0.25, ease: "power2.out" });
            } else if (currentAnim === "damage") {
                tl.to(el, { filter: "brightness(2) drop-shadow(0 0 30px white)", scale: 0.85, duration: 0.1 })
                  .to(el, { filter: "none", scale: 1, duration: 0.25, ease: "elastic.out(1, 0.4)" });
            } else if (currentAnim === "buff" || currentAnim === "heal") {
                tl.to(el, { scale: 1.15, filter: "brightness(1.5) drop-shadow(0 0 20px #4ade80)", duration: 0.15 })
                  .to(el, { scale: 1, filter: "none", duration: 0.3, ease: "bounce.out" });
            }
        } else if (!currentAnim) {
            animState[pet.id] = null; // Sıfırla
        }
      });
    };

    handleAnims(pT, playerRefs, true);
    handleAnims(eT, enemyRefs, false);

  }, [pT, eT, anims, step]);

  return (
    <div className="w-full flex justify-center items-center py-6 min-h-[350px] overflow-visible perspective-[1000px]">
      <div ref={cameraRef} className="flex flex-row items-center justify-center w-full gap-4 relative">
      
      {/* Oyuncu Takımı (SOL YARI) */}
      <div className="flex items-center justify-start flex-nowrap flex-row-reverse min-h-[160px] pb-4 relative z-20 w-[45%] pr-4 gap-1 sm:gap-2">
        {pT.map((a, idx) => {
           const healthPercent = Math.max(0, (a.curHp / a.hp) * 100);
           return (
             <div key={a.id} className="flex flex-col items-center" style={{ zIndex: 50 - idx }}>
               {/* HP Bar */}
               <div className="flex flex-col items-center justify-center mb-2 w-full">
                  <div className="w-16 h-3 bg-black/50 rounded-full overflow-hidden border border-white/10 shadow-inner">
                     <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          healthPercent > 50 ? "bg-gradient-to-r from-green-600 to-green-400" : healthPercent > 25 ? "bg-gradient-to-r from-yellow-600 to-yellow-400" : "bg-gradient-to-r from-red-600 to-red-400 animate-pulse"
                        }`}
                        style={{ width: `${healthPercent}%`, boxShadow: "0 0 10px currentColor" }}
                     />
                  </div>
               </div>
               {/* Asıl Kart (GSAP bağlanıyor) */}
               <div ref={el => playerRefs.current[a.id] = el} className="relative z-10 origin-bottom">
                 <Card
                  a={{ ...a, curHp: a.curHp }}
                  anim={anims[a.id]}
                  onClick={() => {}}
                  selected={false}
                  compact={false}
                  battle={true}
                  mirror={true}
                 />
               </div>
             </div>
           );
        })}
      </div>

      {/* VS Ortası */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0 z-10 w-[10%]">
        <div 
           className="text-5xl drop-shadow-2xl select-none relative" 
           style={{ transition: "transform 0.2s", transform: step % 2 !== 0 ? "scale(1)" : "scale(1.2)" }}
        >
          ⚔️
        </div>
        <div className="text-sm text-white font-black tracking-widest bg-white/15 border border-white/20 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] backdrop-blur-md">
          VS
        </div>
      </div>

      {/* Düşman Takımı (SAĞ YARI) */}
      <div className="flex items-center justify-start flex-nowrap min-h-[160px] pb-6 relative z-20 w-[45%] pl-4 gap-1 sm:gap-2">
        {eT.map((a, idx) => {
           const healthPercent = Math.max(0, (a.curHp / a.hp) * 100);
           return (
             <div key={a.id} className="flex flex-col items-center" style={{ zIndex: 50 - idx }}>
               {/* HP Bar */}
               <div className="flex flex-col items-center justify-center mb-2 w-full">
                  <div className="w-16 h-3 bg-black/50 rounded-full overflow-hidden border border-white/10 shadow-inner">
                     <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          healthPercent > 50 ? "bg-gradient-to-r from-red-600 to-red-400" : healthPercent > 25 ? "bg-gradient-to-r from-orange-600 to-orange-400" : "bg-gradient-to-r from-red-800 to-red-600 animate-pulse"
                        }`}
                        style={{ width: `${healthPercent}%`, boxShadow: "0 0 10px currentColor" }}
                     />
                  </div>
               </div>
               {/* Asıl Kart veya Boss Modeli */}
               <div ref={el => enemyRefs.current[a.id] = el} className="relative z-10 origin-bottom">
                 {a.isBossUnit && BOSSES[turn]?.image ? (
                    <div className="relative flex flex-col items-center justify-center">
                       <div className="relative flex items-center justify-center w-36 h-36">
                          <div
                             className="absolute w-28 h-28 rounded-full"
                             style={{ background: `radial-gradient(circle, ${BOSSES[turn].glow} 0%, transparent 70%)` }}
                          />
                          <img
                             src={BOSSES[turn].image}
                             alt={a.nick}
                             className="relative z-10 w-28 h-28 object-contain drop-shadow-[0_0_15px_currentColor]"
                          />
                       </div>
                       <div className="flex gap-1 items-center mt-1 z-20 bg-black/60 rounded-xl px-2 py-1 backdrop-blur-md border border-white/10">
                          <span className="text-red-400 font-black text-lg">⚔️{a.atk}</span>
                          <span className="text-green-400 font-black text-lg">❤️{Math.max(0, a.curHp ?? 0)}</span>
                       </div>
                    </div>
                 ) : (
                    <Card
                      a={{ ...a, curHp: a.curHp }}
                      anim={anims[a.id]}
                      onClick={() => {}}
                      selected={false}
                      compact={false}
                      battle={true}
                      mirror={false}
                    />
                 )}
               </div>
             </div>
           );
        })}
      </div>

      </div>
    </div>
  );
}
