/**
 * pixiEngine.js — Pixi.js tabanlı savaş sahnesi motoru
 *
 * Sorumluluklar:
 *  - Pixi Application lifecycle (init / destroy)
 *  - Sprite havuzu (her hayvan için Sprite + Container)
 *  - Pozisyonlama algoritması (hiçbir zaman taşmaz)
 *  - Kamera zoom (gerçek Container.scale, overflow yok)
 *  - Animasyon sistemi (attack, damage, buff, death)
 *  - Projektil ve parçacık sistemi (koordinat tabanlı, DOM'a bağımlı değil)
 *  - Ölüm yeteneği efektleri (FAINT_DMG, FAINT_WAVE vb.)
 */

import * as PIXI from "pixi.js";

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const SCENE_W        = 900;   // Sabit sahne genişliği (px)
const SCENE_H        = 320;   // Sabit sahne yüksekliği (px)
const CARD_W         = 96;    // Sprite alanı genişliği
const CARD_H         = 120;   // Sprite alanı yüksekliği
const HP_BAR_W       = 72;
const HP_BAR_H       = 7;
const VS_CENTER_X    = SCENE_W / 2;
const TEAM_PADDING   = 20;    // Sahne kenarından boşluk
const MAX_TEAM_W     = VS_CENTER_X - TEAM_PADDING - 40; // Her takımın max genişliği

// Ability projektil emojileri
const PROJECTILE_EMOJI = {
  start_fire:         "🔥",
  start_poison:       "☠️",
  start_snipe:        "🎯",
  start_multi_snipe:  "🎯",
  faint_wave:         "🌊",
  faint_dmg:          "💀",
  start_freeze_enemy: "❄️",
  start_dmg:          "💥",
  hurt_dmg:           "💢",
  devour:             "💚",
  start_trample:      "💨",
  kill_buff:          "🩸",
  start_fear:         "😱",
  kill_fear_all:      "😱",
  cheetah_faint:      "💨",
  weaken_strong:      "🐧",
  default:            "⚔️",
};

// ─── PixiEngine sınıfı ────────────────────────────────────────────────────────
export class PixiEngine {
  constructor() {
    this.app          = null;
    this.stage        = null;       // Root container
    this.cameraRoot   = null;       // Zoom için container
    this.petLayer     = null;       // Hayvanlar
    this.fxLayer      = null;       // Efektler (projektil, parçacık)
    this.textLayer    = null;       // Floating text

    // id → { container, sprite, hpBar, hpBg, atkText, hpText, nameText, pet }
    this.sprites      = new Map();
    this.textures     = new Map();  // img dosya adı → Texture (cache)

    this._tickerFns   = [];         // Temizlenecek ticker fonksiyonları
    this.isReady      = false;      // init() tamamlanana kadar false
    this._pendingTeams = null;      // init bitmeden gelen updateTeams isteği
  }

  // ── Başlatma ──────────────────────────────────────────────────────────────
  async init(canvas) {
    // WebGL başlatma denemesi — GPU desteği yoksa Canvas renderer'a düş
    try {
      this.app = new PIXI.Application({
        view:            canvas,
        width:           SCENE_W,
        height:          SCENE_H,
        backgroundAlpha: 0,          // PixiJS 7: şeffaf arka plan
        antialias:       true,
        resolution:      window.devicePixelRatio || 1,
        autoDensity:     true,
      });
    } catch (e) {
      console.warn("[PixiEngine] WebGL başlatılamadı, Canvas renderer'a geçiliyor.", e);
      this.app = new PIXI.Application({
        view:            canvas,
        width:           SCENE_W,
        height:          SCENE_H,
        backgroundAlpha: 0,          // PixiJS 7: şeffaf arka plan
        forceCanvas:     true,
        resolution:      1,
        autoDensity:     true,
      });
    }

    this.stage      = this.app.stage;
    this.cameraRoot = new PIXI.Container();
    this.petLayer   = new PIXI.Container();
    this.fxLayer    = new PIXI.Container();
    this.textLayer  = new PIXI.Container();

    this.cameraRoot.addChild(this.petLayer, this.fxLayer, this.textLayer);
    this.stage.addChild(this.cameraRoot);

    // Kamera merkezleme
    this.cameraRoot.pivot.set(SCENE_W / 2, SCENE_H / 2);
    this.cameraRoot.position.set(SCENE_W / 2, SCENE_H / 2);

    // Hazır — bekleyen takım güncellemesi varsa uygula
    this.isReady = true;
    if (this._pendingTeams) {
      const { pT, eT } = this._pendingTeams;
      this._pendingTeams = null;
      await this.updateTeams(pT, eT);
    }
  }

  destroy() {
    this._tickerFns.forEach(fn => this.app?.ticker.remove(fn));
    this._tickerFns = [];
    this.sprites.clear();
    this.textures.clear();
    this.app?.destroy(false, { children: true, texture: false });
    this.app = null;
  }

  // ── Texture yükleme (cache'li) ────────────────────────────────────────────
  async _getTexture(imgFile) {
    if (!imgFile) return PIXI.Texture.WHITE;
    if (this.textures.has(imgFile)) return this.textures.get(imgFile);
    return new Promise((resolve) => {
      try {
        const tex = PIXI.Texture.from(`/images/animals/${imgFile}`);
        tex.baseTexture.on("loaded", () => {
          this.textures.set(imgFile, tex);
          resolve(tex);
        });
        tex.baseTexture.on("error", () => resolve(PIXI.Texture.WHITE));
        // Zaten yüklüyse
        if (tex.baseTexture.valid) {
          this.textures.set(imgFile, tex);
          resolve(tex);
        }
      } catch {
        resolve(PIXI.Texture.WHITE);
      }
    });
  }

  // ── Pozisyon hesaplama ────────────────────────────────────────────────────
  // Her takım için hayvan sayısına göre kart boyutu ve X pozisyonları
  _calcPositions(count, isPlayer) {
    if (count === 0) return [];

    // Kart boyutunu hayvan sayısına göre ölçekle
    const maxW    = MAX_TEAM_W;
    const spacing = Math.min(CARD_W + 8, Math.floor(maxW / count));
    const scale   = Math.min(1, spacing / (CARD_W + 8));
    const cardW   = CARD_W * scale;
    const totalW  = count * spacing;

    // Takım bloğunun başlangıç X'i
    const baseX = isPlayer
      ? VS_CENTER_X - TEAM_PADDING - totalW      // Oyuncu: VS'e yakın sağda, uzak solda
      : VS_CENTER_X + TEAM_PADDING;              // Düşman: VS'e yakın solda, uzak sağda

    const positions = [];
    for (let i = 0; i < count; i++) {
      // Oyuncu: pT[0] = ön = VS'e en yakın (sağ), pT[5] = arka = en sol
      // Düşman: eT[0] = ön = VS'e en yakın (sol), eT[5] = arka = en sağ
      const x = isPlayer
        ? baseX + (count - 1 - i) * spacing + cardW / 2
        : baseX + i * spacing + cardW / 2;
      positions.push({ x, y: SCENE_H / 2, scale });
    }
    return positions;
  }

  // ── Sprite oluşturma ──────────────────────────────────────────────────────
  async _createSprite(pet, pos, isPlayer) {
    const container = new PIXI.Container();
    container.position.set(pos.x, pos.y);

    const scale = pos.scale;
    const cw = CARD_W * scale;
    const ch = CARD_H * scale;

    // Hayvan görseli
    const tex    = await this._getTexture(pet.img);
    const sprite = new PIXI.Sprite(tex);
    sprite.width  = cw;
    sprite.height = ch;
    sprite.anchor.set(0.5, 0.5);
    // flip mantığı: mirror mod (oyuncu) → flip:false ise ters çevir
    const shouldFlip = isPlayer ? !pet.flip : pet.flip;
    if (shouldFlip) sprite.scale.x *= -1;
    container.addChild(sprite);

    // HP bar arka planı
    const hpBg = new PIXI.Graphics();
    hpBg.beginFill(0x000000, 0.5);
    hpBg.drawRoundedRect(-HP_BAR_W / 2, ch / 2 + 4, HP_BAR_W, HP_BAR_H, 3);
    hpBg.endFill();
    container.addChild(hpBg);

    // HP bar dolgu
    const hpBar = new PIXI.Graphics();
    container.addChild(hpBar);
    this._drawHpBar(hpBar, pet.curHp, pet.hp, ch);

    // ATK text
    const atkText = new PIXI.Text(`⚔️${pet.atk}`, {
      fontSize: 13 * scale,
      fontWeight: "900",
      fill: 0xef4444,
      dropShadow: true,
      dropShadowDistance: 1,
    });
    atkText.anchor.set(0, 0.5);
    atkText.position.set(-cw / 2, ch / 2 + 18 * scale);
    container.addChild(atkText);

    // HP text
    const hpText = new PIXI.Text(`❤️${Math.max(0, pet.curHp)}`, {
      fontSize: 13 * scale,
      fontWeight: "900",
      fill: 0x4ade80,
      dropShadow: true,
      dropShadowDistance: 1,
    });
    hpText.anchor.set(1, 0.5);
    hpText.position.set(cw / 2, ch / 2 + 18 * scale);
    container.addChild(hpText);

    // İsim text
    const nameText = new PIXI.Text(pet.nick, {
      fontSize: 10 * scale,
      fontWeight: "700",
      fill: 0xe2e8f0,
    });
    nameText.anchor.set(0.5, 0);
    nameText.position.set(0, ch / 2 + 28 * scale);
    container.addChild(nameText);

    this.petLayer.addChild(container);

    // Spawn animasyonu (drop-in)
    container.alpha = 0;
    container.y    -= 200;
    this._tween(container, { y: pos.y, alpha: 1 }, 500, "bounce", 0);

    const entry = { container, sprite, hpBar, hpBg, atkText, hpText, nameText, pet, pos, isDead: false };
    this.sprites.set(pet.id, entry);
    return entry;
  }

  _drawHpBar(hpBar, curHp, maxHp, ch) {
    const ratio   = Math.min(1, Math.max(0, curHp / Math.max(1, maxHp)));
    const color   = ratio > 0.5 ? 0x4ade80 : ratio > 0.25 ? 0xfacc15 : 0xef4444;
    const w       = HP_BAR_W * ratio;
    hpBar.clear();
    if (w > 0) {
      hpBar.beginFill(color, 0.9);
      hpBar.drawRoundedRect(-HP_BAR_W / 2, ch / 2 + 4, w, HP_BAR_H, 3);
      hpBar.endFill();
    }
  }

  // ── Takım güncelleme (pT/eT değiştiğinde çağrılır) ────────────────────────
  async updateTeams(pT, eT) {
    // init() henüz tamamlanmadıysa isteği sıraya al
    if (!this.isReady) {
      this._pendingTeams = { pT, eT };
      return;
    }

    const allPetIds = new Set([...pT, ...eT].map(p => p.id));

    // Yeni hayvanları ekle
    const pPositions = this._calcPositions(pT.length, true);
    const ePositions = this._calcPositions(eT.length, false);

    for (let i = 0; i < pT.length; i++) {
      const pet = pT[i];
      if (!this.sprites.has(pet.id)) {
        await this._createSprite(pet, pPositions[i], true);
      } else {
        this._updateSprite(pet, pPositions[i]);
      }
    }
    for (let i = 0; i < eT.length; i++) {
      const pet = eT[i];
      if (!this.sprites.has(pet.id)) {
        await this._createSprite(pet, ePositions[i], false);
      } else {
        this._updateSprite(pet, ePositions[i]);
      }
    }

    // Ölü hayvanları temizle (DOM'dan değil, Pixi sahnesinden)
    for (const [id, entry] of this.sprites) {
      if (!allPetIds.has(id) && !entry.isDead) {
        this._playDeathAnim(id);
      }
    }

    // Kamera zoom
    this._updateZoom(pT.length + eT.length);
  }

  _updateSprite(pet, pos) {
    const entry = this.sprites.get(pet.id);
    if (!entry) return;
    const { container, hpBar, atkText, hpText } = entry;
    const ch = CARD_H * pos.scale;

    // HP bar
    this._drawHpBar(hpBar, pet.curHp, pet.hp, ch);
    // Stat text
    atkText.text = `⚔️${pet.atk}`;
    const hpRatio = Math.min(1, Math.max(0, pet.curHp / Math.max(1, pet.hp)));
    hpText.style.fill = hpRatio > 0.5 ? 0x4ade80 : hpRatio > 0.25 ? 0xfacc15 : 0xef4444;
    hpText.text = `❤️${Math.max(0, pet.curHp)}`;

    // Pozisyon (hayvan öldüyse hareket ettirme)
    if (!entry.isDead) {
      entry.pos = pos;
    }
  }

  // ── Kamera zoom ───────────────────────────────────────────────────────────
  _updateZoom(totalAlive) {
    let scale = 1;
    if      (totalAlive <= 2)  scale = 1.35;
    else if (totalAlive <= 4)  scale = 1.2;
    else if (totalAlive <= 6)  scale = 1.05;
    else if (totalAlive <= 8)  scale = 0.95;
    else                       scale = 0.85;

    this._tween(this.cameraRoot, { scale }, 1200, "power2");
  }

  // ── Hayvan animasyonu ─────────────────────────────────────────────────────
  playAnim(petId, animType) {
    const entry = this.sprites.get(petId);
    if (!entry || entry.isDead) return;
    const { container, sprite } = entry;
    const origX = entry.pos?.x ?? container.x;
    const origY = entry.pos?.y ?? container.y;

    switch (animType) {
      case "attackLeft":
        this._tween(container, { x: origX - 70, y: origY - 15 }, 150, "power1");
        setTimeout(() => this._tween(container, { x: origX, y: origY }, 250, "power2"), 150);
        break;
      case "attackRight":
        this._tween(container, { x: origX + 70, y: origY - 15 }, 150, "power1");
        setTimeout(() => this._tween(container, { x: origX, y: origY }, 250, "power2"), 150);
        break;
      case "damage":
        this._flashSprite(sprite, 0xff0000);
        this._tween(container, { x: origX + 8 }, 50, "linear");
        setTimeout(() => this._tween(container, { x: origX - 8 }, 50, "linear"), 50);
        setTimeout(() => this._tween(container, { x: origX }, 100, "power2"), 100);
        break;
      case "buff":
      case "heal":
        this._flashSprite(sprite, animType === "heal" ? 0x22ff88 : 0xfbbf24);
        this._tween(container, { scale: (entry.pos?.scale ?? 1) * 1.15 }, 150, "power1");
        setTimeout(() => this._tween(container, { scale: entry.pos?.scale ?? 1 }, 300, "bounce"), 150);
        break;
      case "ability":
        this._flashSprite(sprite, 0xffffff);
        break;
      default:
        break;
    }
  }

  _flashSprite(sprite, color) {
    sprite.tint = color;
    setTimeout(() => { sprite.tint = 0xffffff; }, 300);
  }

  // ── Ölüm animasyonu ───────────────────────────────────────────────────────
  _playDeathAnim(petId) {
    const entry = this.sprites.get(petId);
    if (!entry || entry.isDead) return;
    entry.isDead = true;

    const { container } = entry;
    this._spawnDeathParticles(container.x, container.y);

    this._tween(container, { y: container.y + 150, alpha: 0 }, 500, "power2");
    setTimeout(() => {
      this.petLayer.removeChild(container);
      this.sprites.delete(petId);
    }, 600);
  }

  // ── Projektil sistemi ─────────────────────────────────────────────────────
  spawnProjectile(fromPetId, toPetId, ability, onImpact, arc = false) {
    const from = this.sprites.get(fromPetId);
    const to   = this.sprites.get(toPetId);

    if (!from || !to) { if (onImpact) onImpact(); return; }

    const startX = from.container.x;
    const startY = from.container.y;
    const endX   = to.container.x;
    const endY   = to.container.y;

    const emoji    = PROJECTILE_EMOJI[ability] || PROJECTILE_EMOJI.default;
    const dx       = endX - startX;
    const dy       = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Math.max(300, Math.min(800, distance * 1.0)); // ms

    const proj = new PIXI.Text(emoji, { fontSize: 28 });
    proj.anchor.set(0.5, 0.5);
    proj.position.set(startX, startY);
    this.fxLayer.addChild(proj);

    if (arc) {
      // Bezier eğrisi
      const arcH  = -Math.min(100, distance * 0.4);
      const steps = 50;
      let   s     = 0;
      const tick  = () => {
        if (s >= steps) {
          this.fxLayer.removeChild(proj);
          this._spawnImpact(endX, endY);
          if (onImpact) onImpact();
          this.app.ticker.remove(tick);
          return;
        }
        const t  = s / steps;
        const mx = startX + dx / 2;
        const my = startY + dy / 2 + arcH;
        proj.x   = (1-t)*(1-t)*startX + 2*(1-t)*t*mx + t*t*endX;
        proj.y   = (1-t)*(1-t)*startY + 2*(1-t)*t*my + t*t*endY;
        s += steps / (duration / (1000 / 60));
      };
      this.app.ticker.add(tick);
      this._tickerFns.push(tick);
    } else {
      // Düz uçuş
      const speedX = dx / (duration / (1000 / 60));
      const speedY = dy / (duration / (1000 / 60));
      let   elapsed = 0;
      const tick = () => {
        elapsed += 1000 / 60;
        proj.x  += speedX;
        proj.y  += speedY;
        if (elapsed >= duration) {
          this.fxLayer.removeChild(proj);
          this._spawnImpact(endX, endY);
          if (onImpact) onImpact();
          this.app.ticker.remove(tick);
        }
      };
      this.app.ticker.add(tick);
      this._tickerFns.push(tick);
    }
  }

  // Tüm düşman takımına dalga efekti (FAINT_WAVE, FAINT_DMG vb.)
  spawnAbilityFx(fromPetId, targetPetIds, ability) {
    const from = this.sprites.get(fromPetId);
    if (!from) return;

    targetPetIds.forEach((tId, i) => {
      setTimeout(() => {
        this.spawnProjectile(fromPetId, tId, ability, () => {
          const entry = this.sprites.get(tId);
          if (entry) this.playAnim(tId, "damage");
        }, false);
      }, i * 100);
    });
  }

  // ── Parçacık ve efektler ──────────────────────────────────────────────────
  _spawnImpact(x, y) {
    const impact = new PIXI.Text("💥", { fontSize: 36 });
    impact.anchor.set(0.5, 0.5);
    impact.position.set(x, y);
    impact.scale.set(0);
    this.fxLayer.addChild(impact);
    this._tween(impact, { scaleXY: 1.4 }, 100, "power1");
    setTimeout(() => this._tween(impact, { scaleXY: 0, alpha: 0 }, 200, "power2"), 100);
    setTimeout(() => this.fxLayer.removeChild(impact), 350);
  }

  _spawnDeathParticles(x, y) {
    const emojis = ["💀", "💨", "✨", "💫"];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const dist  = 50 + Math.random() * 30;
      const p     = new PIXI.Text(emojis[i % emojis.length], { fontSize: 20 });
      p.anchor.set(0.5, 0.5);
      p.position.set(x, y);
      this.fxLayer.addChild(p);
      this._tween(p, { x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist, alpha: 0 }, 700, "power2");
      setTimeout(() => this.fxLayer.removeChild(p), 750);
    }
  }

  // Floating damage/buff text
  spawnFloatingText(text, petId, type = "damage") {
    const entry = this.sprites.get(petId);
    const x     = entry ? entry.container.x : SCENE_W / 2;
    const y     = entry ? entry.container.y - 60 : SCENE_H / 2;

    const color  = type === "damage" ? 0xff3333 : type === "buff" ? 0x22ff88 : 0xffd700;
    const size   = type === "damage" ? 28 : 22;
    const txt    = new PIXI.Text(text, { fontSize: size, fontWeight: "900", fill: color });
    txt.anchor.set(0.5, 0.5);
    txt.position.set(x, y);
    this.textLayer.addChild(txt);
    this._tween(txt, { y: y - 50, alpha: 0 }, 1200, "power1");
    setTimeout(() => this.textLayer.removeChild(txt), 1250);
  }

  // Parçacık patlaması (buff, fire, shield vb.)
  spawnParticles(petId, type) {
    const entry = this.sprites.get(petId);
    if (!entry) return;
    const { x, y } = entry.container;

    const iconMap = {
      fire:   ["🔥", "💥", "✨"],
      shield: ["🛡️", "✨", "💫"],
      heal:   ["💚", "✨", "💖"],
      attack: ["⚔️", "💥", "⭐"],
      buff:   ["✨", "💫", "🌟"],
    };
    const icons = iconMap[type] || ["✨"];

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const dist  = 40 + Math.random() * 30;
      const p     = new PIXI.Text(icons[i % icons.length], { fontSize: 20 });
      p.anchor.set(0.5, 0.5);
      p.position.set(x, y);
      this.fxLayer.addChild(p);
      this._tween(p, { x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist, alpha: 0 }, 600, "power2");
      setTimeout(() => this.fxLayer.removeChild(p), 650);
    }
  }

  // ── Tween yardımcısı (GSAP olmadan, Pixi ticker tabanlı) ─────────────────
  // props: { x, y, alpha, scale, scaleXY }
  _tween(target, props, durationMs, ease = "linear", delay = 0) {
    // Engine veya target henüz hazır değilse sessizce çık
    if (!target || !this.app) return;
    const startProps = {};

    for (const key of Object.keys(props)) {
      if (key === "scaleXY")   startProps[key] = target.scale.x;
      else if (key === "scale") startProps[key] = target.scale.x;
      else                      startProps[key] = target[key] ?? 0;
    }

    const easeFn = (t) => {
      if (ease === "power1") return t * t;
      if (ease === "power2") return t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
      if (ease === "bounce") {
        if (t < 1/2.75) return 7.5625*t*t;
        if (t < 2/2.75) return 7.5625*(t-=1.5/2.75)*t+0.75;
        if (t < 2.5/2.75) return 7.5625*(t-=2.25/2.75)*t+0.9375;
        return 7.5625*(t-=2.625/2.75)*t+0.984375;
      }
      return t; // linear
    };

    const tick = () => {
      const now = performance.now();
      if (now < startTime) return;
      const elapsed = now - startTime;
      const t = easeFn(Math.min(1, elapsed / durationMs));

      for (const [key, end] of Object.entries(props)) {
        const start = startProps[key];
        const val   = start + (end - start) * t;
        if (key === "scaleXY") { target.scale.set(val); }
        else if (key === "scale") { target.scale.set(val); }
        else { target[key] = val; }
      }

      if (elapsed >= durationMs) {
        this.app?.ticker.remove(tick);
        const idx = this._tickerFns.indexOf(tick);
        if (idx > -1) this._tickerFns.splice(idx, 1);
      }
    };

    this.app?.ticker.add(tick);
    this._tickerFns.push(tick);
  }

  // ── Hayvanın sahne koordinatını döner (projektil hedefleme için) ──────────
  getPetCenter(petId) {
    const entry = this.sprites.get(petId);
    if (!entry || entry.isDead) return null;
    return { x: entry.container.x, y: entry.container.y };
  }
}
