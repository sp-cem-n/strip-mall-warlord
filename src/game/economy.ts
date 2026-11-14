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
  BUFF_SECONDS,
  WALKIN_HEAT,
  WALKIN_HEAT_SECONDS,
  WALKIN_LOAN,
  WALKIN_TIP,
  WALKINS,
  ZONES,
  type ShopKind,
} from './defs';
import type { Buffs, GameState, LogLine, Slot } from './state';
import { fmt } from '../ui/format';

export const SAVE_VERSION = 3;
export const noBuffs = (): Buffs => ({ dmg: 0, tough: 0, regen: 0, heat: 0 });
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
    log: [{ t: 0, text: 'Lease transferred: Pinewood Plaza, Unit A (vape shop) and Units B through D (as is).', tone: 'info' }],
    stats: { wins: 0, losses: 0, earned: 0 },
    savedAt: Date.now(),
    nextUid: 1,
    lastCapture: 0,
    lossStreak: 0,
    find: null,
    findClock: 30,
    buffs: noBuffs(),
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

// Heat is derived, not stored: every Payday level you own makes every fight harder,
// plus a temporary bump while a borrower's paperwork is still warm.
export const paydayHeat = (s: GameState) => s.slots.reduce((a, sl) => a + (sl.shop === 'payday' ? sl.level * HEAT_PER_PAYDAY_LEVEL : 0), 0);
export const heat = (s: GameState) => paydayHeat(s) + (s.buffs.heat > 0 ? WALKIN_HEAT : 0);

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
  const f = s.find;
  if (!f) return 'Nobody walked in';
  s.find = null;
  const where = s.slots[f.slot].label;
  const b = s.buffs;
  switch (f.kind) {
    case 'pawn':
      b.dmg = BUFF_SECONDS;
      return log(s, `Somebody pawned ${f.name} at ${where}. Crew hits 50% harder for 30 seconds.`, 'win'), null;
    case 'dojo':
      b.tough = BUFF_SECONDS;
      return log(s, `${f.name} went a few rounds with the Bouncers at ${where}. They take 40% less damage for 30 seconds.`, 'win'), null;
    case 'laundromat':
      b.regen = BUFF_SECONDS;
      return log(s, `Found in a dryer at ${where}: ${f.name}. Morale is up. Crew heals 2% a second for 30 seconds.`, 'win'), null;
    case 'vape': {
      const tip = incomePerSec(s) * WALKIN_TIP;
      s.cash += tip;
      return log(s, `${f.name} bought in bulk at ${where}. +$${fmt(tip)}. Didn't ask for a bag.`, 'win'), null;
    }
    case 'payday': {
      const loan = incomePerSec(s) * WALKIN_LOAN;
      s.cash += loan;
      b.heat = WALKIN_HEAT_SECONDS;
      return log(s, `${f.name} signed at ${where}. +$${fmt(loan)}. The cruisers noticed: +25% Heat for 3 minutes.`, 'loss'), null;
    }
  }
  return WALKINS[f.kind] ? null : 'Unknown walk-in';
}
