import { playSound } from "../hooks/useSound";

// ─── AnimationManager ────────────────────────────────────────────────────────
// Tüm DOM partikülleri burada takip edilir.
// Bileşen unmount / savaş biterken animManager.clearAll() ile temizlenebilir.
class AnimationManager {
  constructor() {
    this._particles = new Set();
  }

  /** Bir DOM elementi oluşturur, body'e ekler ve durationMs sonra otomatik kaldırır. */
  spawn(cssText, durationMs) {
    const el = document.createElement("div");
    el.style.cssText = cssText;
    el.style.pointerEvents = "none";
    el.style.zIndex = "1000";
    document.body.appendChild(el);
    this._particles.add(el);
    const id = setTimeout(() => {
      el.remove();
      this._particles.delete(el);
    }, durationMs);
    return {
      el,
      cancel: () => {
        clearTimeout(id);
        el.remove();
        this._particles.delete(el);
      },
    };
  }

  /** Tüm aktif partikülleri anında kaldırır (savaş reset / unmount için). */
  clearAll() {
    this._particles.forEach((el) => el.remove());
    this._particles.clear();
  }
}

export const animManager = new AnimationManager();

// ─── Yardımcı: pet elementinin merkez koordinatlarını al ─────────────────────
const getCenter = (petId) => {
  const el = document.querySelector(`[data-pet-id="${petId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { el, x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
};

// ─── spawnParticles ───────────────────────────────────────────────────────────
export const spawnParticles = (petId, abilityType) => {
  const colors = {
    fire:   ["🔥", "💥", "✨"],
    shield: ["🛡️", "✨", "💫"],
    heal:   ["💚", "✨", "💖"],
    attack: ["⚔️", "💥", "⭐"],
    buff:   ["✨", "💫", "🌟"],
  };
  const icons = colors[abilityType] || ["✨"];
  const center = getCenter(petId);
  const x = center ? center.x : window.innerWidth / 2;
  const y = center ? center.y : window.innerHeight / 2;

  for (let i = 0; i < 6; i++) {
    const el = animManager.spawn(
      `position:fixed;left:${x}px;top:${y}px;font-size:24px;
       --px:${(Math.random() - 0.5) * 100}px;
       --py:${(Math.random() - 0.5) * 100}px;
       animation:particleBurst 0.8s ease-out forwards;`,
      800
    ).el;
    el.textContent = icons[i % icons.length];
  }
};

// ─── spawnFloatingText ────────────────────────────────────────────────────────
export const spawnFloatingText = (text, x, y, type = "damage") => {
  const el = animManager.spawn("position:fixed;", 1200).el;
  el.textContent = text;
  el.style.left         = `${x}px`;
  el.style.top          = `${y}px`;
  el.style.fontWeight   = "900";
  el.style.letterSpacing = "-1px";
  el.style.textShadow   = "0 2px 8px rgba(0,0,0,0.8)";
  el.style.fontFamily   = "system-ui, sans-serif";

  if (type === "damage") {
    const num = parseInt(text.replace("-", "")) || 0;
    el.style.fontSize   = num >= 20 ? "42px" : num >= 10 ? "34px" : "26px";
    el.style.color      = "#ff3333";
    el.style.textShadow = "0 0 10px rgba(255,50,50,0.8), 0 2px 8px rgba(0,0,0,0.8)";
    el.style.animation  = "floatUpRed 1.2s ease-out forwards";
  } else if (type === "heal" || type === "buff") {
    const num = parseInt(text.replace("+", "")) || 0;
    el.style.fontSize   = num >= 20 ? "38px" : num >= 10 ? "30px" : "24px";
    el.style.color      = "#22ff88";
    el.style.textShadow = "0 0 10px rgba(34,255,136,0.8), 0 2px 8px rgba(0,0,0,0.8)";
    el.style.animation  = "floatUpGreen 1.2s ease-out forwards";
  } else {
    el.style.fontSize   = "28px";
    el.style.color      = "#ffd700";
    el.style.textShadow = "0 0 10px rgba(255,215,0,0.8), 0 2px 8px rgba(0,0,0,0.8)";
    el.style.animation  = "floatUp 1.2s ease-out forwards";
  }
};

// ─── spawnBuffAnimation ───────────────────────────────────────────────────────
// Bir hayvandan diğerine uçan buff/heal ikonu + floating text
export const spawnBuffAnimation = (fromPetId, toPetId, amount = 1, type = "buff", triggerAnim) => {
  const from = getCenter(fromPetId);
  const to   = getCenter(toPetId);
  if (!from || !to) return;

  const icons = type === "buff" ? ["⚔️", "❤️"] : type === "heal" ? ["💚", "✨"] : ["💰"];
  icons.forEach((icon, index) => {
    setTimeout(() => {
      const el = animManager.spawn(
        `position:fixed;left:${from.x}px;top:${from.y}px;font-size:24px;
         --tx:${to.x - from.x}px;--ty:${to.y - from.y}px;
         animation:800ms flyToTarget cubic-bezier(0.25,0.46,0.45,0.94) forwards;`,
        800
      ).el;
      el.textContent = icon;

      setTimeout(() => {
        const toNow = getCenter(toPetId);
        if (toNow) {
          spawnFloatingText(`+${amount}`, toNow.x, toNow.rect.top, type === "heal" ? "heal" : "buff");
        }
        if (typeof triggerAnim === "function") triggerAnim(toPetId, "buff");
      }, 700);
    }, index * 150);
  });
};

// ─── spawnFlyingParticle ──────────────────────────────────────────────────────
// Genel amaçlı: koordinattan koordinata uçan emoji.
// useShop içindeki tüm document.createElement blokları bununla değiştirildi.
export const spawnFlyingParticle = (icon, fromX, fromY, toX, toY, durationMs = 800, onArrive) => {
  const el = animManager.spawn(
    `position:fixed;left:${fromX}px;top:${fromY}px;font-size:20px;
     --tx:${toX - fromX}px;--ty:${toY - fromY}px;
     animation:flyToTarget ${durationMs}ms cubic-bezier(0.25,0.46,0.45,0.94) forwards;`,
    durationMs
  ).el;
  el.textContent = icon;
  if (onArrive) setTimeout(onArrive, durationMs - 100);
  return el;
};

// ─── spawnImpact ──────────────────────────────────────────────────────────────
export const spawnImpact = (x, y) => {
  const el = animManager.spawn(
    `position:fixed;left:${x}px;top:${y}px;font-size:32px;
     transform:translate(-50%,-50%);`,
    500
  ).el;
  el.textContent = "💥";
  el.className = "impact-effect";
};

// ─── spawnDeathEffect ─────────────────────────────────────────────────────────
export const spawnDeathEffect = (petId) => {
  playSound("death");
  const center = getCenter(petId);
  if (!center) return;
  const { x, y } = center;

  // Kırmızı flash halkası
  animManager.spawn(
    `position:fixed;left:${x}px;top:${y}px;
     width:120px;height:120px;border-radius:50%;
     background:radial-gradient(circle,rgba(255,50,50,0.8) 0%,transparent 70%);
     transform:translate(-50%,-50%) scale(0);
     animation:deathFlash 0.6s ease-out forwards;`,
    600
  );

  // Partiküller
  const emojis = ["💀", "💨", "✨", "💫", "🩸"];
  for (let i = 0; i < 8; i++) {
    const angle    = (Math.PI * 2 * i) / 8;
    const distance = 60 + Math.random() * 40;
    const size     = 20 + Math.random() * 16;
    animManager.spawn(
      `position:fixed;left:${x}px;top:${y}px;
       font-size:${size}px;
       transform:translate(-50%,-50%);
       --tx:${Math.cos(angle) * distance}px;
       --ty:${Math.sin(angle) * distance}px;
       animation:deathParticle 0.9s ease-out forwards;`,
      900
    ).el.textContent = emojis[i % emojis.length];
  }

  // Büyük kafatası
  animManager.spawn(
    `position:fixed;left:${x}px;top:${y - 30}px;font-size:48px;
     transform:translate(-50%,-50%) scale(0);
     animation:deathSkull 1s ease-out forwards;`,
    1000
  ).el.textContent = "💀";
};

// ─── spawnProjectile ──────────────────────────────────────────────────────────
export const ABILITY_PROJECTILES = {
  start_fire:         "🔥",
  start_poison:       "☠️",
  start_snipe:        "🎯",
  start_multi_snipe:  "🎯",
  faint_wave:         "🌊",
  start_freeze_enemy: "❄️",
  start_dmg:          "💥",
  faint_dmg:          "💀",
  hurt_dmg:           "💢",
  devour:             "💚",
  start_trample:      "💨",
  kill_buff:          "🩸",
  start_fear:         "😱",
  kill_fear_all:      "😱",
  cheetah_faint:      "💨",
  default:            "⚔️",
};

/** Çarpışma efekti (impact + ring) */
const spawnImpactAt = (endX, endY) => {
  animManager.spawn(
    `position:fixed;left:${endX}px;top:${endY}px;font-size:48px;
     transform:translate(-50%,-50%);
     filter:drop-shadow(0 0 12px rgba(255,100,0,0.9));
     animation:impactBurst 0.5s ease-out forwards;`,
    500
  ).el.textContent = "💥";

  animManager.spawn(
    `position:fixed;left:${endX}px;top:${endY}px;
     width:20px;height:20px;
     border:3px solid rgba(255,200,50,0.9);border-radius:50%;
     transform:translate(-50%,-50%);
     animation:impactRing 0.5s ease-out forwards;`,
    500
  );
};

export const spawnProjectile = (fromPetId, toPetId, ability, onImpact, arc = false) => {
  setTimeout(() => {
  const from = getCenter(fromPetId);
  const to   = getCenter(toPetId);
  if (!from || !to) { if (onImpact) onImpact(); return; }

  const { x: startX, y: startY } = from;
  const { x: endX,   y: endY   } = to;
  const dx       = endX - startX;
  const dy       = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const duration = Math.max(400, Math.min(900, distance * 1.2));
  const emoji    = (ability && ABILITY_PROJECTILES[ability]) || ABILITY_PROJECTILES.default;

  const projectile = animManager.spawn(
    `position:fixed;font-size:32px;
     transform:translate(-50%,-50%);
     filter:drop-shadow(0 0 8px white) drop-shadow(0 0 16px rgba(255,200,50,0.9));`,
    duration + 200
  ).el;
  projectile.textContent = emoji;

  if (arc) {
    // Yay (quadratic bezier) hareketi
    const steps   = 60;
    const arcH    = -Math.min(120, distance * 0.5);
    const stepDur = duration / steps;
    let   s       = 0;

    const animate = () => {
      if (s > steps) {
        projectile.remove();
        spawnImpactAt(endX, endY);
        if (onImpact) onImpact();
        return;
      }
      const t  = s / steps;
      const mx = startX + dx / 2;
      const my = startY + dy / 2 + arcH;
      const x  = (1-t)*(1-t)*startX + 2*(1-t)*t*mx + t*t*endX;
      const y  = (1-t)*(1-t)*startY + 2*(1-t)*t*my + t*t*endY;
      projectile.style.left = `${x}px`;
      projectile.style.top  = `${y}px`;

      if (s % 4 === 0) {
        animManager.spawn(
          `position:fixed;left:${x}px;top:${y}px;font-size:16px;
           transform:translate(-50%,-50%);opacity:0.5;
           filter:drop-shadow(0 0 4px rgba(255,200,50,0.6));
           animation:trailFade 0.3s ease-out forwards;`,
          300
        ).el.textContent = emoji;
      }
      s++;
      setTimeout(animate, stepDur);
    };
    setTimeout(animate, stepDur);

  } else {
    // Düz atış — CSS animation ile
    projectile.style.left = `${startX}px`;
    projectile.style.top  = `${startY}px`;
    projectile.style.setProperty("--tx", `${dx}px`);
    projectile.style.setProperty("--ty", `${dy}px`);
    projectile.style.animation = `projectileFly ${duration}ms cubic-bezier(0.25,0.46,0.45,0.94) forwards`;

    const trailCount = 6;
    for (let i = 0; i < trailCount; i++) {
      setTimeout(() => {
        const p = i / trailCount;
        animManager.spawn(
          `position:fixed;
           left:${startX + dx * p}px;top:${startY + dy * p}px;
           font-size:${20 - i * 2}px;
           transform:translate(-50%,-50%);
           opacity:${0.6 - i * 0.08};
           filter:drop-shadow(0 0 6px rgba(255,200,50,0.8));
           animation:trailFade 0.4s ease-out forwards;`,
          400
        ).el.textContent = emoji;
      }, (duration / trailCount) * i);
    }

    setTimeout(() => {
      projectile.remove();
      spawnImpactAt(endX, endY);
      if (onImpact) onImpact();
    }, duration);
  }
  }, 50);
};
