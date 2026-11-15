import { DAWN } from './content/dawn';
import { enemyLineup, statsOf } from './battle';
import { ASPHALT_BONUS, CURRENCY_NAME, type Currency, BATTLERS, FIGHTS, fightIndex, GOODWILL_PER_EQUITY, MAX_SLOTS, OVERTIME_FIGHTS, OVERTIME_SECONDS, REGIONS, RENO_GROWTH, RENT_GROWTH, ROLES, SMOKE_BREAK_SECONDS, SHOPS, SLOT_PRICES, START_SLOTS, SHOP_LIST, START_CASH, TRAIN_BASE, TRAIN_GROWTH, type RegionId, type Role, type ShopDef, LOG_KEEP } from './defs';
import type { Crew, GameState, LogLine, Track } from './state';
import { newRoom, perk } from './room';

export const SAVE_VERSION = 5;
const zeroTrack = (): Track => ({ tank: 0, damage: 0, heal: 0, control: 0, buffer: 0 });
export const newCrew = (r: RegionId): Crew => ({ cash: START_CASH, shops: { [REGIONS[r].start]: 1 }, train: zeroTrack(), frontier: 0, at: 0, kills: 0, farmed: 0, tries: 0, wounds: {}, battle: null, regroup: 2, smoke: 0, overtime: 0, lineup: null, contracts: [], slotBuys: 0, rally: 0, wins: 0, losses: 0 });

export function newGame(seed = Date.now() % 2147483647): GameState {
  return {
    version: SAVE_VERSION,
    seed,
    time: 0,
    totalTime: 0,
    goodwill: 0,
    equity: 0,
    tickets: 0,
    room: newRoom(),
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

// The purse: every currency is read, spent and earned through these three.
export const bal = (s: GameState, r: RegionId, cur: Currency) => (cur === 'cash' ? s.crews[r].cash : s[cur]);
export function earn(s: GameState, r: RegionId, cur: Currency, n: number) {
  if (cur === 'cash') s.crews[r].cash += n;
  else s[cur] += n;
}
export function spend(s: GameState, r: RegionId, cur: Currency, n: number): string | null {
  if (bal(s, r, cur) < n) return `Not enough ${CURRENCY_NAME[cur]}`;
  earn(s, r, cur, -n);
  return null;
}
export const currencyOf = (r: RegionId) => CURRENCY_NAME[REGIONS[r].pay];
export const purse = (s: GameState, r: RegionId) => bal(s, r, REGIONS[r].pay);

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
  const idx = fightIndex(r, zone, i);
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

// A shop's hire fights at its renovation level plus the shop's tier: pricier storefronts send better people,
// so a dollar of renovation buys about the same strength anywhere on the strip.
export const tierOf = (id: string) => Math.max(0, Math.round(Math.log(SHOPS[id].reno / 5) / Math.log(RENO_GROWTH)));
export const powerLevel = (s: GameState, id: string) => (s.crews[SHOPS[id].region].shops[id] ?? 0) + tierOf(id);
// Bosses who quit and joined that region's crew; they fight at the crew's average power level.
export const joined = (s: GameState, r: RegionId) => REGIONS[r].lots.filter((l, z) => cleared(s, r, z, l.fights)).map((l) => l.boss.joins);
export function bossLevel(s: GameState, r: RegionId): number {
  const lv = leased(s, r).map((x) => powerLevel(s, x.id));
  return Math.max(1, Math.round(lv.reduce((a, b) => a + b, 0) / Math.max(1, lv.length)));
}
// The whole crew, front to back: [battler id, level]
export function roster(s: GameState, r: RegionId): [string, number][] {
  const out: [string, number][] = leased(s, r).map((x) => [x.battler, powerLevel(s, x.id)]);
  const bl = bossLevel(s, r);
  for (const id of joined(s, r)) out.push([id, bl]);
  return out.sort((a, b) => ROLES.indexOf(BATTLERS[a[0]].role) - ROLES.indexOf(BATTLERS[b[0]].role));
}

export const rentOf = (s: GameState, id: string, level = s.crews[SHOPS[id].region].shops[id] ?? 0) => (level ? SHOPS[id].rent * RENT_GROWTH ** (level - 1) * asphaltMult(s, SHOPS[id].region) : 0);
export const rentPerSec = (s: GameState, r: RegionId) => leased(s, r).reduce((a, x) => a + rentOf(s, x.id), 0);
export const renovateCost = (id: string, level: number) => Math.round(SHOPS[id].reno * RENO_GROWTH ** (level - 1));
export const trainCost = (r: RegionId, level: number) => Math.round(TRAIN_BASE[r] * TRAIN_GROWTH ** level);
export const overtimeCost = (s: GameState, r: RegionId) => Math.max(10, Math.round(rentPerSec(s, r) * OVERTIME_SECONDS * (r === 0 ? 1 - 0.25 * perk(s, 'otCheap') : 1)));
export const overtimeFights = (s: GameState, r: RegionId) => OVERTIME_FIGHTS + (r === 0 ? perk(s, 'otLong') : 0);

export function log(s: GameState, r: RegionId, text: string, tone: LogLine['tone'] = 'info', live = false) {
  if (live) {
    const last = [...s.log].reverse().find((l) => l.r === r);
    if (last?.live) return void Object.assign(last, { t: s.time, text, tone, n: undefined });
    return void s.log.push({ t: s.time, r, text, tone, live });
  }
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
  // keep the last LOG_KEEP lines per crew
  if (s.log.filter((l) => l.r === r).length > LOG_KEEP) s.log.splice(s.log.findIndex((l) => l.r === r), 1);
}

export function lease(s: GameState, id: string): string | null {
  const sh = SHOPS[id];
  const c = sh && s.crews[sh.region];
  if (!sh || c.shops[id]) return 'Already yours';
  if (!available(s, sh)) return 'Not available yet';
  const err = spend(s, sh.region, REGIONS[sh.region].leaseIn, sh.lease);
  if (err) return err;
  c.shops[id] = 1;
  log(s, sh.region, `${sh.name} leased. ${BATTLERS[sh.battler].name} joins the crew.`, 'capture');
  return null;
}

export function renovate(s: GameState, id: string): string | null {
  const sh = SHOPS[id];
  const c = s.crews[sh.region];
  const lv = c.shops[id];
  if (!lv) return 'Lease it first';
  const err = spend(s, sh.region, 'cash', renovateCost(id, lv));
  if (err) return err;
  c.shops[id] = lv + 1;
  return null;
}

export function train(s: GameState, r: RegionId, role: Role): string | null {
  const c = s.crews[r];
  const err = spend(s, r, REGIONS[r].trainIn, trainCost(r, c.train[role]));
  if (err) return err;
  c.train[role]++;
  return null;
}

// Goodwill -> Equity, whole Equity only. One way.
export function convert(s: GameState, equity = Infinity): string | null {
  if (!s.bypass) return 'Nothing to convert into';
  const n = Math.min(equity, Math.floor(s.goodwill / GOODWILL_PER_EQUITY));
  if (n < 1) return DAWN.convertShort;
  s.goodwill -= n * GOODWILL_PER_EQUITY;
  s.equity += n;
  s.stats.banked += n;
  log(s, 1, DAWN.converted(n * GOODWILL_PER_EQUITY, n));
  return null;
}

// ---- Patrols: auto-advance, hired one lot at a time from the lot track. ----
export const autoCovers = (s: GameState, r: RegionId, zone: number) => s.crews[r].contracts.includes(zone);
export const patrolPrice = (_s: GameState, r: RegionId, zone: number) => REGIONS[r].lots[zone].patrol;
// Everyone steps out back for a smoke. Full HP when they come back.
export function smokeBreak(s: GameState, r: RegionId) {
  const c = s.crews[r];
  c.wounds = {};
  c.regroup = c.smoke = SMOKE_BREAK_SECONDS;
}
export const lotReached = (s: GameState, r: RegionId, zone: number) => zone <= FIGHTS[r][Math.min(s.crews[r].frontier, FIGHTS[r].length - 1)].zone;
export function patrolBlock(s: GameState, r: RegionId, zone: number): string | null {
  if (autoCovers(s, r, zone)) return 'Already patrolled';
  if (!lotReached(s, r, zone)) return 'Not open yet';
  return null;
}
export function buyPatrol(s: GameState, r: RegionId, zone: number): string | null {
  const err = patrolBlock(s, r, zone) ?? spend(s, r, 'cash', patrolPrice(s, r, zone));
  if (err) return err;
  const c = s.crews[r];
  c.contracts.push(zone);
  log(s, r, `Patrol hired: ${REGIONS[r].lots[zone].name}.`);
  return null;
}

// ---- fighter slots and the lineup. Buffers stand on the curb: always on, never in a slot. ----
export const slotsOf = (s: GameState, r: RegionId) => Math.min(MAX_SLOTS, START_SLOTS + s.crews[r].slotBuys + roomSlots(s, r));
export const slotPrice = (s: GameState, r: RegionId) => (slotsOf(s, r) >= MAX_SLOTS ? Infinity : (SLOT_PRICES[r][s.crews[r].slotBuys] ?? Infinity));
export function buySlot(s: GameState, r: RegionId): string | null {
  const price = slotPrice(s, r);
  if (!isFinite(price)) return 'No more slots for sale here';
  const err = spend(s, r, REGIONS[r].trainIn, price);
  if (err) return err;
  s.crews[r].slotBuys++;
  return null;
}
export const curb = (s: GameState, r: RegionId) => roster(s, r).filter(([id]) => BATTLERS[id].role === 'buffer');
export const fighters = (s: GameState, r: RegionId) => roster(s, r).filter(([id]) => BATTLERS[id].role !== 'buffer');

// The auto pick: best tank (two against hard hitters), a healer (two from 7 slots), counters for this fight, then raw power.
export function autoLineup(s: GameState, r: RegionId, fight = s.crews[r].at): string[] {
  const n = slotsOf(s, r);
  const pool = fighters(s, r).map(([id, lv]) => {
    const st = statsOf(s, r, id, lv);
    return { id, role: BATTLERS[id].role, hp: st.hp, power: (st.hp * st.dmg) / st.interval };
  });
  const out: string[] = [];
  const take = (ids: string[]) => ids.forEach((id) => out.length < n && !out.includes(id) && out.push(id));
  const by = (role: Role, k: keyof (typeof pool)[number]) => pool.filter((p) => p.role === role).sort((a, b) => (b[k] as number) - (a[k] as number)).map((p) => p.id);
  const foes = enemyLineup(r, Math.min(fight, FIGHTS[r].length - 1));
  take(by('tank', 'hp').slice(0, foes.some((e) => e.def.tell === 'hard') && n >= 6 ? 2 : 1));
  take(by('heal', 'power').slice(0, n >= 7 ? 2 : 1));
  take([...new Set(foes.map((e) => e.def.weak))].filter((id) => pool.some((p) => p.id === id)).slice(0, 2));
  take(pool.filter((p) => p.role !== 'tank').sort((a, b) => b.power - a.power).map((p) => p.id));
  take(pool.map((p) => p.id));
  return out;
}
export function lineupOf(s: GameState, r: RegionId): string[] {
  const c = s.crews[r];
  if (!c.lineup) return autoLineup(s, r);
  const have = new Set(fighters(s, r).map(([id]) => id));
  return c.lineup.filter((id) => have.has(id)).slice(0, slotsOf(s, r));
}
export function toggleField(s: GameState, r: RegionId, id: string): string | null {
  const c = s.crews[r];
  const now = lineupOf(s, r);
  if (now.includes(id)) c.lineup = now.filter((x) => x !== id);
  else if (now.length >= slotsOf(s, r)) return `All ${slotsOf(s, r)} slots are taken. Bench someone first.`;
  else c.lineup = [...now, id];
  return null;
}
export const autoPick = (s: GameState, r: RegionId) => (s.crews[r].lineup = null);
// Arcade and bar perks that add slots (the prize counter, the shuffleboard board). Filled in by the Game Room.
export const roomSlots = (s: GameState, r: RegionId) => (r === 0 ? perk(s, 'slot') : s.room.shuffle >= 3 ? 1 : 0);

export function advance(s: GameState, r: RegionId, dir: 1 | -1): string | null {
  const c = s.crews[r];
  const to = c.at + dir;
  if (to < 0 || to > topFight(s, r)) return dir > 0 ? 'Win this one first' : 'Already at the first fight';
  c.at = to;
  c.farmed = 0;
  c.battle = null;
  smokeBreak(s, r);
  return null;
}

// Overtime: pay two minutes of this crew's rent; the next 3 fights get +25% HP and damage.
export function overtime(s: GameState, r: RegionId): string | null {
  const c = s.crews[r];
  if (c.overtime > 0) return 'Already on overtime';
  const cost = overtimeCost(s, r);
  const err = spend(s, r, 'cash', cost);
  if (err) return err;
  c.overtime = overtimeFights(s, r);
  log(s, r, `Overtime approved. Next ${c.overtime} fights: +25% HP and damage. -$${Math.round(cost)}.`);
  return null;
}

export function view(s: GameState, r: RegionId): string | null {
  if (r === 1 && !s.bypass) return 'No such road';
  s.view = r;
  s.find = null;
  return null;
}
