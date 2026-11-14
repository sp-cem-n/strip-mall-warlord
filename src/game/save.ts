import { SAVE_VERSION } from './economy';
import type { GameState } from './state';

const KEY = 'smw.save';

export function saveGame(s: GameState) {
  s.savedAt = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: keep playing */
  }
}

// Never crash on a bad save: fall back to a new game.
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (!s || s.version !== SAVE_VERSION || !Array.isArray(s.slots) || typeof s.cash !== 'number') return null;
    return s;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
