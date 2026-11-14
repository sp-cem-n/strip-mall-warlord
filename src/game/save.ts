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

// 'old' = a save from before v0.5. The loop changed too much to carry it over.
export function loadGame(): GameState | 'old' | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as GameState;
    if (s?.version === SAVE_VERSION && Array.isArray(s.crews)) return s;
    return 'old';
  } catch {
    return 'old';
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
