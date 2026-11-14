import { BATTLERS, FALL_BACK_AFTER, FIGHTS, OFFLINE_CAP_SECONDS, RALLY_SECONDS, REFERRAL_WINS, REGIONS, REGROUP_SECONDS, SHOPS, SHOP_LIST, STEP, TIP_SECONDS, WALKIN_EVERY, WALKIN_NAMES, WALKIN_STAYS, type FightDef, type RegionId, type WalkInKind } from './defs';
import { pick } from './rng';
import { lossReason, startBattle, stepBattle } from './battle';
import { asphaltMult, autoCovers, available, currencyOf, earn, fightOf, leased, log, rentPerSec, retryAfter, topFight } from './economy';
import type { Battle, GameState } from './state';
import { fmt } from '../ui/format';

// One fixed step. Callers own their own time accumulators.
// `watching` is true only for the live game: walk-ins never happen offline or in the idle bot.
// Both crews are always on the clock; `view` only picks which one you manage.
export function step(s: GameState, watching = false) {
  s.time += STEP;
  s.totalTime += STEP;
  if (watching) walkIns(s);
  for (const r of s.bypass ? ([0, 1] as const) : ([0] as const)) {
    const c = s.crews[r];
    c.rally = Math.max(0, c.rally - STEP);
    const inc = rentPerSec(s, r) * STEP;
    c.cash += inc;
    s.stats.earned += inc;
    if (c.battle) {
      const result = stepBattle(s, c.battle, STEP, c.rally > 0);
      if (result) resolve(s, r, c.battle, result);
    } else if ((c.regroup -= STEP) <= 0) {
      if (!startBattle(s, r)) c.regroup = 1;
    }
  }
}

export const payFor = (s: GameState, r: RegionId, fight: FightDef = fightOf(s, r), payUp = 0) => fight.pay * (1 + payUp) * asphaltMult(s, r);
export function fightLabel(r: RegionId, idx: number) {
  const f = FIGHTS[r][idx];
  const lot = REGIONS[r].lots[f.zone];
  return f.boss ? (lot.boss.name.startsWith('The ') ? lot.boss.name : `the ${lot.boss.name}`) : `fight ${f.i + 1}/${lot.fights} at ${lot.name}`;
}

function resolve(s: GameState, r: RegionId, b: Battle, result: 'win' | 'loss') {
  const c = s.crews[r];
  c.battle = null;
  c.regroup = REGROUP_SECONDS;
  const ladder = FIGHTS[r];
  if (result === 'loss') {
    c.losses++;
    c.streak++;
    if (c.streak >= FALL_BACK_AFTER && c.at > 0) {
      c.at--;
      c.streak = 0;
      c.farmed = 0;
      log(s, r, `Lost ${fightLabel(r, b.fight)}. Falling back to farm ${fightLabel(r, c.at)}. ${lossReason(b, c.stance)}`, 'loss');
    } else {
      if (c.at === 0) c.regroup = 5;
      log(s, r, `Lost ${fightLabel(r, b.fight)}. ${lossReason(b, c.stance)}`, 'loss');
    }
    return;
  }
  c.wins++;
  c.streak = 0;
  const f = ladder[b.fight];
  const pay = payFor(s, r, f, b.field.payUp);
  earn(s, r, REGIONS[r].pay, pay);
  s.stats[REGIONS[r].pay as 'goodwill' | 'equity'] += pay;
  if (b.fight === c.frontier) {
    if (++c.kills < f.need) return log(s, r, `Won ${fightLabel(r, b.fight)}. ${c.kills}/${f.need} to move up.`, 'win');
    clearFight(s, r);
    return;
  }
  // farming below the frontier
  c.farmed++;
  log(s, r, `Won ${fightLabel(r, b.fight)}. +${fmt(pay)} ${currencyOf(r)}.`, 'win');
  const next = ladder[c.at + 1];
  if (!next || c.at + 1 > topFight(s, r) || !autoCovers(s, r, next.zone)) return;
  if (c.at + 1 < c.frontier || c.farmed >= retryAfter(s, r)) {
    c.at++;
    c.farmed = 0;
  }
}

function clearFight(s: GameState, r: RegionId) {
  const c = s.crews[r];
  const ladder = FIGHTS[r];
  const f = ladder[c.frontier];
  const lot = REGIONS[r].lots[f.zone];
  c.frontier++;
  c.kills = 0;
  c.farmed = 0;
  if (f.boss) {
    log(s, r, `CAPTURED ${lot.name.toUpperCase()}. ${lot.clearText}`, 'capture');
    log(s, r, `${BATTLERS[lot.boss.joins].name} joins the crew. ${BATTLERS[lot.boss.joins].does}`, 'capture');
  } else log(s, r, `Cleared ${fightLabel(r, c.frontier - 1)}.`, 'win');
  for (const sh of SHOP_LIST) if (sh.region === r && sh.zone === f.zone && sh.fight === f.i) log(s, r, `For lease: ${sh.name}. ${sh.tagline}`, 'capture');
  if (c.frontier >= ladder.length) {
    c.at = ladder.length - 2;
    if (r === 0 && !s.bypass) s.bypass = true;
    if (r === 0 ? s.paves === 0 || s.ending === 0 : true) s.ending = (r + 1) as 1 | 2;
    log(s, r, REGIONS[r].ending, 'capture');
    return;
  }
  const next = ladder[c.frontier];
  if (autoCovers(s, r, next.zone)) c.at = c.frontier;
  else if (next.i === 0) log(s, r, `${REGIONS[r].lots[next.zone].name} is open. No patrol out there yet: press ▸ when the crew is ready.`);
}

// A walk-in every 90s or so, at the crew you're watching. Never required.
function walkIns(s: GameState) {
  if (s.find) {
    if ((s.find.left -= STEP) <= 0) s.find = null;
    return;
  }
  if ((s.findClock -= STEP) > 0) return;
  s.findClock = WALKIN_EVERY;
  const shops = leased(s, s.view);
  if (!shops.length) return;
  const sh = pick(s, shops);
  s.find = { shop: sh.id, kind: sh.walkin.kind, name: pick(s, WALKIN_NAMES[sh.walkin.kind]), left: WALKIN_STAYS };
}

export function walkInValue(s: GameState, kind: WalkInKind): number {
  if (kind === 'cash') return rentPerSec(s, s.view) * TIP_SECONDS;
  if (kind === 'referral') return payFor(s, s.view) * REFERRAL_WINS;
  return 0;
}

export function collectFind(s: GameState): string | null {
  const f = s.find;
  if (!f) return 'Nobody walked in';
  s.find = null;
  const r = SHOPS[f.shop].region;
  const c = s.crews[r];
  const where = SHOPS[f.shop].name;
  const v = walkInValue(s, f.kind);
  if (f.kind === 'rally') {
    c.rally = RALLY_SECONDS;
    log(s, r, `Somebody brought ${f.name} to the ${where}. Crew hits 25% harder for 30 seconds.`, 'win');
  } else if (f.kind === 'cash') {
    c.cash += v;
    log(s, r, `${f.name} at the ${where}. +$${fmt(v)}.`, 'win');
  } else {
    earn(s, r, REGIONS[r].pay, v);
    log(s, r, `${f.name}: ${where} regular. +${fmt(v)} ${currencyOf(r)}.`, 'win');
  }
  return null;
}

export interface AwaySummary {
  seconds: number;
  earned: number;
  goodwill: number;
  equity: number;
  wins: number;
  losses: number;
  cleared: number;
  captured: string[];
  forLease: number;
}

// Offline: same sim, full rate, capped at 8 hours.
export function simulateAway(s: GameState, seconds: number): AwaySummary {
  const capped = Math.min(Math.max(0, seconds), OFFLINE_CAP_SECONDS);
  const wins = () => s.crews[0].wins + s.crews[1].wins;
  const losses = () => s.crews[0].losses + s.crews[1].losses;
  const before = { earned: s.stats.earned, gw: s.stats.goodwill, eq: s.stats.equity, wins: wins(), losses: losses() };
  const fr = [s.crews[0].frontier, s.crews[1].frontier];
  const steps = Math.floor(capped / STEP);
  for (let i = 0; i < steps; i++) step(s);
  const captured: string[] = [];
  for (const r of [0, 1] as const) FIGHTS[r].forEach((f, idx) => f.boss && idx >= fr[r] && idx < s.crews[r].frontier && captured.push(REGIONS[r].lots[f.zone].name));
  return {
    seconds: capped,
    earned: s.stats.earned - before.earned,
    goodwill: s.stats.goodwill - before.gw,
    equity: s.stats.equity - before.eq,
    wins: wins() - before.wins,
    losses: losses() - before.losses,
    cleared: s.crews[0].frontier + s.crews[1].frontier - fr[0] - fr[1],
    captured,
    forLease: SHOP_LIST.filter((x) => !s.crews[x.region].shops[x.id] && available(s, x) && (x.region === 0 || s.bypass)).length,
  };
}
