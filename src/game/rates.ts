// Live earning rates: what actually came in over the last few seconds of game time, per currency.
// Goodwill and Equity arrive in lumps after fights, so they use a 60-second window and may display as /m.
import { RATE_WINDOW } from './knobs';
import type { GameState } from './state';

export type RateKey = 'cash0' | 'cash1' | 'goodwill' | 'equity' | 'tickets';
export const rateWindow = (key: RateKey) => (key === 'goodwill' || key === 'equity' ? 60 : RATE_WINDOW);
const MAX = 61;
const books = new Map<RateKey, { sec: number[]; amt: number[] }>();
export const lumps = new Map<RateKey, { n: number; at: number }>();
const unitHeld = new Map<RateKey, 's' | 'm'>();

export function credit(s: GameState, key: RateKey, n: number, lump = false) {
  if (!(n > 0)) return;
  const sec = Math.floor(s.totalTime);
  const N = rateWindow(key) + 1;
  let b = books.get(key);
  if (!b) books.set(key, (b = { sec: Array(MAX).fill(-1), amt: Array(MAX).fill(0) }));
  const i = sec % N;
  if (b.sec[i] !== sec) (b.sec[i] = sec), (b.amt[i] = 0);
  b.amt[i] += n;
  if (lump) lumps.set(key, { n, at: s.totalTime });
}

export function rate(s: GameState, key: RateKey): number {
  const b = books.get(key);
  if (!b) return 0;
  const win = rateWindow(key);
  const now = Math.floor(s.totalTime);
  let sum = 0;
  const N = win + 1;
  for (let i = 0; i < N; i++) if (b.sec[i] > now - win && b.sec[i] <= now) sum += b.amt[i];
  return sum / Math.max(1, Math.min(win - 1 + (s.totalTime - now), s.totalTime));
}

// /m when under 1/s, /s at or above 1.5/s, hold in the band so the label doesn't flicker.
export function rateLabel(s: GameState, key: RateKey): { n: number; unit: 's' | 'm' } {
  const rps = rate(s, key);
  let u = unitHeld.get(key) ?? (rps >= 1.5 ? 's' : 'm');
  if (rps >= 1.5) u = 's';
  else if (rps < 1) u = 'm';
  unitHeld.set(key, u);
  return { n: u === 'm' ? rps * 60 : rps, unit: u };
}
