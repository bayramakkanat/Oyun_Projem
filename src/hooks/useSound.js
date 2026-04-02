let _soundEnabled = true;

export const setSoundFlag = (v) => {
  _soundEnabled = v;
};

export const playSound = (type) => {
  if (!_soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === "attackLeft" || type === "attackRight") {
      osc.frequency.value = 200;
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "damage") {
      osc.frequency.value = 150;
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "buff") {
      osc.frequency.value = 400;
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "buy") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(700, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "sell") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.linearRampToValueAtTime(250, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "levelup") {
      [0, 0.1, 0.2].forEach((t, i) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.type = "sine";
        o2.frequency.value = [440, 550, 660][i];
        g2.gain.setValueAtTime(0.25, now + t);
        g2.gain.exponentialRampToValueAtTime(0.01, now + t + 0.15);
        o2.start(now + t);
        o2.stop(now + t + 0.15);
      });
      return;
    } else if (type === "victory") {
      [0, 0.15, 0.3, 0.5].forEach((t, i) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.type = "sine";
        o2.frequency.value = [523, 659, 784, 1047][i];
        g2.gain.setValueAtTime(0.3, now + t);
        g2.gain.exponentialRampToValueAtTime(0.01, now + t + 0.25);
        o2.start(now + t);
        o2.stop(now + t + 0.3);
      });
      return;
    } else if (type === "defeat") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.5);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === "achievement") {
      [0, 0.08, 0.16, 0.24].forEach((t, i) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.type = "sine";
        o2.frequency.value = [660, 784, 880, 1047][i];
        g2.gain.setValueAtTime(0.2, now + t);
        g2.gain.exponentialRampToValueAtTime(0.01, now + t + 0.12);
        o2.start(now + t);
        o2.stop(now + t + 0.15);
      });
      return;
    } else if (type === "shop_open") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(450, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "death") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === "boss_start") {
      [0, 0.2, 0.4, 0.6, 0.8].forEach((t, i) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.type = "sawtooth";
        o2.frequency.value = [110, 98, 87, 82, 73][i];
        g2.gain.setValueAtTime(0.3, now + t);
        g2.gain.exponentialRampToValueAtTime(0.01, now + t + 0.25);
        o2.start(now + t);
        o2.stop(now + t + 0.3);
      });
      return;
    } else if (type === "refresh") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "freeze") {
      [0, 0.08, 0.16].forEach((t) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.type = "triangle";
        o2.frequency.setValueAtTime(1200, now + t);
        o2.frequency.linearRampToValueAtTime(800, now + t + 0.1);
        g2.gain.setValueAtTime(0.1, now + t);
        g2.gain.exponentialRampToValueAtTime(0.01, now + t + 0.1);
        o2.start(now + t);
        o2.stop(now + t + 0.12);
      });
      return;
    } else if (type === "versus_ready") {
      [0, 0.07].forEach((t, i) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.type = "triangle";
        o2.frequency.setValueAtTime([520, 680][i], now + t);
        g2.gain.setValueAtTime(0.14, now + t);
        g2.gain.exponentialRampToValueAtTime(0.01, now + t + 0.12);
        o2.start(now + t);
        o2.stop(now + t + 0.13);
      });
      return;
    } else if (type === "versus_match") {
      [0, 0.08, 0.16].forEach((t, i) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.type = "sawtooth";
        o2.frequency.setValueAtTime([220, 300, 420][i], now + t);
        g2.gain.setValueAtTime(0.12, now + t);
        g2.gain.exponentialRampToValueAtTime(0.01, now + t + 0.12);
        o2.start(now + t);
        o2.stop(now + t + 0.14);
      });
      return;
    } else if (type === "versus_disconnect") {
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.connect(g2);
      g2.connect(ctx.destination);
      o2.type = "square";
      o2.frequency.setValueAtTime(260, now);
      o2.frequency.linearRampToValueAtTime(180, now + 0.22);
      g2.gain.setValueAtTime(0.16, now);
      g2.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
      o2.start(now);
      o2.stop(now + 0.25);
      return;
    }
    
  } catch (e) {}
};
