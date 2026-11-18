// Plaza buys: consultants, landmarks and ad blitzes. Prices are minutes of that road's rent; the buffs live in economy.ts.
// The official balance bot does not buy these, so Route 9 pacing stays on the fights.
import { REGIONS, SHOP_LIST, STEP, type RegionId } from './defs';
import { lotsTaken, log, rentPerSec, renovate, renovateCost, spend } from './economy';
import type { GameState } from './state';

const rentMinutes = (s: GameState, r: RegionId, minutes: number) => Math.max(100, Math.round(rentPerSec(s, r) * minutes * 60));

// A consultant renovates one captured lot's shops on their own once the night is over: one hire per lot.
export const CONSULT_MIN = 45;
export const CONSULT_DOES = 'Renovates a shop on this lot, cheapest first, whenever the till could pay for it twice.';
export const consultCost = (s: GameState, r: RegionId) => rentMinutes(s, r, CONSULT_MIN);
export const hasConsultant = (s: GameState, r: RegionId, z: number) => s.consultants[r].includes(z);
export const consultOpen = (s: GameState, r: RegionId, z: number) => s.bypass && lotsTaken(s, r) > z && !hasConsultant(s, r, z);

export function hireConsultant(s: GameState, r: RegionId, z: number): string | null {
  if (!consultOpen(s, r, z)) return 'Not available';
  const err = spend(s, r, 'cash', consultCost(s, r));
  if (err) return err;
  s.consultants[r] = [...s.consultants[r], z];
  log(s, r, `Hired a consultant for ${REGIONS[r].lots[z].name}. They renovate when the till allows.`, 'info');
  return null;
}

// Landmarks stack: each copy adds half the first one's buff and costs half again as much.
export const LANDMARKS = [
  { id: 'billboard', name: 'Billboard', after: 1, minutes: 30, buff: 0.02, does: 'Route 9 rent', art: 'A faded 1991 ad over the lot.' },
  { id: 'tower', name: 'Water tower', after: 2, minutes: 50, buff: 0.03, does: 'crew HP on Route 9', art: 'PINEWOOD, in rusted letters.' },
  { id: 'pylon', name: 'Neon pylon', after: 4, minutes: 90, buff: 0.04, does: 'Route 9 crew stats', art: 'A second, quieter sign by the entrance.' },
] as const;
export type LandmarkId = (typeof LANDMARKS)[number]['id'];

export const landmarkCount = (s: GameState, id: LandmarkId) => s.landmarks.filter((x) => x === id).length;
export const landmarkBuff = (s: GameState, id: LandmarkId) => {
  const n = landmarkCount(s, id);
  return n ? LANDMARKS.find((d) => d.id === id)!.buff * (1 + (n - 1) / 2) : 0;
};
export const hasLandmark = (s: GameState, id: LandmarkId) => landmarkCount(s, id) > 0;
export const landmarkOpen = (s: GameState, id: LandmarkId) => lotsTaken(s, 0) >= LANDMARKS.find((x) => x.id === id)!.after;
export const landmarkCost = (s: GameState, id: LandmarkId) => Math.round(rentMinutes(s, 0, LANDMARKS.find((x) => x.id === id)!.minutes) * 1.5 ** landmarkCount(s, id));

export function buyLandmark(s: GameState, id: LandmarkId): string | null {
  if (!landmarkOpen(s, id)) return 'Not available';
  const err = spend(s, 0, 'cash', landmarkCost(s, id));
  if (err) return err;
  s.landmarks = [...s.landmarks, id];
  const d = LANDMARKS.find((x) => x.id === id)!;
  log(s, 0, `Put up a ${d.name.toLowerCase()} (${landmarkCount(s, id)}). +${Math.round(landmarkBuff(s, id) * 1000) / 10}% ${d.does}.`, 'capture');
  return null;
}

// Ad blitzes: each run is a permanent bump to Route 9 rent and walk-ins, and the reprint costs half again as much.
export const BLITZ = [
  { id: 'radio', name: 'Radio spot', after: 1, minutes: 15, rent: 0.015 },
  { id: 'paper', name: 'Newspaper insert', after: 2, minutes: 30, rent: 0.02 },
  { id: 'banner', name: 'Grand-opening banner', after: 3, minutes: 50, rent: 0.03 },
] as const;
export const BLITZ_WALKIN = 0.04; // each run brings walk-ins this much sooner
export type BlitzId = (typeof BLITZ)[number]['id'];
export const blitzLevel = (s: GameState, id: BlitzId) => s.blitz[id] ?? 0;
export const blitzOpen = (s: GameState, id: BlitzId) => lotsTaken(s, 0) >= BLITZ.find((x) => x.id === id)!.after;
export const blitzCost = (s: GameState, id: BlitzId) => Math.round(rentMinutes(s, 0, BLITZ.find((x) => x.id === id)!.minutes) * 1.5 ** blitzLevel(s, id));

export function buyBlitz(s: GameState, id: BlitzId): string | null {
  if (!blitzOpen(s, id)) return 'Not available';
  const err = spend(s, 0, 'cash', blitzCost(s, id));
  if (err) return err;
  s.blitz[id] = blitzLevel(s, id) + 1;
  log(s, 0, `${BLITZ.find((x) => x.id === id)!.name}, run ${s.blitz[id]}.`, 'info');
  return null;
}

// Consultants at work: every 10 seconds, the cheapest renovation on their lots, if the till could pay for it twice.
export function tickSinks(s: GameState) {
  if (Math.floor(s.totalTime / 10) === Math.floor((s.totalTime - STEP) / 10)) return;
  for (const r of s.bypass ? ([0, 1] as const) : ([0] as const)) {
    let best: { id: string; cost: number } | null = null;
    for (const sh of SHOP_LIST) {
      const lv = s.crews[r].shops[sh.id];
      if (sh.region !== r || !lv || !hasConsultant(s, r, sh.zone)) continue;
      const cost = renovateCost(sh.id, lv);
      if (!best || cost < best.cost) best = { id: sh.id, cost };
    }
    if (best && s.crews[r].cash >= best.cost * 2) renovate(s, best.id);
  }
}
