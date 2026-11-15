// Late-game cash sinks: consultants, landmarks, retainers, marketing blitzes.
// The official balance bot does not buy these, so Route 9 pacing stays on the fights.
import { FIGHTS, REGIONS, SHOP_LIST, STEP, type RegionId } from './defs';
import { lotsTaken, log, rentPerSec, renovate, renovateCost, spend } from './economy';
import type { GameState } from './state';

export const CONSULT_MIN = 20; // minutes of rent to hire
export const AUTORENO_MIN = 45;

export function consultCost(s: GameState, r: RegionId) {
  return Math.max(100, Math.round(rentPerSec(s, r) * CONSULT_MIN * 60));
}
export function autoRenoCost(s: GameState, r: RegionId) {
  return Math.max(100, Math.round(rentPerSec(s, r) * AUTORENO_MIN * 60));
}
export const hasConsultant = (s: GameState, r: RegionId, z: number) => (s.consultants[r] ?? []).includes(z);
export const hasAutoReno = (s: GameState, r: RegionId, z: number) => (s.autoReno[r] ?? []).includes(z);
// A lot's consultant appears once the next lot is captured (Parking Lot after Big-Box falls).
export const consultOpen = (s: GameState, r: RegionId, z: number) => lotsTaken(s, r) > z && !hasConsultant(s, r, z);

export function hireConsultant(s: GameState, r: RegionId, z: number): string | null {
  if (!consultOpen(s, r, z)) return 'Not available';
  const err = spend(s, r, 'cash', consultCost(s, r));
  if (err) return err;
  s.consultants[r] = [...(s.consultants[r] ?? []), z];
  log(s, r, `Hired a consultant for ${REGIONS[r].lots[z].name}. They'll keep the lights on.`, 'info');
  return null;
}
export function buyAutoReno(s: GameState, r: RegionId, z: number): string | null {
  if (!hasConsultant(s, r, z) || hasAutoReno(s, r, z)) return 'Not available';
  const err = spend(s, r, 'cash', autoRenoCost(s, r));
  if (err) return err;
  s.autoReno[r] = [...(s.autoReno[r] ?? []), z];
  log(s, r, `The ${REGIONS[r].lots[z].name} consultant will renovate when the till allows.`, 'info');
  return null;
}

export const LANDMARKS = [
  { id: 'billboard', name: 'Billboard', after: 1, minutes: 30, buff: 0.02, does: '+2% Route 9 rent. A faded 1991 ad over the lot.' },
  { id: 'tower', name: 'Water tower', after: 2, minutes: 50, buff: 0.03, does: '+3% crew HP on Route 9. PINEWOOD, in rusted letters.' },
  { id: 'pylon', name: 'Neon pylon', after: 4, minutes: 90, buff: 0.04, does: '+4% Route 9 stats. A second, quieter sign by the entrance.' },
] as const;
export type LandmarkId = (typeof LANDMARKS)[number]['id'];

export function landmarkCost(s: GameState, r: RegionId, id: LandmarkId) {
  const d = LANDMARKS.find((x) => x.id === id)!;
  return Math.max(100, Math.round(rentPerSec(s, r) * d.minutes * 60));
}
export const hasLandmark = (s: GameState, id: LandmarkId) => s.landmarks.includes(id);
export const landmarkOpen = (s: GameState, id: LandmarkId) => lotsTaken(s, 0) >= LANDMARKS.find((x) => x.id === id)!.after && !hasLandmark(s, id);

export function buyLandmark(s: GameState, id: LandmarkId): string | null {
  if (!landmarkOpen(s, id)) return 'Not available';
  const d = LANDMARKS.find((x) => x.id === id)!;
  const err = spend(s, 0, 'cash', landmarkCost(s, 0, id));
  if (err) return err;
  s.landmarks = [...s.landmarks, id];
  log(s, 0, `Bought the ${d.name.toLowerCase()}. ${d.does}`, 'capture');
  return null;
}
export const landmarkRent = (s: GameState) => LANDMARKS.reduce((a, d) => a + (hasLandmark(s, d.id) && d.id === 'billboard' ? d.buff : 0), 0);
export const landmarkHp = (s: GameState) => (hasLandmark(s, 'tower') ? 0.03 : 0);
export const landmarkStat = (s: GameState) => (hasLandmark(s, 'pylon') ? 0.04 : 0);

export const BLITZ = [
  { id: 'radio', name: 'Radio spot', after: 1, minutes: 15, does: 'A small, permanent bump to walk-ins and rent. Stacks.' },
  { id: 'paper', name: 'Newspaper insert', after: 2, minutes: 30, does: 'A bigger bump. Stacks, and each reprint costs more.' },
  { id: 'banner', name: 'Grand-opening banner', after: 3, minutes: 50, does: 'The big one. Stacks.' },
] as const;
export type BlitzId = (typeof BLITZ)[number]['id'];
export const blitzLevel = (s: GameState, id: BlitzId) => s.blitz[id] ?? 0;
export const blitzOpen = (s: GameState, id: BlitzId) => lotsTaken(s, 0) >= BLITZ.find((x) => x.id === id)!.after;
export function blitzCost(s: GameState, r: RegionId, id: BlitzId) {
  const d = BLITZ.find((x) => x.id === id)!;
  const lv = blitzLevel(s, id);
  return Math.max(100, Math.round(rentPerSec(s, r) * d.minutes * 60 * 1.5 ** lv));
}
export function buyBlitz(s: GameState, id: BlitzId): string | null {
  if (!blitzOpen(s, id)) return 'Not available';
  const err = spend(s, 0, 'cash', blitzCost(s, 0, id));
  if (err) return err;
  s.blitz[id] = blitzLevel(s, id) + 1;
  log(s, 0, `${BLITZ.find((x) => x.id === id)!.name}, run ${s.blitz[id]}.`, 'info');
  return null;
}
export const blitzRent = (s: GameState) => 0.015 * blitzLevel(s, 'radio') + 0.02 * blitzLevel(s, 'paper') + 0.03 * blitzLevel(s, 'banner');
export const blitzWalkin = (s: GameState) => Math.max(0, 1 - 0.04 * (blitzLevel(s, 'radio') + blitzLevel(s, 'paper') + blitzLevel(s, 'banner')));

export const RETAIN_MIN = 20;
export function retainCost(s: GameState, r: RegionId) {
  return Math.max(100, Math.round(rentPerSec(s, r) * RETAIN_MIN * 60 * 1.5 ** s.retainers));
}
export const retainOpen = (s: GameState, r: RegionId) => lotsTaken(s, r) >= 3; // around Sunrise Office Park
export function buyRetainer(s: GameState, r: RegionId): string | null {
  if (!retainOpen(s, r)) return 'Not available';
  const err = spend(s, r, 'cash', retainCost(s, r));
  if (err) return err;
  s.retainers++;
  log(s, r, `Signed a crew contract (${s.retainers}). Veterans hold a little harder.`, 'info');
  return null;
}
export const retainerStat = (s: GameState) => 0.02 * s.retainers;

// Auto-renovate shops on lots the consultant is paid to handle, cheapest first, if the till is comfortable.
export function tickSinks(s: GameState) {
  if (Math.floor(s.totalTime / 10) === Math.floor((s.totalTime - STEP) / 10)) return;
  for (const r of s.bypass ? ([0, 1] as const) : ([0] as const)) {
    let best: { r: RegionId; id: string; cost: number } | null = null;
    for (const z of s.autoReno[r] ?? []) {
      const shops = SHOP_LIST.filter((x) => x.region === r && x.zone === z && s.crews[r].shops[x.id]);
      for (const sh of shops) {
        const cost = renovateCost(sh.id, s.crews[r].shops[sh.id]!);
        if (!best || cost < best.cost) best = { r, id: sh.id, cost };
      }
    }
    if (!best || s.crews[best.r].cash < best.cost * 2) continue;
    renovate(s, best.id);
  }
}

export const sinkRentBonus = (s: GameState) => landmarkRent(s) + blitzRent(s);
export const sinkStatBonus = (s: GameState) => landmarkStat(s) + retainerStat(s);
export const paveAsphalt = () => FIGHTS[0].length + 10 * REGIONS[0].lots.length;
