import {
  ASPHALT_CREW,
  BATTLE_TIMEOUT,
  BENCH_BONUS,
  DOT_SECONDS,
  FIGHTERS,
  FIXER_DEBUFF_CAP,
  FIXER_DEBUFF_EACH,
  HEAT_ENEMY_BONUS,
  LEVEL_STATS,
  RAID,
  SQUAD_SIZE,
  STUN_SECONDS,
  WAVE_GROWTH,
  ZONES,
  type EnemyDef,
  type FighterKind,
} from './defs';
import { fighterLevel, log } from './economy';
import { gearBonus } from './gear';
import { pick, rand } from './rng';
import type { Battle, GameState, Unit } from './state';

// Front-to-back marching order. Enemies hit the first one standing.
const ORDER: FighterKind[] = ['bouncer', 'fixer', 'hustler', 'lawyer', 'medic'];
const DRAFT: FighterKind[] = ['bouncer', 'hustler', 'medic', 'fixer', 'lawyer'];

export function currentZoneIndex(s: GameState) {
  return Math.min(s.zone, ZONES.length - 1);
}

export function squad(s: GameState): FighterKind[] {
  const left = { ...s.roster };
  const picked: FighterKind[] = [];
  const size = SQUAD_SIZE(s.zone);
  while (picked.length < size) {
    let any = false;
    for (const k of DRAFT) {
      if (picked.length >= size) break;
      if (left[k] > 0) {
        left[k]--;
        picked.push(k);
        any = true;
      }
    }
    if (!any) break;
  }
  return picked.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
}

// Fighters who don't make the squad still help: each one on the bench adds BENCH_BONUS to their type.
export function benchBonus(s: GameState, k: FighterKind): number {
  const bench = s.roster[k] - squad(s).filter((x) => x === k).length;
  return 1 + BENCH_BONUS * Math.max(0, bench);
}

function crewUnit(s: GameState, k: FighterKind, bench: number): Unit {
  const d = FIGHTERS[k];
  const m = LEVEL_STATS(fighterLevel(s, k)) * bench * (1 + ASPHALT_CREW * s.asphalt);
  const hp = Math.round(d.hp * m * (1 + gearBonus(s, 'armor')));
  const interval = d.interval / (1 + gearBonus(s, 'kit'));
  return {
    uid: s.nextUid++,
    side: 'crew',
    kind: k,
    name: d.name,
    title: `Lv ${fighterLevel(s, k)} ${d.role}`,
    maxHp: hp,
    hp,
    dmg: d.dmg * m * (1 + gearBonus(s, 'weapon')),
    interval,
    cooldown: interval * (0.3 + 0.7 * rand(s)),
    dodge: d.dodge,
    heal: d.heal * m,
    stunChance: d.stunChance,
    dot: d.dot * m,
    stunned: 0,
    dotLeft: 0,
    dotDps: 0,
    boss: false,
    flash: 0,
    acted: 0,
  };
}

function enemyUnit(s: GameState, e: EnemyDef, mult: number, boss: boolean): Unit {
  const hp = Math.round(e.hp * mult);
  return {
    uid: s.nextUid++,
    side: 'enemy',
    kind: 'enemy',
    name: e.name,
    title: e.title,
    maxHp: hp,
    hp,
    dmg: e.dmg * mult,
    interval: e.interval,
    cooldown: e.interval * (0.3 + 0.7 * rand(s)),
    dodge: 0,
    heal: 0,
    stunChance: 0,
    dot: 0,
    stunned: 0,
    dotLeft: 0,
    dotDps: 0,
    boss,
    flash: 0,
    acted: 0,
  };
}

export function enemyMult(s: GameState, zone: number, wave: number): number {
  return ZONES[zone].strength * (1 + WAVE_GROWTH * wave) * (1 + (HEAT_ENEMY_BONUS * s.heat) / 100);
}

export function startBattle(s: GameState, kind: 'wave' | 'raid'): Battle | null {
  const members = squad(s);
  if (!members.length) return null;
  const z = currentZoneIndex(s);
  const zd = ZONES[z];
  const wave = s.won ? zd.waves - 1 : s.wave;
  const fixers = members.filter((m) => m === 'fixer').length;
  const debuff = Math.min(FIXER_DEBUFF_CAP, fixers * FIXER_DEBUFF_EACH);
  const enemies: Unit[] = [];
  if (kind === 'raid') {
    const mult = enemyMult(s, z, 1) * (1 - debuff);
    for (let i = 0; i < 3; i++) enemies.push(enemyUnit(s, pick(s, RAID), mult, false));
  } else {
    const mult = enemyMult(s, z, wave) * (1 - debuff);
    const isBoss = wave === zd.waves - 1;
    if (isBoss) {
      enemies.push(enemyUnit(s, zd.boss, mult, true));
      enemies.push(enemyUnit(s, pick(s, zd.regulars), mult, false));
    } else {
      const count = 1 + Math.ceil(wave * 0.6);
      for (let i = 0; i < count; i++) enemies.push(enemyUnit(s, pick(s, zd.regulars), mult, false));
    }
  }
  const b: Battle = { kind, zone: z, wave, t: 0, crew: members.map((m) => crewUnit(s, m, benchBonus(s, m))), enemies, debuff };
  s.battle = b;
  if (kind === 'raid') log(s, `Raid on Pinewood Plaza. ${enemies.length} officials in the lot, asking about the payday place.`, 'loss');
  if (debuff > 0 && kind === 'wave' && s.wave === 0) log(s, `Your fixers got to their supply closet first (−${Math.round(debuff * 100)}% enemy HP & damage).`);
  return b;
}

const alive = (u: Unit) => u.hp > 0;

function hit(s: GameState, src: Unit, dst: Unit, amount: number) {
  if (dst.dodge > 0 && rand(s) < dst.dodge) return;
  dst.hp = Math.max(0, dst.hp - amount);
  dst.flash = 0.25;
  if (dst.hp <= 0 && dst.boss) log(s, `${src.name} puts down the ${dst.name}. ${dst.title}`, 'hit');
}

function act(s: GameState, u: Unit, b: Battle) {
  const allies = u.side === 'crew' ? b.crew : b.enemies;
  const foes = u.side === 'crew' ? b.enemies : b.crew;
  const front = foes.find(alive);
  if (!front) return;
  u.acted = 0.2;
  if (u.heal > 0) {
    let worst: Unit | null = null;
    for (const a of allies) if (alive(a) && a.maxHp - a.hp > u.heal * 0.6 && (!worst || a.hp / a.maxHp < worst.hp / worst.maxHp)) worst = a;
    if (worst) {
      worst.hp = Math.min(worst.maxHp, worst.hp + u.heal);
      return;
    }
  }
  if (u.stunChance > 0) {
    // lawyers pick whoever is not already being sued
    const target = foes.find((f) => alive(f) && f.dotLeft <= 0) ?? front;
    target.dotLeft = DOT_SECONDS;
    target.dotDps = u.dot;
    if (rand(s) < u.stunChance) {
      target.stunned = STUN_SECONDS;
      if (target.boss) log(s, `Cease-and-desist served. The ${target.name} stops to read it.`, 'hit');
    }
    hit(s, u, target, u.dmg);
    return;
  }
  // hustlers go for the weakest; everyone else hits the front
  const target = u.kind === 'hustler' ? foes.filter(alive).sort((a, c) => a.hp - c.hp)[0] : front;
  hit(s, u, target, u.dmg * (0.85 + 0.3 * rand(s)));
}

// Advance a battle by dt seconds. Returns 'win' | 'loss' | null.
export function stepBattle(s: GameState, b: Battle, dt: number): 'win' | 'loss' | null {
  b.t += dt;
  for (const u of [...b.crew, ...b.enemies]) {
    if (!alive(u)) continue;
    u.flash = Math.max(0, u.flash - dt);
    u.acted = Math.max(0, u.acted - dt);
    if (u.dotLeft > 0) {
      u.dotLeft -= dt;
      u.hp = Math.max(0, u.hp - u.dotDps * dt);
      if (!alive(u)) continue;
    }
    if (u.stunned > 0) {
      u.stunned -= dt;
      continue;
    }
    u.cooldown -= dt;
    if (u.cooldown <= 0) {
      u.cooldown += u.interval;
      act(s, u, b);
    }
  }
  if (!b.enemies.some(alive)) return 'win';
  if (!b.crew.some(alive)) return 'loss';
  if (b.t >= BATTLE_TIMEOUT) return 'loss';
  return null;
}
