// Scripted players for the balance script and the ?advance= debug param.
//   mixed  — plans a crew for the current lot (front line, medic, counters) and rebrands to fit
//   static — fills slots in a fixed rotation and never rebrands
//   dojo   — Dojos everywhere
import { FIGHTERS, SHOPS, SHOP_ORDER, ZONES, type FighterKind, type ShopKind } from './defs';
import { openShop, regionTaken, renovate, renovateCost, unlockedShops } from './economy';
import { asphaltGain, bulldoze, canBulldoze } from './sim';
import type { GameState } from './state';

export type Strategy = 'mixed' | 'static' | 'dojo';
const SHOP_FOR = Object.fromEntries(SHOP_ORDER.map((k) => [SHOPS[k].fighter, k])) as Record<FighterKind, ShopKind>;

function plan(s: GameState, strategy: Strategy): ShopKind[] {
  const n = s.slots.length;
  const open = unlockedShops(s);
  if (strategy === 'dojo') return Array(n).fill('dojo');
  if (strategy === 'static') return s.slots.map((sl, i) => sl.shop ?? open[i % open.length]);
  const zd = ZONES[Math.min(s.zone, ZONES.length - 1)];
  const counters = [...new Set([zd.boss.weak, ...zd.regulars.map((e) => e.weak)])].filter((f) => open.includes(SHOP_FOR[f]));
  const want: ShopKind[] = ['dojo'];
  if (n >= 3) want.push('laundromat');
  for (let i = 0; want.length < n; i++) {
    if (want.length === 4 || want.length === 8) want.push('dojo');
    else want.push(SHOP_FOR[counters[i % counters.length] ?? 'hustler']);
  }
  // put the first counter right after the front line so it's bought early
  if (n >= 3) [want[1], want[2]] = [want[2], want[1]];
  return want;
}

export function botAct(s: GameState, strategy: Strategy = 'mixed', prestige = false): GameState {
  const want = plan(s, strategy);
  // keep storefronts that already match something we want
  const need = [...want];
  const keep = new Set<number>();
  for (const sl of s.slots) {
    const i = sl.shop ? need.indexOf(sl.shop) : -1;
    if (i >= 0) {
      need.splice(i, 1);
      keep.add(sl.id);
    }
  }
  let pending = 0;
  for (const kind of need) {
    const sl = s.slots.filter((x) => !keep.has(x.id)).sort((a, b) => (a.shop ? 1 : 0) - (b.shop ? 1 : 0) || b.level - a.level)[0];
    if (!sl) break;
    if (openShop(s, sl.id, kind) !== null) {
      pending = SHOPS[kind].openCost; // save up for it, in priority order
      break;
    }
    keep.add(sl.id);
  }
  for (let guard = 0; guard < 50; guard++) {
    const sl = s.slots.filter((x) => x.shop).sort((a, b) => a.level - b.level)[0];
    if (!sl || (pending && renovateCost(sl.level) > pending * 0.25) || renovate(s, sl.id)) break;
  }
  const stalled = regionTaken(s) || s.time - s.lastCapture > 480;
  if (prestige && canBulldoze(s) && stalled && asphaltGain(s) >= 8) return bulldoze(s);
  return s;
}

export const describeCrew = (s: GameState) =>
  s.slots
    .filter((x) => x.shop)
    .map((x) => `${FIGHTERS[SHOPS[x.shop!].fighter].name[0]}${x.level}`)
    .join(' ');
