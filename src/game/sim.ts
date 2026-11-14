import { OFFLINE_CAP_SECONDS, PRESTIGE_MIN_ZONE, REGROUP_SECONDS, SHOPS, SMOKE_BREAK_AFTER, SMOKE_BREAK_SECONDS, STEP, WALKIN_EVERY, WALKIN_STAYS, WALKINS, ZONES } from './defs';
import { pick } from './rng';
import { lossReason, startBattle, stepBattle } from './battle';
import { incomePerSec, log, newGame, regionTaken } from './economy';
import type { GameState } from './state';

// One fixed step. Callers own their own time accumulators.
// `watching` is true only for the live game: walk-ins never happen offline or in the idle bot.
export function step(s: GameState, watching = false) {
  s.time += STEP;
  for (const k of ['dmg', 'tough', 'regen', 'heat'] as const) s.buffs[k] = Math.max(0, s.buffs[k] - STEP);
  if (watching) walkIns(s);
  s.totalTime += STEP;
  const inc = incomePerSec(s) * STEP;
  s.cash += inc;
  s.stats.earned += inc;
  if (regionTaken(s)) return;
  if (s.battle) {
    const result = stepBattle(s, s.battle, STEP);
    if (result) resolve(s, result);
  } else if ((s.regroup -= STEP) <= 0) {
    if (!startBattle(s)) s.regroup = 1;
  }
}

function resolve(s: GameState, result: 'win' | 'loss') {
  const b = s.battle!;
  s.battle = null;
  s.regroup = REGROUP_SECONDS;
  const zd = ZONES[b.zone];
  if (result === 'loss') {
    s.stats.losses++;
    if (++s.lossStreak >= SMOKE_BREAK_AFTER) {
      s.regroup = Math.min(15 * 60, SMOKE_BREAK_SECONDS * 2 ** (s.lossStreak - SMOKE_BREAK_AFTER)); // 1, 2, 4… min, cap 15
      if (s.lossStreak === SMOKE_BREAK_AFTER) log(s, `Crew's on a smoke break after ${SMOKE_BREAK_AFTER} straight losses. They'll try again in a minute, then less and less, until you change something.`, 'loss');
    }
    log(s, `Lost row ${b.row + 1}/${zd.rows} at ${zd.name}. ${lossReason(b)}`, 'loss');
    return;
  }
  s.stats.wins++;
  s.lossStreak = 0;
  s.row++;
  if (s.row < zd.rows) return log(s, `Took row ${s.row}/${zd.rows} at ${zd.name}.`, 'win');
  const id = s.slots.length;
  for (let i = 0; i < zd.captureSlots; i++) s.slots.push({ id: id + i, label: `${zd.short} #${i + 1}`, level: 1, shop: null });
  log(s, `CAPTURED ${zd.name.toUpperCase()}. ${zd.captureText} (+${zd.captureSlots} storefront${zd.captureSlots > 1 ? 's' : ''})`, 'capture');
  if (zd.unlocks) log(s, `New tenant type: ${SHOPS[zd.unlocks].name}.`, 'capture');
  s.zone++;
  s.row = 0;
  s.lastCapture = s.time;
  if (regionTaken(s)) log(s, 'The region is yours. The only thing left to do is pave it.', 'capture');
}

function walkIns(s: GameState) {
  if (s.find && (s.find.left -= STEP) <= 0) {
    log(s, `${s.find.name.replace(/^an? /, 'The guy with the ')} got tired of waiting and left.`);
    s.find = null;
  }
  const open = s.slots.filter((x) => x.shop);
  if (!s.find && open.length && (s.findClock -= STEP) <= 0) {
    s.findClock = WALKIN_EVERY;
    const sl = pick(s, open);
    s.find = { slot: sl.id, kind: sl.shop!, name: pick(s, WALKINS[sl.shop!].names), left: WALKIN_STAYS };
  }
}

export const canBulldoze = (s: GameState) => s.zone >= PRESTIGE_MIN_ZONE;
// Asphalt = rows taken this run.
export const asphaltGain = (s: GameState) => ZONES.slice(0, s.zone).reduce((a, z) => a + z.rows, 0) + s.row;

export function bulldoze(s: GameState): GameState {
  const gain = asphaltGain(s);
  const next = newGame(s.seed, s.asphalt + gain, s.bulldozes + 1, s.totalTime);
  log(next, `Bulldozed it all into a parking lot. +${gain} asphalt. Everything runs ${gain * 2}% better, forever.`, 'capture');
  return next;
}

export interface AwaySummary {
  seconds: number;
  earned: number;
  wins: number;
  losses: number;
  rows: number;
  captured: string[];
  onBreak: boolean;
}

export function simulateAway(s: GameState, seconds: number): AwaySummary {
  const secs = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, seconds));
  const before = { ...s.stats, zone: s.zone, rows: asphaltGain(s) };
  for (let i = 0; i < Math.floor(secs / STEP); i++) step(s);
  return {
    seconds: secs,
    earned: s.stats.earned - before.earned,
    wins: s.stats.wins - before.wins,
    losses: s.stats.losses - before.losses,
    rows: asphaltGain(s) - before.rows,
    captured: ZONES.slice(before.zone, s.zone).map((z) => z.name),
    onBreak: s.lossStreak >= SMOKE_BREAK_AFTER,
  };
}
