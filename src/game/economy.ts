import { ASPHALT_BONUS, BATTLERS, FIGHTS, GOODWILL_PER_EQUITY, OVERTIME_SECONDS, REGIONS, RENO_GROWTH, RENT_GROWTH, RETRY_AFTER, ROLES, SECURITY_LEVELS, SHOPS, SHOP_LIST, START_CASH, TRAIN_BASE, TRAIN_GROWTH, type RegionId, type Role, type ShopDef, type Stance } from './defs';
import type { Crew, GameState, LogLine, Track } from './state';

export const SAVE_VERSION = 4;
const zeroTrack = (): Track => ({ tank: 0, damage: 0, heal: 0, control: 0, buffer: 0 });
export const newCrew = (r: RegionId): Crew => ({ cash: START_CASH, shops: { [REGIONS[r].start]: 1 }, train: zeroTrack(), frontier: 0, at: 0, kills: 0, farmed: 0, streak: 0, battle: null, regroup: 2, stance: 'even', overtime: 0, rally: 0, wins: 0, losses: 0 });

export function newGame(seed = Date.now() % 2147483647): GameState {
  return {
    version: SAVE_VERSION,
    seed,
    time: 0,
    totalTime: 0,
    goodwill: 0,
    equity: 0,
    asphalt: 0,
    paves: 0,
    crews: [newCrew(0), newCrew(1)],
    view: 0,
    bypass: false,
    ending: 0,
    log: [{ t: 0, r: 0, text: "Lease transferred: Pinewood Plaza, Unit A (Uncle Sal's pawn shop) and the rest of the row (as is).", tone: 'info' }],
    stats: { earned: 0, goodwill: 0, equity: 0, banked: 0 },
    savedAt: Date.now(),
    nextUid: 1,
    find: null,
    findClock: 30,
  };
}

export const crewOf = (s: GameState, r: RegionId = s.view) => s.crews[r];
export const currencyOf = (r: RegionId) => REGIONS[r].currency;
export const purse = (s: GameState, r: RegionId) => (r === 0 ? s.goodwill : s.equity);

// Paving Route 9: the Route 9 crew starts over with more asphalt under it. The Bypass is untouched.
export const asphaltGain = (s: GameState) => (regionDone(s, 0) ? FIGHTS[0].length + 10 * REGIONS[0].lots.length : 0);
export function pave(s: GameState): GameState {
  const gain = asphaltGain(s);
  if (!gain) return s;
  s.crews[0] = newCrew(0);
  s.goodwill = 0;
  s.asphalt += gain;
  s.paves++;
  s.time = 0;
  s.view = 0;
  s.ending = 0;
  s.find = null;
  log(s, 0, `Route 9 repaved: +${gain} asphalt. Uncle Sal's pawn shop opens at 9, same as always.`);
  return s;
}
// Asphalt is Route 9's: +2% rent, stats and Goodwill each. The Bypass only gets Route 9 through Equity.
export const asphaltMult = (s: GameState, r: RegionId) => (r === 0 ? 1 + ASPHALT_BONUS * s.asphalt : 1);

export const regionDone = (s: GameState, r: RegionId) => s.crews[r].frontier >= FIGHTS[r].length;
export function cleared(s: GameState, r: RegionId, zone: number, i: number) {
  const idx = FIGHTS[r].findIndex((f) => f.zone === zone && f.i === i);
  return idx >= 0 && s.crews[r].frontier > idx;
}
export const lotsTaken = (s: GameState, r: RegionId) => REGIONS[r].lots.filter((l, z) => cleared(s, r, z, l.fights)).length;
// Once a region is done its last boss is on your crew, so the crew farms the fight before him.
export const topFight = (s: GameState, r: RegionId) => (regionDone(s, r) ? FIGHTS[r].length - 2 : Math.min(s.crews[r].frontier, FIGHTS[r].length - 1));
export const fightOf = (s: GameState, r: RegionId) => FIGHTS[r][Math.min(s.crews[r].at, FIGHTS[r].length - 1)];

// Shops arrive in a fixed order as fights are cleared.
export const available = (s: GameState, sh: ShopDef) => sh.fight < 0 || cleared(s, sh.region, sh.zone, sh.fight);
export const leased = (s: GameState, r: RegionId) => SHOP_LIST.filter((x) => x.region === r && s.crews[r].shops[x.id]);
export const forLease = (s: GameState, r: RegionId) => SHOP_LIST.filter((x) => x.region === r && !s.crews[r].shops[x.id] && available(s, x));

// Bosses who quit and joined that region's crew; their level is the crew's average renovation level.
export const joined = (s: GameState, r: RegionId) => REGIONS[r].lots.filter((l, z) => cleared(s, r, z, l.fights)).map((l) => l.boss.joins);
export function bossLevel(s: GameState, r: RegionId): number {
  const lv = Object.values(s.crews[r].shops);
  return Math.max(1, Math.round(lv.reduce((a, b) => a + b, 0) / Math.max(1, lv.length)));
}
// The whole crew, front to back: [battler id, level]
export function roster(s: GameState, r: RegionId): [string, number][] {
  const c = s.crews[r];
  const out: [string, number][] = leased(s, r).map((x) => [x.battler, c.shops[x.id]]);
  const bl = bossLevel(s, r);
  for (const id of joined(s, r)) out.push([id, bl]);
  return out.sort((a, b) => ROLES.indexOf(BATTLERS[a[0]].role) - ROLES.indexOf(BATTLERS[b[0]].role));
}

export const rentOf = (s: GameState, id: string, level = s.crews[SHOPS[id].region].shops[id] ?? 0) => (level ? SHOPS[id].rent * RENT_GROWTH ** (level - 1) * asphaltMult(s, SHOPS[id].region) : 0);
export const rentPerSec = (s: GameState, r: RegionId) => leased(s, r).reduce((a, x) => a + rentOf(s, x.id), 0);
export const renovateCost = (id: string, level: number) => Math.round(SHOPS[id].reno * RENO_GROWTH ** (level - 1));
export const trainCost = (r: RegionId, level: number) => Math.round(TRAIN_BASE[r] * TRAIN_GROWTH ** level);
export const overtimeCost = (s: GameState, r: RegionId) => Math.max(10, Math.round(rentPerSec(s, r) * OVERTIME_SECONDS));

export function log(s: GameState, r: RegionId, text: string, tone: LogLine['tone'] = 'info') {
  for (let i = s.log.length - 1; i >= Math.max(0, s.log.length - 3); i--) {
    const l = s.log[i];
    if (l.r === r && l.text === text) {
      l.n = (l.n ?? 1) + 1; // collapse repeats ("x12")
      l.t = s.time;
      return;
    }
    if (l.r === r) break;
  }
  s.log.push({ t: s.time, r, text, tone });
  if (s.log.length > 80) s.log.splice(0, s.log.length - 80);
}

// Any purchase lets auto-advance try the frontier again right away.
const bought = (c: Crew) => (c.farmed = Math.max(c.farmed, RETRY_AFTER));

export function lease(s: GameState, id: string): string | null {
  const sh = SHOPS[id];
  const c = sh && s.crews[sh.region];
  if (!sh || c.shops[id]) return 'Already yours';
  if (!available(s, sh)) return 'Not available yet';
  // Route 9 leases cost dollars; the Bypass leases cost Equity (that's where Goodwill ends up).
  if (sh.region === 0 ? c.cash < sh.lease : s.equity < sh.lease) return sh.region === 0 ? 'Not enough cash' : 'Not enough Equity';
  if (sh.region === 0) c.cash -= sh.lease;
  else s.equity -= sh.lease;
  c.shops[id] = 1;
  bought(c);
  log(s, sh.region, `${sh.name} leased. ${BATTLERS[sh.battler].name} joins the crew.`, 'capture');
  return null;
}

export function renovate(s: GameState, id: string): string | null {
  const sh = SHOPS[id];
  const c = s.crews[sh.region];
  const lv = c.shops[id];
  if (!lv) return 'Lease it first';
  const cost = renovateCost(id, lv);
  if (c.cash < cost) return 'Not enough cash';
  c.cash -= cost;
  c.shops[id] = lv + 1;
  bought(c);
  return null;
}

// Route 9 trains with Goodwill, the Bypass with Equity.
export function train(s: GameState, r: RegionId, role: Role): string | null {
  const c = s.crews[r];
  const cost = trainCost(r, c.train[role]);
  if (purse(s, r) < cost) return `Not enough ${currencyOf(r)}`;
  if (r === 0) s.goodwill -= cost;
  else s.equity -= cost;
  c.train[role]++;
  bought(c);
  return null;
}

// Goodwill -> Equity, whole Equity only. One way.
export function convert(s: GameState, equity = Infinity): string | null {
  if (!s.bypass) return 'Nothing to convert into';
  const n = Math.min(equity, Math.floor(s.goodwill / GOODWILL_PER_EQUITY));
  if (n < 1) return `Takes ${GOODWILL_PER_EQUITY} Goodwill per Equity`;
  s.goodwill -= n * GOODWILL_PER_EQUITY;
  s.equity += n;
  s.stats.banked += n;
  log(s, 1, `Converted ${n * GOODWILL_PER_EQUITY} Goodwill into ${n} Equity. The bank called it "a relationship."`);
  return null;
}

// Does the Security Office cover this lot? The first lot of each region is always covered.
export function autoCovers(s: GameState, r: RegionId, zone: number): boolean {
  return zone === 0 || (s.crews[r].shops[REGIONS[r].security] ?? 0) >= SECURITY_LEVELS(zone);
}

export function advance(s: GameState, r: RegionId, dir: 1 | -1): string | null {
  const c = s.crews[r];
  const to = c.at + dir;
  if (to < 0 || to > topFight(s, r)) return dir > 0 ? 'Win this one first' : 'Already at the first fight';
  c.at = to;
  c.streak = 0;
  c.farmed = 0;
  c.battle = null;
  c.regroup = 1;
  return null;
}

export function setStance(s: GameState, r: RegionId, stance: Stance) {
  s.crews[r].stance = stance;
}

// Overtime: pay two minutes of this crew's rent; the next 3 fights get +25% HP and damage.
export function overtime(s: GameState, r: RegionId): string | null {
  const c = s.crews[r];
  if (c.overtime > 0) return 'Already on overtime';
  const cost = overtimeCost(s, r);
  if (c.cash < cost) return 'Not enough cash';
  c.cash -= cost;
  c.overtime = 3;
  log(s, r, `Overtime approved. Next 3 fights: +25% HP and damage. -$${Math.round(cost)}.`);
  return null;
}

export function view(s: GameState, r: RegionId): string | null {
  if (r === 1 && !s.bypass) return 'No such road';
  s.view = r;
  s.find = null;
  return null;
}
