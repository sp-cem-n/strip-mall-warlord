import {
  ASPHALT_BONUS,
  HEAT_PER_PAYDAY_LEVEL,
  HOME_UNITS,
  INCOME_GROWTH,
  RENOVATE_BASE,
  RENOVATE_GROWTH,
  SHOPS,
  SHOP_ORDER,
  START_CASH,
  START_SHOPS,
  SMOKE_BREAK_AFTER,
  REGROUP_SECONDS,
  WALKIN_SECONDS,
  ZONES,
  type ShopKind,
} from './defs';
import type { GameState, LogLine, Slot } from './state';

export const SAVE_VERSION = 2;
const HOME_LABELS = ['Unit A', 'Unit B', 'Unit C', 'Unit D'];

export function newGame(seed = Date.now() % 2147483647, asphalt = 0, bulldozes = 0, totalTime = 0): GameState {
  const slots: Slot[] = HOME_LABELS.slice(0, HOME_UNITS).map((label, id) => ({ id, label, level: 1, shop: id === 0 ? 'vape' : null }));
  return {
    version: SAVE_VERSION,
    seed,
    time: 0,
    totalTime,
    cash: START_CASH,
    asphalt,
    bulldozes,
    slots,
    zone: 0,
    row: 0,
    battle: null,
    regroup: 2,
    log: [{ t: 0, text: 'Your uncle left you Pinewood Plaza, est. 1991: his vape shop, three empty units, and a paid-up lease.', tone: 'info' }],
    stats: { wins: 0, losses: 0, earned: 0 },
    savedAt: Date.now(),
    nextUid: 1,
    lastCapture: 0,
    lossStreak: 0,
    find: null,
    findClock: 30,
    boost: 0,
  };
}

export const regionTaken = (s: GameState) => s.zone >= ZONES.length;
export const asphaltMult = (s: GameState) => 1 + ASPHALT_BONUS * s.asphalt;

export function unlockedShops(s: GameState): ShopKind[] {
  const out = [...START_SHOPS];
  for (const z of ZONES.slice(0, s.zone)) if (z.unlocks) out.push(z.unlocks);
  return SHOP_ORDER.filter((k) => out.includes(k));
}

export function slotIncome(s: GameState, sl: Slot): number {
  return sl.shop ? SHOPS[sl.shop].income * INCOME_GROWTH ** (sl.level - 1) * asphaltMult(s) : 0;
}

export function incomePerSec(s: GameState): number {
  return s.slots.reduce((a, sl) => a + slotIncome(s, sl), 0);
}

// Heat is derived, not stored: every Payday level you own makes every fight harder.
export function heat(s: GameState): number {
  return s.slots.reduce((a, sl) => a + (sl.shop === 'payday' ? sl.level * HEAT_PER_PAYDAY_LEVEL : 0), 0);
}

export const renovateCost = (level: number) => Math.round(RENOVATE_BASE * RENOVATE_GROWTH ** (level - 1));

export function log(s: GameState, text: string, tone: LogLine['tone'] = 'info') {
  const last = s.log[s.log.length - 1];
  if (last?.text === text) {
    last.n = (last.n ?? 1) + 1; // collapse repeats ("×12")
    last.t = s.time;
    return;
  }
  s.log.push({ t: s.time, text, tone });
  if (s.log.length > 60) s.log.splice(0, s.log.length - 60);
}

// Open a shop in an empty storefront, or rebrand an occupied one (keeps the level).
export function openShop(s: GameState, slotId: number, kind: ShopKind): string | null {
  const sl = s.slots[slotId];
  if (!sl) return 'No such storefront';
  if (sl.shop === kind) return 'Already that';
  if (!unlockedShops(s).includes(kind)) return 'Not unlocked yet';
  const cost = SHOPS[kind].openCost;
  if (s.cash < cost) return 'Not enough cash';
  s.cash -= cost;
  const was = sl.shop;
  sl.shop = kind;
  lineupChanged(s);
  log(s, was ? `${sl.label}: ${SHOPS[was].name} is now a ${SHOPS[kind].name}. Same carpet.` : `${SHOPS[kind].name} opened in ${sl.label}.`);
  return null;
}

export function renovate(s: GameState, slotId: number): string | null {
  const sl = s.slots[slotId];
  if (!sl?.shop) return 'Open something first';
  const cost = renovateCost(sl.level);
  if (s.cash < cost) return 'Not enough cash';
  s.cash -= cost;
  sl.level++;
  lineupChanged(s);
  return null;
}

// Any change to the crew ends a smoke break.
function lineupChanged(s: GameState) {
  if (s.lossStreak >= SMOKE_BREAK_AFTER && !s.battle) s.regroup = Math.min(s.regroup, REGROUP_SECONDS);
  s.lossStreak = 0;
}

export function collectFind(s: GameState): string | null {
  if (!s.find) return 'Nobody walked in';
  s.boost = WALKIN_SECONDS;
  log(s, `Somebody pawned a ${s.find.name} at ${s.slots[s.find.slot].label}. Crew hits 50% harder for a minute.`, 'win');
  s.find = null;
  return null;
}
