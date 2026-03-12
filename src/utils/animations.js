import { playSound } from "../hooks/useSound";

export const spawnParticles = (petId, abilityType) => {
  const colors = {
    fire: ["🔥", "💥", "✨"],
    shield: ["🛡️", "✨", "💫"],
    heal: ["💚", "✨", "💖"],
    attack: ["⚔️", "💥", "⭐"],
    buff: ["✨", "💫", "🌟"],
  };
  const particles = colors[abilityType] || ["✨"];
  for (let i = 0; i < 6; i++) {
    const particle = document.createElement("div");
    particle.textContent = particles[i % particles.length];
    particle.style.position = "fixed";
    particle.style.fontSize = "24px";
    particle.style.pointerEvents = "none";
    particle.style.zIndex = "1000";
    particle.style.setProperty("--px", `${(Math.random() - 0.5) * 100}px`);
    particle.style.setProperty("--py", `${(Math.random() - 0.5) * 100}px`);
    particle.style.animation = "particleBurst 0.8s ease-out forwards";
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
};

export const spawnFloatingText = (text, x, y, type = "damage") => {
  const floater = document.createElement("div");
  floater.textContent = text;
  floater.style.position = "fixed";
  floater.style.left = `${x}px`;
  floater.style.top = `${y}px`;
  floater.style.pointerEvents = "none";
  floater.style.zIndex = "1000";
  floater.style.fontWeight = "900";
  floater.style.letterSpacing = "-1px";
  floater.style.textShadow = "0 2px 8px rgba(0,0,0,0.8)";
  floater.style.fontFamily = "system-ui, sans-serif";
  if (type === "damage") {
    const num = parseInt(text.replace("-", "")) || 0;
    const size = num >= 20 ? "42px" : num >= 10 ? "34px" : "26px";
    floater.style.fontSize = size;
    floater.style.color = "#ff3333";
    floater.style.textShadow =
      "0 0 10px rgba(255,50,50,0.8), 0 2px 8px rgba(0,0,0,0.8)";
    floater.style.animation = "floatUpRed 1.2s ease-out forwards";
  } else if (type === "heal" || type === "buff") {
    const num = parseInt(text.replace("+", "")) || 0;
    const size = num >= 20 ? "38px" : num >= 10 ? "30px" : "24px";
    floater.style.fontSize = size;
    floater.style.color = "#22ff88";
    floater.style.textShadow =
      "0 0 10px rgba(34,255,136,0.8), 0 2px 8px rgba(0,0,0,0.8)";
    floater.style.animation = "floatUpGreen 1.2s ease-out forwards";
  } else {
    floater.style.fontSize = "28px";
    floater.style.color = "#ffd700";
    floater.style.textShadow =
      "0 0 10px rgba(255,215,0,0.8), 0 2px 8px rgba(0,0,0,0.8)";
    floater.style.animation = "floatUp 1.2s ease-out forwards";
  }
  document.body.appendChild(floater);
  setTimeout(() => floater.remove(), 1200);
};

export const spawnBuffAnimation = (
  fromPetId,
  toPetId,
  amount = 1,
  type = "buff",
  triggerAnim
) => {
  const fromElement = document.querySelector(`[data-pet-id="${fromPetId}"]`);
  const toElement = document.querySelector(`[data-pet-id="${toPetId}"]`);
  if (!fromElement || !toElement) return;
  const fromRect = fromElement.getBoundingClientRect();
  const toRect = toElement.getBoundingClientRect();
  const startX = fromRect.left + fromRect.width / 2;
  const startY = fromRect.top + fromRect.height / 2;
  const endX = toRect.left + toRect.width / 2;
  const endY = toRect.top + toRect.height / 2;
  const icons =
    type === "buff" ? ["⚔️", "❤️"] : type === "heal" ? ["💚", "✨"] : ["💰"];
  icons.forEach((icon, index) => {
    setTimeout(() => {
      const particle = document.createElement("div");
      particle.textContent = icon;
      particle.style.position = "fixed";
      particle.style.left = `${startX}px`;
      particle.style.top = `${startY}px`;
      particle.style.fontSize = "24px";
      particle.style.pointerEvents = "none";
      particle.style.zIndex = "1000";
      particle.style.setProperty("--tx", `${endX - startX}px`);
      particle.style.setProperty("--ty", `${endY - startY}px`);
      particle.style.animation = `800ms flyToTarget cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
      document.body.appendChild(particle);
      setTimeout(() => {
        const rect = toElement.getBoundingClientRect();
        spawnFloatingText(
          `+${amount}`,
          rect.left + rect.width / 2,
          rect.top,
          type === "heal" ? "heal" : "buff"
        );
        if (typeof triggerAnim === "function") triggerAnim(toPetId, "buff");
      }, 700);
      setTimeout(() => particle.remove(), 800);
    }, index * 150);
  });
};

export const spawnImpact = (x, y) => {
  const impact = document.createElement("div");
  impact.textContent = "💥";
  impact.className = "impact-effect";
  impact.style.left = `${x}px`;
  impact.style.top = `${y}px`;
  document.body.appendChild(impact);
  setTimeout(() => impact.remove(), 500);
};

export const spawnDeathEffect = (petId) => {
  playSound("death");
  const element = document.querySelector(`[data-pet-id="${petId}"]`);
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Karartma efekti
  const flash = document.createElement("div");
  flash.style.cssText = `
    position: fixed;
    left: ${centerX}px;
    top: ${centerY}px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,50,50,0.8) 0%, transparent 70%);
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%) scale(0);
    animation: deathFlash 0.6s ease-out forwards;
  `;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 600);

  // Partiküller
  const particles = ["💀", "💨", "✨", "💫", "🩸"];
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement("div");
    particle.textContent = particles[i % particles.length];
    const angle = (Math.PI * 2 * i) / 8;
    const distance = 60 + Math.random() * 40;
    particle.style.cssText = `
      position: fixed;
      left: ${centerX}px;
      top: ${centerY}px;
      font-size: ${20 + Math.random() * 16}px;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      --tx: ${Math.cos(angle) * distance}px;
      --ty: ${Math.sin(angle) * distance}px;
      animation: deathParticle 0.9s ease-out forwards;
    `;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 900);
  }

  // Büyük X efekti
  const skull = document.createElement("div");
  skull.textContent = "💀";
  skull.style.cssText = `
    position: fixed;
    left: ${centerX}px;
    top: ${centerY - 30}px;
    font-size: 48px;
    pointer-events: none;
    z-index: 10000;
    transform: translate(-50%, -50%) scale(0);
    animation: deathSkull 1s ease-out forwards;
  `;
  document.body.appendChild(skull);
  setTimeout(() => skull.remove(), 1000);
};
export const ABILITY_PROJECTILES = {
  start_fire: "🔥",
  start_poison: "☠️",
  start_snipe: "🎯",
  start_multi_snipe: "🎯",
  faint_wave: "🌊",
  start_freeze_enemy: "❄️",
  start_dmg: "💥",
  faint_dmg: "💀",
  hurt_dmg: "💢",
 devour: "💚",
  start_trample: "💨",
  kill_buff: "🩸",
  start_fear: "😱",
  kill_fear_all: "😱",
  cheetah_faint: "💨",
  default: "⚔️",
};
export const spawnProjectile = (fromPetId, toPetId, ability, onImpact, arc = false) => {
  const fromEl = document.querySelector(`[data-pet-id="${fromPetId}"]`);
  const toEl = document.querySelector(`[data-pet-id="${toPetId}"]`);
  if (!fromEl || !toEl) {
    if (onImpact) onImpact();
    return;
  }

  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();

  const startX = fromRect.left + fromRect.width / 2;
  const startY = fromRect.top + fromRect.height / 2;
  const endX = toRect.left + toRect.width / 2;
  const endY = toRect.top + toRect.height / 2;

  const emoji = (ability && ABILITY_PROJECTILES[ability]) || ABILITY_PROJECTILES.default;
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const duration = Math.max(400, Math.min(900, distance * 1.2));

  const projectile = document.createElement("div");
  projectile.textContent = emoji;
  document.body.appendChild(projectile);

  if (arc) {
    // Yay atışı - canvas benzeri quadratic bezier ile
    const steps = 60;
    const arcHeight = -Math.min(120, distance * 0.5);
    let currentStep = 0;

    projectile.style.cssText = `
      position: fixed;
      font-size: 32px;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      filter: drop-shadow(0 0 8px white) drop-shadow(0 0 16px rgba(255,200,50,0.9));
      transition: none;
    `;
const stepDuration = duration / steps;
    const animate = () => {
      if (currentStep > steps) {
        projectile.remove();
        // Çarpışma efekti
        const impact = document.createElement("div");
        impact.textContent = "💥";
        impact.style.cssText = `
          position: fixed;
          left: ${endX}px;
          top: ${endY}px;
          font-size: 48px;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 0 12px rgba(255,100,0,0.9));
          animation: impactBurst 0.5s ease-out forwards;
        `;
        document.body.appendChild(impact);
        const ring = document.createElement("div");
        ring.style.cssText = `
          position: fixed;
          left: ${endX}px;
          top: ${endY}px;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,200,50,0.9);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9998;
          transform: translate(-50%, -50%);
          animation: impactRing 0.5s ease-out forwards;
        `;
        document.body.appendChild(ring);
        setTimeout(() => { impact.remove(); ring.remove(); }, 500);
        if (onImpact) onImpact();
        return;
      }

      const t = currentStep / steps;
      // Quadratic bezier
      const mx = startX + dx / 2;
      const my = startY + dy / 2 + arcHeight;
      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * mx + t * t * endX;
      const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * my + t * t * endY;

      projectile.style.left = `${x}px`;
      projectile.style.top = `${y}px`;

      // İz bırak
      if (currentStep % 4 === 0) {
        const trail = document.createElement("div");
        trail.textContent = emoji;
        trail.style.cssText = `
          position: fixed;
          left: ${x}px;
          top: ${y}px;
          font-size: ${16}px;
          pointer-events: none;
          z-index: 9998;
          transform: translate(-50%, -50%);
          opacity: 0.5;
          filter: drop-shadow(0 0 4px rgba(255,200,50,0.6));
          animation: trailFade 0.3s ease-out forwards;
        `;
        document.body.appendChild(trail);
        setTimeout(() => trail.remove(), 300);
      }

      currentStep++;
     setTimeout(animate, stepDuration);
    };

   setTimeout(animate, stepDuration);

  } else {
    // Düz atış - orijinal sistem
    projectile.style.cssText = `
      position: fixed;
      left: ${startX}px;
      top: ${startY}px;
      font-size: 32px;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      filter: drop-shadow(0 0 8px white) drop-shadow(0 0 16px rgba(255,200,50,0.9));
      --tx: ${dx}px;
      --ty: ${dy}px;
      animation: projectileFly ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    `;

    // Parlak iz
    const trailCount = 6;
    for (let i = 0; i < trailCount; i++) {
      setTimeout(() => {
        const progress = i / trailCount;
        const trailX = startX + dx * progress;
        const trailY = startY + dy * progress;
        const trail = document.createElement("div");
        trail.textContent = emoji;
        trail.style.cssText = `
          position: fixed;
          left: ${trailX}px;
          top: ${trailY}px;
          font-size: ${20 - i * 2}px;
          pointer-events: none;
          z-index: 9998;
          transform: translate(-50%, -50%);
          opacity: ${0.6 - i * 0.08};
          filter: drop-shadow(0 0 6px rgba(255,200,50,0.8));
          animation: trailFade 0.4s ease-out forwards;
        `;
        document.body.appendChild(trail);
        setTimeout(() => trail.remove(), 400);
      }, (duration / trailCount) * i);
    }

    setTimeout(() => {
      projectile.remove();
      const impact = document.createElement("div");
      impact.textContent = "💥";
      impact.style.cssText = `
        position: fixed;
        left: ${endX}px;
        top: ${endY}px;
        font-size: 48px;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        filter: drop-shadow(0 0 12px rgba(255,100,0,0.9));
        animation: impactBurst 0.5s ease-out forwards;
      `;
      document.body.appendChild(impact);
      const ring = document.createElement("div");
      ring.style.cssText = `
        position: fixed;
        left: ${endX}px;
        top: ${endY}px;
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255,200,50,0.9);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        transform: translate(-50%, -50%);
        animation: impactRing 0.5s ease-out forwards;
      `;
      document.body.appendChild(ring);
      setTimeout(() => { impact.remove(); ring.remove(); }, 500);
      if (onImpact) onImpact();
    }, duration);
  }
};