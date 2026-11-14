import {
  FIGHTERS,
  HEAT_DECAY,
  HEAT_RAID_AT,
  LOSS_REGROUP_SECONDS,
  LOSS_RENT,
  LOSS_RENT_MIN,
  OFFLINE_CAP_SECONDS,
  PRESTIGE_MIN_ZONE,
  RAID_HEAT_DROP,
  REGROUP_SECONDS,
  SHOPS,
  STEP,
  ZONES,
} from './defs';
import { startBattle, stepBattle } from './battle';
import { fighterCap, heatPerSec, incomePerSec, log, newGame, shopsOf, speedMult, trainRate } from './economy';
import { rollGear, GEAR_SLOT_LABEL } from './gear';
import type { GameState } from './state';

const PAWN_SECONDS = 40;
let carry = 0;

export function tick(s: GameState, dt: number) {
  carry += dt;
  while (carry >= STEP) {
    carry -= STEP;
    step(s);
  }
}

export function step(s: GameState) {
  const dt = STEP;
  s.time += dt;
  s.totalTime += dt;

  const inc = incomePerSec(s) * dt;
  s.cash += inc;
  s.stats.earned += inc;
  s.heat = Math.max(0, Math.min(100, s.heat + (heatPerSec(s) - HEAT_DECAY) * dt));

  for (const sl of s.slots) {
    const shop = sl.shop;
    if (!shop) continue;
    const f = SHOPS[shop.kind].fighter;
    if (s.roster[f] >= fighterCap(s, f)) {
      shop.train = Math.min(shop.train, 0.999);
      continue;
    }
    shop.train += trainRate(s, shop.kind, shop.level) * dt;
    if (shop.train >= 1) {
      shop.train -= 1;
      s.roster[f]++;
      s.stats.trained++;
      if (s.stats.trained <= 3 || s.roster[f] === 1) log(s, `A new ${FIGHTERS[f].name.toLowerCase()} reports from the ${SHOPS[shop.kind].name.toLowerCase()}.`);
    }
  }

  const pawns = shopsOf(s, 'pawn');
  if (pawns.length) {
    s.pawnClock += dt * speedMult(s) * pawns.length;
    if (s.pawnClock >= PAWN_SECONDS) {
      s.pawnClock -= PAWN_SECONDS;
      const lvl = Math.max(...pawns.map((p) => p.level));
      const g = rollGear(s, lvl);
      const cur = s.gear[g.slot];
      if (!cur || g.bonus > cur.bonus) {
        s.gear[g.slot] = g;
        log(s, `Pawn shop took in a ${g.name}. Crew-wide ${GEAR_SLOT_LABEL[g.slot]} now +${Math.round(g.bonus * 100)}%.`);
      }
    }
  }

  if (s.battle) {
    const result = stepBattle(s, s.battle, dt);
    if (result) resolve(s, result);
  } else {
    s.regroup -= dt;
    if (s.regroup <= 0) {
      if (s.heat >= HEAT_RAID_AT) startBattle(s, 'raid');
      else startBattle(s, 'wave');
      if (!s.battle) s.regroup = 1;
    }
  }
}

export function lossRent(s: GameState, zone: number, wave: number) {
  return Math.max(LOSS_RENT_MIN, Math.round(waveReward(s, zone, wave) * LOSS_RENT));
}

export function waveReward(s: GameState, zone: number, wave: number) {
  return Math.round(ZONES[zone].reward * (1 + 0.35 * wave) * (1 + s.heat / 200));
}

function resolve(s: GameState, result: 'win' | 'loss') {
  const b = s.battle!;
  s.battle = null;
  const zd = ZONES[b.zone];
  if (b.kind === 'raid') {
    if (result === 'win') {
      const bounty = waveReward(s, b.zone, zd.waves - 1) * 3;
      s.cash += bounty;
      s.stats.earned += bounty;
      s.stats.raidsWon++;
      log(s, `Raid repelled. The examiners leave a card. Heat cools off. (+$${fmt(bounty)})`, 'win');
    } else {
      const fine = Math.round(s.cash * 0.25);
      s.cash -= fine;
      s.stats.raidsLost++;
      s.stats.rentPaid += fine;
      log(s, `Raid lost. Fines and “administrative fees”: −$${fmt(fine)}.`, 'loss');
    }
    s.heat = Math.max(0, s.heat - (result === 'win' ? RAID_HEAT_DROP : 15));
    s.regroup = result === 'win' ? REGROUP_SECONDS : LOSS_REGROUP_SECONDS;
    return;
  }
  if (result === 'win') {
    const r = waveReward(s, b.zone, b.wave);
    s.cash += r;
    s.stats.earned += r;
    s.stats.wins++;
    s.regroup = REGROUP_SECONDS;
    if (s.won) {
      log(s, `Held the region against another visit from management. +$${fmt(r)}`, 'win');
      return;
    }
    s.wave++;
    if (s.wave >= zd.waves) capture(s, b.zone);
    else log(s, `Won ${zd.name} ${s.wave}/${zd.waves}. +$${fmt(r)}`, 'win');
  } else {
    const rent = Math.min(s.cash, lossRent(s, b.zone, b.wave));
    s.cash -= rent;
    s.stats.losses++;
    s.stats.rentPaid += rent;
    s.regroup = LOSS_REGROUP_SECONDS;
    const fellBack = !s.won && s.wave > 0;
    if (fellBack) s.wave--;
    log(s, `Lost at ${zd.name} ${b.wave + 1}/${zd.waves}. Crew limps back${fellBack ? ' a row of parking' : ''}. Rent's still due: −$${fmt(rent)}.`, 'loss');
  }
}

function capture(s: GameState, z: number) {
  const zd = ZONES[z];
  for (let i = 0; i < zd.captureSlots; i++) {
    const id = s.slots.length;
    s.slots.push({ id, label: `${zd.name} #${i + 1}`, origin: 'captured', leased: true, shop: null });
  }
  log(s, `CAPTURED ${zd.name.toUpperCase()}. ${zd.captureText}`, 'capture');
  if (zd.unlocks) log(s, `New tenant type available: ${SHOPS[zd.unlocks].name}.`, 'capture');
  s.zone = z + 1;
  s.wave = 0;
  s.lastCapture = s.time;
  if (s.zone >= ZONES.length) {
    s.won = true;
    s.zone = ZONES.length;
    log(s, 'The region is yours. The only thing left to do is pave it.', 'capture');
  }
}

export function canBulldoze(s: GameState) {
  return s.zone >= PRESTIGE_MIN_ZONE;
}

export function asphaltGain(s: GameState) {
  return s.zone * 2 + Math.floor(Math.sqrt(s.stats.earned / 25000));
}

export function bulldoze(s: GameState): GameState {
  const gain = asphaltGain(s);
  const next = newGame(s.seed, s.asphalt + gain, s.bulldozes + 1, s.totalTime);
  next.log.push({ t: 0, text: `Bulldozed everything into a parking lot. +${gain} asphalt. Shops run ${Math.round(gain * 10)}% faster, forever.`, tone: 'capture' });
  return next;
}

export interface AwaySummary {
  seconds: number;
  earned: number;
  wins: number;
  losses: number;
  captured: string[];
  trained: number;
  raids: number;
  rentPaid: number;
  cashDelta: number;
}

export function simulateAway(s: GameState, seconds: number): AwaySummary {
  const secs = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, seconds));
  const before = { ...s.stats, zone: s.zone, cash: s.cash };
  const steps = Math.floor(secs / STEP);
  for (let i = 0; i < steps; i++) step(s);
  const captured = ZONES.slice(before.zone, s.zone).map((z) => z.name);
  return {
    seconds: secs,
    earned: s.stats.earned - before.earned,
    wins: s.stats.wins - before.wins,
    losses: s.stats.losses - before.losses,
    captured,
    trained: s.stats.trained - before.trained,
    raids: s.stats.raidsWon + s.stats.raidsLost - before.raidsWon - before.raidsLost,
    rentPaid: s.stats.rentPaid - before.rentPaid,
    cashDelta: s.cash - before.cash,
  };
}

export function fmt(n: number): string {
  const a = Math.abs(n);
  if (a < 1000) return a < 10 && a % 1 ? n.toFixed(1) : Math.floor(n).toString();
  const units = ['K', 'M', 'B', 'T'];
  let u = -1;
  let v = n;
  while (Math.abs(v) >= 1000 && u < units.length - 1) {
    v /= 1000;
    u++;
  }
  return `${v.toFixed(Math.abs(v) < 10 ? 2 : Math.abs(v) < 100 ? 1 : 0)}${units[u]}`;
}

export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s2 = Math.floor(sec % 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}:${s2.toString().padStart(2, '0')}`;
}
