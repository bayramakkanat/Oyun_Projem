const SAVE_KEY = "petgame_save";

export function saveGameState(state) {
  try {
    const data = {
      turn: state.turn,
      gold: state.gold,
      lives: state.lives,
      wins: state.wins,
      team: state.team,
      shop: state.shop,
      phase: state.phase,
      gameMode: state.gameMode,
      difficultyLevel: state.difficultyLevel,
      savedAt: Date.now(),
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
    return JSON.parse(raw);
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