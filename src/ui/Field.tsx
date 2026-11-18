// The parking lot canvas: the crew in ranks by role, the enemies, hit flashes and damage numbers.
import { useEffect, useRef } from 'preact/hooks';
import { app } from '../app';
import { glyph } from '../art/font';
import { C, HEX } from '../art/palette';
import { BATTLERS, FIGHTS, REGIONS, WALK_IN_SECONDS, type RegionId, type Role } from '../game/defs';
import { enemyLineup } from '../game/battle';
import { curb, lineupOf } from '../game/economy';
import type { Battle, Unit } from '../game/state';
import { crewArt, enemyArt, fieldArt } from './art';
import { hit } from './audio';
import { fmt } from './format';

const W = 320;
const H = 150;
const SCALE = 2;
export const ROLE_COLOR: Record<Role, number> = { tank: C.red, damage: C.sodium, control: C.green, heal: C.blue, buffer: C.violet };

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, c: number, shadow = true) {
  for (const pass of shadow ? [1, 0] : [0]) {
    ctx.fillStyle = HEX[pass ? C.ink : c];
    let cx = x + pass;
    for (const ch of s.toUpperCase()) {
      const g = glyph(ch);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i]) ctx.fillRect(cx + i, y + j + pass, 1, 1);
      cx += 4;
    }
  }
}
const center = (s: string, x: number) => x - Math.floor((s.length * 4 - 1) / 2);

// Feet positions. Fielded fighters stand in ranks of 3, front rank (tanks) nearest the lamp. Buffers stand on the curb, bottom left.
function crewSpots(n: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const col = Math.floor(i / 3);
    return [150 - col * 24, 84 + (i % 3) * 20 + (col % 2 ? 10 : 0)];
  });
}
const curbSpot = (i: number): [number, number] => [12 + i * 13, 146];
const enemySpot = (i: number): [number, number] => [184 + Math.floor(i / 3) * 24 + (i % 3 === 1 ? 12 : 0), 88 + (i % 3) * 20];
const BOSS_SPOT: [number, number] = [262, 134];
const lastFlash = new Map<number, number>();
const downAt = new Map<number, number>();

function drawUnit(ctx: CanvasRenderingContext2D, u: Unit, [x, y]: [number, number], t: number) {
  const big = u.boss;
  const flash = u.hp > 0 && u.flash > 0.2;
  const art = u.side === 'crew' ? crewArt(u.id, flash) : enemyArt(u.name, flash);
  const k = big ? 2 : 1;
  const was = lastFlash.get(u.uid) ?? 0;
  if (u.side === 'enemy' && u.flash > was + 0.05) hit(u.boss);
  lastFlash.set(u.uid, u.flash);
  const dir = u.side === 'crew' ? 1 : -1;
  if (u.acted > 0) x += dir * 3; // lunge
  if (u.flash > 0) x -= dir * Math.ceil(u.flash * 6); // knockback
  const w = 16 * k;
  const h = 24 * k;
  if (u.hp <= 0) {
    // fallen fighters fade out and leave the lot instead of piling up
    const at = downAt.get(u.uid) ?? (downAt.set(u.uid, t), t);
    const a = 0.5 - (t - at) * 0.6;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y - 4);
    ctx.rotate((dir * Math.PI) / 2);
    ctx.drawImage(art, -w / 2, -h / 2, w, h);
    ctx.restore();
    return;
  }
  const bob = Math.round(Math.sin(t * 4 + u.uid) * 0.6);
  ctx.drawImage(art, x - w / 2, y - h + bob, w, h);
  const top = y - h - 3;
  if (u.hp < u.maxHp) {
    const bw = big ? 28 : 12;
    ctx.fillStyle = HEX[C.ink];
    ctx.fillRect(x - bw / 2 - 1, top - 1, bw + 2, 3);
    ctx.fillStyle = HEX[u.side === 'crew' ? C.green : C.red];
    ctx.fillRect(x - bw / 2, top, Math.ceil((bw * u.hp) / u.maxHp), 1);
  }
  if (u.side !== 'enemy') return;
  if (u.weak) {
    const d = BATTLERS[u.weak];
    ctx.fillStyle = HEX[C.ink];
    ctx.fillRect(x - 4, top - 9, 7, 7);
    ctx.fillStyle = HEX[ROLE_COLOR[d.role]];
    ctx.fillRect(x - 3, top - 8, 5, 5);
    text(ctx, d.name[0], x - 2, top - 8, C.paper, false);
  }
  if (u.flash > 0) {
    const label = `-${fmt(u.lastDmg)}`;
    text(ctx, label, center(label, x), top - 16 - Math.round((0.35 - u.flash) * 30), u.lastWeak ? C.sodiumLight : C.paper);
  }
}

// SMOKE BREAK: the crew steps back to the curb by the lamp, a few cigarettes going, a bar filling up.
function smokeBreak(ctx: CanvasRenderingContext2D, t: number, r: RegionId) {
  const c = app.s.crews[r];
  const team = lineupOf(app.s, r);
  const done = 1 - Math.max(0, c.regroup) / Math.max(0.01, c.smoke);
  team.forEach((id, i) => {
    // up on the curb, either side of the lamp post
    const x = 92 + i * 17 + (i >= Math.ceil(team.length / 2) ? 14 : 0);
    const y = 62 + (i % 2) * 3;
    ctx.drawImage(crewArt(id), x - 8, y - 24);
    if (i % 2) return;
    // a lit cigarette and its smoke: three puffs rising and drifting, pixel squares
    ctx.fillStyle = HEX[C.sodiumLight];
    ctx.fillRect(x + 5, y - 13, 1, 1);
    for (let p = 0; p < 3; p++) {
      const ph = (t * 0.7 + p / 3 + i * 0.37) % 1;
      const sz = 2 + Math.floor(ph * 3);
      ctx.globalAlpha = 0.85 * (1 - ph * 0.8);
      ctx.fillStyle = HEX[ph < 0.4 ? C.bone : C.stone];
      ctx.fillRect(Math.round(x + 6 + Math.sin((ph + i) * 6) * 2 + ph * 4), Math.round(y - 15 - ph * 16), sz, sz);
    }
    ctx.globalAlpha = 1;
  });
  const bw = 90, bx = 160 - bw / 2, by = 104;
  text(ctx, 'SMOKE BREAK', center('SMOKE BREAK', 160), 94, C.sodiumLight);
  ctx.fillStyle = HEX[C.ink];
  ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
  ctx.fillStyle = HEX[C.asphalt];
  ctx.fillRect(bx, by, bw, 4);
  ctx.fillStyle = HEX[C.sodium];
  ctx.fillRect(bx, by, Math.round(bw * done), 4);
}

// Visual only, never touches the fight: when a group that was waiting in line takes over, it steps up from its
// place in line (STEP_UP seconds) instead of popping onto the spots, and the one-tick gap between fights keeps
// drawing the last fight, so nothing blinks. The fallen from the last group finish fading under the new one.
// Each group walks in along one of three lanes; the living close up toward the front as the front line falls.
const STEP_UP = 0.6;
const LANES: [number, number][] = [[70, -46], [96, 0], [70, 46]]; // from the upper right, the far right, the lower right
const lane = () => Math.floor(Math.random() * LANES.length);
// on deck: behind the last column of the group that's fighting, never on top of it
const queueOff = (fighting: number): [number, number] => [Math.ceil(fighting / 3) * 24 + 16, -10];
// a little give in the line so it doesn't look stamped
const jitter = (n: number): [number, number] => [(Math.imul(n, 2654435761) >>> 0) % 7 - 3, (Math.imul(n, 40503) >>> 0) % 5 - 2];
type P = [number, number];
type Trail = { last: Battle | null; lastAt: number; queued: boolean; seen: Battle | null; stepFrom: number; fallen: [Unit, P][]; lane: number; qLane: number; qOff: P; stepOff: P; drawn: number; at: Map<number, P> };
const trails: Trail[] = [0, 1].map(() => ({ last: null, lastAt: -9, queued: false, seen: null, stepFrom: -9, fallen: [], lane: 0, qLane: -1, qOff: [40, -10], stepOff: [40, -10], drawn: 0, at: new Map() }));

function draw(ctx: CanvasRenderingContext2D, t: number, r: RegionId) {
  const s = app.s;
  const c = s.crews[r];
  const f = FIGHTS[r][Math.min(c.at, FIGHTS[r].length - 1)];
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(fieldArt(REGIONS[r].lots[f.zone].id), 0, 0);
  const tr = trails[r];
  let b = c.battle;
  const gap = !b && c.smoke <= 0 && tr.last && t - tr.lastAt < 0.5; // regroup tick between two fights
  if (gap) b = tr.last;
  if (b && b !== tr.seen && c.battle === b) {
    // a new fight: if its group was standing in line, it steps up from there
    tr.stepFrom = tr.queued && b.enter < WALK_IN_SECONDS ? t : -9;
    const old = tr.seen?.enemies ?? [];
    tr.fallen = old.filter((u) => u.hp <= 0 && t - (downAt.get(u.uid) ?? t) < 0.9).map((u) => [u, u.boss ? BOSS_SPOT : tr.at.get(u.uid) ?? BOSS_SPOT]);
    tr.at.clear();
    tr.lane = tr.qLane >= 0 ? tr.qLane : lane();
    tr.stepOff = tr.qOff;
    tr.seen = b;
  }
  if (c.battle) ((tr.last = c.battle), (tr.lastAt = t), (tr.queued = c.queueEnter >= 0));
  else if (!gap) ((tr.last = null), (tr.queued = false));
  if (c.queueEnter < 0) tr.qLane = -1;
  else if (tr.qLane < 0) tr.qLane = lane();
  const ease = 1 - Math.exp(-Math.min(0.1, t - tr.drawn) * 6);
  tr.drawn = t;
  if (b) {
    if (!gap) for (const [u, p] of tr.fallen) drawUnit(ctx, u, p, t);
    const spots = crewSpots(b.crew.length);
    const order = b.crew.map((u, i) => [u, spots[i]] as const).sort((a, z) => a[1][1] - z[1][1]);
    for (const [u, p] of order) drawUnit(ctx, u, p, t);
    // the group walks in along its lane, or steps up from its place in line
    const k = Math.max(0, b.enter) / WALK_IN_SECONDS;
    const up = gap ? 0 : Math.max(0, 1 - (t - tr.stepFrom) / STEP_UP); // 1 = still in line, 0 = on the spot
    const ue = up * up * (3 - 2 * up);
    const [lx, ly] = LANES[tr.lane];
    const walk = ([x, y]: P): P => [
      Math.round(x + k * lx + tr.stepOff[0] * ue),
      Math.round(y + k * ly + tr.stepOff[1] * ue + (k > 0 || up > 0 ? Math.abs(Math.sin(t * 10)) * 1.5 : 0)),
    ];
    const regs = b.enemies.filter((e) => !e.boss);
    const alive = regs.filter((u) => u.hp > 0);
    for (const u of regs) {
      // the living fill the front spots in order; the fallen stay where they dropped
      const was = tr.at.get(u.uid);
      if (u.hp <= 0 && was) continue;
      const [sx, sy] = enemySpot(alive.indexOf(u));
      const [jx, jy] = jitter(u.uid);
      tr.at.set(u.uid, was ? [was[0] + (sx + jx - was[0]) * ease, was[1] + (sy + jy - was[1]) * ease] : [sx + jx, sy + jy]);
    }
    regs.map((u) => [u, walk(tr.at.get(u.uid)!)] as const).sort((a, z) => a[1][1] - z[1][1]).forEach(([u, p]) => drawUnit(ctx, u, p, t));
    for (const u of b.enemies.filter((e) => e.boss)) drawUnit(ctx, u, walk(BOSS_SPOT), t);
    // the next group waits in line behind the one you're fighting, and only steps up once the last of it is down
    if (c.queueEnter >= 0) {
      const qk = c.queueEnter / WALK_IN_SECONDS;
      tr.qOff = queueOff(regs.length);
      const [qx, qy] = LANES[Math.max(0, tr.qLane)];
      const qwalk = ([x, y]: P): P => [Math.round(x + tr.qOff[0] + qk * qx), Math.round(y + tr.qOff[1] + qk * qy + (qk > 0 ? Math.abs(Math.sin(t * 10)) * 1.5 : 0))];
      const next = enemyLineup(r, c.deck);
      const regs2 = next.filter((e) => !e.boss);
      regs2.forEach((e, i) => {
        const [jx, jy] = jitter(i + 1);
        const [x, y] = qwalk([enemySpot(i)[0] + jx, enemySpot(i)[1] + jy]);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(enemyArt(e.def.name), x - 8, y - 24);
        ctx.globalAlpha = 1;
      });
      const boss = next.find((e) => e.boss);
      if (boss) {
        const [x, y] = qwalk(BOSS_SPOT);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(enemyArt(boss.def.name), x - 16, y - 48, 32, 48);
        ctx.globalAlpha = 1;
      }
    }
  } else if (c.smoke > 0) smokeBreak(ctx, t, r);
  else {
    const team = lineupOf(s, r);
    const spots = crewSpots(team.length);
    team.map((id, i) => [id, spots[i]] as const).sort((a, z) => a[1][1] - z[1][1]).forEach(([id, [x, y]]) => ctx.drawImage(crewArt(id), x - 8, y - 24));
  }
  curb(s, r).forEach(([id], i) => {
    const [x, y] = curbSpot(i);
    ctx.drawImage(crewArt(id), x - 6, y - 18, 12, 18);
  });
  let by = 132;
  if (c.rally > 0) text(ctx, `RALLY +25% ${Math.ceil(c.rally)}S`, 196, (by += 8), C.sodiumLight);
}

function hitAt(r: RegionId, mx: number, my: number) {
  const s = app.s;
  const c = s.crews[r];
  const b = c.battle;
  const inside = (x: number, y: number, w: number, h: number) => mx >= x - w / 2 && mx <= x + w / 2 && my >= y - h && my <= y + 2;
  if (b) {
    const k = Math.max(0, b.enter) / WALK_IN_SECONDS;
    const [lx, ly] = LANES[trails[r].lane];
    const walk = ([x, y]: P): P => [x + k * lx, y + k * ly];
    const spots = crewSpots(b.crew.length);
    for (let i = 0; i < b.crew.length; i++) {
      const u = b.crew[i];
      const [x, y] = spots[i];
      if (inside(x, y, 16, 24)) return `${u.name} · ${u.role} · HP ${Math.ceil(u.hp)}/${u.maxHp} · ${u.dmg.toFixed(1)} / ${u.interval}s`;
    }
    const regs = b.enemies.filter((e) => !e.boss);
    for (let i = 0; i < regs.length; i++) {
      const u = regs[i];
      const [x, y] = walk(trails[r].at.get(u.uid) ?? enemySpot(i));
      if (inside(x, y, 16, 24)) return `${u.name}${u.tell ? ` · ${u.tell}` : ''}${u.weak ? ` · weak to ${BATTLERS[u.weak].name}` : ''} · HP ${Math.ceil(u.hp)}/${u.maxHp}`;
    }
    for (const u of b.enemies.filter((e) => e.boss)) {
      const [x, y] = walk(BOSS_SPOT);
      if (inside(x, y, 32, 48)) return `${u.name} · HP ${Math.ceil(u.hp)}/${u.maxHp}`;
    }
  }
  for (const [i, [id]] of curb(s, r).entries()) {
    const [x, y] = curbSpot(i);
    if (inside(x, y, 12, 18)) return `${BATTLERS[id].name} · curb · ${BATTLERS[id].does}`;
  }
  if (!b) {
    const team = lineupOf(s, r);
    const spots = crewSpots(team.length);
    for (let i = 0; i < team.length; i++) {
      const [x, y] = spots[i];
      if (inside(x, y, 16, 24)) {
        const d = BATTLERS[team[i]];
        return `${d.name} · ${d.role}`;
      }
    }
  }
  return null;
}

export function Field({ r }: { r: RegionId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rr = useRef(r);
  rr.current = r;
  useEffect(() => {
    let id = 0;
    const loop = (now: number) => {
      const ctx = ref.current?.getContext('2d');
      if (ctx) draw(ctx, now / 1000, rr.current);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  const local = (e: MouseEvent) => {
    const el = e.currentTarget as HTMLCanvasElement;
    const box = el.getBoundingClientRect();
    return [((e.clientX - box.left) / box.width) * W, ((e.clientY - box.top) / box.height) * H] as const;
  };
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      class="field"
      style={{ width: "100%", maxWidth: `${W * SCALE}px`, aspectRatio: `${W} / ${H}` }}
      onClick={() => {
        app.roster = true;
        app.tip = null;
        app.refresh();
      }}
      onMouseMove={(e) => {
        const [x, y] = local(e);
        const line = hitAt(rr.current, x, y);
        if (line) {
          const next = { x: e.clientX, y: e.clientY + 16, title: line.split(' · ')[0], lines: line.split(' · ').slice(1) };
          const cur = app.tip;
          if (!cur || cur.title !== next.title || cur.lines.join() !== next.lines.join()) {
            app.tip = next;
            app.refresh();
          }
        } else if (app.tip) {
          app.tip = null;
          app.refresh();
        }
      }}
      onMouseLeave={() => {
        if (app.tip) {
          app.tip = null;
          app.refresh();
        }
      }}
    />
  );
}
