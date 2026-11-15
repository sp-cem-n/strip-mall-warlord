// Shuffleboard, 2.5D: a long table seen down the lane. Pucks slide, slow, and knock each other.
// You throw blue; the house player throws red every third puck and goes after your best one.
// Only your pucks score. Aim with the mouse, A/D or the arrows; hold and release (or Space) for power.
import { C } from '../art/palette';
import { SHUFFLE_TOP } from '../game/room';
import { circle, type Game, type Pen } from './machines';

const LANE = 40; // lane width in table units
const NEAR = 112; // where you throw from (table y; 0 is the far edge)
const ZONES: [number, number, number][] = [[0, 7, 4], [7, 21, 3], [21, 35, 2], [35, 49, 1]];
const R = 2.6; // puck radius
const DECEL = 95; // table units / s^2 (the sand)
const VMAX = Math.sqrt(2 * DECEL * (NEAR + 6));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const tri = (t: number, period: number) => {
  const x = (t / period) % 1;
  return x < 0.5 ? x * 2 : 2 - x * 2;
};
export const zoneOf = (y: number) => (y < -R ? -1 : ZONES.find(([a, b]) => y >= a && y < b)?.[2] ?? 0);

interface Puck { x: number; y: number; vx: number; vy: number; red: boolean; live: boolean }

// one physics step; exported for the check script
export function slide(pucks: Puck[], dt: number) {
  for (const p of pucks) {
    if (!p.live) continue;
    const v = Math.hypot(p.vx, p.vy);
    if (v > 0) {
      const nv = Math.max(0, v - DECEL * dt);
      p.vx *= nv / v;
      p.vy *= nv / v;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < -1 || p.x > LANE + 1 || p.y < -R * 2) p.live = false; // into the gutter, or off the end
  }
  for (let i = 0; i < pucks.length; i++)
    for (let j = i + 1; j < pucks.length; j++) {
      const a = pucks[i], b = pucks[j];
      if (!a.live || !b.live) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= R * 2 || d === 0) continue;
      const nx = dx / d, ny = dy / d;
      const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      const push = (R * 2 - d) / 2;
      a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
      if (rel <= 0) continue;
      const k = rel * 0.92; // equal weights, a little lost to the clack
      a.vx -= k * nx; a.vy -= k * ny; b.vx += k * nx; b.vy += k * ny;
    }
}
export const moving = (pucks: Puck[]) => pucks.some((p) => p.live && Math.hypot(p.vx, p.vy) > 0.5);
export const scoreOf = (pucks: Puck[], red: boolean) => pucks.filter((p) => p.live && p.red === red).reduce((n, p) => n + Math.max(0, zoneOf(p.y)), 0);
export const throwPuck = (x: number, pow: number, red: boolean, angle = 0): Puck => {
  const v = VMAX * Math.sqrt(clamp(pow, 0, 1));
  return { x, y: NEAR, vx: Math.sin(angle) * v, vy: -Math.cos(angle) * v, red, live: true };
};
// power that stops a puck at table y
export const powFor = (y: number) => clamp((NEAR - y) / (NEAR + 6), 0, 1);

// the table, in perspective: far edge narrow at the top, your end wide at the bottom
function view(p: Pen) {
  const top = 6, bot = p.h - 4;
  const at = (y: number) => {
    const t = clamp((y + 6) / (NEAR + 10), 0, 1);
    const e = t * t * 0.45 + t * 0.55; // the far end bunches up
    const w = 22 + 44 * t;
    return { sy: top + (bot - top) * e, w, x0: 39 - w / 2, s: w / LANE };
  };
  return at;
}
function table(p: Pen) {
  const at = view(p);
  p.rect(0, 0, p.w, p.h, C.umber);
  for (let y = 0; y < p.h; y += 3) p.rect(0, y, p.w, 1, C.brick);
  for (let ty = -6; ty <= NEAR + 4; ty += 0.5) {
    const a = at(ty);
    const y = Math.round(a.sy);
    p.rect(Math.round(a.x0) - 2, y, Math.round(a.w) + 4, 2, C.ink); // gutter
    p.rect(Math.round(a.x0), y, Math.round(a.w), 2, ty < 0 ? C.umber : C.bone);
  }
  for (let ty = 2; ty < NEAR; ty += 5) for (let k = 0; k < 6; k++) {
    const a = at(ty + (k % 2) * 2.5);
    p.rect(Math.round(a.x0 + ((k * 7 + ty * 3) % 40) * a.s), Math.round(a.sy), 1, 1, C.paper); // the sand
  }
  for (const [, b, v] of ZONES) {
    const a = at(b);
    p.rect(Math.round(a.x0), Math.round(a.sy), Math.round(a.w), 1, C.red);
    const m = at(b - 6);
    p.text(String(v), Math.round(a.x0 + a.w) + 2, Math.round(m.sy) - 2, v === 4 ? C.red : C.sodiumLight);
  }
  const f = at(NEAR - 12);
  p.rect(Math.round(f.x0), Math.round(f.sy), Math.round(f.w), 1, C.blue); // foul line
}
function drawPuck(p: Pen, pk: Puck) {
  const a = view(p)(pk.y);
  const x = Math.round(a.x0 + pk.x * a.s), y = Math.round(a.sy);
  const r = Math.max(1, Math.round(R * a.s * 0.75));
  circle(p, x, y + 1, r, C.ink);
  circle(p, x, y, r, pk.red ? C.red : C.blue);
  p.rect(x - 1, y - Math.max(1, r - 1), 2, 1, C.paper);
}

const ORDER = [false, false, true, false, false, true, false, false, true]; // you, you, house...
export function shuffleV2(house = 'MO'): Game {
  const pucks: Puck[] = [];
  let turn = 0, aim = LANE / 2, hold = -1, keyL = false, keyR = false, end = -1, msg = '', wait = 0, mine = 0;
  const yours = ORDER.filter((r) => !r).length;
  const houseThrow = () => {
    // go after your best puck if there's one worth hitting; otherwise try to park in the 3
    const best = pucks.filter((q) => q.live && !q.red).sort((a, b) => zoneOf(b.y) - zoneOf(a.y))[0];
    const hit = best && zoneOf(best.y) >= 2 && Math.random() < 0.7;
    const x = clamp((hit ? best.x : 12 + Math.random() * 16) + (Math.random() - 0.5) * 5, R, LANE - R);
    const pow = hit ? powFor(best.y - 14) : powFor(13 + (Math.random() - 0.5) * 12);
    pucks.push(throwPuck(x, pow * (0.95 + Math.random() * 0.1), true));
    msg = hit ? `${house} GOES FOR IT` : `${house} THROWS`;
  };
  const finish = () => {
    const sc = scoreOf(pucks, false);
    end = 0;
    g.score = sc;
    g.q = Math.min(1, sc / SHUFFLE_TOP);
    g.label = `${sc} PTS`;
  };
  const nextTurn = () => {
    const before = pucks.filter((q) => q.live && !q.red).length;
    if (before < mine) msg = 'KNOCKED OFF';
    mine = before;
    turn++;
    if (turn >= ORDER.length) return finish();
    if (ORDER[turn]) (wait = 0.6), houseThrow();
  };
  const g: Game = {
    over: false, q: 0, score: 0,
    update(dt) {
      if (end >= 0) return void ((end += dt) > 1.8 && (g.over = true));
      if (hold >= 0) hold += dt;
      if (keyL) aim = clamp(aim - 22 * dt, R, LANE - R);
      if (keyR) aim = clamp(aim + 22 * dt, R, LANE - R);
      const busy = moving(pucks);
      for (let i = 0; i < 4; i++) slide(pucks, dt / 4);
      if (busy && !moving(pucks)) {
        const last = pucks[pucks.length - 1];
        if (!ORDER[turn] && last && !last.red) msg = !last.live ? (last.y < 0 ? 'OFF THE END' : 'GUTTER') : zoneOf(last.y) === 4 ? 'HANGER' : zoneOf(last.y) ? `+${zoneOf(last.y)}` : 'SHORT';
        wait = 0.5;
      }
      if (!busy && wait > 0 && (wait -= dt) <= 0 && pucks.length > turn) nextTurn();
    },
    draw(p) {
      table(p);
      for (const pk of pucks) if (pk.live) drawPuck(p, pk);
      const yourTurn = end < 0 && !ORDER[turn] && pucks.length === turn;
      if (yourTurn) {
        drawPuck(p, { x: aim, y: NEAR, vx: 0, vy: 0, red: false, live: true });
        const a = view(p)(NEAR - 6);
        p.rect(Math.round(a.x0 + aim * a.s), Math.round(a.sy) - 6, 1, 5, C.ink);
        // the power meter, the same one the skee lane has
        const m = hold >= 0 ? tri(hold, 1.8) : 0;
        p.rect(p.w - 6, p.h - 46, 5, 42, C.ink);
        for (let i = 0; i < 10; i++) p.rect(p.w - 5, p.h - 8 - i * 4, 3, 3, i / 10 < m ? [C.teal, C.teal, C.green, C.green, C.sodiumLight, C.sodiumLight, C.sodium, C.sodium, C.red, C.red][i] : C.asphalt);
      }
      p.text(`YOU ${scoreOf(pucks, false)}`, 2, 2, C.blue);
      p.text(`${house} ${scoreOf(pucks, true)}`, 2, 8, C.red);
      p.text(`${Math.min(yours, ORDER.slice(0, turn + 1).filter((r) => !r).length)}/${yours}`, p.w - 16, 2, C.paper);
      if (end >= 0) (p.rect(0, 40, p.w, 11, C.ink), p.center(g.label ?? '', 43, C.sodiumLight));
      else if (msg) p.center(msg, 16, C.sodiumLight);
      else if (turn === 0 && hold < 0) p.center('HOLD', 16, C.blue);
    },
    move(x) {
      if (hold < 0) {
        const a = view({ w: 78, h: 101 } as Pen)(NEAR);
        aim = clamp((x - a.x0) / a.s, R, LANE - R);
      }
    },
    down(x) {
      g.move?.(x, 0);
      if (end < 0 && !ORDER[turn] && pucks.length === turn && !moving(pucks)) hold = 0;
    },
    up() {
      if (hold < 0) return;
      const pow = tri(hold, 1.8);
      hold = -1;
      pucks.push(throwPuck(aim, pow, false, (Math.random() - 0.5) * 0.02));
      msg = '';
    },
    key(k, down) {
      const low = k.toLowerCase();
      if (low === 'a' || k === 'ArrowLeft') keyL = down;
      if (low === 'd' || k === 'ArrowRight') keyR = down;
      if (k !== ' ') return;
      if (!down) return g.up(0, 0);
      if (hold < 0 && end < 0 && !ORDER[turn] && pucks.length === turn && !moving(pucks)) hold = 0;
    },
  };
  return g;
}
