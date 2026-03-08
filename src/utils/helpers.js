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
