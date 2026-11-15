// Live earning rates: what actually came in over the last few seconds of game time, per currency.
// Not saved. Rent, wins, walk-ins and the game rooms all credit through here, so the +/s on the top bar moves when you play.
import { RATE_WINDOW } from './knobs';
import type { GameState } from './state';

export type RateKey = 'cash0' | 'cash1' | 'goodwill' | 'equity' | 'tickets';
const N = RATE_WINDOW + 1;
const books = new Map<RateKey, { sec: number[]; amt: number[] }>();
export const lumps = new Map<RateKey, { n: number; at: number }>(); // the last big payout, for the pop on the tenant

export function credit(s: GameState, key: RateKey, n: number, lump = false) {
  if (!(n > 0)) return;
  const sec = Math.floor(s.totalTime);
  let b = books.get(key);
  if (!b) books.set(key, (b = { sec: Array(N).fill(-1), amt: Array(N).fill(0) }));
  const i = sec % N;
  if (b.sec[i] !== sec) (b.sec[i] = sec), (b.amt[i] = 0);
  b.amt[i] += n;
  if (lump) lumps.set(key, { n, at: s.totalTime });
}

// Per second over the last RATE_WINDOW seconds (the current, partial second counts for what it has so far).
export function rate(s: GameState, key: RateKey): number {
  const b = books.get(key);
  if (!b) return 0;
  const now = Math.floor(s.totalTime);
  let sum = 0;
  for (let i = 0; i < N; i++) if (b.sec[i] > now - RATE_WINDOW && b.sec[i] <= now) sum += b.amt[i];
  return sum / Math.max(1, Math.min(RATE_WINDOW - 1 + (s.totalTime - now), s.totalTime));
}
