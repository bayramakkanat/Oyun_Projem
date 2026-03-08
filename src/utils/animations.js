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
  const particles = ["💀", "💨", "✨", "💫"];
  for (let i = 0; i < 6; i++) {
    const particle = document.createElement("div");
    particle.textContent = particles[i % particles.length];
    particle.className = "death-particle";
    const angle = (Math.PI * 2 * i) / 6;
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.setProperty("--tx", `${Math.cos(angle) * 80}px`);
    particle.style.setProperty("--ty", `${Math.sin(angle) * 80}px`);
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
};
