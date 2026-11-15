// The Game Room: the Fun Zone arcade on Route 9 (and, after dawn, the bar on the Bypass). DOM-free.
// Every machine is data: what unlocks it, what a play costs, and payout(q) for a play of quality q (0..1).
// The UI's mini-games, Attract Mode and the balance bot all go through startPlay / endPlay, so they pay the same.
import { FIGHTS, REGIONS, type Currency, type RegionId } from './defs';
import { asphaltMult, bal, cleared, earn, log, rentPerSec, spend } from './economy';
import { rand } from './rng';
import type { GameState } from './state';

export type MachineId = 'pusher' | 'whac' | 'skee' | 'claw' | 'pinball' | 'cyclone' | 'darts' | 'pool' | 'poker' | 'foos' | 'shuffle' | 'trivia';
export type BuffKind = 'bat' | 'duck' | 'troll' | 'ball' | 'watch' | 'well' | 'call' | 'top' | 'royal' | 'quiz' | 'genius';
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
  shelf: [number, number]; // what's left to win: the coin pusher's pile, and the darts pot. 0-10, one back a minute
  buffs: Partial<Record<BuffKind, number>>; // seconds left
  plays: number;
  shuffle: number; // shuffleboard house scores beaten (0-5)
  shuffleBest: number;
  hands: Partial<Record<BuffKind, string>>; // the real poker hand behind each bar buff (a flush pays like trips)
}
export const newRoom = (): RoomState => ({ unlocked: [], attract: {}, clock: {}, cool: {}, perks: {}, board: 0, best: 0, jackpot: 500, shelf: [10, 10], buffs: {}, plays: 0, shuffle: 0, shuffleBest: 0, hands: {} });

// ---- rates every payout is priced in, so nothing goes stale ----
const rent = (s: GameState, r: RegionId) => Math.max(1, rentPerSec(s, r));
export const winPay = (s: GameState, r: RegionId) => FIGHTS[r][Math.min(s.crews[r].frontier, FIGHTS[r].length - 1)].pay * asphaltMult(s, r) * boardBonus(s, r);
// Night Shift (Route 9 Goodwill) and the shuffleboard (Bypass Equity): +6% per win for each house score beaten
// trivia on the Bypass: a timed bump to Equity per win
export const QUIZ: [BuffKind, number][] = [['quiz', 0.1], ['genius', 0.25]];
export const boardBonus = (s: GameState, r: RegionId = 0) => 1 + 0.06 * (r === 0 ? s.room.board : s.room.shuffle) + (r === 1 ? Math.max(0, ...QUIZ.filter(([b]) => buffOn(s, b)).map(([, v]) => v)) : 0);
const rentCost = (sec: number, r: RegionId = 0) => (s: GameState): Cost => ({ cur: 'cash', n: Math.max(1, Math.round(rent(s, r) * sec)) });

export const BUFFS: Record<BuffKind, { name: string; does: string }> = {
  bat: { name: 'Plush Bat', does: '+30% crew damage' },
  duck: { name: 'Rubber Duck', does: '+30% crew HP' },
  troll: { name: 'Troll Doll', does: 'walk-ins pay double' },
  ball: { name: 'Bouncy Ball', does: 'a free 30s rally' },
  watch: { name: 'Gold Watch', does: '5 free Overtime fights' },
  well: { name: 'Jacks or Better', does: '+10% crew damage' },
  call: { name: 'Three of a Kind', does: '+20% crew damage' },
  top: { name: 'Full House', does: '+30% crew damage and HP' },
  royal: { name: 'Royal Flush', does: '+50% crew damage and HP' },
  quiz: { name: 'Three Right', does: '+10% Equity per win' },
  genius: { name: 'Five for Five', does: '+25% Equity per win' },
};
export const BUFF_SECONDS = 600;
// the bar's buffs, by poker hand: [kind, seconds, damage, HP]
export const BAR_BUFFS: [BuffKind, number, number, number][] = [['well', 300, 0.1, 0], ['call', 480, 0.2, 0], ['top', 600, 0.3, 0.3], ['royal', 900, 0.5, 0.5]];
export const BAR_HOUSE: [string, number][] = [['MO', 10], ['TERRI', 13], ['GUS', 16], ['BIG AL', 19], ['RAY', 22]];
export const SHUFFLE_TOP = 24;
export const POKER_HANDS = ['NOTHING', 'JACKS OR BETTER', 'THREE OF A KIND', 'FULL HOUSE', 'ROYAL FLUSH'];
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

// every machine needs its room leased first
const funZone = (s: GameState) => !!s.crews[0].shops.funzone;
const offRamp = (s: GameState) => !!s.crews[1].shops.offramp;
const fz = (f: (s: GameState) => boolean) => (s: GameState) => funZone(s) && f(s);
const or = (f: (s: GameState) => boolean) => (s: GameState) => offRamp(s) && f(s);
const bypassRent = (s: GameState) => rent(s, 1);
export const MACHINES: MachineDef[] = [
  {
    id: 'pusher', region: 0, name: 'Coin Pusher', blurb: 'Drop it in front of the pile.', needs: 'Lease the Fun Zone', unlock: funZone, cost: rentCost(5), secs: 4, cool: 120,
    pay: (s, q) => {
      const cost = rent(s, 0) * 5;
      const pile = s.room.shelf[0] / 10;
      if (q > 0.9 && pile > 0.5 && rand(s) < 0.08) return { cash: rent(s, 0) * 120, big: true, text: 'A Rent Check coin went over the edge.' };
      return { cash: cost * (0.4 + 2.6 * q) * (0.4 + 0.6 * pile), text: q > 0.7 ? 'Clean drop.' : 'Bounced.' };
    },
  },
  {
    id: 'whac', region: 0, name: 'Whac-a-Shoplifter', blurb: 'Bonk shoplifters. Not customers.', needs: 'Capture Big-Box Plaza', unlock: fz((s) => cleared(s, 0, 1, REGIONS[0].lots[1].fights)), cost: rentCost(20), secs: 32, cool: 0,
    pay: (s, q) => ({ goodwill: winPay(s, 0) * 0.5 * Math.round(30 * q), text: `${Math.round(30 * q)} bonks.` }),
  },
  {
    id: 'skee', region: 0, name: 'Skee-Ball', blurb: 'Nine balls. Hold for power.', needs: 'Clear fight 6 at the Outlet Mall', unlock: fz((s) => cleared(s, 0, 2, 5)), cost: rentCost(15), secs: 25, cool: 60,
    pay: (_s, q) => (q >= 1 ? { tickets: 140, big: true, text: '450 or better. The machine sings.' } : { tickets: Math.round(10 + 30 * q), text: `${Math.round(450 * q)} points.` }),
  },
  {
    id: 'claw', region: 0, name: 'Claw Machine', blurb: 'Press to go. Press to drop.', needs: 'Capture the Outlet Mall', unlock: fz((s) => cleared(s, 0, 2, REGIONS[0].lots[2].fights)), cost: () => ({ cur: 'tickets', n: 50 }), secs: 10, cool: 60,
    pay: (s, q) => {
      if (rand(s) > q) return { text: 'It slipped. It always slips.' };
      const roll = rand(s);
      const buff: BuffKind = roll < 0.06 ? 'watch' : roll < 0.37 ? 'bat' : roll < 0.68 ? 'duck' : roll < 0.86 ? 'troll' : 'ball';
      return { buff, big: true, text: `Got the ${BUFFS[buff].name}: ${BUFFS[buff].does}.` };
    },
  },
  {
    id: 'pinball', region: 0, name: 'Night Shift', blurb: 'Pinball. Left half, right half.', needs: 'Capture Sunrise Office Park', unlock: fz((s) => cleared(s, 0, 3, REGIONS[0].lots[3].fights)), cost: rentCost(20), secs: 70, cool: 0,
    pay: (s, q) => ({ goodwill: winPay(s, 0) * 8 * q, text: `${Math.round(PINBALL_TOP * q).toLocaleString('en-US')} points.` }),
  },
  {
    id: 'cyclone', region: 0, name: 'Cyclone', blurb: 'Stop it on the jackpot.', needs: 'Clear fight 9 at Pinewood Commons', unlock: fz((s) => cleared(s, 0, 5, 8)), cost: rentCost(15), secs: 6, cool: 600,
    pay: (s, q) => {
      if (q >= 1) return { tickets: s.room.jackpot, big: true, text: `JACKPOT. ${s.room.jackpot} tickets.` };
      return { tickets: q >= 0.5 ? 50 : 2 + Math.floor(rand(s) * 9), text: q >= 0.5 ? 'One light off.' : 'Missed.' };
    },
  },
  // ---- The Off-Ramp, on the Bypass ----
  {
    id: 'darts', region: 1, name: 'Darts', blurb: 'Three darts. Click when it drifts over the bull.', needs: 'Lease the Off-Ramp', unlock: offRamp, cost: rentCost(15, 1), secs: 8, cool: 60,
    pay: (s, q) => {
      const pot = s.room.shelf[1] / 10;
      if (q >= 1 && pot > 0.5) return { cash: bypassRent(s) * 120, big: true, text: 'Three in the bull. The bar goes quiet.' };
      return { cash: bypassRent(s) * 15 * (0.4 + 2.6 * q) * (0.4 + 0.6 * pot), text: q > 0.6 ? 'Good darts.' : 'Wall.' };
    },
  },
  {
    id: 'pool', region: 1, name: 'Pool', blurb: 'Drag back from the cue ball. Six shots.', needs: 'Capture the Exit 14 Power Center', unlock: or((s) => cleared(s, 1, 0, REGIONS[1].lots[0].fights)), cost: rentCost(20, 1), secs: 45, cool: 180,
    pay: (s, q) => {
      const balls = Math.round(q * 6);
      if (q >= 1) return { equity: winPay(s, 1) * 10 + 5 * (FIGHTS[1][Math.min(s.crews[1].frontier, FIGHTS[1].length - 1)].zone + 1), big: true, text: 'Ran the rack.' };
      return { equity: winPay(s, 1) * 1.2 * balls, text: `${balls} down.` };
    },
  },
  {
    id: 'poker', region: 1, name: 'Video Poker', blurb: 'Jacks or Better. Click to hold, then draw.', needs: 'Clear fight 6 at the Corporate Campus', unlock: or((s) => cleared(s, 1, 1, 5)), cost: rentCost(10, 1), secs: 10, cool: 600,
    pay: (_s, q) => {
      const tier = Math.round(q * 4);
      if (!tier) return { text: 'Nothing.' };
      const [buff, sec] = BAR_BUFFS[tier - 1];
      return { buff, big: tier === 4, text: `${POKER_HANDS[tier]}: ${BUFFS[buff].does} for ${sec / 60} min.` };
    },
  },
  {
    id: 'foos', region: 1, name: 'Foosball', blurb: 'First to five. Move to line up a man, click to shoot.', needs: 'Capture the Corporate Campus', unlock: or((s) => cleared(s, 1, 1, REGIONS[1].lots[1].fights)), cost: rentCost(20, 1), secs: 60, cool: 0,
    pay: (s, q) => ({ equity: winPay(s, 1) * 8 * q, big: q >= 1, text: q >= 1 ? 'Five-nothing. They want a rematch.' : `${Math.round(q * 5)} goals.` }),
  },
  {
    id: 'shuffle', region: 1, name: 'Shuffleboard', blurb: 'Six pucks. Hold for power. The far end is worth more.', needs: 'Capture Town Center, Phase II', unlock: or((s) => cleared(s, 1, 2, REGIONS[1].lots[2].fights)), cost: rentCost(15, 1), secs: 30, cool: 0,
    pay: (s, q) => ({ equity: winPay(s, 1) * 2 * q, text: `${Math.round(q * SHUFFLE_TOP)} points.` }),
  },
  {
    id: 'trivia', region: 1, name: 'Bar Trivia', blurb: 'Five questions. Faster is more points.', needs: 'Clear fight 6 at the Bypass Galleria', unlock: or((s) => cleared(s, 1, 3, 5)), cost: rentCost(10, 1), secs: 50, cool: 600,
    pay: (_s, q) => {
      const right = Math.round(q * 5);
      if (right >= 5) return { buff: 'genius', big: true, text: `Five for five: ${BUFFS.genius.does} for 10 min.` };
      if (right >= 3) return { buff: 'quiz', text: `${right} right: ${BUFFS.quiz.does} for 10 min.` };
      return { text: `${right} right. The regulars are not impressed.` };
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
  if (MACHINE[id].region === 1) return { cur: 'cash', n: Math.round(rent(s, 1) * (lv === 1 ? 1800 : 5400)) }; // no tickets at the bar
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
  if (id === 'pusher' || id === 'darts') s.room.shelf[id === 'pusher' ? 0 : 1] = Math.max(0, s.room.shelf[id === 'pusher' ? 0 : 1] - 1);
  if (id === 'cyclone') s.room.jackpot = q >= 1 ? 500 : s.room.jackpot + 5;
  if (rw.big && m.cool) s.room.cool[id] = s.totalTime + m.cool;
  s.room.plays++;
  if (!quiet && rw.big) log(s, r, `${m.name}: ${rw.text}`, 'win');
  return rw;
}

// Shuffleboard: same deal for Equity; beating the third house score adds a Bypass fighter slot.
export function postShuffle(s: GameState, score: number): number {
  s.room.shuffleBest = Math.max(s.room.shuffleBest, score);
  const beat = BAR_HOUSE.filter(([, v]) => s.room.shuffleBest > v).length;
  const gained = beat - s.room.shuffle;
  if (gained > 0) {
    s.room.shuffle = beat;
    log(s, 1, `Shuffleboard: ${BAR_HOUSE[beat - 1][0]} is off the board. Equity per win +${Math.round(0.06 * beat * 100)}%.${beat >= 3 && beat - gained < 3 ? ' And a fighter slot.' : ''}`, 'capture');
  }
  return gained;
}
export const barDmg = (s: GameState) => 1 + Math.max(0, ...BAR_BUFFS.filter(([b]) => buffOn(s, b)).map(([, , d]) => d));
export const barHp = (s: GameState) => 1 + Math.max(0, ...BAR_BUFFS.filter(([b]) => buffOn(s, b)).map(([, , , h]) => h));

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
  delete s.room.hands[b]; // the cabinet writes the real hand back after
  const c = s.crews[0];
  if (b === 'ball') c.rally = Math.max(c.rally, 30);
  else if (b === 'watch') c.overtime += 5;
  else s.room.buffs[b] = BAR_BUFFS.find(([k]) => k === b)?.[1] ?? BUFF_SECONDS;
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
  R.shelf = R.shelf.map((x) => Math.min(10, x + dt / 60)) as [number, number];
  for (const id of Object.keys(R.attract) as MachineId[]) {
    const lv = R.attract[id] ?? 0;
    if (!lv) continue;
    R.clock[id] = (R.clock[id] ?? 0) + dt;
    if (R.clock[id]! < ATTRACT_EVERY[lv]) continue;
    R.clock[id] = 0;
    if (startPlay(s, id) !== null) continue;
    const q = id === 'cyclone' ? (rand(s) < 0.04 ? 1 : rand(s) < 0.15 ? 0.5 : 0) : id === 'poker' ? pokerQ(s, false) : ATTRACT_SKILL * (0.6 + 0.8 * rand(s));
    if (id === 'shuffle') postShuffle(s, Math.round(q * SHUFFLE_TOP));
    endPlay(s, id, q, true);
  }
}

// A video poker hand for players who aren't at the machine (Attract Mode, the bot): Jacks or Better odds, held well or not.
export function pokerQ(s: GameState, good: boolean) {
  const x = rand(s);
  const [royal, top, call, well] = good ? [0.0005, 0.035, 0.2, 0.62] : [0.0001, 0.012, 0.09, 0.4];
  return x < royal ? 1 : x < top ? 0.75 : x < call ? 0.5 : x < well ? 0.25 : 0;
}
