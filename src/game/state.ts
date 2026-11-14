import type { FighterKind, ShopKind } from './defs';

export interface Shop {
  kind: ShopKind;
  level: number;
  train: number; // 0..1 progress toward next fighter
}

export interface Slot {
  id: number;
  label: string; // "Unit 1", "Ex-Blockbuster"
  origin: 'home' | 'captured';
  leased: boolean;
  shop: Shop | null;
}

export type GearSlot = 'weapon' | 'armor' | 'kit';
export interface Gear {
  slot: GearSlot;
  name: string;
  bonus: number; // 0.1 = +10%
}

export interface Unit {
  uid: number;
  side: 'crew' | 'enemy';
  kind: FighterKind | 'enemy';
  name: string;
  title: string;
  maxHp: number;
  hp: number;
  dmg: number;
  interval: number;
  cooldown: number;
  dodge: number;
  heal: number;
  stunChance: number;
  dot: number;
  stunned: number;
  dotLeft: number;
  dotDps: number;
  boss: boolean;
  flash: number; // seconds left of "just hit" highlight
  acted: number; // seconds left of "just acted" highlight
}

export interface Battle {
  kind: 'wave' | 'raid';
  zone: number;
  wave: number;
  t: number;
  crew: Unit[];
  enemies: Unit[];
  debuff: number;
}

export interface LogLine {
  t: number;
  text: string;
  tone: 'win' | 'loss' | 'info' | 'hit' | 'capture';
}

export interface Stats {
  wins: number;
  losses: number;
  raidsWon: number;
  raidsLost: number;
  earned: number;
  rentPaid: number;
  trained: number;
}

export interface GameState {
  version: number;
  seed: number;
  time: number; // sim seconds this run
  totalTime: number; // sim seconds all runs
  cash: number;
  heat: number;
  asphalt: number;
  bulldozes: number;
  slots: Slot[];
  roster: Record<FighterKind, number>;
  gear: Record<GearSlot, Gear | null>;
  pawnClock: number;
  zone: number; // current zone index (== zones captured)
  wave: number; // current wave inside the zone
  battle: Battle | null;
  regroup: number;
  raidPending: boolean;
  log: LogLine[];
  stats: Stats;
  savedAt: number;
  nextUid: number;
  won: boolean; // region conquered
  lastCapture: number; // sim time of last capture this run
}
