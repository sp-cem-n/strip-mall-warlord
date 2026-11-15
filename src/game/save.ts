import { SAVE_VERSION } from './economy';
import type { GameState } from './state';
import { newRoom } from './room';

const KEY = 'smw.save';

export function saveGame(s: GameState) {
  s.savedAt = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: keep playing */
  }
}

// The version an old save came from: 'v0.5' saves are copied where /v0.5/ reads them, so that plaza is still yours there.
export const old = { from: 'v0.4' };
const ARCHIVE: Record<number, string> = { 4: 'v0.5' };

// 'old' = a save from an earlier loop. The loop changed too much to carry it over.
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
    if (s?.version === SAVE_VERSION && Array.isArray(s.crews)) {
      s.room = { ...newRoom(), ...s.room };
      for (const c of s.crews) {
        // v0.6 -> v0.7: damage carries over, smoke breaks, one tries counter
        c.tries ??= 0;
        c.wounds ??= {};
        c.smoke ??= 0;
        delete (c as { streak?: number }).streak;
        if (c.battle && c.battle.taken === undefined) c.battle = null;
      }
      return s;
    }
    const tag = ARCHIVE[s?.version];
    if (tag) {
      old.from = tag;
      if (!localStorage.getItem(`smw-${tag}:${KEY}`)) localStorage.setItem(`smw-${tag}:${KEY}`, raw);
    }
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
