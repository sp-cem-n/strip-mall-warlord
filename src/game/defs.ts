// Types and the assembled content. The content itself lives in content/*.ts, the numbers in knobs.ts.
import { DAWN } from './content/dawn';
import { BATTLER_LIST } from './content/battlers';
import { BYPASS, BYPASS_SHOPS } from './content/bypass';
import { BOSS } from './content/make';
import { ROUTE9, ROUTE9_SHOPS } from './content/route9';
import { BOSS_PAY, FIGHT_GROWTH, LOT_JUMP, PAY_BASE, PAY_GROWTH, STRENGTH, WINS_FIRST, WINS_LAST } from './knobs';
export * from './knobs';
export { WALKIN_NAMES } from './content/battlers';

export type Role = 'tank' | 'damage' | 'heal' | 'control' | 'buffer';
export const ROLES: Role[] = ['tank', 'damage', 'control', 'heal', 'buffer']; // front to back on the lot
export type RegionId = 0 | 1;
export type Target = 'all' | Role | string; // string = a battler id

// What a battler does besides hit or heal. Auras are set when a fight starts and last the fight.
export type Fx =
  | { k: 'mark'; v: number } // enemies take +v damage
  | { k: 'slow'; v: number } // enemies attack v slower
  | { k: 'weaken'; v: number } // enemies deal v less
  | { k: 'stun'; v: number } // chance an enemy loses its turn
  | { k: 'confuse'; v: number } // chance an enemy hits another enemy
  | { k: 'haste'; to: Target; v: number }
  | { k: 'dmgUp'; to: Target; v: number }
  | { k: 'hpUp'; to: Target; v: number }
  | { k: 'regen'; v: number } // tanks regain v of max HP per second
  | { k: 'revive'; v: number } // first ally down gets back up at v HP, once per fight
  | { k: 'twin' } // a second, smaller hit
  | { k: 'copy'; v: number } // copies the strongest other aura at v
  | { k: 'payUp'; v: number } // +v Goodwill / Equity per win
  | { k: 'dr'; v: number }; // takes v less damage

export interface BattlerDef {
  id: string;
  name: string;
  role: Role;
  hp: number;
  dmg: number; // heal amount for healers
  interval: number;
  fx?: Fx;
  does: string;
  line: string;
}


export const BATTLERS: Record<string, BattlerDef> = Object.fromEntries(BATTLER_LIST.map((b) => [b.id, b]));

export type WalkInKind = 'cash' | 'referral' | 'rally';
export interface ShopDef {
  id: string;
  name: string;
  battler: string;
  region: RegionId;
  zone: number; // lot that unlocks it
  fight: number; // fight index in that lot (== lot fights for the boss); -1 = you start with it
  lease: number; // Route 9: dollars. The Bypass: Equity.
  reno: number; // first renovation, in dollars
  rent: number; // $/s at level 1
  tagline: string;
  walkin: { kind: WalkInKind; who: string };
}

export type Tell = 'tanky' | 'hard' | null; // tanky: +40% HP, -20% dmg. hard: +30% dmg, -20% HP.
export interface EnemyDef {
  name: string;
  tell: Tell;
  title: string;
  hp: number;
  dmg: number;
  interval: number;
  weak: string; // battler id; +25% from them
}
export interface LotDef {
  id: string;
  name: string;
  short: string;
  blurb: string;
  fights: number; // regular fights; the boss comes after
  patrol: number; // patrol price, in that region's dollars
  regulars: EnemyDef[];
  boss: EnemyDef & { joins: string };
  clearText: string;
}

// Every currency in the game goes through the purse helpers in economy.ts.
export type Currency = 'cash' | 'goodwill' | 'equity';
export const CURRENCY_NAME: Record<Currency, string> = { cash: 'cash', goodwill: 'Goodwill', equity: DAWN.equity };
export const CURRENCY_SHORT: Record<Currency, string> = { cash: '$', goodwill: 'GW', equity: 'EQ' };

export interface RegionDef {
  id: RegionId;
  name: string;
  pay: Currency; // what wins pay
  leaseIn: Currency;
  trainIn: Currency;
  chrome: { plaza: string; mgmt: string; sub: string };
  start: string; // shop you start with
  lots: LotDef[];
  ending: string;
}

export const REGIONS: RegionDef[] = [ROUTE9, BYPASS];
export const SHOP_LIST: ShopDef[] = [...ROUTE9_SHOPS, ...BYPASS_SHOPS];
for (const sh of SHOP_LIST) if (sh.fight === BOSS) sh.fight = REGIONS[sh.region].lots[sh.zone].fights;
export const SHOPS: Record<string, ShopDef> = Object.fromEntries(SHOP_LIST.map((s) => [s.id, s]));

// ---- the fight ladder: every region flattened into one list ----
export interface FightDef {
  region: RegionId;
  zone: number;
  i: number; // index inside the lot; i === lot.fights is the boss
  boss: boolean;
  need: number;
  pay: number;
  strength: number;
}
export const FIGHTS: FightDef[][] = REGIONS.map((r) => {
  const out: FightDef[] = [];
  const n = r.lots.reduce((a, l) => a + l.fights + 1, 0);
  let str = LOT_JUMP[r.id][0] / FIGHT_GROWTH[r.id][0];
  r.lots.forEach((lot, zone) => {
    if (zone) str *= LOT_JUMP[r.id][zone];
    for (let i = 0; i <= lot.fights; i++) {
      str *= FIGHT_GROWTH[r.id][zone];
      const boss = i === lot.fights;
      const g = out.length;
      const per = PAY_BASE[r.id] * PAY_GROWTH[r.id] ** g;
      out.push({ region: r.id, zone, i, boss, need: boss ? 1 : Math.round(WINS_FIRST + ((WINS_LAST - WINS_FIRST) * g) / (n - 1)), pay: Math.max(1, Math.round(boss ? per * BOSS_PAY : per)), strength: STRENGTH[r.id][g] ?? str });
    }
  });
  return out;
});
export const fightIndex = (region: RegionId, zone: number, i: number) => FIGHTS[region].findIndex((f) => f.zone === zone && f.i === i);
