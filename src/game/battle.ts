import { AURA_STEP, BATTLERS, WALK_IN_SECONDS, BOSS_STRENGTH, HARD_FOCUS, FIGHTS, FIGHT_TIMEOUT, FRONT_SHARE, MAIN_GROWTH, RALLY_BOOST, REGIONS, ROLES, SIDE_HP_GROWTH, TANK_HP_GROWTH, TELL, TRAIN_STEP, WEAK_BONUS, type BattlerDef, type EnemyDef, type Fx, type RegionId, type Role } from './defs';
import { asphaltMult, curb, fighters, lineupOf, log, sinkHpBonus } from './economy';
import { rand } from './rng';
import { barDmg, barHp, buffOn } from './room';
import type { Battle, Field, GameState, Unit } from './state';

// Training multiplier for a role on one crew.
export const trackMult = (s: GameState, role: Role, region: RegionId) => 1 + TRAIN_STEP * s.crews[region].train[role];

// One battler's numbers at a level, before auras. Used by the fight and the unit card.
// A renovation grows the one thing a unit does: tanks get HP; damage, heal and control get their hit (plus a little HP); auras grow +4% of base.
export function statsOf(s: GameState, region: RegionId, id: string, level: number) {
  const d = BATTLERS[id];
  const L = level - 1;
  const a = asphaltMult(s, region);
  const t = trackMult(s, d.role, region);
  const fights = d.role !== 'tank' && d.role !== 'buffer';
  return {
    hp: Math.round(d.hp * a * (1 + (region === 0 ? sinkHpBonus(s) : 0)) * (d.role === 'tank' ? TANK_HP_GROWTH ** L * t : d.role === 'buffer' ? 1 : SIDE_HP_GROWTH ** L)),
    dmg: d.dmg * a * (fights ? MAIN_GROWTH ** L * t : 1),
    interval: d.interval,
    aura: 1 + AURA_STEP * L,
  };
}

const CAPS: Partial<Record<Fx['k'], number>> = { stun: 0.35, confuse: 0.35, slow: 0.6, weaken: 0.6, dr: 0.6 };
const targets = (to: string, d: BattlerDef) => to === 'all' || to === d.role || to === d.id;

// Every aura on the crew, scaled by the Paperwork (control) and Team Building (buffer) tracks.
export function auras(s: GameState, members: [string, number][], region: RegionId): { from: string; fx: Fx }[] {
  const out: { from: string; fx: Fx }[] = [];
  const scaleOf = (id: string, lv: number) => (BATTLERS[id].role === 'control' || BATTLERS[id].role === 'buffer' ? trackMult(s, BATTLERS[id].role, region) * (1 + AURA_STEP * (lv - 1)) : 1);
  for (const [id, lv] of members) {
    const d = BATTLERS[id];
    if (!d.fx || d.fx.k === 'copy' || d.fx.k === 'twin') continue;
    const scale = scaleOf(id, lv);
    out.push({ from: id, fx: 'v' in d.fx ? { ...d.fx, v: d.fx.v * scale } : d.fx });
  }
  for (const [id, lv] of members) {
    const d = BATTLERS[id];
    if (d.fx?.k !== 'copy') continue;
    const best = out.filter((a) => a.fx.k === 'haste' || a.fx.k === 'dmgUp' || a.fx.k === 'hpUp').sort((a, b) => ('v' in b.fx ? b.fx.v : 0) - ('v' in a.fx ? a.fx.v : 0))[0];
    if (best && 'v' in best.fx) out.push({ from: id, fx: { ...best.fx, v: best.fx.v * d.fx.v * scaleOf(id, lv) } });
  }
  return out;
}

function unit(s: GameState, side: Unit['side'], id: string, role: Unit['role'], name: string, hp: number, dmg: number, interval: number, weak: string | null, boss: boolean): Unit {
  hp = Math.round(hp);
  return { uid: s.nextUid++, side, id, role, name, maxHp: hp, hp, dmg, interval, cooldown: interval * (0.3 + 0.7 * rand(s)), dr: 0, twin: false, weak, tell: null, boss, flash: 0, lastDmg: 0, lastWeak: false, acted: 0, aim: 0 };
}

// Who shows up. The count grows across the whole region: lot k fields 1 + k regulars, one more from its halfway point (max 6).
// The boss brings 2 + k escorts (max 5), so every lot's boss is its peak and the next lot opens a step up.
export const regularsIn = (zone: number, i: number, fights: number) => Math.min(6, 1 + zone + Math.floor((2 * i) / fights));
export function enemyLineup(region: RegionId, fight: number): { def: EnemyDef; boss: boolean }[] {
  const f = FIGHTS[region][fight];
  const lot = REGIONS[region].lots[f.zone];
  if (f.boss) return [{ def: lot.boss, boss: true }, ...Array.from({ length: Math.min(5, 2 + f.zone) }, (_, k) => ({ def: lot.regulars[k % 3], boss: false }))];
  const n = regularsIn(f.zone, f.i, lot.fights);
  return Array.from({ length: n }, (_, k) => ({ def: lot.regulars[(f.i + k) % 3], boss: false }));
}

// Lanchester-style threat (total HP x total damage per second), so a fight's strength means the same thing whatever
// the lineup: more, weaker enemies as a lot goes on, never a jump from who happens to show up.
const threat = (l: { def: EnemyDef }[]) => {
  let hp = 0, dps = 0;
  for (const { def } of l) { const tl = def.tell ? TELL[def.tell] : { hp: 1, dmg: 1 }; hp += def.hp * tl.hp; dps += (def.dmg * tl.dmg) / def.interval; }
  return hp * dps;
};
const scales: number[][] = [[], []];
export const fightScale = (r: RegionId, g: number) => (scales[r][g] ??= Math.sqrt(threat(enemyLineup(0, 0)) / threat(enemyLineup(r, g))) * (FIGHTS[r][g].boss ? BOSS_STRENGTH : 1));

export function startBattle(s: GameState, r: RegionId): Battle | null {
  const c = s.crews[r];
  // the group waiting in line goes next, even if you've since picked another fight; otherwise the fight you're on
  const queued = c.queueEnter >= 0 && c.smoke <= 0;
  const fight = Math.min(queued ? c.deck : c.at, FIGHTS[r].length - 1);
  const lv = new Map(fighters(s, r));
  const team: [string, number][] = lineupOf(s, r).map((id) => [id, lv.get(id) ?? 1]);
  if (!team.length) return null;
  team.sort((a, b) => ROLES.indexOf(BATTLERS[a[0]].role) - ROLES.indexOf(BATTLERS[b[0]].role));
  const aur = auras(s, [...team, ...curb(s, r)], r);
  const field: Field = { mark: 0, slow: 0, weaken: 0, stun: 0, confuse: 0, regen: 0, revive: 0, payUp: 0 };
  for (const { fx } of aur) if (fx.k in field && 'v' in fx) (field as unknown as Record<string, number>)[fx.k] += fx.v;
  for (const k of Object.keys(CAPS) as (keyof Field)[]) if (k in field) field[k] = Math.min(field[k], CAPS[k as Fx['k']]!);
  const crew = team.map(([id, lv]) => {
    const d = BATTLERS[id];
    const st = statsOf(s, r, id, lv);
    const toy = (k: 'bat' | 'duck') => (buffOn(s, k) ? 1.3 : 1);
    const bar = (k: 'bat' | 'duck') => (r === 1 ? (k === 'bat' ? barDmg(s) : barHp(s)) : 1);
    let hp = toy('duck') * bar('duck') * (r === 1 && buffOn(s, 'shot') ? 1.1 : 1), dmg = toy('bat') * bar('bat') * (r === 1 && buffOn(s, 'shot') ? 1.1 : 1), haste = 1, dr = d.fx?.k === 'dr' ? d.fx.v : 0;
    for (const { fx } of aur) {
      if (fx.k === 'hpUp' && targets(fx.to, d)) hp += fx.v;
      if (fx.k === 'dmgUp' && targets(fx.to, d)) dmg += fx.v;
      if (fx.k === 'haste' && targets(fx.to, d)) haste *= 1 - fx.v;
    }
    const u = unit(s, 'crew', id, d.role, d.name, st.hp * hp, st.dmg * dmg, st.interval * Math.max(0.4, haste), null, false);
    u.dr = Math.min(dr, CAPS.dr!);
    u.twin = d.fx?.k === 'twin';
    u.hp = Math.round(u.maxHp * (1 - (c.wounds[id] ?? 0)));
    return u;
  });
  const f = FIGHTS[r][fight];
  const enemies = enemyLineup(r, fight).map(({ def, boss }) => {
    const m = f.strength * fightScale(r, fight);
    const tl = def.tell ? TELL[def.tell] : { hp: 1, dmg: 1 };
    const e = unit(s, 'enemy', def.name, 'enemy', def.name, def.hp * m * tl.hp, def.dmg * m * tl.dmg * (1 - field.weaken), def.interval * (1 + field.slow), def.weak, boss);
    e.tell = def.tell;
    return e;
  });
  // the boss's entrance: once, on the first try
  if (f.boss && fight === c.frontier && c.tries === 0) log(s, r, `${REGIONS[r].lots[f.zone].boss.name.replace(/^(?!The )/, 'The ')} walks out. ${REGIONS[r].lots[f.zone].boss.title}`);
  const fresh = crew.every((u) => u.hp >= u.maxHp);
  // straight out of a smoke break they're already standing there; otherwise they walk in (or step up from the line)
  const enter = queued ? c.queueEnter : c.smoke > 0 ? 0 : WALK_IN_SECONDS;
  c.queueEnter = -1;
  return (c.battle = { fight, t: 0, crew, enemies, field, revived: false, fresh, enter });
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

// The crew hits the front enemy. Enemies hit the front tank 60% of the time and anyone the rest;
// hard hitters and bosses go for whoever is lowest on HP.
function pickTarget(u: Unit, foes: Unit[]): Unit | undefined {
  if (u.side === 'crew') return foes.find(alive);
  const live = foes.filter(alive);
  if (!live.length) return undefined;
  const n = u.aim++;
  // Bosses always go for the weakest; hard hitters do it on a share of their hits.
  if (u.boss || (u.tell === 'hard' && Math.floor((n + 1) * HARD_FOCUS) > Math.floor(n * HARD_FOCUS))) return live.reduce((a, z) => (z.hp / z.maxHp < a.hp / a.maxHp ? z : a));
  // Spread hits: a fixed share goes to the front tank, the rest work down the line in turn, each enemy starting somewhere else.
  const front = live.find((x) => x.role === 'tank') ?? live[0];
  if (Math.floor((n + 1) * FRONT_SHARE) > Math.floor(n * FRONT_SHARE)) return front;
  const rest = live.filter((x) => x !== front);
  return rest.length ? rest[(u.uid + n) % rest.length] : front;
}

function act(s: GameState, rally: boolean, u: Unit, b: Battle) {
  const allies = u.side === 'crew' ? b.crew : b.enemies;
  const foes = u.side === 'crew' ? b.enemies : b.crew;
  const target = pickTarget(u, foes);
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
  if (b.enter > 0) return void (b.enter -= dt), null; // still walking in from the back of the lot
  if (!b.crew.some(alive)) return 'loss';
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
export function lossReason(b: Battle): string {
  const have = new Set(b.crew.map((u) => u.id));
  const roles = new Set(b.crew.map((u) => u.role));
  const standing = b.enemies.filter(alive);
  if (b.t >= FIGHT_TIMEOUT) return 'Ran out the clock. Needs more damage.';
  const counter = standing.find((e) => e.weak && !have.has(e.weak));
  if (counter && counter.weak) return `Outmatched. A ${BATTLERS[counter.weak].name} would hit the ${counter.name} 25% harder.`;
  if (!roles.has('heal') && b.t > 12) return 'Long fight, nobody patching people up.';
  return 'Outmatched. Renovate, train, or farm the fight behind you.';
}
