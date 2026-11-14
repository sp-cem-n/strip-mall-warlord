import { SAVE_VERSION, noBuffs } from './economy';
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
    const s = JSON.parse(raw) as GameState & { boost?: number };
    if (!s || typeof s !== 'object' || !Array.isArray(s.slots) || typeof s.cash !== 'number') return null;
    if (s.version === 2) {
      // v0.3 -> v0.4: one generic walk-in became per-shop walk-ins with their own effects
      s.buffs = noBuffs();
      s.find = null;
      delete s.boost;
      s.version = SAVE_VERSION;
    }
    if (s.version !== SAVE_VERSION || !s.buffs) return null;
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
