import type { FighterKind, ShopKind } from './defs';

export interface Slot {
  id: number;
  label: string;
  level: number; // renovations belong to the building
  shop: ShopKind | null;
}

export interface Unit {
  uid: number;
  side: 'crew' | 'enemy';
  kind: FighterKind | 'enemy';
  name: string;
  title: string;
  maxHp: number;
  hp: number;
  dmg: number; // heal amount for medics
  interval: number;
  cooldown: number;
  weak: FighterKind | null; // enemies only
  boss: boolean;
  flash: number; // seconds left of "just hit"
  lastDmg: number; // last damage taken, shown while flashing
  acted: number;
}

export interface Battle {
  zone: number;
  row: number;
  t: number;
  crew: Unit[];
  enemies: Unit[];
}

export interface LogLine {
  t: number;
  text: string;
  tone: 'win' | 'loss' | 'info' | 'capture';
  n?: number;
}

export interface GameState {
  version: number;
  seed: number;
  time: number; // sim seconds this run
  totalTime: number; // all runs
  cash: number;
  asphalt: number;
  bulldozes: number;
  slots: Slot[];
  zone: number; // lots captured == index of current lot
  row: number;
  battle: Battle | null;
  regroup: number;
  log: LogLine[];
  stats: { wins: number; losses: number; earned: number };
  savedAt: number;
  nextUid: number;
  lastCapture: number;
}
