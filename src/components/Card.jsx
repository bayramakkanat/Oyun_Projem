import { useState, useEffect } from "react";
import { TBG, TBD, ABILITY_ICONS } from "../data/gameData";
import { getDesc as getDescUtil } from "../utils/getDesc";

const getStatFontSize = (value, isCompact) => {
  const len = String(value).length;
  if (len >= 3) return isCompact ? "13px" : "15px";
  if (len === 2) return isCompact ? "15px" : "18px";
  return isCompact ? "18px" : "22px";
};

function Card({
  a,
  compact,
  tall,
  battle,
  selected,
  onClick,
  onSell,
  anim,
  showName,
  mirror,
  getDesc,
  shop,
  team,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  useEffect(() => {
    if (!compact && !battle && !anim) {
      setTimeout(() => setIsFlipped(true), Math.random() * 400);
    } else if (battle) {
      setIsFlipped(true);
    }
  }, [compact, battle, anim]);

  const close = a.exp >= 1 && a.lvl < 3;
  const st =
    a.lvl === 3
      ? "★★★"
      : a.lvl === 2
      ? a.exp >= 1
        ? "★★½"
        : "★★"
      : a.exp >= 1
      ? "★½"
      : "★";
  const sp = Math.ceil(a.lvl + (a.exp >= 1 ? 0.5 : 0));

  let animStyle = {};
  if (anim === "damage")
    animStyle = {
      animation: "shake 0.5s",
      background: "linear-gradient(135deg, rgba(239,68,68,0.2), transparent)",
    };

  if (anim === "attackLeft")
    animStyle = { animation: "attackLeft 0.8s ease-in-out" };
  if (anim === "attackRight")
    animStyle = { animation: "attackRight 0.8s ease-in-out" };
  if (anim === "deathLeft")
    animStyle = { animation: "fadeOutLeft 0.5s ease-out forwards" };
  if (anim === "deathRight")
    animStyle = { animation: "fadeOutRight 0.5s ease-out forwards" };
  if (anim === "slideInLeft")
    animStyle = { animation: "slideInLeft 0.4s ease-out" };
  if (anim === "slideInRight")
    animStyle = { animation: "slideInRight 0.4s ease-out" };

  const displayHp = battle
    ? Math.max(0, a.curHp ?? 0)
    : Math.max(0, a.curHp !== undefined ? a.curHp : a.hp);

  const size = compact ? 38 : 44;

  const SwordStat = ({ value }) => (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src="https://raw.githack.com/googlefonts/noto-emoji/main/svg/emoji_u2694.svg"
       width={size + 4}
  height={size + 4}
        style={{
          position: "absolute",
          opacity: 0.25,
          filter: "brightness(0) invert(1)",
        }}
        alt="atk"
      />
      <span
        style={{
          position: "relative",
          zIndex: 2,
          color: "#ef4444",
          fontSize: getStatFontSize(value, compact),
          fontWeight: "900",
          textShadow: "0 0 8px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.9)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );

  const HeartStat = ({ value }) => (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src="https://raw.githack.com/googlefonts/noto-emoji/main/svg/emoji_u1f6e1.svg"
        width={size}
        height={size}
        style={{
          position: "absolute",
          opacity: 0.25,
          filter: "brightness(0) invert(1)",
        }}
        alt="hp"
      />
      <span
        style={{
          position: "relative",
          zIndex: 2,
          color: "#4ade80",
          fontSize: getStatFontSize(value, compact),
          fontWeight: "900",
          textShadow: "0 0 8px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.9)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div className="relative group">
      {!compact &&
        shop &&
        team &&
        a.lvl < 3 &&
        team.some(
          (t) => t && t.name === a.name && t.tier === a.tier && t.exp >= 1
        ) && (
          <div
            className="absolute top-0 right-0 z-20 text-sm pointer-events-none"
            style={{ animation: "starTwinkle 1.5s ease-in-out infinite" }}
          >
            ⭐
          </div>
        )}
      {!compact && (
        <>
          {a.tripleAttackCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white z-10">
              {a.tripleAttackCount}
            </div>
          )}
        </>
      )}
      <div
        data-pet-id={a.id}
       className={`card-3d tier-${a.tier} level-${a.lvl} ${battle ? "battle-card" : ""} ${
          compact
            ? "w-20 h-28 pt-2 pb-1"
            : tall
            ? "w-28 h-40 pt-3 pb-4"
          : "w-32 h-40 pt-1 pb-1"
      } rounded-xl flex flex-col items-center justify-around ${(battle || a.img) ? "bg-transparent border-0 shadow-none" : `bg-gradient-to-br ${TBG[a.tier]} border-2 ${TBD[a.tier]} backdrop-blur-md shadow-xl`} ${
          battle
            ? ""
            : `${
                selected
  ? ""
  : close && !compact
  ? ""
  : ""
              }`
      } ${
  battle
    ? ""
    : "cursor-pointer transition-all duration-300"
} relative`}
        onClick={onClick}
        style={{
  ...(battle
    ? {}
    : !compact && !isFlipped
    ? { opacity: 0, transform: "rotateY(90deg)" }
    : isFlipped
    ? {}
    : {}),
  ...animStyle
}}
      >
       <div className="flex flex-col items-center gap-0 -mt-1">
         <img
  src={a.img ? `/images/animals/${a.img}` : `https://raw.githack.com/googlefonts/noto-emoji/main/svg/emoji_u${a.name.codePointAt(0).toString(16)}.svg`}
  alt={a.nick}
  className={`pet-glow drop-shadow-2xl object-contain ${
    a.img
     ? compact ? "w-16 h-16" : "w-24 h-24"
      : compact ? "w-12 h-12" : "w-16 h-16"
  }`}
 style={mirror && !a.flip ? { transform: "scaleX(-1)" } : {}}
  onError={(e) => {
    e.target.style.display = "none";
    e.target.nextSibling.style.display = "inline";
  }}
/>
<span
  className={`pet-glow ${
    compact ? "text-2xl" : "text-4xl"
  } drop-shadow-2xl hidden`}
>
  {a.name}
</span>
          {!compact && showName && (
            <span className="text-[10px] text-gray-300 font-semibold -mt-1 text-center px-0.5 leading-tight max-w-[90px]">
              {a.nick}
            </span>
          )}
        </div>
       {!compact && (
  <span className="text-[10px] text-yellow-400 font-black tracking-[0.2em] bg-black/20 px-2 py-0.5 rounded-full border border-yellow-500/20">
    {st}
  </span>
)}
        <div className="flex gap-1 items-center z-20">
          <SwordStat value={a.atk} />
          <HeartStat value={displayHp} />
        </div>
      </div>
      {!compact && a.ability && a.ability !== "none" && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-[9999] w-72">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-2xl border-2 border-purple-500 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
              <span className="text-2xl">{ABILITY_ICONS[a.ability]}</span>
              <div>
                <div className="font-bold text-yellow-300">{a.nick}</div>
                <div className="text-gray-400 text-xs">Kademe {a.tier}</div>
              </div>
            </div>
            <div className="text-gray-200 leading-relaxed">
              {getDesc ? getDesc(a) : getDescUtil(a)}
            </div>
          </div>
          <div className="w-3 h-3 bg-gray-900 border-r-2 border-b-2 border-purple-500 transform rotate-45 mx-auto -mt-1.5"></div>
        </div>
      )}
      {onSell && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onSell();
          }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm text-yellow-300 font-bold cursor-pointer hover:scale-110 transition-transform group/sell"
        >
          <span className="group-hover/sell:hidden">{sp}💰</span>
          <span className="hidden group-hover/sell:inline">SAT</span>
        </span>
      )}
    </div>
  );
}

export default Card;
