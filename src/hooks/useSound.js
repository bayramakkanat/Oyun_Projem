// ─── Global singleton AudioContext ────────────────────────────────────────────
// Her seste yeni AudioContext oluşturmak tarayıcı limitini (6-8 eşzamanlı)
// doldurarak seslerin tamamen kesilmesine yol açıyordu. Tek instance kullanılıyor.
let _ctx = null;
let _soundEnabled = true;

const getCtx = () => {
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Tarayıcı etkileşim olmadan AudioContext suspend edebilir; resume et.
  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
};

export const setSoundFlag = (v) => {
  _soundEnabled = v;
};

export const playSound = (type) => {
  if (!_soundEnabled) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Çok sesli (chord) tipler için yardımcı — ctx dışarıdan alıyor
    const makeOsc = (freq, gainVal, startT, stopT, oscType = "sine") => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = oscType;
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.setValueAtTime(freq, startT);
      g.gain.setValueAtTime(gainVal, startT);
      g.gain.exponentialRampToValueAtTime(0.001, stopT);
      o.start(startT);
      o.stop(stopT);
    };

    if (type === "attackLeft" || type === "attackRight") {
      makeOsc(200, 0.3, now, now + 0.1);

    } else if (type === "damage") {
      makeOsc(150, 0.2, now, now + 0.15);

    } else if (type === "buff") {
      makeOsc(400, 0.2, now, now + 0.2);

    } else if (type === "buy") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(520, now);
      o.frequency.linearRampToValueAtTime(700, now + 0.12);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.start(now); o.stop(now + 0.2);

    } else if (type === "sell") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "triangle";
      o.frequency.setValueAtTime(350, now);
      o.frequency.linearRampToValueAtTime(250, now + 0.15);
      g.gain.setValueAtTime(0.2, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.start(now); o.stop(now + 0.2);

    } else if (type === "levelup") {
      [0, 0.1, 0.2].forEach((t, i) => {
        makeOsc([440, 550, 660][i], 0.25, now + t, now + t + 0.15);
      });

    } else if (type === "victory") {
      [0, 0.15, 0.3, 0.5].forEach((t, i) => {
        makeOsc([523, 659, 784, 1047][i], 0.3, now + t, now + t + 0.3);
      });

    } else if (type === "defeat") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sawtooth";
      o.frequency.setValueAtTime(300, now);
      o.frequency.linearRampToValueAtTime(100, now + 0.5);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      o.start(now); o.stop(now + 0.5);

    } else if (type === "achievement") {
      [0, 0.08, 0.16, 0.24].forEach((t, i) => {
        makeOsc([660, 784, 880, 1047][i], 0.2, now + t, now + t + 0.15);
      });

    } else if (type === "shop_open") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(300, now);
      o.frequency.linearRampToValueAtTime(450, now + 0.1);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      o.start(now); o.stop(now + 0.15);

    } else if (type === "death") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sawtooth";
      o.frequency.setValueAtTime(180, now);
      o.frequency.linearRampToValueAtTime(60, now + 0.4);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      o.start(now); o.stop(now + 0.4);

    } else if (type === "boss_start") {
      [0, 0.2, 0.4, 0.6, 0.8].forEach((t, i) => {
        makeOsc([110, 98, 87, 82, 73][i], 0.3, now + t, now + t + 0.3, "sawtooth");
      });

    } else if (type === "refresh") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(600, now);
      o.frequency.exponentialRampToValueAtTime(200, now + 0.2);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.start(now); o.stop(now + 0.2);

    } else if (type === "freeze") {
      [0, 0.08, 0.16].forEach((t) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "triangle";
        o.frequency.setValueAtTime(1200, now + t);
        o.frequency.linearRampToValueAtTime(800, now + t + 0.1);
        g.gain.setValueAtTime(0.1, now + t);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.1);
        o.start(now + t); o.stop(now + t + 0.12);
      });

    } else if (type === "versus_ready") {
      [0, 0.07].forEach((t, i) => {
        makeOsc([520, 680][i], 0.14, now + t, now + t + 0.13, "triangle");
      });

    } else if (type === "versus_match") {
      [0, 0.08, 0.16].forEach((t, i) => {
        makeOsc([220, 300, 420][i], 0.12, now + t, now + t + 0.14, "sawtooth");
      });

    } else if (type === "versus_disconnect") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "square";
      o.frequency.setValueAtTime(260, now);
      o.frequency.linearRampToValueAtTime(180, now + 0.22);
      g.gain.setValueAtTime(0.16, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      o.start(now); o.stop(now + 0.25);
    }

  } catch (_e) {
    // Ses sistemi erişilemezse sessizce devam et
  }
  
};
