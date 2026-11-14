// All tunable numbers live here. DESIGN.md mirrors these; change both together.

export type ShopKind = 'dojo' | 'vape' | 'laundromat' | 'pawn' | 'payday';
export type FighterKind = 'bouncer' | 'hustler' | 'medic' | 'fixer' | 'lawyer';

export interface ShopDef {
  kind: ShopKind;
  name: string;
  fighter: FighterKind;
  openCost: number; // also the cost to rebrand a storefront into this
  income: number; // $/s at storefront level 1
}

export const SHOPS: Record<ShopKind, ShopDef> = {
  dojo: { kind: 'dojo', name: 'Dojo', fighter: 'bouncer', openCost: 15, income: 1 },
  vape: { kind: 'vape', name: 'Vape Shop', fighter: 'hustler', openCost: 50, income: 2 },
  laundromat: { kind: 'laundromat', name: 'Laundromat', fighter: 'medic', openCost: 200, income: 3 },
  pawn: { kind: 'pawn', name: 'Pawn Shop', fighter: 'fixer', openCost: 800, income: 8 },
  payday: { kind: 'payday', name: 'Payday Loans', fighter: 'lawyer', openCost: 4000, income: 35 },
};
export const SHOP_ORDER: ShopKind[] = ['dojo', 'vape', 'laundromat', 'pawn', 'payday'];
export const START_SHOPS: ShopKind[] = ['dojo', 'vape', 'laundromat'];

export interface FighterDef {
  kind: FighterKind;
  name: string;
  plural: string;
  hp: number;
  dmg: number; // medics: heal amount
  interval: number;
  does: string; // one line, shown on the storefront
}

export const FIGHTERS: Record<FighterKind, FighterDef> = {
  bouncer: { kind: 'bouncer', name: 'Bouncer', plural: 'Bouncers', hp: 130, dmg: 4, interval: 1.4, does: 'Stands in front. Enemies hit the front first.' },
  hustler: { kind: 'hustler', name: 'Hustler', plural: 'Hustlers', hp: 50, dmg: 9, interval: 1.0, does: 'Fast and fragile. Out-talks contract security.' },
  medic: { kind: 'medic', name: 'Medic', plural: 'Medics', hp: 60, dmg: 15, interval: 1.6, does: 'Patches up whoever is worst off. Never attacks.' },
  fixer: { kind: 'fixer', name: 'Fixer', plural: 'Fixers', hp: 75, dmg: 14, interval: 1.4, does: 'Knows a guy. Handles retail and management.' },
  lawyer: { kind: 'lawyer', name: 'Lawyer', plural: 'Lawyers', hp: 55, dmg: 26, interval: 2.2, does: 'Slow, huge hits. Paperwork beats paperwork.' },
};
// Front-to-back marching order inside the crew.
export const FRONT_ORDER: FighterKind[] = ['bouncer', 'fixer', 'hustler', 'lawyer', 'medic'];

export const WEAK_MULT = 2.5; // the enemy's weak-to type hits this hard
export const RESIST_MULT = 0.5; // everyone else

export interface EnemyDef {
  name: string;
  title: string;
  hp: number;
  dmg: number;
  interval: number;
  weak: FighterKind;
}

export interface ZoneDef {
  id: string;
  name: string;
  blurb: string;
  rows: number; // last row is the boss
  strength: number;
  regulars: EnemyDef[];
  boss: EnemyDef;
  captureSlots: number;
  unlocks: ShopKind | null;
  captureText: string;
}

export const ZONES: ZoneDef[] = [
  {
    id: 'lot',
    name: 'The Parking Lot',
    blurb: 'Faded lines, one working lamp post, a shopping cart nobody owns.',
    rows: 5,
    strength: 2,
    regulars: [
      { name: 'Rent-a-Cop', title: 'Contract Security, Part-Time', hp: 40, dmg: 4, interval: 1.6, weak: 'hustler' },
      { name: 'Lot Attendant', title: 'Parking Enforcement Associate I', hp: 30, dmg: 5, interval: 1.4, weak: 'hustler' },
    ],
    boss: { name: 'Night Shift Supervisor', title: 'Has a clipboard. Uses it.', hp: 200, dmg: 8, interval: 1.6, weak: 'hustler' },
    captureSlots: 1,
    unlocks: 'pawn',
    captureText: 'The old Blockbuster on the end cap is yours. Smells like carpet.',
  },
  {
    id: 'bigbox',
    name: 'Big-Box Plaza',
    blurb: 'A Circuit City husk and a grocery that keeps changing names.',
    rows: 6,
    strength: 2.6,
    regulars: [
      { name: 'Loss Prevention Associate', title: 'Watches the monitors. Sometimes leaves the room.', hp: 45, dmg: 5, interval: 1.5, weak: 'fixer' },
      { name: 'Rent-a-Cop (Senior)', title: 'Contract Security, Full-Time w/ Dental', hp: 60, dmg: 4, interval: 1.6, weak: 'hustler' },
    ],
    boss: { name: 'District Loss Prevention Manager', title: 'Oversees eleven stores and a golf cart.', hp: 260, dmg: 9, interval: 1.5, weak: 'fixer' },
    captureSlots: 2,
    unlocks: 'payday',
    captureText: 'Two storefronts by the Circuit City. One still has the sign.',
  },
  {
    id: 'outlet',
    name: 'Outlet Mall',
    blurb: 'Seventy percent off, permanently. The fountain is off to save water.',
    rows: 7,
    strength: 7,
    regulars: [
      { name: 'Code Enforcement Officer', title: 'Municipal Code §14-210, Signage', hp: 55, dmg: 5, interval: 1.5, weak: 'lawyer' },
      { name: 'HOA President', title: 'Unpaid. Very motivated.', hp: 45, dmg: 7, interval: 1.7, weak: 'lawyer' },
    ],
    boss: { name: 'Outlet Mall General Manager', title: 'Has a lanyard with four keycards.', hp: 320, dmg: 10, interval: 1.5, weak: 'fixer' },
    captureSlots: 2,
    unlocks: null,
    captureText: 'A former Bath & Body Works and a kiosk. The kiosk counts.',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Center',
    blurb: 'Open-air. Fake brick. A Cheesecake Factory with a two-hour wait.',
    rows: 8,
    strength: 18,
    regulars: [
      { name: 'Developer Private Security', title: 'Paid by the developer. Paid well.', hp: 65, dmg: 6, interval: 1.4, weak: 'hustler' },
      { name: 'Placemaking Consultant', title: 'Explains the vision. Also hits people.', hp: 50, dmg: 7, interval: 1.6, weak: 'fixer' },
    ],
    boss: { name: 'Regional Property Manager', title: 'Oversees “the portfolio.” Has never been inside a dojo.', hp: 420, dmg: 12, interval: 1.4, weak: 'lawyer' },
    captureSlots: 3,
    unlocks: null,
    captureText: 'The whole region answers to you now. The Cheesecake Factory still has a wait.',
  },
];

export const HOME_UNITS = 4;
export const START_CASH = 20;

// Renovation belongs to the storefront, not the shop: rebranding keeps the level.
export const RENOVATE_BASE = 20;
export const RENOVATE_GROWTH = 1.35; // cost = base * growth^(level-1)
export const INCOME_GROWTH = 1.15; // income = shop income * growth^(level-1)
export const STAT_GROWTH = 1.1; // fighter hp/dmg = base * growth^(level-1)

export const ROW_GROWTH = 0.22; // enemy stats +22% per row inside a lot
export const HEAT_PER_PAYDAY_LEVEL = 0.02; // +2% enemy strength per Payday level owned
export const REGROUP_SECONDS = 3;
export const SMOKE_BREAK_AFTER = 3; // straight losses on one row
export const SMOKE_BREAK_SECONDS = 60; // first break; doubles each further loss (cap 15 min) until you change something
export const WALKIN_EVERY = 90; // seconds between walk-ins, only while the game is open
export const WALKIN_STAYS = 25;
export const WALKIN_BOOST = 0.5; // +50% crew damage
export const WALKIN_SECONDS = 60;
export const WALKIN_ITEMS = ['Aluminum Bat', 'Maglite (4-cell)', 'Carhartt Jacket', 'Case of Red Bull', 'Nextel Chirp Phone', 'Letterman Jacket', 'Tire Iron', 'Discman w/ Anti-Skip', 'Rollerblades', 'Pager (Clip-On)'];
export const FIGHT_TIMEOUT = 30; // stalemate counts as a loss

export const ASPHALT_BONUS = 0.02; // +2% income and crew stats per asphalt
export const PRESTIGE_MIN_ZONE = 2; // lots captured before you can bulldoze
export const OFFLINE_CAP_SECONDS = 8 * 3600;
export const STEP = 0.2;
