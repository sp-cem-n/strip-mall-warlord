import type { RegionId, Role, Tell, WalkInKind } from './defs';
import type { RoomState } from './room';

export interface Unit {
  uid: number;
  side: 'crew' | 'enemy';
  id: string; // battler id, or enemy name
  role: Role | 'enemy';
  name: string;
  maxHp: number;
  hp: number;
  dmg: number; // heal amount for healers
  interval: number;
  cooldown: number;
  dr: number; // damage reduction
  twin: boolean;
  weak: string | null; // enemies only
  tell: Tell;
  boss: boolean;
  flash: number; // seconds left of "just hit"
  lastDmg: number;
  lastWeak: boolean;
  acted: number;
  aim: number; // enemies: hits thrown so far, for the spread rotation
}

// Auras, compiled when a fight starts.
export interface Field {
  mark: number;
  slow: number;
  weaken: number;
  stun: number;
  confuse: number;
  regen: number;
  revive: number;
  payUp: number;
}

export interface Battle {
  fight: number; // index into FIGHTS[region]
  t: number;
  crew: Unit[];
  enemies: Unit[];
  field: Field;
  revived: boolean;
  fresh: boolean; // the crew started at full HP
  enter: number; // seconds left of the enemies walking in
}

export interface LogLine {
  t: number;
  r: RegionId;
  text: string;
  tone: 'win' | 'loss' | 'info' | 'capture';
  n?: number;
  live?: boolean; // the running fight line: the next one replaces it
}

export type Track = Record<Role, number>;

// One region's crew: its own shops, till, training and place on the fight ladder.
export interface Crew {
  cash: number;
  shops: Record<string, number>; // leased shops -> renovation level
  train: Track; // Route 9: bought with Goodwill. The Bypass: bought with Equity.
  frontier: number; // first fight not yet cleared (== ladder length when the region is done)
  at: number; // the fight the crew is on; always <= frontier
  kills: number; // wins on the frontier fight
  farmed: number; // wins below the frontier since the last try
  tries: number; // losses at the frontier since it last moved
  wounds: Record<string, number>; // share of HP each fighter is missing; carries over between fights until a smoke break
  battle: Battle | null;
  regroup: number; // seconds until the next fight
  smoke: number; // length of the current smoke break (0 = the next group is just walking in)
  lineup: string[] | null; // fighters you picked for the lot; null = the auto pick
  contracts: number[]; // lots with a patrol (auto-advance, and a lost wall drops back to a winnable fight)
  parked: boolean; // the player stepped down with ◂: the patrol doesn't climb until ▸ or the next clear
  slotBuys: number; // fighter slots bought in the Back Office
  rally: number; // seconds left
  wins: number;
  losses: number;
  queueEnter: number; // next group walking in behind the current fight; -1 = none, 0 = waiting in line
  deck: number; // the fight that group is from
  rec: Record<number, number[]>; // per fight, the last RECORD_KEEP outcomes as [won, pay, seconds since the fight before ended]
  lastEnd: number; // totalTime when the last fight ended, -1 before the first
}

export interface GameState {
  version: number;
  seed: number;
  time: number; // sim seconds this run of Route 9
  totalTime: number; // all runs
  goodwill: number;
  equity: number;
  tickets: number; // arcade tickets (Route 9's Fun Zone)
  room: RoomState; // the Fun Zone (and the bar): survives paving
  asphalt: number;
  paves: number;
  crews: [Crew, Crew];
  view: RegionId; // which crew you're watching and managing
  bypass: boolean; // region 2 found (survives paving)
  ending: 0 | 1 | 2; // a win card waiting to be seen (region + 1)
  log: LogLine[];
  stats: { earned: number; goodwill: number; equity: number; banked: number; relit?: number }; // equity = from Bypass wins, banked = from Goodwill; relit = dead sign letters clicked back on
  savedAt: number;
  nextUid: number;
  find: { shop: string; kind: WalkInKind; name: string; left: number } | null; // walk-in, only while you're watching
  findClock: number;
  consultants: [number[], number[]]; // lots a consultant renovates, per region
  landmarks: string[]; // one entry per landmark put up; they stack
  blitz: Record<string, number>;
}
