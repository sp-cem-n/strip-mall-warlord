import { SAVE_VERSION } from './economy';
import type { GameState } from './state';
import { newRoom } from './room';

let KEY = 'smw.save';
// ?test=1 plays on its own save, so testing never touches the real plaza
export const useTestSave = () => void (KEY = 'smw.test');

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

// Fields added since the save was written get their defaults; a battle from before walk-ins is dropped.
function fillIn(s: GameState): GameState {
  s.room = { ...newRoom(), ...s.room };
  if (typeof s.room.shelf === 'number') s.room.shelf = [s.room.shelf, 10];
  s.room.attracting ??= null;
  s.consultants ??= [[], []];
  s.landmarks ??= [];
  s.blitz ??= {};
  for (const c of s.crews) {
    c.tries ??= 0;
    c.wounds ??= {};
    c.smoke ??= 0;
    c.queueEnter ??= -1;
    c.deck ??= c.at;
    c.parked ??= false;
    c.rec ??= {};
    c.lastEnd ??= -1;
    delete (c as { streak?: number }).streak;
    delete (c as { stance?: string }).stance;
    if (c.battle && c.battle.enter === undefined) c.battle = null;
  }
  return s;
}

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
    if (s?.version === SAVE_VERSION && Array.isArray(s.crews)) return fillIn(s);
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

// A compact, copy-pasteable lease code. Confirm before a load overwrites the current run.
const PREFIX = 'SMW1.';
export function exportCode(s: GameState): string {
  const json = JSON.stringify(s);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return PREFIX + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function importCode(raw: string): GameState | string {
  const t = raw.trim().replace(/\s+/g, '');
  if (!t.startsWith(PREFIX)) return 'That does not look like a lease code.';
  try {
    const b64 = t.slice(PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const bin = atob(b64 + pad);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const s = JSON.parse(new TextDecoder().decode(bytes)) as GameState;
    if (s?.version !== SAVE_VERSION || !Array.isArray(s.crews)) return 'That lease is from another version.';
    return fillIn(s);
  } catch {
    return 'Could not read that lease code.';
  }
}
