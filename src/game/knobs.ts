// Every pacing number. docs/V06_DESIGN.md mirrors these. Env overrides exist only for balance sweeps (bun); the browser uses the defaults.
const env = (k: string, d: number) => Number((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env[k] ?? d);
export const START_CASH = 10;
export const WINS_FIRST = 3; // wins to clear a regular fight at the start of a region...
export const WINS_LAST = 10; // ...growing evenly to this by its last fight. Bosses always need 1.
export const START_SLOTS = 5; // fighters on the lot; buffers stand on the curb and don't take one
export const MAX_SLOTS = 9;
export const SLOT_PRICES = [[env('SMW_SL0', 2000), env('SMW_SL1', 20000)], [50, 500, 20000]] as const; // Back Office slots: Goodwill (Route 9), Equity (the Bypass)
export const HARD_FOCUS = env('SMW_HF', 0.75); // share of a hard hitter's hits that go for the weakest
export const FRONT_SHARE = env('SMW_FS', 0.6); // enemy hits that go to the front tank; the rest land on anyone. Hard hitters and bosses pick the weakest.
const list = (k: string, d: number[]) => ((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env[k]?.split(',').map(Number) ?? d);
// Enemy HP and damage growth per fight, one entry per lot: steep while the plaza fills up, gentler once renovations get expensive.
export const FIGHT_GROWTH = [list('SMW_G0', [1.6, 1.07, 1.07, 1.07, 1.07, 1.07]), list('SMW_G1', [1.66, 1.0825, 1.0825, 1.0825])] as const;
// Optional explicit enemy strength per fight (balance tooling only): SMW_STR0=1,1.2,...
export const STRENGTH = [list('SMW_STR0', []), list('SMW_STR1', [])] as const;
export const LOT_JUMP = [list('SMW_J0', [2, 1.259, 1.103, 1.286, 0.619, 1.089]), list('SMW_J1', [2.5, 8.59, 1.01, 0.45])] as const; // step entering each lot (entry 0 scales the first fight)
export const PAY_BASE = [2, 0.2] as const; // Goodwill / Equity per win at a region's first fight. Bypass wins pay thin: most Equity comes from the bank.
export const PAY_GROWTH = [1.06, env('SMW_P1', 1.09)] as const; // per fight, across the region
export const BOSS_STRENGTH = env('SMW_BS', 1.15); // a boss is this much over the fight before it
export const BOSS_PAY = 25; // a boss win pays this many wins' worth
export const WEAK_BONUS = 0.25;
export const RENO_GROWTH = env('SMW_RG', 1.35);
export const RENT_GROWTH = env('SMW_RT', 1.2);
// A renovation grows the one thing a unit does, plus a little HP for anyone who isn't a tank.
export const TANK_HP_GROWTH = env('SMW_TH', 1.1);
export const MAIN_GROWTH = env('SMW_MG', 1.1); // damage dealers' hits, healers' heals, control's hits
export const SIDE_HP_GROWTH = env('SMW_SH', 1.08);
export const ENEMY_DMG = env('SMW_ED', 1); // enemy hits vs their HP: above 1 makes fights hurt more and last less
export const AURA_STEP = 0.04; // control and buffer auras: +4% of base per level
export const TRAIN_STEP = 0.05; // per Goodwill track level
export const TRAIN_BASE = [20, 2] as const; // Goodwill (Route 9) / Equity (Bypass)
export const TRAIN_GROWTH = 1.3;
export const GOODWILL_PER_EQUITY = env('SMW_R', 10); // conversion: Goodwill buys Equity, one way
export const ASPHALT_BONUS = env('SMW_A', 0.02); // per asphalt: Route 9 rent, stats and Goodwill
export const PATROL_DISCOUNT = 0.05; // per Security Office level, off every Patrol contract
export const PATROL_DISCOUNT_CAP = 0.5;
// The play: Rush hits harder and takes more; Dig In hits softer and takes less. Damage carries over between fights, so it decides how long a streak lasts.
export const STANCE = { even: { taken: 1, dmg: 1 }, rush: { taken: 1.25, dmg: env('SMW_RD', 1.3) }, dig: { taken: 0.75, dmg: env('SMW_DD', 0.8) } } as const;
export type Stance = keyof typeof STANCE;
export const TELL = { tanky: { hp: 1.4, dmg: 0.8 }, hard: { hp: 0.8, dmg: 1.3 } } as const;
export const OVERTIME_SECONDS = 120; // costs this many seconds of the region's rent
export const OVERTIME_FIGHTS = 3;
export const OVERTIME_BOOST = 0.25; // +HP and +damage
export const RETRY_AFTER = 6; // farmed wins before the crew moves up a fight (or tries the frontier again)
export const SMOKE_BREAK_SECONDS = 5; // full heal: after a loss or when moving to a new fight
export const WALK_IN_SECONDS = 2; // during a streak the next group walks in from the back of the lot
export const FIGHT_TIMEOUT = 30;
export const WALKIN_EVERY = 90;
export const WALKIN_STAYS = 25;
export const RALLY_SECONDS = 30;
export const RALLY_BOOST = 0.25;
export const TIP_SECONDS = 30; // cash walk-in: this much rent
export const REFERRAL_WINS = 10; // referral walk-in: this many wins' pay
export const OFFLINE_CAP_SECONDS = 8 * 3600;
export const STEP = 0.2;
export const LOG_KEEP = 60; // receipt lines kept per crew
