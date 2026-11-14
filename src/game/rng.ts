import type { GameState } from './state';

// mulberry32 over state.seed so runs are reproducible and saves resume the stream.
export function rand(s: GameState): number {
  let t = (s.seed = (s.seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function pick<T>(s: GameState, list: readonly T[]): T {
  return list[Math.floor(rand(s) * list.length)];
}
