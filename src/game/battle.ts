import { BATTLERS, FIGHTS, FIGHT_TIMEOUT, OVERTIME_BOOST, RALLY_BOOST, REGIONS, STANCE, STAT_GROWTH, TELL, TRAIN_STEP, WEAK_BONUS, type BattlerDef, type EnemyDef, type Fx, type RegionId, type Role } from './defs';
import { asphaltMult, log, roster } from './economy';
import { rand } from './rng';
import type { Battle, Field, GameState, Unit } from './state';

// Training multiplier for a role on one crew.
export const trackMult = (s: GameState, role: Role, region: RegionId) => 1 + TRAIN_STEP * s.crews[region].train[role];

// One battler's numbers at a level, before auras. Used by the fight and the unit card.
export function statsOf(s: GameState, region: RegionId, id: string, level: number) {
  const d = BATTLERS[id];
  const m = STAT_GROWTH ** (level - 1) * asphaltMult(s, region);
  const t = trackMult(s, d.role, region);
  return {
    hp: Math.round(d.hp * m * (d.role === 'tank' ? t : 1)),
    dmg: d.dmg * m * (d.role === 'damage' || d.role === 'heal' || d.role === 'control' ? t : 1),
    interval: d.interval,
  };
}

const CAPS: Partial<Record<Fx['k'], number>> = { stun: 0.35, confuse: 0.35, slow: 0.6, weaken: 0.6, dr: 0.6 };
const targets = (to: string, d: BattlerDef) => to === 'all' || to === d.role || to === d.id;

// Every aura on the crew, scaled by the Paperwork (control) and Team Building (buffer) tracks.
export function auras(s: GameState, ids: string[], region: RegionId): { from: string; fx: Fx }[] {
  const out: { from: string; fx: Fx }[] = [];
  for (const id of ids) {
    const d = BATTLERS[id];
    if (!d.fx || d.fx.k === 'copy' || d.fx.k === 'twin') continue;
    const scale = d.role === 'control' || d.role === 'buffer' ? trackMult(s, d.role, region) : 1;
    out.push({ from: id, fx: 'v' in d.fx ? { ...d.fx, v: d.fx.v * scale } : d.fx });
  }
  for (const id of ids) {
    const d = BATTLERS[id];
    if (d.fx?.k !== 'copy') continue;
    const best = out.filter((a) => a.fx.k === 'haste' || a.fx.k === 'dmgUp' || a.fx.k === 'hpUp').sort((a, b) => ('v' in b.fx ? b.fx.v : 0) - ('v' in a.fx ? a.fx.v : 0))[0];
    if (best && 'v' in best.fx) out.push({ from: id, fx: { ...best.fx, v: best.fx.v * d.fx.v * trackMult(s, 'buffer', region) } });
  }
  return out;
}

function unit(s: GameState, side: Unit['side'], id: string, role: Unit['role'], name: string, hp: number, dmg: number, interval: number, weak: string | null, boss: boolean): Unit {
  hp = Math.round(hp);
  return { uid: s.nextUid++, side, id, role, name, maxHp: hp, hp, dmg, interval, cooldown: interval * (0.3 + 0.7 * rand(s)), dr: 0, twin: false, weak, tell: null, boss, flash: 0, lastDmg: 0, lastWeak: false, acted: 0 };
}

// Who shows up for a fight: 1 to 5 regulars, or the boss with two.
export function enemyLineup(region: RegionId, fight: number): { def: EnemyDef; boss: boolean }[] {
  const f = FIGHTS[region][fight];
  const lot = REGIONS[region].lots[f.zone];
  if (f.boss) return [{ def: lot.boss, boss: true }, { def: lot.regulars[0], boss: false }, { def: lot.regulars[1], boss: false }];
  const n = 1 + Math.floor((f.i * 4) / lot.fights);
  return Array.from({ length: n }, (_, k) => ({ def: lot.regulars[(f.i + k) % 3], boss: false }));
}

export function startBattle(s: GameState, r: RegionId): Battle | null {
  const c = s.crews[r];
  const fight = Math.min(c.at, FIGHTS[r].length - 1);
  const team = roster(s, r);
  if (!team.length) return null;
  const ids = team.map(([id]) => id);
  const aur = auras(s, ids, r);
  const field: Field = { mark: 0, slow: 0, weaken: 0, stun: 0, confuse: 0, regen: 0, revive: 0, payUp: 0 };
  for (const { fx } of aur) if (fx.k in field && 'v' in fx) (field as unknown as Record<string, number>)[fx.k] += fx.v;
  for (const k of Object.keys(CAPS) as (keyof Field)[]) if (k in field) field[k] = Math.min(field[k], CAPS[k as Fx['k']]!);
  const overtime = c.overtime > 0;
  const ot = overtime ? 1 + OVERTIME_BOOST : 1;
  if (overtime) c.overtime--;
  const crew = team.map(([id, lv]) => {
    const d = BATTLERS[id];
    const st = statsOf(s, r, id, lv);
    let hp = STANCE[c.stance].hp * ot, dmg = STANCE[c.stance].dmg * ot, haste = 1, dr = d.fx?.k === 'dr' ? d.fx.v : 0;
    for (const { fx } of aur) {
      if (fx.k === 'hpUp' && targets(fx.to, d)) hp += fx.v;
      if (fx.k === 'dmgUp' && targets(fx.to, d)) dmg += fx.v;
      if (fx.k === 'haste' && targets(fx.to, d)) haste *= 1 - fx.v;
    }
    const u = unit(s, 'crew', id, d.role, d.name, st.hp * hp, st.dmg * dmg, st.interval * Math.max(0.4, haste), null, false);
    u.dr = Math.min(dr, CAPS.dr!);
    u.twin = d.fx?.k === 'twin';
    return u;
  });
  const f = FIGHTS[r][fight];
  const enemies = enemyLineup(r, fight).map(({ def, boss }) => {
    const m = f.strength;
    const tl = def.tell ? TELL[def.tell] : { hp: 1, dmg: 1 };
    const e = unit(s, 'enemy', def.name, 'enemy', def.name, def.hp * m * tl.hp, def.dmg * m * tl.dmg * (1 - field.weaken), def.interval * (1 + field.slow), def.weak, boss);
    e.tell = def.tell;
    return e;
  });
  if (f.boss && c.streak === 0) log(s, r, `${REGIONS[r].lots[f.zone].boss.name.replace(/^(?!The )/, 'The ')} walks out. ${REGIONS[r].lots[f.zone].boss.title}`);
  return (c.battle = { fight, t: 0, crew, enemies, field, revived: false, overtime });
}

const alive = (u: Unit) => u.hp > 0;

function hit(s: GameState, rally: boolean, b: Battle, from: Unit, target: Unit, scale: number) {
  let dmg = from.dmg * scale * (0.85 + 0.3 * rand(s));
  if (from.side === 'crew') {
    const weak = target.weak === from.id;
    dmg *= (weak ? 1 + WEAK_BONUS : 1) * (1 + b.field.mark) * (rally ? 1 + RALLY_BOOST : 1);
    target.lastWeak = weak;
  } else dmg *= 1 - target.dr;
  target.hp = Math.max(0, target.hp - dmg);
  target.flash = 0.35;
  target.lastDmg = dmg;
  if (target.hp <= 0 && target.side === 'crew' && b.field.revive > 0 && !b.revived) {
    b.revived = true;
    target.hp = target.maxHp * b.field.revive;
  }
}

function act(s: GameState, rally: boolean, u: Unit, b: Battle) {
  const allies = u.side === 'crew' ? b.crew : b.enemies;
  const foes = u.side === 'crew' ? b.enemies : b.crew;
  const target = foes.find(alive);
  if (!target) return;
  u.acted = 0.2;
  if (u.role === 'heal') {
    let worst: Unit | null = null;
    for (const a of allies) if (alive(a) && a.maxHp - a.hp > u.dmg * 0.5 && (!worst || a.hp / a.maxHp < worst.hp / worst.maxHp)) worst = a;
    if (worst) worst.hp = Math.min(worst.maxHp, worst.hp + u.dmg);
    return;
  }
  if (u.side === 'enemy') {
    if (rand(s) < b.field.stun) return;
    if (b.field.confuse > 0 && rand(s) < b.field.confuse) {
      const other = allies.filter((a) => alive(a) && a !== u);
      if (other.length) return hit(s, rally, b, u, other[Math.floor(rand(s) * other.length)], 1);
    }
  }
  hit(s, rally, b, u, target, 1);
  if (u.twin) {
    const next = foes.find(alive);
    if (next) hit(s, rally, b, u, next, 0.6);
  }
}

export function stepBattle(s: GameState, b: Battle, dt: number, rally = false): 'win' | 'loss' | null {
  b.t += dt;
  for (const u of [...b.crew, ...b.enemies]) {
    if (!alive(u)) continue;
    if (u.role === 'tank' && b.field.regen > 0) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * b.field.regen * dt);
    u.flash = Math.max(0, u.flash - dt);
    u.acted = Math.max(0, u.acted - dt);
    u.cooldown -= dt;
    if (u.cooldown <= 0) {
      u.cooldown += u.interval;
      act(s, rally, u, b);
    }
  }
  if (!b.enemies.some(alive)) return 'win';
  if (!b.crew.some(alive) || b.t >= FIGHT_TIMEOUT) return 'loss';
  return null;
}

// Why did we lose? Point at the fix.
export function lossReason(b: Battle, stance: keyof typeof STANCE): string {
  const have = new Set(b.crew.map((u) => u.id));
  const roles = new Set(b.crew.map((u) => u.role));
  const standing = b.enemies.filter(alive);
  const tanky = standing.some((e) => e.tell === 'tanky');
  if (b.t >= FIGHT_TIMEOUT) return stance !== 'rush' && tanky ? 'Ran out the clock on a tank. Try the Rush play.' : 'Ran out the clock. Needs more damage.';
  const hard = b.enemies.some((e) => e.tell === 'hard');
  if (stance !== 'dig' && hard) return 'They hit hard. Try the Dig In play.';
  const counter = standing.find((e) => e.weak && !have.has(e.weak));
  if (counter && counter.weak) return `Outmatched. A ${BATTLERS[counter.weak].name} would hit the ${counter.name} 25% harder.`;
  if (!roles.has('heal') && b.t > 12) return 'Long fight, nobody patching people up.';
  return 'Outmatched. Renovate, train, or farm the fight behind you.';
}
