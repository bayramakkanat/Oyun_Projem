// Hata yakalama ve loglama
const DEBUG = true;
export const logError = (error, context) => {
  if (DEBUG) {
    console.error(`❌ HATA [${context}]:`, error);
    console.trace();
  }
};

// Güvenli sayı kontrolü
export const safeNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null || isNaN(value))
    return defaultValue;
  return value;
};

// Güvenli clamp
export const safeClamp = (value, min = 0, max = 100) => {
  const num = safeNumber(value);
  return Math.min(Math.max(num, min), max);
};

export const loadStats = (userId) => {
  try {
    const key = "oyunStats_" + (userId || "guest");
    const s = localStorage.getItem(key);
    return s
      ? JSON.parse(s)
      : {
          totalGames: 0,
          totalWins: 0,
          bestTurn: 0,
          bestWins: 0,
          achievements: [],
        };
  } catch {
    return {
      totalGames: 0,
      totalWins: 0,
      bestTurn: 0,
      bestWins: 0,
      achievements: [],
    };
  }
};

export const saveStats = (s, userId) => {
  try {
    const key = "oyunStats_" + (userId || "guest");
    localStorage.setItem(key, JSON.stringify(s));
  } catch {}
};

export const getStatFontSize = (value, isCompact) => {
  const len = String(value).length;
  if (len >= 3) return isCompact ? "13px" : "15px";
  if (len === 2) return isCompact ? "15px" : "18px";
  return isCompact ? "18px" : "22px";
};
// XP & Rank sistemi
export const RANKS = [
  { name: "Bronz", icon: "🥉", min: 0, max: 500, color: "#cd7f32" },
  { name: "Gümüş", icon: "🥈", min: 500, max: 1500, color: "#c0c0c0" },
  { name: "Altın", icon: "🥇", min: 1500, max: 3000, color: "#ffd700" },
  { name: "Elmas", icon: "💎", min: 3000, max: 6000, color: "#b9f2ff" },
  { name: "Şampiyon", icon: "👑", min: 6000, max: Infinity, color: "#ff6b6b" },
];

export const getRank = (xp) => {
  return RANKS.find((r) => xp >= r.min && xp < r.max) || RANKS[0];
};

export const calcArenaXP = ({ won, turn, isNewBestTurn }) => {
  let xp = 2; // tura katılım
  if (won) xp += 5; // turu kazanmak
  else xp -= 2; // turu kaybetmek
  if (isNewBestTurn) xp += 50; // rekor kırma bonusu
  return Math.max(0, xp); // negatife düşmesin
};
// Koleksiyon sistemi
export const loadCollection = (userId) => {
  try {
    const key = "oyunKoleksiyon_" + (userId || "guest");
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
};

export const saveCollection = (data, userId) => {
  try {
    const key = "oyunKoleksiyon_" + (userId || "guest");
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

export const getDefaultAnimalData = () => ({
  used: 0,        // Kaç kez kullanıldı
  wins: 0,        // Kaç galibiyet kazandı
  maxLvl: 0,      // En yüksek seviye
  unlocked: false, // 3. seviyeye çıkarıldı mı
  task1: false,   // 3 kez kullan
  task2: false,   // 5 galibiyet kazan
  task3: false,   // 3. seviyeye çıkar
});