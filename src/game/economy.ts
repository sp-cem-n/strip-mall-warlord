import {
  ASPHALT_BONUS,
  FIGHTERS,
  FIGHTERS_PER_SHOP,
  HOME_UNITS,
  LEASE_COSTS,
  LEVEL_INCOME,
  SHOPS,
  SHOP_ORDER,
  START_CASH,
  TRAIN_SPEED,
  UPGRADE_GROWTH,
  ZONES,
  type FighterKind,
  type ShopKind,
} from './defs';
import type { GameState, Slot } from './state';

export const SAVE_VERSION = 1;

const HOME_LABELS = ['Unit A (inherited)', 'Unit B', 'Unit C', 'Unit D'];

export function newGame(seed = Date.now() % 2147483647, asphalt = 0, bulldozes = 0, totalTime = 0): GameState {
  const slots: Slot[] = [];
  for (let i = 0; i < HOME_UNITS; i++) slots.push({ id: i, label: HOME_LABELS[i], origin: 'home', leased: i === 0, shop: null });
  return {
    version: SAVE_VERSION,
    seed,
    time: 0,
    totalTime,
    cash: START_CASH,
    heat: 0,
    asphalt,
    bulldozes,
    slots,
    roster: { bouncer: 0, hustler: 0, medic: 0, fixer: 0, lawyer: 0 },
    gear: { weapon: null, armor: null, kit: null },
    pawnClock: 0,
    zone: 0,
    wave: 0,
    battle: null,
    regroup: 2,
    raidPending: false,
    log: [{ t: 0, text: 'Your uncle left you Unit A at Pinewood Plaza, est. 1991. The lease is paid through Friday.', tone: 'info' }],
    stats: { wins: 0, losses: 0, raidsWon: 0, raidsLost: 0, earned: 0, rentPaid: 0, trained: 0 },
    savedAt: Date.now(),
    nextUid: 1,
    won: false,
    lastCapture: 0,
  };
}

export function speedMult(s: GameState): number {
  return 1 + ASPHALT_BONUS * s.asphalt;
}

export function unlockedShops(s: GameState): ShopKind[] {
  const out: ShopKind[] = ['dojo', 'vape'];
  for (let z = 0; z < Math.min(s.zone, ZONES.length); z++) {
    const u = ZONES[z].unlocks;
    if (u) out.push(u);
  }
  return SHOP_ORDER.filter((k) => out.includes(k));
}

export function shopsOf(s: GameState, kind: ShopKind) {
  return s.slots.flatMap((sl) => (sl.shop && sl.shop.kind === kind ? [sl.shop] : []));
}

export function openCost(s: GameState, kind: ShopKind): number {
  return Math.round(SHOPS[kind].openCost * 2.2 ** shopsOf(s, kind).length);
}

export function upgradeCost(kind: ShopKind, level: number): number {
  return Math.round(SHOPS[kind].upgradeBase * UPGRADE_GROWTH ** (level - 1));
}

export function nextLeaseCost(s: GameState): number | null {
  const i = s.slots.findIndex((sl) => sl.origin === 'home' && !sl.leased);
  return i < 0 ? null : LEASE_COSTS[i];
}

export function shopIncome(s: GameState, kind: ShopKind, level: number): number {
  return SHOPS[kind].income * LEVEL_INCOME(level) * speedMult(s);
}

export function incomePerSec(s: GameState): number {
  let total = 0;
  for (const sl of s.slots) if (sl.shop) total += shopIncome(s, sl.shop.kind, sl.shop.level);
  return total;
}

export function heatPerSec(s: GameState): number {
  let total = 0;
  for (const sl of s.slots) if (sl.shop) total += SHOPS[sl.shop.kind].heat * sl.shop.level;
  return total;
}

export function fighterCap(s: GameState, f: FighterKind): number {
  let cap = 0;
  for (const sl of s.slots) if (sl.shop && SHOPS[sl.shop.kind].fighter === f) cap += FIGHTERS_PER_SHOP(sl.shop.level);
  return cap;
}

export function fighterLevel(s: GameState, f: FighterKind): number {
  let lvl = 0;
  for (const sl of s.slots) if (sl.shop && SHOPS[sl.shop.kind].fighter === f) lvl = Math.max(lvl, sl.shop.level);
  return Math.max(1, lvl);
}

export function trainRate(s: GameState, kind: ShopKind, level: number): number {
  return (TRAIN_SPEED(level) * speedMult(s)) / SHOPS[kind].trainSeconds;
}

export function log(s: GameState, text: string, tone: GameState['log'][number]['tone'] = 'info') {
  s.log.push({ t: s.time, text, tone });
  if (s.log.length > 80) s.log.splice(0, s.log.length - 80);
}

// ---- player actions; each returns an error string or null ----

export function leaseUnit(s: GameState): string | null {
  const i = s.slots.findIndex((sl) => sl.origin === 'home' && !sl.leased);
  if (i < 0) return 'No more units in Pinewood Plaza';
  const cost = LEASE_COSTS[i];
  if (s.cash < cost) return 'Not enough cash';
  s.cash -= cost;
  s.slots[i].leased = true;
  log(s, `Signed a lease on ${s.slots[i].label}. Landlord wants first and last.`);
  return null;
}

export function openShop(s: GameState, slotId: number, kind: ShopKind): string | null {
  const sl = s.slots.find((x) => x.id === slotId);
  if (!sl || !sl.leased) return 'Slot not available';
  if (sl.shop) return 'Already occupied';
  if (!unlockedShops(s).includes(kind)) return 'Not unlocked yet';
  const cost = openCost(s, kind);
  if (s.cash < cost) return 'Not enough cash';
  s.cash -= cost;
  sl.shop = { kind, level: 1, train: 0 };
  log(s, `${SHOPS[kind].name} opened in ${sl.label}. ${FIGHTERS[SHOPS[kind].fighter].plural} start training.`);
  return null;
}

export function upgradeShop(s: GameState, slotId: number): string | null {
  const sl = s.slots.find((x) => x.id === slotId);
  if (!sl?.shop) return 'Nothing to upgrade';
  const cost = upgradeCost(sl.shop.kind, sl.shop.level);
  if (s.cash < cost) return 'Not enough cash';
  s.cash -= cost;
  sl.shop.level++;
  return null;
}
