import { useState } from "react";
import { TIERS } from "../data/gameData";

// Tüm hayvanları düz liste olarak al
const ALL_ANIMALS = Object.values(TIERS).flat();

// Hazır test senaryoları
const SCENARIOS = [
  {
    id: "faint_chain",
    label: "💀 Ölüm Zinciri",
    desc: "Kirpi ölünce hasar, Kaplumbağa ölünce HP, Karınca ölünce buff",
    player: [
      { nick: "Kirpi", name: "🦔", atk: 2, hp: 1, curHp: 1, ability: "faint_dmg", tier: 2, lvl: 1, exp: 0 },
      { nick: "Kaplumbağa", name: "🐢", atk: 2, hp: 6, curHp: 6, ability: "faint_shield", tier: 3, lvl: 1, exp: 0 },
      { nick: "Karınca", name: "🐜", atk: 2, hp: 1, curHp: 1, ability: "faint_buff", tier: 1, lvl: 1, exp: 0 },
    ],
    enemy: [
      { nick: "Balık", name: "🐟", atk: 5, hp: 20, curHp: 20, ability: "none", tier: 1, lvl: 1, exp: 0 },
    ],
  },
  {
    id: "summon_combo",
    label: "🐣 Summon Kombosu",
    desc: "Kanguru yavru çağırır, Ayı yavrulara buff verir, Dodo efekti tekrarlar",
    player: [
      { nick: "Kanguru", name: "🦘", atk: 4, hp: 5, curHp: 5, ability: "friend_summon", tier: 2, lvl: 2, exp: 0 },
      { nick: "Ayı", name: "🐻", atk: 11, hp: 13, curHp: 13, ability: "summon_buff", tier: 5, lvl: 2, exp: 0 },
      { nick: "Dodo", name: "🦤", atk: 20, hp: 12, curHp: 12, ability: "summon_retrigger", tier: 6, lvl: 2, exp: 0 },
    ],
    enemy: [
      { nick: "Fil", name: "🐘", atk: 9, hp: 40, curHp: 40, ability: "hurt_dmg", tier: 5, lvl: 2, exp: 0 },
    ],
  },
  {
    id: "wolf_pack",
    label: "🐺 Kurt Sürüsü",
    desc: "Kurt dost ölünce buff alır, Flamingo tur sonu buff verir",
    player: [
      { nick: "Karınca", name: "🐜", atk: 2, hp: 1, curHp: 1, ability: "faint_buff", tier: 1, lvl: 1, exp: 0 },
      { nick: "Karınca", name: "🐜", atk: 2, hp: 1, curHp: 1, ability: "faint_buff", tier: 1, lvl: 1, exp: 0 },
      { nick: "Kurt", name: "🐺", atk: 5, hp: 4, curHp: 4, ability: "friend_faint", tier: 3, lvl: 2, exp: 0 },
      { nick: "Flamingo", name: "🦩", atk: 3, hp: 5, curHp: 5, ability: "end_team_buff", tier: 3, lvl: 2, exp: 0 },
    ],
    enemy: [
      { nick: "Timsah", name: "🐊", atk: 5, hp: 30, curHp: 30, ability: "faint_summon", tier: 4, lvl: 2, exp: 0 },
    ],
  },
  {
    id: "shark_kill",
    label: "🦈 Köpekbalığı Katliamı",
    desc: "Köpekbalığı her öldürmede güçlenir, Kaplan korkutur",
    player: [
      { nick: "Köpekbalığı", name: "🦈", atk: 6, hp: 5, curHp: 5, ability: "kill_buff", tier: 4, lvl: 2, exp: 0 },
      { nick: "Kaplan", name: "🐅", atk: 13, hp: 11, curHp: 11, ability: "kill_fear_all", tier: 5, lvl: 1, exp: 0 },
    ],
    enemy: [
      { nick: "Fare", name: "🐀", atk: 2, hp: 2, curHp: 2, ability: "atk_buff", tier: 2, lvl: 1, exp: 0 },
      { nick: "Fare", name: "🐀", atk: 2, hp: 2, curHp: 2, ability: "atk_buff", tier: 2, lvl: 1, exp: 0 },
      { nick: "Fare", name: "🐀", atk: 2, hp: 2, curHp: 2, ability: "atk_buff", tier: 2, lvl: 1, exp: 0 },
      { nick: "Bufalo", name: "🐃", atk: 4, hp: 8, curHp: 8, ability: "hurt_buff", tier: 4, lvl: 2, exp: 0 },
    ],
  },
  {
    id: "dodo_retrigger",
    label: "🦤 Dodo Retrigger",
    desc: "Balina ölünce 9 hasar, Dodo bunu tekrarlar → çok hasar",
    player: [
      { nick: "Balina", name: "🐋", atk: 1, hp: 1, curHp: 1, ability: "faint_wave", tier: 6, lvl: 2, exp: 0 },
      { nick: "Dodo", name: "🦤", atk: 20, hp: 12, curHp: 12, ability: "summon_retrigger", tier: 6, lvl: 2, exp: 0 },
    ],
    enemy: [
      { nick: "Goril", name: "🦍", atk: 12, hp: 50, curHp: 50, ability: "end_self_buff", tier: 5, lvl: 2, exp: 0 },
      { nick: "Aslan", name: "🦁", atk: 12, hp: 30, curHp: 30, ability: "start_fear", tier: 5, lvl: 1, exp: 0 },
    ],
  },
  {
    id: "boss_anka",
    label: "🔥 Boss: Anka",
    desc: "Anka Boss savaşı — tur 5 boss takımı",
    player: [
      { nick: "Gergedan", name: "🦏", atk: 14, hp: 10, curHp: 10, ability: "start_trample", tier: 5, lvl: 2, exp: 0 },
      { nick: "Aslan", name: "🦁", atk: 12, hp: 10, curHp: 10, ability: "start_fear", tier: 5, lvl: 1, exp: 0 },
      { nick: "Kaplumbağa", name: "🐢", atk: 2, hp: 6, curHp: 6, ability: "faint_shield", tier: 3, lvl: 2, exp: 0 },
    ],
    enemy: [
      { nick: "Anka", name: "🔥", atk: 28, hp: 38, curHp: 38, ability: "start_fire", tier: 4, lvl: 3, exp: 0, isBossUnit: true, isRebornBoss: true, reborn: false, rebornAtk: 20 },
    ],
  },
  {
    id: "dragon_fire",
    label: "🐉 Ejderha Ateşi",
    desc: "Ejderha savaş başı tüm düşmanlara hasar verir",
    player: [
      { nick: "Ejderha", name: "🐉", atk: 18, hp: 16, curHp: 16, ability: "start_fire", tier: 6, lvl: 2, exp: 0 },
      { nick: "Geyik", name: "🦌", atk: 15, hp: 20, curHp: 20, ability: "stag_combo", tier: 6, lvl: 1, exp: 0 },
    ],
    enemy: [
      { nick: "Mamut", name: "🦣", atk: 10, hp: 16, curHp: 16, ability: "start_freeze_enemy", tier: 5, lvl: 2, exp: 0 },
      { nick: "Gergedan", name: "🦏", atk: 14, hp: 10, curHp: 10, ability: "start_trample", tier: 5, lvl: 1, exp: 0 },
      { nick: "Fil", name: "🐘", atk: 9, hp: 18, curHp: 18, ability: "hurt_dmg", tier: 5, lvl: 1, exp: 0 },
    ],
  },
  {
    id: "cheetah_rage",
    label: "💨 Çita + Kara Ruh",
    desc: "Çita ölünce takıma buff, faint_rage da takıma buff — çift zincir",
    player: [
      { nick: "Çita", name: "🐆", atk: 15, hp: 8, curHp: 8, ability: "cheetah_faint", tier: 5, lvl: 2, exp: 0 },
    ],
    enemy: [
      { nick: "Kara Ruh", name: "👤", atk: 25, hp: 30, curHp: 30, ability: "faint_rage", tier: 4, lvl: 2, exp: 0 },
      { nick: "Kara Ruh", name: "👤", atk: 20, hp: 25, curHp: 25, ability: "friend_faint", tier: 4, lvl: 2, exp: 0 },
    ],
  },
  {
    id: "octopus_copy",
    label: "🐙 Ahtapot Kopyalama",
    desc: "Ahtapot ölünce güçlü bir dostu kopyalar",
    player: [
      { nick: "Ahtapot", name: "🐙", atk: 1, hp: 1, curHp: 1, ability: "faint_duplicate", tier: 6, lvl: 2, exp: 0 },
      { nick: "Ejderha", name: "🐉", atk: 18, hp: 16, curHp: 16, ability: "start_fire", tier: 6, lvl: 3, exp: 0 },
    ],
    enemy: [
      { nick: "Timsah", name: "🐊", atk: 5, hp: 6, curHp: 6, ability: "faint_summon", tier: 4, lvl: 2, exp: 0 },
      { nick: "Su Aygırı", name: "🦛", atk: 4, hp: 7, curHp: 7, ability: "faint_copy", tier: 4, lvl: 2, exp: 0 },
    ],
  },
  {
    id: "atk_buff_mouse",
    label: "💪 Fare ATK Zinciri",
    desc: "Fare her vuruşta ATK kazanır, Yaban Domuzu da saldırıda büyür",
    player: [
      { nick: "Fare", name: "🐀", atk: 4, hp: 10, curHp: 10, ability: "atk_buff", tier: 2, lvl: 2, exp: 0 },
      { nick: "Yaban Domuzu", name: "🐗", atk: 5, hp: 5, curHp: 5, ability: "start_charge", tier: 3, lvl: 2, exp: 0 },
    ],
    enemy: [
      { nick: "Goril", name: "🦍", atk: 12, hp: 60, curHp: 60, ability: "end_self_buff", tier: 5, lvl: 3, exp: 0 },
    ],
  },
];
const getAnimal = (nick, tier, lvl = 1) => {
  const base = Object.values(TIERS).flat().find(
    (a) => a.nick === nick && a.tier === tier
  );
  if (!base) return null;
  const bonus = lvl - 1;
  return {
    ...base,
    id: Math.random(),
    lvl,
    exp: 0,
    atk: base.atk + bonus,
    hp: base.hp + bonus,
    curHp: base.hp + bonus,
  };
};
// Hayvan kartı bileşeni (mini)
function MiniCard({ animal, onRemove, onLvlChange, onMoveUp, onMoveDown, isFirst, isLast, flip }) {
  return (
    <div className="relative bg-black/50 border border-white/20 rounded-xl p-2 flex flex-col items-center gap-1 min-w-[80px]">
      <button
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center hover:bg-red-500 z-10"
      >×</button>
    <span className="text-2xl" style={{ display: "inline-block", transform: flip ? "scaleX(-1)" : "scaleX(1)" }}>{animal.name}</span>
      <span className="text-[9px] text-white/70 font-bold truncate max-w-[70px] text-center">{animal.nick}</span>
      <div className="flex gap-1 text-[9px]">
        <span className="text-red-300">⚔️{animal.atk}</span>
        <span className="text-green-300">❤️{animal.hp}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3].map((l) => (
          <button
            key={l}
            onClick={() => onLvlChange(l)}
            className={`w-4 h-4 rounded text-[8px] font-black transition-all ${
              animal.lvl === l
                ? "bg-yellow-500 text-black"
                : "bg-white/10 text-white/50 hover:bg-white/20"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      {/* Sıra değiştirme butonları */}
      <div className="flex gap-1 w-full justify-center">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          title="Öne al"
          className="flex-1 h-4 rounded text-[9px] bg-white/10 hover:bg-blue-600/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >◀</button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          title="Arkaya al"
          className="flex-1 h-4 rounded text-[9px] bg-white/10 hover:bg-blue-600/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >▶</button>
      </div>
      <span className="text-[8px] text-purple-300 text-center leading-tight">{animal.ability}</span>
    </div>
  );
}

export default function DebugPanel({ onStartBattle, onClose }) {
  const [activeTab, setActiveTab] = useState("scenarios"); // "scenarios" | "manual"
  const [playerTeam, setPlayerTeam] = useState([]);
  const [enemyTeam, setEnemyTeam] = useState([]);
  const [searchP, setSearchP] = useState("");
  const [searchE, setSearchE] = useState("");
  const [filterTier, setFilterTier] = useState(0);
  const [addTarget, setAddTarget] = useState("player"); // "player" | "enemy"

  const filteredAnimals = ALL_ANIMALS.filter((a) => {
    const matchSearch = addTarget === "player"
      ? a.nick.toLowerCase().includes(searchP.toLowerCase()) || a.ability.toLowerCase().includes(searchP.toLowerCase())
      : a.nick.toLowerCase().includes(searchE.toLowerCase()) || a.ability.toLowerCase().includes(searchE.toLowerCase());
    const matchTier = filterTier === 0 || a.tier === filterTier;
    return matchSearch && matchTier;
  });

 const loadScenario = (scenario) => {
    const withIds = (arr) =>
      arr.map((a) => {
        const base = Object.values(TIERS).flat().find(
          (t) => t.nick === a.nick && t.tier === a.tier
        );
        if (!base) return { ...a, id: Math.random(), curHp: a.hp };
        const bonus = (a.lvl || 1) - 1;
        return {
          ...base,
          ...a,
          id: Math.random(),
          atk: base.atk + bonus,
          hp: base.hp + bonus,
          curHp: base.hp + bonus,
        };
      });
    setPlayerTeam(withIds(scenario.player));
    setEnemyTeam(withIds(scenario.enemy));
    setActiveTab("manual");
  };

  const addAnimal = (animal, target) => {
    const maxSlots = 6;
    const newAnimal = {
      ...animal,
      id: Math.random(),
      lvl: 1,
      exp: 0,
      curHp: animal.hp,
    };
    if (target === "player" && playerTeam.length < maxSlots) {
      setPlayerTeam((prev) => [...prev, newAnimal]);
    } else if (target === "enemy" && enemyTeam.length < maxSlots) {
      setEnemyTeam((prev) => [...prev, newAnimal]);
    }
  };

  const removeAnimal = (id, target) => {
    if (target === "player") setPlayerTeam((prev) => prev.filter((a) => a.id !== id));
    else setEnemyTeam((prev) => prev.filter((a) => a.id !== id));
  };

 const changeLvl = (id, lvl, target) => {
    const update = (prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        // Orijinal base statları bul (TIERS'dan)
        const base = Object.values(TIERS).flat().find(
          (t) => t.name === a.name && t.tier === a.tier
        );
        if (!base) return { ...a, lvl };
        // Lvl başına +1/+1 bonus (oyundaki merge mantığıyla aynı)
        const bonus = lvl - 1;
        const newAtk = base.atk + bonus;
        const newHp = base.hp + bonus;
        return { ...a, lvl, atk: newAtk, hp: newHp, curHp: newHp };
      });
    if (target === "player") setPlayerTeam(update);
    else setEnemyTeam(update);
  };

  const moveAnimal = (id, direction, target) => {
    const update = (prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx === -1) return prev;
      const newArr = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= newArr.length) return prev;
      [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
      return newArr;
    };
    if (target === "player") setPlayerTeam(update);
    else setEnemyTeam(update);
  };

  const canStart = playerTeam.length > 0 && enemyTeam.length > 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-purple-500/40 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-purple-900/60 to-black/60 border-b border-purple-500/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">🧪</span>
            <span className="font-black text-lg tracking-tight text-purple-200">DEBUG / TEST PANELİ</span>
            <span className="text-[10px] text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold uppercase tracking-widest">
              Sadece Geliştirici
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >✕</button>
        </div>

        {/* Sekmeler */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          {[
            { id: "scenarios", label: "📋 Hazır Senaryolar" },
            { id: "manual", label: "⚙️ Manuel Kurulum" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-purple-400 text-purple-300 bg-purple-900/20"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-4">

          {/* HAZIR SENARYOLAR */}
          {activeTab === "scenarios" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadScenario(s)}
                  className="text-left bg-black/40 border border-white/10 hover:border-purple-400/50 hover:bg-purple-900/20 rounded-xl p-3 transition-all group"
                >
                  <div className="font-black text-white group-hover:text-purple-200 transition-colors">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-white/50 mt-1 leading-relaxed">{s.desc}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <div className="flex gap-1 items-center">
                      <span className="text-[10px] text-green-400 font-bold">Sen:</span>
                      {s.player.map((a, i) => (
                        <span key={i} className="text-base">{a.name}</span>
                      ))}
                    </div>
                    <span className="text-white/30 text-xs">vs</span>
                    <div className="flex gap-1 items-center">
                      <span className="text-[10px] text-red-400 font-bold">Düşman:</span>
                      {s.enemy.map((a, i) => (
                        <span key={i} className="text-base">{a.name}</span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* MANUEL KURULUM */}
          {activeTab === "manual" && (
            <div className="flex flex-col gap-4">

              {/* Takımlar */}
              <div className="grid grid-cols-2 gap-3">
                {/* Oyuncu Takımı */}
                <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-3">
                  <div className="text-xs font-black text-green-300 uppercase tracking-widest mb-2 flex items-center justify-between">
                    <span>⚔️ Senin Takımın ({playerTeam.length}/6)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-white/30 normal-case font-normal">◀ ilk = öndeki savaşçı</span>
                      <button
                        onClick={() => setPlayerTeam([])}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >Temizle</button>
                    </div>
                  </div>
                  {playerTeam.length === 0 ? (
                    <div className="text-center text-white/20 text-xs py-4">
                      Aşağıdan hayvan ekle
                    </div>
                  ) : (
                   <div className="flex flex-wrap gap-1.5">
                      {[...playerTeam].reverse().map((a, idx) => {
                        const realIdx = playerTeam.length - 1 - idx;
                        return (
                          <MiniCard
                            key={a.id}
                            animal={a}
                            onRemove={() => removeAnimal(a.id, "player")}
                            onLvlChange={(l) => changeLvl(a.id, l, "player")}
                            onMoveUp={() => moveAnimal(a.id, "up", "player")}
                            onMoveDown={() => moveAnimal(a.id, "down", "player")}
                            isFirst={realIdx === 0}
                            isLast={realIdx === playerTeam.length - 1}
                            flip={true}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Düşman Takımı */}
                <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-3">
                  <div className="text-xs font-black text-red-300 uppercase tracking-widest mb-2 flex items-center justify-between">
                    <span>🗡️ Düşman Takımı ({enemyTeam.length}/6)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-white/30 normal-case font-normal">◀ ilk = öndeki savaşçı</span>
                      <button
                        onClick={() => setEnemyTeam([])}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >Temizle</button>
                    </div>
                  </div>
                  {enemyTeam.length === 0 ? (
                    <div className="text-center text-white/20 text-xs py-4">
                      Aşağıdan hayvan ekle
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {enemyTeam.map((a, idx) => (
                        <MiniCard
                          key={a.id}
                          animal={a}
                          onRemove={() => removeAnimal(a.id, "enemy")}
                          onLvlChange={(l) => changeLvl(a.id, l, "enemy")}
                          onMoveUp={() => moveAnimal(a.id, "up", "enemy")}
                          onMoveDown={() => moveAnimal(a.id, "down", "enemy")}
                          isFirst={idx === 0}
                          isLast={idx === enemyTeam.length - 1}
                         flip={false}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Hayvan Seçici */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-3">
                <div className="flex gap-2 mb-3 flex-wrap items-center">
                  {/* Kime eklenecek */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAddTarget("player")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        addTarget === "player"
                          ? "bg-green-600 text-white"
                          : "bg-white/10 text-white/50 hover:bg-white/20"
                      }`}
                    >
                      + Bana Ekle
                    </button>
                    <button
                      onClick={() => setAddTarget("enemy")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        addTarget === "enemy"
                          ? "bg-red-600 text-white"
                          : "bg-white/10 text-white/50 hover:bg-white/20"
                      }`}
                    >
                      + Düşmana Ekle
                    </button>
                  </div>

                  {/* Arama */}
                  <input
                    type="text"
                    placeholder="🔍 Hayvan veya yetenek ara..."
                    value={addTarget === "player" ? searchP : searchE}
                    onChange={(e) =>
                      addTarget === "player"
                        ? setSearchP(e.target.value)
                        : setSearchE(e.target.value)
                    }
                    className="flex-1 min-w-[160px] bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-purple-400/60"
                  />

                  {/* Tier filtresi */}
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((t) => (
                      <button
                        key={t}
                        onClick={() => setFilterTier(t)}
                        className={`w-6 h-6 rounded text-[10px] font-black transition-all ${
                          filterTier === t
                            ? "bg-purple-500 text-white"
                            : "bg-white/10 text-white/40 hover:bg-white/20"
                        }`}
                      >
                        {t === 0 ? "∀" : t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hayvan grid */}
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {filteredAnimals.map((a, idx) => (
                    <button
                      key={idx}
                      onClick={() => addAnimal(a, addTarget)}
                      title={`${a.nick} | T${a.tier} | ⚔️${a.atk} ❤️${a.hp} | ${a.ability}`}
                      className="flex flex-col items-center bg-black/40 border border-white/10 hover:border-purple-400/50 hover:bg-purple-900/20 rounded-lg p-1.5 transition-all group"
                    >
                      <span className="text-xl">{a.name}</span>
                      <span className="text-[8px] text-white/50 group-hover:text-white/80 truncate w-full text-center">
                        {a.nick}
                      </span>
                      <span className="text-[8px] text-purple-400/70">T{a.tier}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alt Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-black/40 border-t border-white/10 flex-shrink-0">
          <div className="text-xs text-white/30">
            {playerTeam.length > 0 || enemyTeam.length > 0 ? (
              <span>
                Oyuncu: <span className="text-green-400">{playerTeam.length}</span> hayvan |{" "}
                Düşman: <span className="text-red-400">{enemyTeam.length}</span> hayvan
              </span>
            ) : (
              <span>Senaryo seç veya manuel kur</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-all"
            >
              İptal
            </button>
            <button
              onClick={() => {
                if (!canStart) return;
                onStartBattle(playerTeam, enemyTeam);
              }}
              disabled={!canStart}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-30 disabled:cursor-not-allowed hover:from-purple-500 hover:to-pink-500 rounded-xl text-sm font-black text-white transition-all shadow-lg shadow-purple-900/50 active:scale-95"
            >
              ⚔️ SAVAŞI BAŞLAT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
