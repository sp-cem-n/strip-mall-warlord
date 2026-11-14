// All tunable numbers live here. DESIGN.md mirrors these; change both together.

export type ShopKind = 'dojo' | 'vape' | 'laundromat' | 'pawn' | 'payday';
export type FighterKind = 'bouncer' | 'hustler' | 'medic' | 'fixer' | 'lawyer';

export interface ShopDef {
  kind: ShopKind;
  name: string;
  sign: string; // what is painted on the window
  fighter: FighterKind;
  openCost: number;
  upgradeBase: number; // cost of going 1 -> 2
  income: number; // $/s at level 1
  trainSeconds: number; // seconds per fighter at level 1
  heat: number; // heat/s at level 1 (payday only)
  blurb: string;
}

export const SHOPS: Record<ShopKind, ShopDef> = {
  dojo: {
    kind: 'dojo',
    name: 'Dojo',
    sign: 'KRAV MAGA • CARDIO KICKBOXING • FIRST CLASS FREE',
    fighter: 'bouncer',
    openCost: 15,
    upgradeBase: 12,
    income: 1.2,
    trainSeconds: 14,
    heat: 0,
    blurb: 'Rubber mats, one window unit. Graduates stand in front of things.',
  },
  vape: {
    kind: 'vape',
    name: 'Vape Shop',
    sign: 'CLOUD NINE VAPOR — WE BUY SNEAKERS',
    fighter: 'hustler',
    openCost: 60,
    upgradeBase: 45,
    income: 2.2,
    trainSeconds: 18,
    heat: 0,
    blurb: 'Half the inventory is resale. The staff talk fast and hit faster.',
  },
  laundromat: {
    kind: 'laundromat',
    name: 'Laundromat',
    sign: 'SUDS CITY COIN LAUNDRY — OPEN 24 HRS',
    fighter: 'medic',
    openCost: 300,
    upgradeBase: 220,
    income: 4,
    trainSeconds: 24,
    heat: 0,
    blurb: 'The overnight attendant is an EMT between shifts. Bring quarters.',
  },
  pawn: {
    kind: 'pawn',
    name: 'Pawn Shop',
    sign: 'GOLD • GUNS • GUITARS • NO QUESTIONS (SOME QUESTIONS)',
    fighter: 'fixer',
    openCost: 1400,
    upgradeBase: 1000,
    income: 9,
    trainSeconds: 30,
    heat: 0,
    blurb: 'Stock changes daily. The fixers know what everything is worth.',
  },
  payday: {
    kind: 'payday',
    name: 'Payday Loans',
    sign: 'CASH TODAY — NO CREDIT CHECK — SE HABLA ESPAÑOL',
    fighter: 'lawyer',
    openCost: 6000,
    upgradeBase: 4500,
    income: 40,
    trainSeconds: 36,
    heat: 0.04,
    blurb: 'Very good money. Draws attention. Comes with counsel.',
  },
};

export const SHOP_ORDER: ShopKind[] = ['dojo', 'vape', 'laundromat', 'pawn', 'payday'];

export interface FighterDef {
  kind: FighterKind;
  name: string;
  plural: string;
  role: string;
  hp: number;
  dmg: number;
  interval: number; // seconds between actions
  dodge: number;
  heal: number; // medics
  stunChance: number; // lawyers
  dot: number; // lawyers: lawsuit dmg/s for DOT_SECONDS
  blurb: string;
}

export const DOT_SECONDS = 5;
export const STUN_SECONDS = 1.6;

export const FIGHTERS: Record<FighterKind, FighterDef> = {
  bouncer: { kind: 'bouncer', name: 'Bouncer', plural: 'Bouncers', role: 'Front line', hp: 110, dmg: 5, interval: 1.4, dodge: 0, heal: 0, stunChance: 0, dot: 0, blurb: 'Off-duty MMA guy. Takes the hit so nobody else has to.' },
  hustler: { kind: 'hustler', name: 'Hustler', plural: 'Hustlers', role: 'Damage', hp: 45, dmg: 13, interval: 1.0, dodge: 0.25, heal: 0, stunChance: 0, dot: 0, blurb: 'Resells sneakers. Gone before the swing lands.' },
  medic: { kind: 'medic', name: 'Medic', plural: 'Medics', role: 'Support', hp: 55, dmg: 2, interval: 1.6, dodge: 0, heal: 14, stunChance: 0, dot: 0, blurb: 'EMT on the night shift. First-aid kit, two energy drinks.' },
  fixer: { kind: 'fixer', name: 'Fixer', plural: 'Fixers', role: 'Debuff', hp: 70, dmg: 7, interval: 1.3, dodge: 0.05, heal: 0, stunChance: 0, dot: 0, blurb: 'Knows a guy. Before the fight, the other side’s gear goes missing.' },
  lawyer: { kind: 'lawyer', name: 'Lawyer', plural: 'Lawyers', role: 'Control', hp: 60, dmg: 4, interval: 1.8, dodge: 0, heal: 0, stunChance: 0.3, dot: 6, blurb: 'Serves cease-and-desists in person. Files suits that bleed.' },
};

export const FIXER_DEBUFF_EACH = 0.08; // -8% enemy dmg & hp per fixer
export const FIXER_DEBUFF_CAP = 0.4;
export const BENCH_BONUS = 0.04; // +4% stats to a type's squad members per benched fighter of that type
export const SQUAD_SIZE = (zonesCaptured: number) => 4 + 2 * zonesCaptured; // 4, 6, 8, 10, 12

export interface EnemyDef {
  name: string;
  title: string; // dry job-title flavor
  hp: number;
  dmg: number;
  interval: number;
}

export interface ZoneDef {
  id: string;
  name: string;
  blurb: string;
  waves: number; // including the boss wave
  strength: number; // multiplier on enemy stats
  reward: number; // $ per win, scaled by wave
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
    waves: 5,
    strength: 2.4,
    reward: 20,
    regulars: [
      { name: 'Rent-a-Cop', title: 'Contract Security, Part-Time', hp: 40, dmg: 4, interval: 1.6 },
      { name: 'Lot Attendant', title: 'Parking Enforcement Associate I', hp: 30, dmg: 5, interval: 1.4 },
    ],
    boss: { name: 'Night Shift Supervisor', title: 'Has a clipboard. Uses it.', hp: 240, dmg: 9, interval: 1.6 },
    captureSlots: 1,
    unlocks: 'laundromat',
    captureText: 'The old Blockbuster on the end cap is yours. Smells like carpet.',
  },
  {
    id: 'bigbox',
    name: 'Big-Box Plaza',
    blurb: 'A Circuit City husk and a grocery that keeps changing names.',
    waves: 6,
    strength: 4,
    reward: 120,
    regulars: [
      { name: 'Loss Prevention Associate', title: 'Watches the monitors. Sometimes leaves the room.', hp: 45, dmg: 5, interval: 1.5 },
      { name: 'Rent-a-Cop (Senior)', title: 'Contract Security, Full-Time w/ Dental', hp: 60, dmg: 4, interval: 1.6 },
    ],
    boss: { name: 'District Loss Prevention Manager', title: 'Oversees eleven stores and a golf cart.', hp: 260, dmg: 9, interval: 1.5 },
    captureSlots: 2,
    unlocks: 'pawn',
    captureText: 'Two storefronts by the Circuit City. One still has the sign.',
  },
  {
    id: 'outlet',
    name: 'Outlet Mall',
    blurb: 'Seventy percent off, permanently. The fountain is off to save water.',
    waves: 7,
    strength: 10,
    reward: 700,
    regulars: [
      { name: 'Code Enforcement Officer', title: 'Municipal Code §14-210, Signage', hp: 55, dmg: 5, interval: 1.5 },
      { name: 'HOA President', title: 'Unpaid. Very motivated.', hp: 45, dmg: 7, interval: 1.7 },
    ],
    boss: { name: 'Outlet Mall General Manager', title: 'Has a lanyard with four keycards.', hp: 320, dmg: 10, interval: 1.5 },
    captureSlots: 2,
    unlocks: 'payday',
    captureText: 'A former Bath & Body Works and a kiosk. The kiosk counts.',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Center',
    blurb: 'Open-air. Fake brick. A Cheesecake Factory with a two-hour wait.',
    waves: 8,
    strength: 24,
    reward: 4000,
    regulars: [
      { name: 'Developer Private Security', title: 'Paid by the developer. Paid well.', hp: 65, dmg: 6, interval: 1.4 },
      { name: 'Placemaking Consultant', title: 'Explains the vision. Also hits people.', hp: 50, dmg: 7, interval: 1.6 },
    ],
    boss: { name: 'Regional Property Manager', title: 'Oversees “the portfolio.” Has never been inside a dojo.', hp: 420, dmg: 12, interval: 1.4 },
    captureSlots: 3,
    unlocks: null,
    captureText: 'The whole region answers to you now. The Cheesecake Factory still has a wait.',
  },
];

export const RAID: EnemyDef[] = [
  { name: 'Code Enforcement Officer', title: 'Here about the signage. And the loans.', hp: 55, dmg: 5, interval: 1.5 },
  { name: 'State Banking Examiner', title: 'Brought a laptop and a sandwich.', hp: 70, dmg: 6, interval: 1.6 },
];

// Home mall: units you lease with cash. Unit 0 is the one you inherit.
export const HOME_UNITS = 4;
export const LEASE_COSTS = [0, 120, 900, 5000];

export const START_CASH = 20;
export const UPGRADE_GROWTH = 1.5; // upgrade cost = upgradeBase * growth^(level-1)
export const LEVEL_INCOME = (level: number) => level * 2 ** Math.floor(level / 10);
export const LEVEL_STATS = (level: number) => 1.09 ** (level - 1);
export const FIGHTERS_PER_SHOP = (level: number) => 2 + Math.floor(level / 6);
export const TRAIN_SPEED = (level: number) => 1 + 0.08 * (level - 1);

export const WAVE_GROWTH = 0.22; // per wave inside a zone
export const LOSS_RENT = 0.5; // a loss costs half of what that fight would have paid
export const LOSS_RENT_MIN = 5;
export const REGROUP_SECONDS = 3;
export const LOSS_REGROUP_SECONDS = 8;
export const BATTLE_TIMEOUT = 30; // stalemate = loss

export const HEAT_DECAY = 0.05; // per second
export const HEAT_RAID_AT = 60;
export const HEAT_ENEMY_BONUS = 0.6; // at 100 heat, enemies +60%
export const RAID_HEAT_DROP = 35;

export const ASPHALT_BONUS = 0.1; // +10% shop speed (income + training) per asphalt
export const ASPHALT_CREW = 0.03; // +3% crew HP/damage per asphalt (packed-down ground, better footing)
export const PRESTIGE_MIN_ZONE = 2; // must have captured this many zones
export const OFFLINE_CAP_SECONDS = 8 * 3600;
export const STEP = 0.2; // fixed sim step in seconds
