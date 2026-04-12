import { useState, useEffect, useRef, useCallback } from "react";
import { useShopContext } from "../context/ShopContext";
import { useUIContext }   from "../context/UIContext";

const TKEY = "petgame_tutorial_v1";

// Kelebek: tier 1 gerçek hayvan, LEVELUP_BUFF_SELF — başka hayvana buff VERMİYOR,
// satın alınca direkt takıma giriyor, pendingTargetBuff tetiklenmiyor.
const TUTORIAL_ANIMAL = {
  name: "🦋",
  nick: "Kelebek",
  tier: 1,
  atk: 2,
  hp: 2,
  cost: 3,
  ability: "levelup_buff_self",
  img: "butterfly.png",
  flip: true,
  isTutorial: true,
};

/* ─── Keyframes ────────────────────────────────────────────────────────────── */
const STYLES = `
  @keyframes tut-bounce    { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-8px)} }
  @keyframes tut-bounceD   { 0%,100%{transform:translateY(0) rotate(180deg)} 50%{transform:translateY(8px) rotate(180deg)} }
  @keyframes tut-appear    { from{opacity:0;transform:scale(0.85) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes tut-float     { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-5px)} }
  @keyframes tut-arrowX    { 0%,100%{transform:translateX(0)} 50%{transform:translateX(8px)} }
  @keyframes tut-badge     { from{transform:scale(0) rotate(-20deg)} to{transform:scale(1) rotate(0deg)} }
  @keyframes tut-arrowDown { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
  @keyframes tut-slot-glow { 0%,100%{box-shadow:0 0 8px 2px rgba(74,222,128,0.3)} 50%{box-shadow:0 0 22px 7px rgba(74,222,128,0.7)} }
`;

/* ─── Karartma ─────────────────────────────────────────────────────────────── */
function Dim() {
  return <div className="fixed inset-0 z-[9990]" style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(2px)" }} />;
}

/* ─── Adım noktaları ───────────────────────────────────────────────────────── */
function StepDots({ current, total }) {
  return (
    <div className="flex gap-1.5 justify-center mt-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="rounded-full transition-all duration-300" style={{
          width: i === current ? 18 : 7, height: 7,
          background: i === current ? "#a78bfa" : i < current ? "#6d28d9" : "#1e1b4b",
          border: "1px solid #6d28d9",
        }} />
      ))}
    </div>
  );
}

/* ─── Merkezi modal ────────────────────────────────────────────────────────── */
function Modal({ emoji, badge, title, body, bodyExtra, primaryLabel, onPrimary, secondaryLabel, onSecondary, accent = "#7c3aed" }) {
  return (
    <>
      <style>{STYLES}</style>
      <Dim />
      <div className="fixed z-[9999] flex flex-col items-center"
        style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(94vw,420px)", animation: "tut-appear 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both" }}>
        <div className="w-full rounded-3xl p-6 flex flex-col items-center gap-4 text-center shadow-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(145deg,#1a1740 0%,#0c1220 100%)", border: `2px solid ${accent}99`, boxShadow: `0 12px 60px ${accent}44` }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% -20%, ${accent}22 0%, transparent 65%)` }} />
          {emoji && (
            <div className="relative" style={{ animation: "tut-float 3s ease-in-out infinite" }}>
              <span className="text-6xl block">{emoji}</span>
              {badge && <span className="absolute -top-1 -right-3 text-2xl block" style={{ animation: "tut-badge 0.4s 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both" }}>{badge}</span>}
            </div>
          )}
          {title    && <p className="relative text-white font-black text-xl leading-snug">{title}</p>}
          {body     && <p className="relative text-gray-300 text-sm leading-relaxed whitespace-pre-line">{body}</p>}
          {bodyExtra}
          <div className="flex flex-col gap-2 w-full mt-1 relative">
            {primaryLabel && (
              <button onClick={onPrimary} className="w-full py-3 rounded-2xl font-black text-base active:scale-95 transition-all"
                style={{ background: `linear-gradient(135deg,${accent} 0%,#4f46e5 100%)`, boxShadow: `0 4px 24px ${accent}55`, color: "#fff" }}>
                {primaryLabel}
              </button>
            )}
            {secondaryLabel && (
              <button onClick={onSecondary} className="w-full py-2 rounded-2xl font-bold text-sm text-gray-500 hover:text-gray-300 transition-colors">
                {secondaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Boş slot okları (takım bölgesine bakan animasyonlu oklar) ─────────────── */
function SlotArrowOverlay({ teamSlots, team }) {
  const emptyCount = Array.from({ length: teamSlots || 4 }).filter((_, i) => !team[i]).length;
  if (emptyCount === 0) return null;
  return (
    <div className="fixed left-0 right-0 z-[9995] flex justify-center gap-6 pointer-events-none" style={{ bottom: 148 }}>
      {Array.from({ length: Math.min(emptyCount, 4) }).map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="font-black text-green-400 text-2xl leading-none"
            style={{ animation: "tut-arrowDown 0.75s ease-in-out infinite", animationDelay: `${i * 0.12}s` }}>▼</span>
          <span className="font-black text-green-300 text-xl leading-none"
            style={{ animation: "tut-arrowDown 0.75s ease-in-out infinite", animationDelay: `${i * 0.12 + 0.1}s` }}>▼</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Altta yüzen kabarcık ─────────────────────────────────────────────────── */
function Bubble({ icon, title, text, arrowUp, accent = "#facc15", showSlotArrows, team, teamSlots, onSkip, children }) {
  return (
    <>
      <style>{STYLES}</style>
      {showSlotArrows && <SlotArrowOverlay teamSlots={teamSlots} team={team || []} />}
      <div className="fixed left-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-auto"
        style={{ transform: "translateX(-50%)", bottom: 86, width: "min(96vw,390px)", animation: "tut-appear 0.3s ease both" }}>
        {arrowUp && <span className="text-3xl block text-yellow-300" style={{ animation: "tut-bounce 0.85s ease-in-out infinite" }}>⬆</span>}
        <div className="w-full rounded-2xl px-4 py-4 flex flex-col gap-2"
          style={{ background: "rgba(10,16,40,0.97)", border: `2px solid ${accent}bb`, backdropFilter: "blur(18px)", boxShadow: `0 0 32px ${accent}44` }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl flex-shrink-0" style={{ animation: "tut-float 2.5s ease-in-out infinite" }}>{icon}</span>
            <div className="flex-1 text-left">
              {title && <p className="text-white font-black text-sm mb-0.5">{title}</p>}
              <p className="text-gray-300 text-xs leading-snug">{text}</p>
            </div>
          </div>
          {children}
        </div>
        {!arrowUp && <span className="text-3xl block text-green-400" style={{ animation: "tut-bounceD 0.85s ease-in-out infinite" }}>⬇</span>}
        <button onClick={onSkip} className="text-xs text-gray-600 hover:text-gray-400 transition-colors mt-0.5">Atla</button>
      </div>
    </>
  );
}

/* ─── HUD satırı ───────────────────────────────────────────────────────────── */
function HRow({ icon, label, desc }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <span className="text-xl w-7 text-center flex-shrink-0">{icon}</span>
      <p className="text-left text-xs">
        <span className="text-white font-black">{label} </span>
        <span className="text-gray-400">{desc}</span>
      </p>
    </div>
  );
}

/* ─── ANA BİLEŞEN ──────────────────────────────────────────────────────────── */
export default function TutorialOverlay() {
  const {
    shop, setShop, team, sel, hasR, shopResetKey, teamSlots,
    tutorialAnimalRef,
  } = useShopContext();

  const { gameMode } = useUIContext();

  const [step,    setStep]    = useState(0);
  const [visible, setVisible] = useState(false);

  const prevTeamCount    = useRef(0);
  const prevResetKey     = useRef(shopResetKey);
  const prevHasR         = useRef(hasR);

  /* İlk açılış */
  useEffect(() => {
    if (gameMode === "versus") return;
    if (localStorage.getItem(TKEY)) return;
    setVisible(true);
  }, [gameMode]);

  const finish = useCallback(() => {
    // Tutorial bitince ref'i temizle — normal refresh devreye girsin
    if (tutorialAnimalRef) tutorialAnimalRef.current = null;
    localStorage.setItem(TKEY, "1");
    setVisible(false);
  }, [tutorialAnimalRef]);

  /* Adım 1 → 2: doğru hayvan seçildi */
  useEffect(() => {
    if (!visible || step !== 1) return;
    if (sel && !sel.isR && !sel.pendingTargetBuff && sel.name === TUTORIAL_ANIMAL.name) {
      setStep(2);
    }
  }, [sel, visible, step]);

  /* Adım 2 → 3: ilk satın alma (takıma 1 hayvan eklendi) */
  useEffect(() => {
    if (!visible) return;
    const tc = team.filter(Boolean).length;
    if (step === 2 && tc > prevTeamCount.current) setStep(3);
    prevTeamCount.current = tc;
  }, [team, visible, step]);

  /* Adım 3 → 4: birinci birleşme (exp > 0) */
  useEffect(() => {
    if (!visible || step !== 3) return;
    if (team.some(a => a && a.exp > 0)) {
      const t = setTimeout(() => setStep(4), 900);
      return () => clearTimeout(t);
    }
  }, [team, visible, step]);

  /* Adım 4'e girilince mağazayı boşalt — oyuncu refresh'e basınca tutorial hayvanı gelsin */
  const step4Cleared = useRef(false);
  useEffect(() => {
    if (!visible || step !== 4) return;
    if (step4Cleared.current) return;
    step4Cleared.current = true;
    // Mağazayı temizle ki "shop değişti = refresh yapıldı" tespiti güvenilir olsun
    setShop([null, null, null, null, null]);
  }, [step, visible, setShop]);

  /* Adım 4 → 5: mağaza temizlendikten sonra shop tekrar dolunca (refresh yapıldı) ilerlet */
  const step4Done = useRef(false);
  useEffect(() => {
    if (!visible || step !== 4) return;
    if (!step4Cleared.current) return; // henüz temizleme olmadı
    if (step4Done.current) return;
    const hasTutAnimal = shop.some(s => s && s.name === TUTORIAL_ANIMAL.name);
    if (hasTutAnimal) {
      step4Done.current = true;
      setTimeout(() => setStep(5), 300);
    }
  }, [shop, visible, step]);

  /* Adım 4'ten çıkınca ref'leri sıfırla */
  useEffect(() => {
    if (step !== 4) {
      step4Cleared.current = false;
      step4Done.current = false;
    }
  }, [step]);

  /* Adım 5 → 6: ödül paneli açıldı (seviye 2 oldu) */
  useEffect(() => {
    if (!visible || step !== 5) return;
    if (hasR && !prevHasR.current) setStep(6);
    prevHasR.current = hasR;
  }, [hasR, visible, step]);

  /* Adım 6 → 7: ödül seçildi */
  useEffect(() => {
    if (!visible || step !== 6) return;
    if (!hasR && prevHasR.current) {
      // Ödül seçildikten sonra tutorial bitti — ref'i temizle, normal oyun başlasın
      if (tutorialAnimalRef) tutorialAnimalRef.current = null;
      setStep(7);
    }
    prevHasR.current = hasR;
  }, [hasR, visible, step, tutorialAnimalRef]);

  if (!visible) return null;

  /* ── Shop'a Kelebek enjeksiyonu + adım başlatma ── */
  const handleStart = () => {
    // tutorialAnimalRef'e Kelebek'i yaz — bundan sonraki her refresh() bunu kullanır
    if (tutorialAnimalRef) tutorialAnimalRef.current = TUTORIAL_ANIMAL;

    // İlk görünüm için mağazayı hemen set et
    setShop([
      { ...TUTORIAL_ANIMAL, id: Math.random(), lvl: 1, exp: 0, curHp: TUTORIAL_ANIMAL.hp, frozen: false },
      { ...TUTORIAL_ANIMAL, id: Math.random(), lvl: 1, exp: 0, curHp: TUTORIAL_ANIMAL.hp, frozen: false },
      null, null, null,
    ]);
    setStep(1);
  };

  const TOTAL = 9;

  /* ── Step 0: Karşılama ── */
  if (step === 0) return (
    <Modal
      emoji="🐾" badge="✨"
      title="Merhaba, oyuna hoş geldin!"
      body={"Bu kısa rehber sana mağazayı,\nhayvan birleştirmeyi ve\nönemli bilgileri adım adım gösterecek."}
      bodyExtra={<StepDots current={0} total={TOTAL} />}
      primaryLabel="Başlayalım! →"
      onPrimary={handleStart}
      secondaryLabel="Atla"
      onSecondary={finish}
      accent="#7c3aed"
    />
  );

  /* ── Step 1: Aynı 2 hayvana tıkla ── */
  if (step === 1) return (
    <Bubble
      icon="🦋" arrowUp accent="#facc15"
      title="Mağazada 2 aynı Kelebek var!"
      text="Birini seçmek için üzerine tıkla — birleştirmeyi öğreneceğiz!"
      onSkip={finish}
    >
      <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl"
        style={{ background: "rgba(250,204,21,0.08)", border: "1px dashed rgba(250,204,21,0.5)" }}>
        <span className="text-xl">🦋</span>
        <span className="text-yellow-300 font-black text-xs">+</span>
        <span className="text-xl">🦋</span>
        <span className="text-yellow-300 font-black text-sm mx-1">→</span>
        <span className="text-2xl">⭐🦋</span>
        <span className="text-gray-400 text-xs ml-1">Seviye atlar!</span>
      </div>
      <StepDots current={1} total={TOTAL} />
    </Bubble>
  );

  /* ── Step 2: Satın al ── */
  if (step === 2) return (
    <Bubble
      icon="🛒" arrowUp={false} accent="#34d399"
      title="Şimdi satın al!"
      text="'Satın Al' butonuna bas — VEYA aşağıdaki boş takım slotlarından birine doğrudan tıkla."
      showSlotArrows team={team} teamSlots={teamSlots || 4}
      onSkip={finish}
    >
      <div className="flex items-center justify-center gap-3 mt-1">
        <div className="px-3 py-1.5 rounded-xl text-xs font-black text-green-300"
          style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.4)" }}>
          ✅ Satın Al butonu
        </div>
        <span className="text-gray-500 text-xs">ya da</span>
        <div className="px-3 py-1.5 rounded-xl text-xs font-black text-green-300"
          style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.4)", animation: "tut-slot-glow 1.5s ease-in-out infinite" }}>
          ⬇ Boş Slot
        </div>
      </div>
      <StepDots current={2} total={TOTAL} />
    </Bubble>
  );

  /* ── Step 3: Birleştir ── */
  if (step === 3) return (
    <Bubble
      icon="✨" arrowUp accent="#a78bfa"
      title="Şimdi birleştir!"
      text="Mağazadaki ikinci Kelebek'e tıkla, açılan panelde takımındaki Kelebek'in bulunduğu slotu seç — ikisi birleşip güçlenecek!"
      onSkip={finish}
    >
      <div className="flex items-center justify-center gap-2 mt-1">
        <div className="flex flex-col items-center">
          <span className="text-xl">🦋</span>
          <span className="text-[9px] text-gray-400">Mağaza</span>
        </div>
        <span className="text-purple-400 font-black text-xl" style={{ animation: "tut-arrowX 0.7s ease-in-out infinite" }}>→</span>
        <div className="flex flex-col items-center">
          <span className="text-xl">🦋</span>
          <span className="text-[9px] text-gray-400">Takım</span>
        </div>
        <span className="text-purple-400 font-black text-lg mx-1">=</span>
        <div className="flex flex-col items-center">
          <span className="text-2xl">⭐🦋</span>
          <span className="text-[9px] text-purple-300 font-black">Seviye 2!</span>
        </div>
      </div>
      <StepDots current={3} total={TOTAL} />
    </Bubble>
  );

  /* ── Step 4: Yenile ── */
  if (step === 4) return (
    <Bubble
      icon="🔄" arrowUp accent="#fb923c"
      title="Mağazayı yenile!"
      text="Mağazanın sağındaki 🔄 Yenile butonuna bas (1💰 harcar). Tutorial hediyesi: yenilemede aynı Kelebek tekrar çıkacak!"
      onSkip={finish}
    >
      <div className="flex items-center gap-3 mt-1 px-3 py-2 rounded-xl"
        style={{ background: "rgba(251,146,60,0.08)", border: "1px dashed rgba(251,146,60,0.45)" }}>
        <span className="text-3xl" style={{ animation: "tut-float 1.5s ease-in-out infinite" }}>🔄</span>
        <div className="text-left">
          <p className="text-orange-300 font-black text-xs">Yenile Butonu</p>
          <p className="text-gray-400 text-xs">Mağaza ızgarasının en sağında</p>
        </div>
        <span className="ml-auto text-yellow-300 font-black text-sm">1💰</span>
      </div>
      <StepDots current={4} total={TOTAL} />
    </Bubble>
  );

  /* ── Step 5: Yenilemeden sonra tekrar Kelebek çıktı ── */
  if (step === 5) return (
    <Bubble
      icon="⭐" arrowUp accent="#34d399"
      title="Kelebek tekrar çıktı!"
      text="Satın al, açılan panelden takımdaki Kelebek'in slotunu seç — Seviye 2 olacak ve ödül kazanacaksın!"
      onSkip={finish}
    >
      <div className="flex items-center justify-center gap-2 mt-1">
        <span className="text-xl">🦋</span>
        <span className="text-green-400 font-black text-xl" style={{ animation: "tut-arrowX 0.7s ease-in-out infinite" }}>→</span>
        <span className="text-xl">⭐🦋</span>
        <span className="text-green-400 font-black text-lg mx-1">=</span>
        <span className="text-2xl">👑🦋</span>
        <span className="text-green-300 font-black text-xs ml-1">Seviye 2!</span>
      </div>
      <StepDots current={5} total={TOTAL} />
    </Bubble>
  );

  /* ── Step 6: Ödül seçimi ── */
  if (step === 6) return (
    <Bubble
      icon="🎁" arrowUp={false} accent="#fbbf24"
      title="Seviye ödülü!"
      text="Kelebek seviye atladı! Açılan ödül havuzundan bir hayvanı seç ve takımına ekle."
      onSkip={finish}
    >
      <StepDots current={6} total={TOTAL} />
    </Bubble>
  );

  /* ── Step 7: HUD tanıtımı ── */
  if (step === 7) return (
    <Modal
      emoji="🗺️"
      title="Üst çubuğu tanıyalım"
      bodyExtra={
        <div className="flex flex-col gap-2 w-full mt-1">
          <HRow icon="🔢" label="TUR"        desc="Kaçıncı turda olduğunu gösterir." />
          <HRow icon="💜" label="KADEME"     desc="O turda mağazaya çıkan hayvan kademesi." />
          <HRow icon="💰" label="ALTIN"      desc="Satın alma ve yenileme bütçen." />
          <HRow icon="❤️" label="CAN"        desc="Sıfırlanırsa oyun biter." />
          <HRow icon="✓"  label="ZAFER"      desc="Bu partide kazandığın savaş sayısı." />
          <HRow icon="🗺️" label="Rehber"     desc="Tüm hayvanları ve yeteneklerini listeler." />
          <HRow icon="📖" label="Koleksiyon" desc="Kullandığın hayvanların istatistikleri." />
          <HRow icon="🏠" label="Menü"       desc="Ana menüye döner." />
          <StepDots current={7} total={TOTAL} />
        </div>
      }
      primaryLabel="Anladım →"
      onPrimary={() => setStep(8)}
      accent="#6366f1"
    />
  );

  /* ── Step 8: Satma ── */
  if (step === 8) return (
    <Modal
      emoji="💸"
      title="Hayvan nasıl satılır?"
      body={"Takımındaki hayvanın altındaki\naltın simgesinin üzerine fareyi getir\n(mobilde uzun bas).\n\n'SAT' yazısı belirince tıkla\n— altın kazanırsın!"}
      bodyExtra={<StepDots current={8} total={TOTAL} />}
      primaryLabel="Anladım →"
      onPrimary={() => setStep(9)}
      accent="#d97706"
    />
  );

  /* ── Step 9: Hazırsın! ── */
  if (step === 9) return (
    <Modal
      emoji="🎉" badge="🚀"
      title="Artık hazırsın!"
      body={"Takımını kur, hayvanları birleştir,\ngüçlendir ve savaşa gönder.\n\nİyi oyunlar! ⚔️"}
      primaryLabel="Oynayalım! →"
      onPrimary={finish}
      accent="#16a34a"
    />
  );

  return null;
}
