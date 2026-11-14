import { FIGHTERS, FIGHT_TIMEOUT, FRONT_ORDER, RESIST_MULT, ROW_GROWTH, SHOPS, STAT_GROWTH, WEAK_MULT, ZONES, type EnemyDef } from './defs';
import { asphaltMult, heat } from './economy';
import { pick, rand } from './rng';
import type { Battle, GameState, Slot, Unit } from './state';

function unit(s: GameState, side: Unit['side'], kind: Unit['kind'], name: string, title: string, hp: number, dmg: number, interval: number, weak: Unit['weak'], boss: boolean): Unit {
  hp = Math.round(hp);
  return { uid: s.nextUid++, side, kind, name, title, maxHp: hp, hp, dmg, interval, cooldown: interval * (0.3 + 0.7 * rand(s)), weak, boss, flash: 0, lastDmg: 0, acted: 0 };
}

function crewUnit(s: GameState, sl: Slot): Unit {
  const d = FIGHTERS[SHOPS[sl.shop!].fighter];
  const m = STAT_GROWTH ** (sl.level - 1) * asphaltMult(s);
  return unit(s, 'crew', d.kind, d.name, `Lv ${sl.level} · ${sl.label}`, d.hp * m, d.dmg * m, d.interval, null, false);
}

export const enemyMult = (s: GameState, zone: number, row: number) => ZONES[zone].strength * (1 + ROW_GROWTH * row) * (1 + heat(s));

export function enemiesFor(zone: number, row: number): { boss: boolean; count: number } {
  const boss = row === ZONES[zone].rows - 1;
  return { boss, count: boss ? 2 : 1 + Math.ceil(row * 0.6) };
}

export function startBattle(s: GameState): Battle | null {
  const crew = s.slots
    .filter((sl) => sl.shop)
    .sort((a, b) => FRONT_ORDER.indexOf(SHOPS[a.shop!].fighter) - FRONT_ORDER.indexOf(SHOPS[b.shop!].fighter))
    .map((sl) => crewUnit(s, sl));
  if (!crew.length) return null;
  const zd = ZONES[s.zone];
  const m = enemyMult(s, s.zone, s.row);
  const { boss, count } = enemiesFor(s.zone, s.row);
  const mk = (e: EnemyDef, isBoss: boolean) => unit(s, 'enemy', 'enemy', e.name, e.title, e.hp * m, e.dmg * m, e.interval, e.weak, isBoss);
  const enemies = boss ? [mk(zd.boss, true), mk(pick(s, zd.regulars), false)] : Array.from({ length: count }, () => mk(pick(s, zd.regulars), false));
  return (s.battle = { zone: s.zone, row: s.row, t: 0, crew, enemies });
}

const alive = (u: Unit) => u.hp > 0;

function act(s: GameState, u: Unit, b: Battle) {
  const allies = u.side === 'crew' ? b.crew : b.enemies;
  const target = (u.side === 'crew' ? b.enemies : b.crew).find(alive);
  if (!target) return;
  u.acted = 0.2;
  if (u.kind === 'medic') {
    let worst: Unit | null = null;
    for (const a of allies) if (alive(a) && a.maxHp - a.hp > u.dmg * 0.5 && (!worst || a.hp / a.maxHp < worst.hp / worst.maxHp)) worst = a;
    if (worst) worst.hp = Math.min(worst.maxHp, worst.hp + u.dmg);
    return;
  }
  const mult = target.weak ? (target.weak === u.kind ? WEAK_MULT : RESIST_MULT) : 1;
  const dmg = u.dmg * mult * (0.85 + 0.3 * rand(s));
  target.hp = Math.max(0, target.hp - dmg);
  target.flash = 0.35;
  target.lastDmg = dmg;
}

export function stepBattle(s: GameState, b: Battle, dt: number): 'win' | 'loss' | null {
  b.t += dt;
  for (const u of [...b.crew, ...b.enemies]) {
    if (!alive(u)) continue;
    u.flash = Math.max(0, u.flash - dt);
    u.acted = Math.max(0, u.acted - dt);
    u.cooldown -= dt;
    if (u.cooldown <= 0) {
      u.cooldown += u.interval;
      act(s, u, b);
    }
  }
  if (!b.enemies.some(alive)) return 'win';
  if (!b.crew.some(alive) || b.t >= FIGHT_TIMEOUT) return 'loss';
  return null;
}

// Why did we lose? Name the missing counter, or the missing front line / medic.
export function lossReason(b: Battle): string {
  const have = new Set(b.crew.map((u) => u.kind));
  const standing = b.enemies.filter(alive);
  const missing = standing.find((e) => e.weak && !have.has(e.weak));
  if (missing) return `Nobody on the crew can handle the ${missing.name}. That's a job for a ${FIGHTERS[missing.weak!].name}.`;
  if (b.t >= FIGHT_TIMEOUT) return 'Nobody went down, nobody won. Need more damage.';
  if (!have.has('bouncer')) return 'Nobody stood in front. Get a Bouncer.';
  if (!have.has('medic') && b.t > 12) return 'Long fight, nobody patching people up. A Medic would help.';
  return 'Outmatched. Renovate.';
}
