// ─── Debug / Loglama ─────────────────────────────────────────────────────────
// Production build'de hata loglaması kapalı; geliştirme ortamında açık.
const DEBUG = process.env.NODE_ENV !== "production";

export const logError = (error, context) => {
  if (DEBUG) {
    console.error(`❌ HATA [${context}]:`, error);
    console.trace();
  }
};

// ─── Güvenli tip yardımcıları ────────────────────────────────────────────────
export const safeNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null || isNaN(value)) return defaultValue;
  return value;
};

export const safeClamp = (value, min = 0, max = 100) => {
  const num = safeNumber(value);
  return Math.min(Math.max(num, min), max);
};

// ─── İstatistik sistemi ──────────────────────────────────────────────────────
export const loadStats = (userId) => {
  try {
    const key = "oyunStats_" + (userId || "guest");
    const s = localStorage.getItem(key);
    const parsed = s ? JSON.parse(s) : null;
    return {
      totalGames:   parsed?.totalGames  || 0,
      totalWins:    parsed?.totalWins   || 0,
      bestTurn:     parsed?.bestTurn    || 0,
      bestWins:     parsed?.bestWins    || 0,
      achievements: [], // achievements artık yalnızca Firebase'den geliyor
    };
  } catch {
    return { totalGames: 0, totalWins: 0, bestTurn: 0, bestWins: 0, achievements: [] };
  }
};

export const saveStats = async (s, userId) => {
  // 1. Önce localStorage'a yaz (anında, senkron)
  try {
    const key = "oyunStats_" + (userId || "guest");
    localStorage.setItem(key, JSON.stringify(s));
  } catch (err) {
    logError(err, "saveStats:localStorage");
  }

  // 2. Giriş yapmış kullanıcı için achievements'ı Firebase'e yaz
  if (!userId || !s.achievements) return;
  try {
    const { db }       = await import("../firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(
      doc(db, "user_profiles", userId),
      { achievements: s.achievements },
      { merge: true }
    );
  } catch (err) {
    logError(err, "saveStats:firebase");
  }
};

// ─── Font boyutu yardımcısı (Card.jsx dahil her yerde import edilmeli) ───────
export const getStatFontSize = (value, isCompact) => {
  const len = String(value).length;
  if (len >= 3) return isCompact ? "13px" : "15px";
  if (len === 2) return isCompact ? "15px" : "18px";
  return isCompact ? "18px" : "22px";
};

// ─── XP & Rank sistemi ───────────────────────────────────────────────────────
export const RANKS = [
  { name: "Çaylak", icon: "🌱", min: 0,     max: 200,      color: "#a0a0a0" },
  { name: "Bronz",  icon: "🥉", min: 200,   max: 500,      color: "#cd7f32" },
  { name: "Gümüş",  icon: "🥈", min: 500,   max: 1000,     color: "#c0c0c0" },
  { name: "Altın",  icon: "🥇", min: 1000,  max: 2000,     color: "#ffd700" },
  { name: "Platin", icon: "💎", min: 2000,  max: 4000,     color: "#b9f2ff" },
  { name: "Elmas",  icon: "💠", min: 4000,  max: 7000,     color: "#00cfff" },
  { name: "Usta",   icon: "⚡", min: 7000,  max: 10000,    color: "#ff9f43" },
  { name: "Efsane", icon: "👑", min: 10000, max: Infinity, color: "#ff6b6b" },
];

export const getRank = (xp) => RANKS.find((r) => xp >= r.min && xp < r.max) || RANKS[0];

export const calcArenaXP = ({ won, turn, isNewBestTurn }) => {
  let xp = 2;               // tura katılım
  if (won)           xp += 5;  // turu kazanmak
  else               xp -= 2;  // turu kaybetmek
  if (isNewBestTurn) xp += 50; // rekor kırma bonusu
  return Math.max(0, xp);      // negatife düşmesin
};

// ─── Koleksiyon sistemi ──────────────────────────────────────────────────────
export const loadCollection = (userId) => {
  try {
    const key = "oyunKoleksiyon_" + (userId || "guest");
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
};

export const saveCollection = async (data, userId) => {
  // 1. localStorage
  try {
    const key = "oyunKoleksiyon_" + (userId || "guest");
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    logError(err, "saveCollection:localStorage");
  }

  // 2. Firebase
  if (!userId) return;
  try {
    const { db }          = await import("../firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(
      doc(db, "user_profiles", userId),
      { collection: data },
      { merge: true }
    );
  } catch (err) {
    logError(err, "saveCollection:firebase");
  }
};

export const getDefaultAnimalData = () => ({
  used:     0,     // Kaç kez kullanıldı
  wins:     0,     // Kaç galibiyet kazandı
  maxLvl:   0,     // En yüksek seviye
  unlocked: false, // 3. seviyeye çıkarıldı mı
  task1:    false, // 3 kez kullan
  task2:    false, // 5 galibiyet kazan
  task3:    false, // 3. seviyeye çıkar
});

// ─── Günlük / Haftalık Görev Sistemi ─────────────────────────────────────────
export const DAILY_TASKS_FIXED = [
  { id: "daily_battles", label: "Bugün 3 savaşa gir",       target: 3, reward: 30, type: "battles" },
  { id: "daily_wins",    label: "Bugün 3 galibiyet kazan",   target: 3, reward: 50, type: "wins"    },
];

export const DAILY_TASKS_RANDOM = [
  { id: "daily_arena",    label: "Arena'da 2 savaş kazan",            target: 2,  reward: 40, type: "arena_wins"   },
  { id: "daily_tier1",   label: "Kademe 1 hayvanla 3 savaş kazan",   target: 3,  reward: 40, type: "tier1_wins"   },
  { id: "daily_lvl2",    label: "Bir hayvanı 2. seviyeye çıkar",      target: 1,  reward: 40, type: "lvl2"         },
  { id: "daily_gold",    label: "Toplam 30 altın harca",              target: 30, reward: 40, type: "gold_spent"   },
  { id: "daily_comeback",label: "1 canla savaş kazan",                target: 1,  reward: 40, type: "comeback"     },
];

export const WEEKLY_TASKS = [
  { id: "weekly_turn",    label: "Bu hafta Arena'da tur 10'a ulaş",  target: 1, reward: 150, type: "reach_turn10"    },
  { id: "weekly_animals", label: "Bu hafta 5 farklı hayvan kullan",  target: 5, reward: 100, type: "unique_animals"  },
];

export const loadTasks = (userId) => {
  try {
    const key = "oyunGorevler_" + (userId || "guest");
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

export const saveTasks = (data, userId) => {
  try {
    const key = "oyunGorevler_" + (userId || "guest");
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    logError(err, "saveTasks");
  }
};

export const getWeekStart = () => {
  const now  = new Date();
  const day  = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toDateString();
};

export const getTodayString = () => new Date().toDateString();

export const initTasks = (userId) => {
  const saved     = loadTasks(userId);
  const today     = getTodayString();
  const weekStart = getWeekStart();

  // Rastgele günlük görev: seed olarak tarihi kullan (her gün aynı görev çıkar)
  const seed       = today.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const randomTask = DAILY_TASKS_RANDOM[seed % DAILY_TASKS_RANDOM.length];

  const freshDaily = {
    date: today,
    tasks: [
      ...DAILY_TASKS_FIXED.map((t) => ({ ...t, progress: 0, done: false })),
      { ...randomTask, progress: 0, done: false },
    ],
  };

  const freshWeekly = {
    weekStart,
    tasks: WEEKLY_TASKS.map((t) => ({ ...t, progress: 0, done: false })),
  };

  if (!saved) {
    const data = { daily: freshDaily, weekly: freshWeekly };
    saveTasks(data, userId);
    return data;
  }

  if (saved.daily?.date !== today)           saved.daily  = freshDaily;
  if (saved.weekly?.weekStart !== weekStart) saved.weekly = freshWeekly;

  saveTasks(saved, userId);
  return saved;
};

// ─── Geri bildirim ───────────────────────────────────────────────────────────
export const saveFeedback = async (data, userId) => {
  try {
    const { db }                          = await import("../firebase");
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    await addDoc(collection(db, "feedback"), {
      userId:    userId || "guest",
      category:  data.category,
      message:   data.message,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    logError(err, "saveFeedback");
  }
};
