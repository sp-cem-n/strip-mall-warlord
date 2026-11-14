// Every pacing number. docs/V06_DESIGN.md mirrors these. Env overrides exist only for balance sweeps (bun); the browser uses the defaults.
const env = (k: string, d: number) => Number((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env[k] ?? d);
export const START_CASH = 10;
export const KILL_RAMP = 1.1; // wins needed grows 10% per fight inside a lot
export const FIGHT_GROWTH = [env('SMW_G0', 1.066), env('SMW_G1', 1.12)] as const; // enemy HP and damage per fight, across a region
export const LOT_JUMP = [env('SMW_J0', 1.3), env('SMW_J1', 1.5)] as const; // extra step at each new lot
export const PAY_BASE = [2, 0.2] as const; // Goodwill / Equity per win at a region's first fight. Bypass wins pay thin: most Equity comes from the bank.
export const PAY_GROWTH = [1.06, env('SMW_P1', 1.09)] as const; // per fight, across the region
export const BOSS_PAY = 25; // a boss win pays this many wins' worth
export const WEAK_BONUS = 0.25;
export const RENO_GROWTH = 1.35;
export const RENT_GROWTH = 1.15;
export const STAT_GROWTH = 1.1;
export const TRAIN_STEP = 0.05; // per Goodwill track level
export const TRAIN_BASE = [20, 2] as const; // Goodwill (Route 9) / Equity (Bypass)
export const TRAIN_GROWTH = 1.3;
export const GOODWILL_PER_EQUITY = env('SMW_R', 10); // conversion: Goodwill buys Equity, one way
export const ASPHALT_BONUS = env('SMW_A', 0.02); // per asphalt: Route 9 rent, stats and Goodwill
export const SECURITY_LEVELS = (zone: number) => 1 + 5 * (zone - 1); // Security Office level that covers a lot (lot 1 is free)
export const STANCE = { even: { hp: 1, dmg: 1 }, rush: { hp: 0.8, dmg: 1.3 }, dig: { hp: 1.3, dmg: 0.8 } } as const;
export type Stance = keyof typeof STANCE;
export const TELL = { tanky: { hp: 1.4, dmg: 0.8 }, hard: { hp: 0.8, dmg: 1.3 } } as const;
export const OVERTIME_SECONDS = 120; // costs this many seconds of the region's rent
export const OVERTIME_FIGHTS = 3;
export const OVERTIME_BOOST = 0.25; // +HP and +damage
export const RETRY_AFTER = 10; // farmed wins before auto-advance tries the frontier again
export const FALL_BACK_AFTER = 3;
export const REGROUP_SECONDS = 1.5;
export const FIGHT_TIMEOUT = 30;
export const WALKIN_EVERY = 90;
export const WALKIN_STAYS = 25;
export const RALLY_SECONDS = 30;
export const RALLY_BOOST = 0.25;
export const TIP_SECONDS = 30; // cash walk-in: this much rent
export const REFERRAL_WINS = 10; // referral walk-in: this many wins' pay
export const OFFLINE_CAP_SECONDS = 8 * 3600;
export const STEP = 0.2;
