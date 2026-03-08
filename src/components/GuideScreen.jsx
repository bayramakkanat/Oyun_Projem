import { useState } from "react";
import Card from "./Card";
import { getDesc } from "../utils/getDesc";
import { TIERS, TBG, TBD, ABILITY_ICONS } from "../data/gameData";

const TIER_LABELS = ["", "K1", "K2", "K3", "K4", "K5", "K6"];
const TIER_TURNS = ["", "Tur 1+", "Tur 3+", "Tur 5+", "Tur 7+", "Tur 9+", "Tur 11+"];
const TIER_COLORS = [
  "",
  { tab: "bg-slate-600/60 border-slate-400/80 text-slate-200", active: "bg-slate-500/80 border-slate-300 text-white shadow-[0_0_15px_rgba(148,163,184,0.5)]" },
  { tab: "bg-emerald-900/60 border-emerald-400/80 text-emerald-200", active: "bg-emerald-700/80 border-emerald-300 text-white shadow-[0_0_15px_rgba(52,211,153,0.6)]" },
  { tab: "bg-blue-900/60 border-cyan-400/80 text-cyan-200", active: "bg-blue-700/80 border-cyan-300 text-white shadow-[0_0_15px_rgba(34,211,238,0.6)]" },
  { tab: "bg-violet-900/60 border-fuchsia-400/80 text-fuchsia-200", active: "bg-violet-700/80 border-fuchsia-300 text-white shadow-[0_0_20px_rgba(232,121,249,0.7)]" },
  { tab: "bg-rose-900/60 border-rose-400/80 text-rose-200", active: "bg-rose-700/80 border-rose-300 text-white shadow-[0_0_20px_rgba(251,113,133,0.7)]" },
  { tab: "bg-amber-900/60 border-yellow-400/80 text-yellow-200", active: "bg-amber-700/80 border-yellow-300 text-white shadow-[0_0_20px_rgba(251,191,36,0.8)]" },
];

export default function GuideScreen({ onClose, guideLvl, setGuideLvl }) {
  const [activeTier, setActiveTier] = useState(1);
  const [selectedPet, setSelectedPet] = useState(null); // { tier, idx }

  const getGuideLvl = (tier, idx) => guideLvl[`${tier}-${idx}`] || 1;
  const setGuideLvlFor = (tier, idx, lvl) =>
    setGuideLvl((prev) => ({ ...prev, [`${tier}-${idx}`]: lvl }));

  const pets = TIERS[activeTier] || [];
  const selPet = selectedPet ? TIERS[selectedPet.tier]?.[selectedPet.idx] : null;
  const selLvl = selectedPet ? getGuideLvl(selectedPet.tier, selectedPet.idx) : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #0d0d1a 50%, #0a1a0d 100%)" }}
    >
      {/* Üst bar */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📖</span>
          <div>
            <div className="font-black text-xl tracking-tight text-white">KADEME REHBERİ</div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">Tüm hayvanlar ve yetenekleri</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-gray-800/80 border border-white/10 hover:bg-gray-700 transition-all flex items-center justify-center text-gray-400 hover:text-white font-bold"
        >
          ✕
        </button>
      </div>

      {/* Kademe sekmeleri */}
      <div className="flex gap-2 px-6 py-3 border-b border-white/10 bg-black/20 flex-shrink-0 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6].map((t) => (
          <button
            key={t}
            onClick={() => { setActiveTier(t); setSelectedPet(null); }}
            className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl border-2 font-black transition-all hover:scale-105 active:scale-95 ${
              activeTier === t ? TIER_COLORS[t].active : TIER_COLORS[t].tab + " hover:brightness-125"
            }`}
          >
            <span className="text-base leading-none">{TIER_LABELS[t]}</span>
            <span className="text-[10px] font-normal opacity-70 mt-0.5">{TIER_TURNS[t]}</span>
          </button>
        ))}
      </div>

      {/* Ana içerik */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sol: Kartlar grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className={`grid gap-3 justify-items-center`} style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
            {pets.map((pet, idx) => {
              const lvl = getGuideLvl(activeTier, idx);
              const isSelected = selectedPet?.tier === activeTier && selectedPet?.idx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedPet(isSelected ? null : { tier: activeTier, idx })}
                  className={`cursor-pointer transition-all rounded-2xl ${isSelected ? "scale-105" : "hover:scale-105"}`}
                >
                  <Card
                    a={{ ...pet, lvl, exp: 0, curHp: pet.hp, id: `guide-${activeTier}-${idx}` }}
                    onClick={() => {}}
                    selected={isSelected}
                    compact={false}
                    battle={false}
                    showName={false}
                    getDesc={getDesc}
                    mirror={true}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Sağ: Seçili hayvan detay paneli */}
        <div className={`w-72 flex-shrink-0 border-l border-white/10 bg-black/30 backdrop-blur-md flex flex-col transition-all duration-300 ${selPet ? "opacity-100" : "opacity-40"}`}>
          {selPet ? (
            <div className="p-5 flex flex-col gap-4 h-full overflow-y-auto">
              {/* Hayvan başlığı */}
              <div className="flex items-center gap-3">
                <span className="text-5xl">{selPet.name}</span>
                <div>
                  <div className="font-black text-xl text-white">{selPet.nick}</div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block bg-gradient-to-r ${TBG[activeTier]} border ${TBD[activeTier]}`}>
                    Kademe {activeTier}
                  </div>
                </div>
              </div>

              {/* Seviye seçici */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Seviye</div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((l) => (
                    <button
                      key={l}
                      onClick={() => setGuideLvlFor(activeTier, selectedPet.idx, l)}
                      className={`flex-1 py-2 rounded-lg border-2 font-black text-sm transition-all hover:scale-105 ${
                        selLvl === l
                          ? "border-yellow-400 bg-yellow-500/20 text-yellow-300"
                          : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30"
                      }`}
                    >
                      {"★".repeat(l)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statlar */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">İstatistikler</div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-red-400 uppercase tracking-widest">⚔️ ATK</div>
                    <div className="text-2xl font-black text-red-300">{selPet.atk + (selLvl - 1)}</div>
                  </div>
                  <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-green-400 uppercase tracking-widest">🛡️ HP</div>
                    <div className="text-2xl font-black text-green-300">{selPet.hp + (selLvl - 1)}</div>
                  </div>
                  <div className="flex-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-yellow-400 uppercase tracking-widest">💰</div>
                    <div className="text-2xl font-black text-yellow-300">{selPet.cost}</div>
                  </div>
                </div>
              </div>

              {/* Yetenek */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Yetenek</div>
                {selPet.ability === "none" ? (
                  <div className="text-gray-500 text-sm italic">Yetenek yok</div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{ABILITY_ICONS[selPet.ability] || "⚡"}</span>
                      <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {selPet.ability}
                      </span>
                    </div>
                    <div className="text-sm text-gray-200 leading-relaxed bg-black/30 rounded-lg p-2 border border-white/5">
                      {getDesc({ ...selPet, lvl: selLvl }, selLvl)}
                    </div>
                  </>
                )}
              </div>

              {/* Seviye karşılaştırması */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Tüm Seviyeler</div>
                <div className="flex flex-col gap-1.5">
                  {[1, 2, 3].map((l) => (
                    <div
                      key={l}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-all ${
                        selLvl === l ? "bg-yellow-500/10 border border-yellow-500/20" : "opacity-50"
                      }`}
                    >
                      <span className="text-yellow-400 w-8 font-black">{"★".repeat(l)}</span>
                      <span className="text-red-300 font-bold">{selPet.atk + (l - 1)}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-green-300 font-bold">{selPet.hp + (l - 1)}</span>
                      <span className="text-gray-400 flex-1 text-right truncate">{getDesc({ ...selPet, lvl: l }, l)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
              <span className="text-5xl opacity-30">👆</span>
              <div className="text-gray-500 text-sm">Detay görmek için bir hayvana tıkla</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
