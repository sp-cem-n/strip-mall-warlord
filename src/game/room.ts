// The Game Room: the Fun Zone arcade on Route 9 (and, after dawn, the bar on the Bypass). DOM-free.
// Every machine is data: what unlocks it, what a play costs, and payout(q) for a play of quality q (0..1).
// The UI's mini-games, Attract Mode and the balance bot all go through startPlay / endPlay, so they pay the same.
import { FIGHTS, REGIONS, type Currency, type RegionId } from './defs';
import { asphaltMult, bal, cleared, earn, log, rentPerSec, spend } from './economy';
import { rand } from './rng';
import type { GameState } from './state';

export type MachineId = 'pusher' | 'whac' | 'skee' | 'claw' | 'pinball' | 'cyclone';
export type BuffKind = 'bat' | 'duck' | 'troll' | 'ball' | 'watch';
export type Cost = { cur: Currency | 'tickets'; n: number };
export interface Reward { cash?: number; goodwill?: number; tickets?: number; equity?: number; buff?: BuffKind; big?: boolean; text: string }
export interface RoomState {
  unlocked: MachineId[]; // survives paving
  attract: Partial<Record<MachineId, number>>; // Attract Mode level, 0-3
  clock: Partial<Record<MachineId, number>>; // seconds since the last Attract Mode game
  cool: Partial<Record<MachineId, number>>; // "being serviced" until this totalTime
  perks: Partial<Record<PerkId, number>>;
  board: number; // pinball house scores beaten (0-5)
  best: number; // your best pinball score
  jackpot: number; // Cyclone, progressive
  shelf: number; // coin pusher pile, 0-10
  buffs: Partial<Record<BuffKind, number>>; // seconds left
  plays: number;
}
export const newRoom = (): RoomState => ({ unlocked: [], attract: {}, clock: {}, cool: {}, perks: {}, board: 0, best: 0, jackpot: 500, shelf: 10, buffs: {}, plays: 0 });

// ---- rates every payout is priced in, so nothing goes stale ----
const rent = (s: GameState, r: RegionId) => Math.max(1, rentPerSec(s, r));
export const winPay = (s: GameState, r: RegionId) => FIGHTS[r][Math.min(s.crews[r].frontier, FIGHTS[r].length - 1)].pay * asphaltMult(s, r) * (r === 0 ? boardBonus(s) : 1);
export const boardBonus = (s: GameState) => 1 + 0.06 * s.room.board;
const rentCost = (sec: number) => (s: GameState): Cost => ({ cur: 'cash', n: Math.max(1, Math.round(rent(s, 0) * sec)) });

export const BUFFS: Record<BuffKind, { name: string; does: string }> = {
  bat: { name: 'Plush Bat', does: '+30% crew damage' },
  duck: { name: 'Rubber Duck', does: '+30% crew HP' },
  troll: { name: 'Troll Doll', does: 'walk-ins pay double' },
  ball: { name: 'Bouncy Ball', does: 'a free 30s rally' },
  watch: { name: 'Gold Watch', does: '5 free Overtime fights' },
};
export const BUFF_SECONDS = 600;
export const HOUSE_SCORES: [string, number][] = [['SAL', 12000], ['DEV', 25000], ['LPM', 40000], ['GM', 60000], ['RPM', 90000]];
export const PINBALL_TOP = 100000; // a q=1 game

export interface MachineDef {
  id: MachineId;
  region: RegionId;
  name: string;
  blurb: string;
  needs: string; // shown on the dark cabinet
  unlock: (s: GameState) => boolean;
  cost: (s: GameState) => Cost;
  secs: number; // a typical game, for the bot
  pay: (s: GameState, q: number) => Reward;
  cool: number; // seconds out of service after a big win
}

const funZone = (s: GameState) => !!s.crews[0].shops.funzone;
export const MACHINES: MachineDef[] = [
  {
    id: 'pusher', region: 0, name: 'Coin Pusher', blurb: 'Drop it in front of the pile.', needs: 'Lease the Fun Zone', unlock: funZone, cost: rentCost(5), secs: 4, cool: 120,
    pay: (s, q) => {
      const cost = rent(s, 0) * 5;
      const pile = s.room.shelf / 10;
      if (q > 0.9 && pile > 0.5 && rand(s) < 0.08) return { cash: rent(s, 0) * 120, big: true, text: 'A Rent Check coin went over the edge.' };
      return { cash: cost * (0.4 + 2.6 * q) * (0.4 + 0.6 * pile), text: q > 0.7 ? 'Clean drop.' : 'Bounced.' };
    },
  },
  {
    id: 'whac', region: 0, name: 'Whac-a-Shoplifter', blurb: 'Bonk shoplifters. Not customers.', needs: 'Capture Big-Box Plaza', unlock: (s) => cleared(s, 0, 1, REGIONS[0].lots[1].fights), cost: rentCost(20), secs: 32, cool: 0,
    pay: (s, q) => ({ goodwill: winPay(s, 0) * 0.5 * Math.round(30 * q), text: `${Math.round(30 * q)} bonks.` }),
  },
  {
    id: 'skee', region: 0, name: 'Skee-Ball', blurb: 'Nine balls. Hold for power.', needs: 'Clear fight 6 at the Outlet Mall', unlock: (s) => cleared(s, 0, 2, 5), cost: rentCost(15), secs: 25, cool: 60,
    pay: (_s, q) => (q >= 1 ? { tickets: 140, big: true, text: '450 or better. The machine sings.' } : { tickets: Math.round(10 + 30 * q), text: `${Math.round(450 * q)} points.` }),
  },
  {
    id: 'claw', region: 0, name: 'Claw Machine', blurb: 'Press to go. Press to drop.', needs: 'Capture the Outlet Mall', unlock: (s) => cleared(s, 0, 2, REGIONS[0].lots[2].fights), cost: () => ({ cur: 'tickets', n: 50 }), secs: 10, cool: 60,
    pay: (s, q) => {
      if (rand(s) > q) return { text: 'It slipped. It always slips.' };
      const roll = rand(s);
      const buff: BuffKind = roll < 0.06 ? 'watch' : roll < 0.37 ? 'bat' : roll < 0.68 ? 'duck' : roll < 0.86 ? 'troll' : 'ball';
      return { buff, big: true, text: `Got the ${BUFFS[buff].name}: ${BUFFS[buff].does}.` };
    },
  },
  {
    id: 'pinball', region: 0, name: 'Night Shift', blurb: 'Pinball. Left half, right half.', needs: 'Capture Sunrise Office Park', unlock: (s) => cleared(s, 0, 3, REGIONS[0].lots[3].fights), cost: rentCost(20), secs: 70, cool: 0,
    pay: (s, q) => ({ goodwill: winPay(s, 0) * 8 * q, text: `${Math.round(PINBALL_TOP * q).toLocaleString('en-US')} points.` }),
  },
  {
    id: 'cyclone', region: 0, name: 'Cyclone', blurb: 'Stop it on the jackpot.', needs: 'Capture the Lifestyle Center', unlock: (s) => cleared(s, 0, 4, REGIONS[0].lots[4].fights), cost: rentCost(15), secs: 6, cool: 600,
    pay: (s, q) => {
      if (q >= 1) {
        const eq = s.bypass ? Math.max(1, Math.round((winPay(s, 0) / 12 / 10) * 900)) : 0;
        return { tickets: s.room.jackpot, equity: eq || undefined, big: true, text: `JACKPOT. ${s.room.jackpot} tickets${eq ? ` and ${eq} Equity` : ''}.` };
      }
      return { tickets: q >= 0.5 ? 50 : 2 + Math.floor(rand(s) * 9), text: q >= 0.5 ? 'One light off.' : 'Missed.' };
    },
  },
];
export const MACHINE: Record<MachineId, MachineDef> = Object.fromEntries(MACHINES.map((m) => [m.id, m])) as Record<MachineId, MachineDef>;
export const roomOpen = (s: GameState, r: RegionId) => MACHINES.some((m) => m.region === r && s.room.unlocked.includes(m.id));

// ---- the prize counter (tickets, permanent) ----
export type PerkId = 'slot' | 'otCheap' | 'otLong' | 'walkins';
export const PERKS: Record<PerkId, { name: string; does: string; prices: number[] }> = {
  slot: { name: 'Fighter slot', does: 'One more fighter on the lot', prices: [1500, 6000] },
  otCheap: { name: 'Overtime coupon', does: 'Overtime costs 25% less', prices: [800, 800] },
  otLong: { name: 'Overtime punch card', does: 'Overtime lasts 4 fights', prices: [2000] },
  walkins: { name: 'Doorbell', does: 'Walk-ins every 75s instead of 90', prices: [1200] },
};
export const perk = (s: GameState, id: PerkId) => s.room.perks[id] ?? 0;
export const perkPrice = (s: GameState, id: PerkId) => PERKS[id].prices[perk(s, id)] ?? Infinity;
export function buyPerk(s: GameState, id: PerkId): string | null {
  const price = perkPrice(s, id);
  if (!isFinite(price)) return 'Sold out';
  if (s.tickets < price) return 'Not enough tickets';
  s.tickets -= price;
  s.room.perks[id] = perk(s, id) + 1;
  log(s, 0, `Prize counter: ${PERKS[id].name}. ${PERKS[id].does}.`, 'win');
  return null;
}

// ---- Attract Mode: plays itself, rarely, badly ----
export const ATTRACT_EVERY = [0, 1800, 1200, 720];
export const ATTRACT_SKILL = 0.4;
export function attractPrice(s: GameState, id: MachineId): Cost | null {
  const lv = s.room.attract[id] ?? 0;
  if (lv >= 3) return null;
  if (lv === 0) return { cur: 'cash', n: Math.max(100, Math.round(rent(s, MACHINE[id].region) * 600)) };
  return { cur: 'tickets', n: lv === 1 ? 300 : 900 };
}
export function buyAttract(s: GameState, id: MachineId): string | null {
  const p = attractPrice(s, id);
  if (!p) return 'Already at the fastest';
  const err = pay(s, MACHINE[id].region, p);
  if (err) return err;
  s.room.attract[id] = (s.room.attract[id] ?? 0) + 1;
  s.room.clock[id] = 0;
  return null;
}

function pay(s: GameState, r: RegionId, c: Cost): string | null {
  if (c.cur === 'tickets') {
    if (s.tickets < c.n) return 'Not enough tickets';
    s.tickets -= c.n;
    return null;
  }
  return spend(s, r, c.cur, c.n);
}
export const canAfford = (s: GameState, r: RegionId, c: Cost) => (c.cur === 'tickets' ? s.tickets : bal(s, r, c.cur)) >= c.n;
export const serviced = (s: GameState, id: MachineId) => Math.max(0, (s.room.cool[id] ?? 0) - s.totalTime);

// Puts the quarter in. Returns why not, or null.
export function startPlay(s: GameState, id: MachineId): string | null {
  const m = MACHINE[id];
  if (!s.room.unlocked.includes(id)) return m.needs;
  if (serviced(s, id) > 0) return 'Being serviced';
  return pay(s, m.region, m.cost(s));
}

// The game is over: pay out for quality q (0..1).
export function endPlay(s: GameState, id: MachineId, q: number, quiet = false): Reward {
  const m = MACHINE[id];
  const r = m.region;
  q = Math.max(0, Math.min(1, q));
  const rw = m.pay(s, q);
  if (rw.cash) earn(s, r, 'cash', rw.cash);
  if (rw.goodwill) earn(s, r, 'goodwill', rw.goodwill);
  if (rw.equity) earn(s, r, 'equity', rw.equity);
  if (rw.tickets) s.tickets += rw.tickets;
  if (rw.buff) grant(s, rw.buff);
  if (id === 'pusher') s.room.shelf = Math.max(0, s.room.shelf - 1);
  if (id === 'cyclone') s.room.jackpot = q >= 1 ? 500 : s.room.jackpot + 5;
  if (rw.big && m.cool) s.room.cool[id] = s.totalTime + m.cool;
  s.room.plays++;
  if (!quiet && rw.big) log(s, r, `${m.name}: ${rw.text}`, 'win');
  return rw;
}

// Pinball: the score goes on the board. Each house score beaten is +6% Goodwill per win, forever.
export function postScore(s: GameState, score: number): number {
  s.room.best = Math.max(s.room.best, score);
  const beat = HOUSE_SCORES.filter(([, v]) => s.room.best > v).length;
  const gained = beat - s.room.board;
  if (gained > 0) {
    s.room.board = beat;
    log(s, 0, `Night Shift high score: ${HOUSE_SCORES[beat - 1][0]} is off the board. Goodwill per win +${Math.round(0.06 * beat * 100)}%.`, 'capture');
  }
  return gained;
}

function grant(s: GameState, b: BuffKind) {
  const c = s.crews[0];
  if (b === 'ball') c.rally = Math.max(c.rally, 30);
  else if (b === 'watch') c.overtime += 5;
  else s.room.buffs[b] = BUFF_SECONDS;
}
export const buffOn = (s: GameState, b: BuffKind) => (s.room.buffs[b] ?? 0) > 0;

// Once a sim step: unlocks, buff clocks, the pusher's shelf, Attract Mode.
export function tickRoom(s: GameState, dt: number) {
  const R = s.room;
  for (const m of MACHINES) {
    if (!R.unlocked.includes(m.id) && m.unlock(s)) {
      R.unlocked.push(m.id);
      log(s, m.region, `New at the ${m.region ? 'bar' : 'Fun Zone'}: ${m.name}.`, 'capture');
    }
  }
  for (const k of Object.keys(R.buffs) as BuffKind[]) R.buffs[k] = Math.max(0, (R.buffs[k] ?? 0) - dt);
  R.shelf = Math.min(10, R.shelf + dt / 3);
  for (const id of Object.keys(R.attract) as MachineId[]) {
    const lv = R.attract[id] ?? 0;
    if (!lv) continue;
    R.clock[id] = (R.clock[id] ?? 0) + dt;
    if (R.clock[id]! < ATTRACT_EVERY[lv]) continue;
    R.clock[id] = 0;
    if (startPlay(s, id) === null) endPlay(s, id, id === 'cyclone' ? (rand(s) < 0.04 ? 1 : rand(s) < 0.15 ? 0.5 : 0) : ATTRACT_SKILL * (0.6 + 0.8 * rand(s)), true);
  }
}
