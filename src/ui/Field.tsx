// The parking lot canvas: the crew in ranks by role, the enemies, hit flashes and damage numbers.
import { useEffect, useRef } from 'preact/hooks';
import { app } from '../app';
import { glyph } from '../art/font';
import { C, HEX } from '../art/palette';
import { BATTLERS, FIGHTS, REGIONS, type RegionId, type Role } from '../game/defs';
import { roster } from '../game/economy';
import type { Unit } from '../game/state';
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

// Feet positions. The crew stands in ranks, 4 deep, front rank (tanks) nearest the lamp, then damage, control, heal, buffers.
// Columns are 17px apart so no two sprites overlap side to side; odd columns sit half a row lower.
function crewSpots(roles: Role[]): [number, number][] {
  return roles.map((_, i) => {
    const col = Math.floor(i / 4);
    return [150 - col * 17, 82 + (i % 4) * 18 + (col % 2 ? 9 : 0)];
  });
}
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

function draw(ctx: CanvasRenderingContext2D, t: number, r: RegionId) {
  const s = app.s;
  const c = s.crews[r];
  const f = FIGHTS[r][Math.min(c.at, FIGHTS[r].length - 1)];
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(fieldArt(REGIONS[r].lots[f.zone].id), 0, 0);
  const b = c.battle;
  if (b) {
    const spots = crewSpots(b.crew.map((u) => u.role as Role));
    const order = b.crew.map((u, i) => [u, spots[i]] as const).sort((a, z) => a[1][1] - z[1][1]);
    for (const [u, p] of order) drawUnit(ctx, u, p, t);
    const regs = b.enemies.filter((e) => !e.boss);
    regs.map((u, i) => [u, enemySpot(i)] as const).sort((a, z) => a[1][1] - z[1][1]).forEach(([u, p]) => drawUnit(ctx, u, p, t));
    for (const u of b.enemies.filter((e) => e.boss)) drawUnit(ctx, u, BOSS_SPOT, t);
    const down = b.crew.filter((u) => u.hp <= 0).length;
    if (down) text(ctx, `${down} DOWN`, 4, 140, C.red);
  } else {
    const team = roster(s, r);
    const spots = crewSpots(team.map(([id]) => BATTLERS[id].role));
    team.map((m, i) => [m[0], spots[i]] as const).sort((a, z) => a[1][1] - z[1][1]).forEach(([id, [x, y]]) => ctx.drawImage(crewArt(id), x - 8, y - 24));
    text(ctx, 'REGROUPING', center('REGROUPING', 236), 96, C.bone);
  }
  let by = 132;
  if (c.rally > 0) text(ctx, `RALLY +25% ${Math.ceil(c.rally)}S`, 196, (by += 8), C.sodiumLight);
  if (c.overtime > 0 || b?.overtime) text(ctx, `OVERTIME ${b?.overtime ? 'ON' : ''}`, 196, by - 8, C.mint);
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
  return <canvas ref={ref} width={W} height={H} class="field" style={{ width: `${W * SCALE}px`, height: `${H * SCALE}px` }} />;
}
