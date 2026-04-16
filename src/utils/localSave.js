const SAVE_KEY = "petgame_save";

// Basit checksum — manuel localStorage düzenlemesini engeller
const makeHash = (turn, gold, lives) =>
  btoa(`${turn}|${gold}|${lives}|petgame`).slice(0, 12);

export function saveGameState(state) {
  try {
    const data = {
      turn: state.turn,
      gold: state.gold,
      lives: state.lives,
      wins: state.wins,
      team: state.team,
      shop: state.shop ?? [],
      phase: state.phase,
      gameMode: state.gameMode,
      difficultyLevel: state.difficultyLevel,
      savedAt: Date.now(),
      _h: makeHash(state.turn, state.gold, state.lives),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Save hatası:", e);
  }
}

export function loadGameState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const { _h, ...rest } = parsed;
    if (_h) {
      const expected = makeHash(rest.turn, rest.gold, rest.lives);
      if (_h !== expected) {
        localStorage.removeItem(SAVE_KEY);
        return null;
      }
    }
    return rest;
  } catch (e) {
    return null;
  }
}

export function clearGameState() {
  localStorage.removeItem(SAVE_KEY);
}

export function hasSavedGame() {
  return !!localStorage.getItem(SAVE_KEY);
}

// ─── Arena kilidi ────────────────────────────────────────────────────────────
const ARENA_KEY = "petgame_arena_unlocked";

export function isArenaUnlocked() {
  return localStorage.getItem(ARENA_KEY) === "1";
}

export function unlockArena() {
  localStorage.setItem(ARENA_KEY, "1");
}

// ─── Arena intro — ilk 3 girişte göster, sonra gösterme ─────────────────────
// Eski tek-seferlik key'i de kontrol ederek geriye dönük uyumluluk sağlanır.
const ARENA_INTRO_COUNT_KEY = "petgame_arena_intro_count_v2";
const ARENA_INTRO_MAX = 3;

export function shouldShowArenaIntro() {
  const count = parseInt(localStorage.getItem(ARENA_INTRO_COUNT_KEY) || "0", 10);
  return count < ARENA_INTRO_MAX;
}

export function incrementArenaIntroCount() {
  const count = parseInt(localStorage.getItem(ARENA_INTRO_COUNT_KEY) || "0", 10);
  localStorage.setItem(ARENA_INTRO_COUNT_KEY, String(count + 1));
}
