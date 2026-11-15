// The arcade's mini-games. Each one runs inside its cabinet's screen at art scale and reports a quality q (0..1)
// when it's over; the payout itself is game/room.ts's job, so Attract Mode and the bot pay the same way.
import { glyph } from '../art/font';
import { C, HEX } from '../art/palette';
import { foos, foosIdle, trivia, triviaIdle } from './bargames';
import { BAR_HOUSE, HOUSE_SCORES, PINBALL_TOP, type BuffKind, type MachineId, type PusherField } from '../game/room';
import { clawV2, pinballV2, pusherV2, whacV2 } from './arcade';
import { shuffleV2 } from './shuffle';
import { blackjack, fairway, pullTabs } from './bar3';

export interface Pen {
  rect(x: number, y: number, w: number, h: number, c: number): Pen;
  text(s: string, x: number, y: number, c: number, scale?: number): void;
  center(s: string, y: number, c: number, scale?: number): void;
  w: number;
  h: number;
}
export function pen(ctx: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number): Pen {
  const rect = (x: number, y: number, ww: number, hh: number, c: number): Pen => {
    ctx.fillStyle = HEX[c];
    ctx.fillRect(Math.round(ox + x), Math.round(oy + y), Math.round(ww), Math.round(hh));
    return me;
  };
  const text = (s: string, x: number, y: number, c: number, k = 1) => {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      const g = glyph(ch);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i]) rect(cx + i * k, y + j * k, k, k, c);
      cx += 4 * k;
    }
  };
  const me: Pen = { rect, text, center: (s, y, c, k = 1) => text(s, Math.floor(w / 2 - (s.length * 4 * k - k) / 2), y, c, k), w, h };
  return me;
}

export interface Game {
  over: boolean;
  q: number;
  score?: number;
  label?: string; // shown when it's over
  update(dt: number): void;
  draw(p: Pen, t: number): void;
  down(x: number, y: number): void;
  up(x: number, y: number): void;
  move?(x: number, y: number): void;
  key?(key: string, down: boolean): void;
}
export const circle = (p: Pen, cx: number, cy: number, r: number, c: number) => {
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    p.rect(cx - w, cy + y, w * 2 + 1, 1, c);
  }
};
const tri = (t: number, period: number) => {
  const x = (t / period) % 1;
  return x < 0.5 ? x * 2 : 2 - x * 2;
};

// ---- Coin Pusher: a chute slides; drop when it's over the middle while the shelf is pulling back ----
function pusher(shelf: number): Game {
  let t = 0, drop: { x: number; y: number; vy: number; q: number } | null = null, spill = 0;
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      t += dt;
      if (drop) {
        drop.vy += 160 * dt;
        drop.y += drop.vy * dt;
        if (drop.y >= 44) {
          if (!spill) spill = 0.01;
          spill += dt;
          if (spill > 0.9) ((g.over = true), (g.q = drop.q));
        }
      }
    },
    draw(p) {
      const chute = 6 + tri(t, 1.7) * 66;
      const push = Math.sin(t * 3) * 4;
      p.rect(0, 0, p.w, p.h, C.night);
      // glass dome glints and the back wall
      p.rect(0, 0, p.w, 18, C.plum);
      if (drop && !spill) for (let i = 0; i < 8; i++) p.rect(4 + i * 10, 4, 6, 6, (i + Math.floor(t * 8)) % 2 ? C.sodium : C.violet);
      // the sweet spot: an arrow over the middle of the shelf; the chute lights up when it's over it
      const onIt = Math.abs(chute - 39) < 8;
      p.rect(37, 19, 5, 1, C.mint).rect(38, 20, 3, 1, C.mint).rect(39, 21, 1, 1, C.mint);
      p.rect(chute - 4, 12, 9, 4, onIt && !drop ? C.mint : C.stone);
      p.rect(chute - 1, 16, 3, 2, C.ink);
      // the pusher shelf and the pile
      p.rect(4, 30 + push, 70, 8, C.concrete);
      p.rect(4, 30 + push, 70, 1, C.stone);
      const pile = Math.round(shelf);
      p.rect(4, 40, 70, 22, C.asphalt);
      for (let i = 0; i < 26; i++) {
        const x = 6 + ((i * 13) % 64), y = 42 + ((i * 7) % 16);
        if (i < pile * 2.6) (p.rect(x, y, 5, 2, C.sodium), p.rect(x + 1, y, 3, 1, C.sodiumLight));
      }
      // the ledge
      p.rect(0, 62, p.w, 3, C.ink);
      p.rect(0, 65, p.w, p.h - 65, C.umber);
      if (drop) {
        p.rect(drop.x - 2, Math.min(drop.y, 44), 5, 2, C.sodiumLight);
        const n = Math.round(1 + drop.q * 5);
        if (spill) {
          for (let i = 0; i < n; i++) p.rect(10 + i * 11, 62 + Math.min(10, spill * 20) + (i % 2) * 2, 5, 2, C.sodium);
          p.center(`${n} OFF THE EDGE`, 1, n >= 4 ? C.sodiumLight : C.bone);
          p.center(drop.q > 0.7 ? 'RIGHT ON IT' : drop.q > 0.4 ? 'CLOSE' : 'WIDE', 7, n >= 4 ? C.mint : C.stone);
        }
      }
      p.text(`PILE ${pile}`, 2, 68, C.bone);
      p.text('EDGE PAYS $', p.w - 46, 68, C.sodiumLight);
      if (!drop) (p.center('DROP AT THE', 1, C.paper), p.center('ARROW', 7, C.paper));
    },
    down() {
      if (drop) return;
      const x = 6 + tri(t, 1.7) * 66;
      const aim = 1 - Math.min(1, Math.abs(x - 39) / 30);
      const back = Math.cos(t * 3) < 0 ? 1 : 0.4; // the shelf is pulling back: coins land flat in front
      drop = { x, y: 16, vy: 0, q: Math.min(1, aim * 0.75 + back * 0.25) };
    },
    up() {},
  };
  return g;
}

// ---- Whac-a-Shoplifter: 3x3 aisles, 30s ----
export function whac(): Game {
  let t = 0, bonks = 0, next = 0.6, flash = 0;
  const holes: { kind: 'thief' | 'shopper' | null; left: number; hit: number }[] = Array.from({ length: 9 }, () => ({ kind: null, left: 0, hit: 0 }));
  const spot = (i: number) => [6 + (i % 3) * 24, 10 + Math.floor(i / 3) * 21] as const;
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      t += dt;
      flash = Math.max(0, flash - dt);
      for (const h of holes) {
        h.hit = Math.max(0, h.hit - dt);
        if (h.kind && (h.left -= dt) <= 0) h.kind = null;
      }
      if ((next -= dt) <= 0) {
        next = 0.35 + r() * 0.45;
        const free = holes.filter((h) => !h.kind);
        if (free.length) {
          const h = free[Math.floor(r() * free.length)];
          h.kind = r() < 0.75 ? 'thief' : 'shopper';
          h.left = 0.6 + r() * 0.6;
        }
      }
      if (t >= 30) ((g.over = true), (g.q = Math.max(0, bonks) / 30), (g.label = `${bonks} BONKS`));
    },
    draw(p) {
      p.rect(0, 0, p.w, p.h, C.night);
      p.text(`${Math.max(0, Math.ceil(30 - t))}S`, 2, 2, C.sodiumLight);
      p.text(`${bonks}`, p.w - 4 * String(bonks).length - 2, 2, flash ? C.red : C.mint);
      holes.forEach((h, i) => {
        const [x, y] = spot(i);
        p.rect(x, y + 12, 18, 5, C.ink);
        p.rect(x + 1, y + 13, 16, 3, C.asphalt);
        if (h.kind) {
          const shirt = h.kind === 'thief' ? C.red : C.blue;
          p.rect(x + 5, y + 2, 8, 6, C.skin);
          p.rect(x + 4, y + 1, 10, 2, h.kind === 'thief' ? C.ink : C.umber); // ski cap / hair
          p.rect(x + 7, y + 4, 1, 1, C.ink);
          p.rect(x + 10, y + 4, 1, 1, C.ink);
          p.rect(x + 3, y + 8, 12, 5, shirt);
          if (h.kind === 'thief') p.rect(x + 13, y + 8, 4, 4, C.paper); // the bag
        }
        if (h.hit) p.text('BONK', x + 1, y + 2, C.sodiumLight);
      });
      p.rect(0, p.h - 8, p.w, 8, C.plum);
      p.center('RED CAPS ONLY', p.h - 7, C.paper);
    },
    down(x, y) {
      holes.forEach((h, i) => {
        const [hx, hy] = spot(i);
        if (x >= hx && x < hx + 18 && y >= hy && y < hy + 17 && h.kind) {
          bonks += h.kind === 'thief' ? 1 : -2;
          if (h.kind === 'shopper') flash = 0.4;
          h.kind = null;
          h.hit = 0.25;
        }
      });
    },
    up() {},
  };
  return g;
}

// ---- Skee-Ball: an aim needle sways; hold for power; nine balls ----
function skee(): Game {
  let t = 0, balls = 9, score = 0, hold = -1, roll: { x: number; y: number; tx: number; ty: number; k: number } | null = null, last = '';
  const RINGS: [number, number, number][] = [[39, 20, 50], [39, 24, 40], [39, 30, 30], [39, 36, 20], [39, 42, 10]];
  const pts = (x: number, y: number) => {
    if ((x < 12 || x > 66) && y < 14) return 100;
    for (const [cx, cy, v] of RINGS) if (Math.hypot(x - cx, (y - cy) * 1.3) < 4 + (50 - v) / 2.4) return v;
    return 0;
  };
  const g: Game = {
    over: false, q: 0, score: 0,
    update(dt) {
      t += dt;
      if (hold >= 0) hold += dt;
      if (roll) {
        roll.k += dt * 1.6;
        if (roll.k >= 1) {
          const v = pts(roll.tx, roll.ty);
          score += v;
          last = v ? `+${v}` : 'GUTTER';
          roll = null;
          if (--balls <= 0) ((g.over = true), (g.score = score), (g.q = Math.min(1, score / 450)), (g.label = `${score} PTS`));
        }
      }
    },
    draw(p) {
      p.rect(0, 0, p.w, p.h, C.umber);
      p.rect(8, 0, 62, p.h, C.tan);
      for (let y = 0; y < p.h; y += 6) p.rect(8, y, 62, 1, C.umber);
      p.rect(4, 2, 70, 48, C.ink);
      p.rect(5, 3, 8, 8, C.neon).rect(65, 3, 8, 8, C.neon);
      p.text('100', 5, 12, C.paper);
      for (const [cx, cy, v] of [...RINGS].reverse()) {
        const rr = 4 + (50 - v) / 2.4;
        circle(p, cx, cy, Math.round(rr), v >= 40 ? C.sodium : v >= 20 ? C.concrete : C.asphalt);
        circle(p, cx, cy, Math.round(rr) - 1, C.night);
      }
      for (const [cx, cy, v] of RINGS) p.text(String(v), cx - 3, cy - 2, C.bone);
      const aim = 39 + Math.sin(t * 2.4) * 30;
      if (!roll) {
        p.rect(Math.round(aim), 60, 1, 10, C.sodiumLight);
        p.rect(Math.round(aim) - 1, 58, 3, 2, C.sodiumLight);
        if (hold >= 0) {
          const pow = tri(hold, 1.6);
          p.rect(72, 72 - pow * 20, 4, pow * 20, C.red);
        }
      } else {
        const y = 70 + (roll.ty - 70) * roll.k - Math.sin(roll.k * Math.PI) * 8;
        const x = roll.x + (roll.tx - roll.x) * roll.k;
        circle(p, Math.round(x), Math.round(y), 2, C.paper);
      }
      p.rect(0, 52, p.w, 6, C.night);
      p.text(`${score}`, 2, 53, C.sodiumLight);
      p.text(`BALLS ${balls}`, 40, 53, C.bone);
      if (last && !roll) p.text(last, 2, 66, C.mint);
      if (balls === 9 && hold < 0 && !roll) p.text('HOLD', 30, 66, C.mint);
    },
    down() {
      if (!roll && balls > 0) hold = 0;
    },
    up() {
      if (hold < 0 || roll) return;
      const pow = tri(hold, 1.6);
      hold = -1;
      const aim = 39 + Math.sin(t * 2.4) * 30;
      roll = { x: aim, y: 70, tx: aim + (Math.sin(t * 7) * 2), ty: 46 - pow * 44, k: 0 };
    },
  };
  return g;
}

// ---- Claw: press to send it across, press to drop; dead center grips ----
const PRIZES = [C.violet, C.sodiumLight, C.neon, C.mint, C.blue];
export function claw(onGrab: (q: number) => boolean): Game {
  let x = 6, phase: 'wait' | 'move' | 'down' | 'up' | 'done' = 'wait', y = 6, got = false, hold = 0;
  const items = PRIZES.map((c, i) => ({ c, x: 10 + i * 14 + (i % 2) * 3, y: 52 + (i % 2) * 4 }));
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      if (phase === 'move') x = Math.min(72, x + dt * 24);
      if (phase === 'move' && x >= 72) phase = 'down';
      if (phase === 'down') {
        y += dt * 30;
        if (y >= 46) {
          const best = items.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
          const d = Math.abs(best.x - x);
          const q = Math.max(0.05, 0.9 - (0.7 * d) / 7);
          got = d < 8 && onGrab(q);
          if (got) items.splice(items.indexOf(best), 1);
          g.q = q;
          phase = 'up';
        }
      }
      if (phase === 'up') {
        y -= dt * 24;
        if (y <= 6) ((phase = 'done'), (hold = 0.8));
      }
      if (phase === 'done' && (hold -= dt) <= 0) ((g.over = true), (g.label = got ? 'GOT ONE' : 'SLIPPED'));
    },
    draw(p) {
      p.rect(0, 0, p.w, p.h, C.navy);
      for (let i = 0; i < p.w; i += 9) p.rect(i, 0, 1, p.h, C.night);
      p.rect(0, 2, p.w, 2, C.stone);
      p.rect(0, 62, p.w, p.h - 62, C.plum);
      for (const it of items) {
        circle(p, it.x, it.y, 5, it.c);
        p.rect(it.x - 2, it.y - 2, 1, 1, C.ink).rect(it.x + 2, it.y - 2, 1, 1, C.ink);
      }
      p.rect(Math.round(x), 4, 1, Math.round(y) - 4, C.bone);
      const open = phase === 'down' ? 3 : 1;
      p.rect(Math.round(x) - 3, Math.round(y), 7, 2, C.stone);
      p.rect(Math.round(x) - 3 - open, Math.round(y) + 2, 2, 4, C.stone).rect(Math.round(x) + 2 + open, Math.round(y) + 2, 2, 4, C.stone);
      if (got && (phase === 'up' || phase === 'done')) circle(p, Math.round(x), Math.round(y) + 7, 4, C.sodiumLight);
      p.rect(68, 62, 10, p.h - 62, C.ink);
      p.text('PRIZE', 58, 66, C.paper);
      if (phase === 'wait') p.text('PRESS TO GO', 4, 66, C.mint);
      if (phase === 'move') p.text('PRESS TO DROP', 4, 66, C.sodiumLight);
    },
    down() {
      if (phase === 'wait') phase = 'move';
      else if (phase === 'move') phase = 'down';
    },
    up() {},
  };
  return g;
}

// ---- Night Shift: pinball. Left half of the table is the left flipper, right half the right. 3 balls. ----
export function pinball(): Game {
  const W = 78, H = 101;
  let ball = { x: 72, y: 90, vx: 0, vy: -95 }, balls = 3, score = 0, launched = true, wait = 0;
  const L = { on: false, a: 0 }, R = { on: false, a: 0 };
  const bumpers = [{ x: 24, y: 30, r: 5, lit: 0 }, { x: 48, y: 24, r: 5, lit: 0 }, { x: 38, y: 44, r: 5, lit: 0 }];
  const letters = 'NIGHT'.split('').map((ch, i) => ({ ch, x: 14 + i * 11, on: false }));
  const flip = (side: -1 | 1, a: number) => {
    const px = side < 0 ? 22 : 56, len = 15;
    const ang = side < 0 ? 0.45 - a * 0.9 : Math.PI - 0.45 + a * 0.9;
    return { x1: px, y1: 88, x2: px + Math.cos(ang) * len, y2: 88 + Math.sin(ang) * len };
  };
  const g: Game = {
    over: false, q: 0, score: 0,
    update(dt) {
      L.a = Math.max(0, Math.min(1, L.a + (L.on ? 12 : -8) * dt));
      R.a = Math.max(0, Math.min(1, R.a + (R.on ? 12 : -8) * dt));
      for (const b of bumpers) b.lit = Math.max(0, b.lit - dt);
      if (!launched) {
        if ((wait -= dt) <= 0) ((ball = { x: 72, y: 90, vx: -5, vy: -100 }), (launched = true));
        return;
      }
      const sub = 4;
      for (let k = 0; k < sub; k++) {
        const h = dt / sub;
        ball.vy += 70 * h;
        ball.x += ball.vx * h;
        ball.y += ball.vy * h;
        if (ball.x < 3) ((ball.x = 3), (ball.vx = Math.abs(ball.vx) * 0.8));
        if (ball.x > W - 3) ((ball.x = W - 3), (ball.vx = -Math.abs(ball.vx) * 0.8));
        if (ball.y < 3) ((ball.y = 3), (ball.vy = Math.abs(ball.vy) * 0.8));
        // top-right curve sends launches left
        if (ball.x > 60 && ball.y < 14) ball.vx -= 300 * h;
        for (const b of bumpers) {
          const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy);
          if (d < b.r + 2 && d > 0) {
            const nx = dx / d, ny = dy / d;
            ball.x = b.x + nx * (b.r + 2);
            ball.y = b.y + ny * (b.r + 2);
            const sp = Math.max(70, Math.hypot(ball.vx, ball.vy));
            ball.vx = nx * sp;
            ball.vy = ny * sp;
            if (b.lit <= 0) score += 500;
            b.lit = 0.2;
          }
        }
        if (ball.y < 10 && ball.vy < 0) for (const l of letters) if (!l.on && Math.abs(ball.x - l.x - 1) < 4) ((l.on = true), (score += 1000));
        if (letters.every((l) => l.on)) (letters.forEach((l) => (l.on = false)), (score += 5000));
        for (const [side, st] of [[-1, L], [1, R]] as const) {
          const f = flip(side, st.a);
          const ex = f.x2 - f.x1, ey = f.y2 - f.y1, len2 = ex * ex + ey * ey;
          const u = Math.max(0, Math.min(1, ((ball.x - f.x1) * ex + (ball.y - f.y1) * ey) / len2));
          const cx = f.x1 + ex * u, cy = f.y1 + ey * u, dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy);
          if (d < 2.5) {
            const nx = d ? dx / d : 0, ny = d ? dy / d : -1;
            ball.x = cx + nx * 2.5;
            ball.y = cy + ny * 2.5;
            const vn = ball.vx * nx + ball.vy * ny;
            if (vn < 0) ((ball.vx -= 1.7 * vn * nx), (ball.vy -= 1.7 * vn * ny));
            if (st.on && st.a < 1) ((ball.vy -= 120 * u), (ball.vx += side * -30 * u));
          }
        }
        // slingshot walls toward the flippers
        if (ball.y > 70 && ball.x < 14 && ball.y < 88) ((ball.vx = Math.abs(ball.vx) + 10), (score += 10));
        if (ball.y > 70 && ball.x > W - 14 && ball.y < 88) ((ball.vx = -Math.abs(ball.vx) - 10), (score += 10));
        if (ball.y > H + 3) {
          balls--;
          launched = false;
          wait = 1;
          if (balls <= 0) ((g.over = true), (g.score = score), (g.q = Math.min(1, score / PINBALL_TOP)), (g.label = `${score}`));
          break;
        }
      }
    },
    draw(p) {
      p.rect(0, 0, W, H, C.navy);
      for (let y = 0; y < H; y += 2) for (let x = (y / 2) % 2; x < W; x += 6) p.rect(x, y, 1, 1, C.night);
      // the lamp post on the playfield: it's the Night Shift
      p.rect(64, 30, 2, 30, C.concrete).rect(60, 28, 9, 3, C.sodium).rect(58, 31, 13, 6, C.plum);
      for (const l of letters) p.text(l.ch, l.x, 4, l.on ? C.sodiumLight : C.asphalt);
      for (const b of bumpers) (circle(p, b.x, b.y, b.r, b.lit ? C.paper : C.red), circle(p, b.x, b.y, b.r - 2, b.lit ? C.sodiumLight : C.neon));
      p.rect(0, 70, 12, 2, C.mint).rect(W - 12, 70, 12, 2, C.mint);
      for (const [side, st] of [[-1, L], [1, R]] as const) {
        const f = flip(side, st.a);
        for (let i = 0; i <= 10; i++) p.rect(f.x1 + ((f.x2 - f.x1) * i) / 10 - 1, f.y1 + ((f.y2 - f.y1) * i) / 10 - 1, 3, 2, C.paper);
      }
      if (launched) circle(p, Math.round(ball.x), Math.round(ball.y), 2, C.bone);
      p.rect(0, H - 8, W, 8, C.ink);
      p.text(String(score), 2, H - 7, C.sodiumLight);
      p.text(`BALL ${4 - Math.max(1, balls)}`, W - 26, H - 7, C.bone);
      if (!L.on && !R.on && score === 0) (p.text('L', 14, 78, C.concrete), p.text('R', 61, 78, C.concrete)); // which half is which flipper
    },
    down(x) {
      if (x < W / 2) L.on = true;
      else R.on = true;
    },
    up() {
      L.on = false;
      R.on = false;
    },
  };
  return g;
}

// ---- Cyclone: 24 lights; stop it on the jackpot ----
function cyclone(speed: number, jackpot: string): Game {
  let t = Math.random() * 3, stopped = -1, hold = 0;
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      if (stopped < 0) t += dt;
      else if ((hold -= dt) <= 0) g.over = true;
    },
    draw(p, now) {
      p.rect(0, 0, p.w, p.h, C.ink);
      const cx = 39, cy = 40, n = Math.floor(t * speed) % 24;
      const at = stopped >= 0 ? stopped : n;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * 30, y = cy + Math.sin(a) * 30;
        const on = i === at;
        const base = i === 0 ? C.red : C.asphalt;
        circle(p, Math.round(x), Math.round(y), i === 0 ? 3 : 2, on ? (i === 0 ? C.sodiumLight : C.paper) : base);
      }
      p.center('JACKPOT', 30, C.red);
      p.center(jackpot, 38, Math.floor(now * 3) % 2 ? C.sodiumLight : C.sodium);
      if (stopped >= 0) p.center(stopped === 0 ? 'JACKPOT!' : stopped === 1 || stopped === 23 ? 'SO CLOSE' : 'NOPE', 48, C.mint);
      else p.center('CLICK TO STOP', 48, C.bone);
    },
    down() {
      if (stopped >= 0) return;
      stopped = Math.floor(t * speed) % 24;
      g.q = stopped === 0 ? 1 : stopped === 1 || stopped === 23 ? 0.5 : 0;
      g.label = stopped === 0 ? 'JACKPOT' : g.q ? 'SO CLOSE' : 'NOPE';
      hold = 1.4;
    },
    up() {},
  };
  return g;
}


// ================= The Off-Ramp =================

// ---- Darts: the hand drifts; click when it's over the bull. Three darts. ----
const DART_NUMS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const BOARD_R = 31;
function dartAt(dx: number, dy: number) {
  const d = Math.hypot(dx, dy);
  const seg = Math.floor(((Math.atan2(dx, -dy) / (2 * Math.PI) + 1) * 20 + 0.5)) % 20;
  if (d < 2.5) return { ring: 'bull' as const, d, seg, pts: 50, color: C.red };
  if (d < 5) return { ring: 'outer' as const, d, seg, pts: 25, color: C.green };
  const odd = seg % 2 === 1;
  if (d < 16) return { ring: 'single' as const, d, seg, pts: DART_NUMS[seg], color: odd ? C.bone : C.ink };
  if (d < 18.5) return { ring: 'treble' as const, d, seg, pts: DART_NUMS[seg] * 3, color: odd ? C.green : C.red };
  if (d < 25) return { ring: 'single' as const, d, seg, pts: DART_NUMS[seg], color: odd ? C.bone : C.ink };
  if (d < 27.5) return { ring: 'double' as const, d, seg, pts: DART_NUMS[seg] * 2, color: odd ? C.green : C.red };
  if (d < BOARD_R) return { ring: 'wire' as const, d, seg, pts: 0, color: C.night };
  return null;
}
// the board as horizontal runs of one color, worked out once
const BOARD_RUNS: [number, number, number, number][] = (() => {
  const out: [number, number, number, number][] = [];
  for (let y = -BOARD_R; y <= BOARD_R; y++) {
    let start = 0, col = -1;
    for (let x = -BOARD_R; x <= BOARD_R + 1; x++) {
      const c = x <= BOARD_R ? (dartAt(x, y)?.color ?? -1) : -1;
      if (c !== col) {
        if (col >= 0) out.push([start, y, x - start, col]);
        start = x;
        col = c;
      }
    }
  }
  return out;
})();
function drawBoard(p: Pen, cx: number, cy: number) {
  circle(p, cx, cy, BOARD_R + 2, C.umber);
  for (const [x, y, w, c] of BOARD_RUNS) p.rect(cx + x, cy + y, w, 1, c);
  for (let i = 0; i < 20; i += 5) {
    const a = (i / 20) * 2 * Math.PI;
    const n = String(DART_NUMS[i]);
    p.text(n, cx + Math.round(Math.sin(a) * 29) - n.length * 2, cy - Math.round(Math.cos(a) * 29) - 2, C.paper);
  }
}
function darts(): Game {
  let t = 0, done = -1;
  const thrown: { x: number; y: number; pts: number; q: number; bull: boolean }[] = [];
  const CX = 39, CY = 37;
  const hand = () => [CX + Math.sin(t * 1.3) * 17 + Math.sin(t * 3.7) * 6, CY + Math.cos(t * 1.7) * 13 + Math.sin(t * 2.9) * 5] as const;
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      t += dt;
      if (done >= 0 && (done += dt) > 1.2) g.over = true;
    },
    draw(p) {
      p.rect(0, 0, p.w, p.h, C.ink);
      drawBoard(p, CX, CY);
      for (const d of thrown) p.rect(Math.round(d.x), Math.round(d.y), 1, 1, C.sodiumLight).rect(Math.round(d.x) + 1, Math.round(d.y) + 1, 2, 1, C.red).rect(Math.round(d.x) + 3, Math.round(d.y) + 2, 2, 1, C.paper);
      if (done < 0) {
        const [x, y] = hand();
        p.rect(Math.round(x) - 4, Math.round(y), 3, 1, C.sodiumLight).rect(Math.round(x) + 2, Math.round(y), 3, 1, C.sodiumLight);
        p.rect(Math.round(x), Math.round(y) - 4, 1, 3, C.sodiumLight).rect(Math.round(x), Math.round(y) + 2, 1, 3, C.sodiumLight);
      }
      p.text(thrown.map((d) => (d.bull ? 'BULL' : d.pts)).join(' '), 2, 2, C.mint);
      p.text(`${3 - thrown.length}`, p.w - 6, 2, C.sodiumLight);
      if (done >= 0) p.center(g.label ?? '', p.h - 7, C.sodiumLight);
    },
    down() {
      if (done >= 0) return;
      const [x, y] = hand();
      const hit = dartAt(x - CX, y - CY);
      const q = !hit ? 0 : hit.ring === 'bull' ? 1 : hit.ring === 'outer' ? 0.8 : hit.ring === 'treble' ? 0.7 : Math.max(0, 1 - hit.d / BOARD_R) * 0.5;
      thrown.push({ x, y, pts: hit?.pts ?? 0, q, bull: hit?.ring === 'bull' });
      if (thrown.length === 3) {
        const bulls = thrown.filter((d) => d.bull).length;
        g.q = bulls === 3 ? 1 : Math.min(0.95, thrown.reduce((a, d) => a + d.q, 0) / 3);
        g.score = thrown.reduce((a, d) => a + d.pts, 0);
        g.label = bulls === 3 ? 'TON-FIFTY' : `${g.score} SCORED`;
        done = 0;
      }
    },
    up() {},
  };
  return g;
}

// ---- Pool: six balls racked, six shots. Press on the table, pull back, let go. ----
const POCKETS = (w: number, h: number) => [[1, 1], [w - 2, 1], [0, h / 2], [w - 1, h / 2], [1, h - 2], [w - 2, h - 2]] as const;
const BALL_COLORS = [C.sodiumLight, C.blue, C.red, C.violet, C.sodium, C.ink];
function pool(): Game {
  const W = 78, H = 101, R = 2.5;
  type Ball = { x: number; y: number; vx: number; vy: number; c: number; in: boolean; cue?: boolean };
  const balls: Ball[] = [];
  const rows = [[39], [36.4, 41.6], [33.8, 39, 44.2]];
  let k = 0;
  rows.forEach((row, i) => row.forEach((x) => balls.push({ x, y: 30 - i * 4.6, vx: 0, vy: 0, c: BALL_COLORS[k++], in: false })));
  const cue: Ball = { x: 39, y: 80, vx: 0, vy: 0, c: C.paper, in: false, cue: true };
  balls.push(cue);
  let shots = 6, aim: { x: number; y: number } | null = null, pull: { x: number; y: number } | null = null, end = -1, msg = '';
  const moving = () => balls.some((b) => !b.in && Math.hypot(b.vx, b.vy) > 0.5);
  const sunk = () => balls.filter((b) => b.in && !b.cue).length;
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      for (let n = 0; n < 6; n++) {
        const h = dt / 6;
        for (const b of balls) {
          if (b.in) continue;
          b.x += b.vx * h;
          b.y += b.vy * h;
          const sp = Math.hypot(b.vx, b.vy);
          const f = Math.max(0, sp - 30 * h) / (sp || 1);
          b.vx *= f * (1 - 0.4 * h);
          b.vy *= f * (1 - 0.4 * h);
          for (const [px, py] of POCKETS(W, H)) if (Math.hypot(b.x - px, b.y - py) < 4.6) ((b.in = true), (b.vx = b.vy = 0), (msg = b.cue ? 'SCRATCH' : 'IN'));
          if (b.in) continue;
          if (b.x < R + 1) ((b.x = R + 1), (b.vx = Math.abs(b.vx) * 0.8));
          if (b.x > W - R - 1) ((b.x = W - R - 1), (b.vx = -Math.abs(b.vx) * 0.8));
          if (b.y < R + 1) ((b.y = R + 1), (b.vy = Math.abs(b.vy) * 0.8));
          if (b.y > H - R - 1) ((b.y = H - R - 1), (b.vy = -Math.abs(b.vy) * 0.8));
        }
        for (let i = 0; i < balls.length; i++)
          for (let j = i + 1; j < balls.length; j++) {
            const a = balls[i], b = balls[j];
            if (a.in || b.in) continue;
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
            if (d >= 2 * R || d === 0) continue;
            const nx = dx / d, ny = dy / d;
            const push = (2 * R - d) / 2;
            a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
            const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (rel <= 0) continue;
            a.vx -= rel * nx * 0.96; a.vy -= rel * ny * 0.96; b.vx += rel * nx * 0.96; b.vy += rel * ny * 0.96;
          }
      }
      if (!moving()) {
        for (const b of balls) if (Math.hypot(b.vx, b.vy) <= 0.5) b.vx = b.vy = 0;
        if (cue.in && sunk() < 6) Object.assign(cue, { in: false, x: 39, y: 80, vx: 0, vy: 0 });
        if (end < 0 && (sunk() === 6 || shots === 0)) {
          end = 0;
          g.q = sunk() / 6;
          g.label = sunk() === 6 ? 'RAN THE RACK' : `${sunk()} DOWN`;
        }
      }
      if (end >= 0 && (end += dt) > 1.4) g.over = true;
    },
    draw(p) {
      p.rect(0, 0, W, H, C.forest);
      p.rect(2, 2, W - 4, H - 4, C.teal);
      for (let y = 4; y < H - 4; y += 6) for (let x = 4 + (y % 12 ? 3 : 0); x < W - 4; x += 6) p.rect(x, y, 1, 1, C.forest);
      p.rect(Math.round(W / 2) - 8, 74, 16, 1, C.mint); // the head string
      for (const [px, py] of POCKETS(W, H)) circle(p, Math.round(px), Math.round(py), 4, C.ink);
      for (const b of balls) {
        if (b.in) continue;
        circle(p, Math.round(b.x), Math.round(b.y), 2, b.c);
        p.rect(Math.round(b.x) - 1, Math.round(b.y) - 1, 1, 1, b.c === C.ink ? C.concrete : C.paper);
      }
      if (aim && pull && !moving() && !cue.in) {
        const dx = aim.x - pull.x, dy = aim.y - pull.y, len = Math.min(36, Math.hypot(dx, dy));
        const ux = dx / (Math.hypot(dx, dy) || 1), uy = dy / (Math.hypot(dx, dy) || 1);
        for (let i = 4; i < 40; i += 3) p.rect(Math.round(cue.x + ux * i), Math.round(cue.y + uy * i), 1, 1, C.paper);
        for (let i = 0; i < 26; i++) p.rect(Math.round(cue.x - ux * (4 + len / 2 + i)), Math.round(cue.y - uy * (4 + len / 2 + i)), 1, 1, i < 3 ? C.blue : C.sodiumLight);
        p.rect(W - 5, H - 4 - Math.round(len), 3, Math.round(len), C.red);
      }
      p.text(`SHOTS ${shots}`, 4, H - 9, C.paper);
      p.text(`${sunk()}/6`, W - 18, 4, C.sodiumLight);
      if (msg && moving()) p.center(msg, 44, C.sodiumLight);
      if (end >= 0) p.center(g.label ?? '', 44, C.sodiumLight);
      else if (shots === 6 && !aim && !moving()) p.center('PULL BACK', 88, C.mint);
    },
    down(x, y) {
      if (moving() || end >= 0 || shots <= 0) return;
      aim = { x, y };
      pull = { x, y };
    },
    move(x, y) {
      if (aim) pull = { x, y };
    },
    up(x, y) {
      if (!aim) return;
      const dx = aim.x - x, dy = aim.y - y, len = Math.min(36, Math.hypot(dx, dy));
      aim = pull = null;
      if (len < 3 || moving()) return;
      cue.vx = (dx / Math.hypot(dx, dy)) * len * 7;
      cue.vy = (dy / Math.hypot(dx, dy)) * len * 7;
      shots--;
      msg = '';
    },
  };
  return g;
}

// ---- Video Poker: Jacks or Better. Click cards to hold, then DRAW. ----
const SUITS = [
  [0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0], // hearts
  [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0], // diamonds, hollow so it can't read as a cross
  [0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0], // clubs
  [0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0], // spades
];
// Four-color deck: hearts red, diamonds blue, clubs green, spades black.
const SUIT_INK = [C.red, C.blue, C.forest, C.ink];
// The paytable shows what each payout tier covers, so a flush doesn't light up THREE OF A KIND.
const PAYTABLE = ['STR/ROYAL FLUSH', 'FULL HOUSE/QUADS', 'TRIPS/STR/FLUSH', 'JACKS/TWO PAIR'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export function handTier(cards: number[]): [number, string] {
  const r = cards.map((c) => c % 13).sort((a, b) => a - b);
  const flush = cards.every((c) => Math.floor(c / 13) === Math.floor(cards[0] / 13));
  const uniq = new Set(r).size === 5;
  const straight = uniq && (r[4] - r[0] === 4 || r.join() === '0,1,2,3,12');
  const counts = Object.values(r.reduce<Record<number, number>>((a, x) => ((a[x] = (a[x] ?? 0) + 1), a), {})).sort((a, b) => b - a);
  if (straight && flush) return [4, r[0] === 8 ? 'ROYAL FLUSH' : 'STRAIGHT FLUSH'];
  if (counts[0] === 4) return [3, 'FOUR OF A KIND'];
  if (counts[0] === 3 && counts[1] === 2) return [3, 'FULL HOUSE'];
  if (flush) return [2, 'FLUSH'];
  if (straight) return [2, 'STRAIGHT'];
  if (counts[0] === 3) return [2, 'THREE OF A KIND'];
  if (counts[0] === 2 && counts[1] === 2) return [1, 'TWO PAIR'];
  if (counts[0] === 2 && r.some((x, i) => x >= 9 && r[i + 1] === x)) return [1, 'JACKS OR BETTER'];
  return [0, 'NOTHING'];
}
function poker(): Game {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 51; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const hand = deck.splice(0, 5);
  const held = [false, false, false, false, false];
  let drawn = false, end = 0, flip = 0;
  const cardX = (i: number) => 3 + i * 15;
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      flip = Math.max(0, flip - dt);
      if (drawn && (end += dt) > 1.8) g.over = true;
    },
    draw(p, now) {
      p.rect(0, 0, p.w, p.h, C.navy);
      const [tier] = handTier(hand);
      PAYTABLE.forEach((n, i) => p.text(n, 3, 2 + i * 6, drawn && tier === 4 - i ? (Math.floor(now * 6) % 2 ? C.sodiumLight : C.paper) : C.bone));
      hand.forEach((c, i) => {
        const x = cardX(i), y = 28;
        if (flip > 0 && !held[i] && drawn) return void p.rect(x, y, 14, 20, C.red).rect(x + 2, y + 2, 10, 16, C.brick);
        p.rect(x, y, 14, 20, C.paper).rect(x, y + 19, 14, 1, C.stone);
        const suit = Math.floor(c / 13), ink = SUIT_INK[suit];
        p.text(RANKS[c % 13], x + 1, y + 1, ink);
        const bits = SUITS[suit];
        for (let j = 0; j < 25; j++) if (bits[j]) p.rect(x + 2 + (j % 5) * 2, y + 7 + Math.floor(j / 5) * 2, 2, 2, ink);
        if (held[i]) p.text('HELD', x - 1, y + 22, C.sodiumLight);
      });
      p.rect(14, 62, 50, 11, drawn ? C.asphalt : C.sodium);
      p.rect(14, 72, 50, 1, C.umber);
      p.center(drawn ? handTier(hand)[1] : 'DRAW', 65, drawn ? C.sodiumLight : C.ink);
    },
    down(x, y) {
      if (drawn) return;
      if (y >= 28 && y < 52) {
        const i = Math.floor((x - 3) / 15);
        if (i >= 0 && i < 5) held[i] = !held[i];
      } else if (y >= 58) {
        for (let i = 0; i < 5; i++) if (!held[i]) hand[i] = deck.shift()!;
        drawn = true;
        flip = 0.3;
        const [tier, name] = handTier(hand);
        g.q = tier / 4;
        g.label = name;
      }
    },
    up() {},
  };
  return g;
}

// ---- Shuffleboard: the needle sways, hold for power. The far end is worth more; past it is nothing. ----
export function newGame(id: MachineId, o: { shelf: number; speed: number; jackpot: string; house?: string; onGrab: (q: number, prize?: BuffKind) => boolean; field?: PusherField; grip?: number }): Game {
  switch (id) {
    case 'pusher': return o.field ? pusherV2(o.field) : pusher(o.shelf);
    case 'whac': return whacV2();
    case 'skee': return skee();
    case 'claw': return clawV2(o.onGrab, o.grip ?? 0);
    case 'pinball': return pinballV2();
    case 'cyclone': return cyclone(o.speed, o.jackpot);
    case 'darts': return darts();
    case 'pool': return pool();
    case 'poker': return poker();
    case 'shuffle': return shuffleV2(o.house);
    case 'foos': return foos();
    case 'trivia': return trivia();
    case 'tabs': return pullTabs();
    case 'blackjack': return blackjack();
    case 'fairway': return fairway();
  }
}

// What a cabinet shows between games: attract-mode lights.
export function idle(p: Pen, id: MachineId, t: number, extra: string) {
  const blink = Math.floor(t * 2) % 2;
  if (id === 'darts') {
    p.rect(0, 0, p.w, p.h, C.ink);
    drawBoard(p, 39, 37);
    if (extra) (p.rect(0, p.h - 9, p.w, 9, C.ink), p.center(extra, p.h - 7, C.mint));
    return;
  }
  if (id === 'pool') {
    p.rect(0, 0, p.w, p.h, C.forest).rect(2, 2, p.w - 4, p.h - 4, C.teal);
    for (const [px, py] of POCKETS(p.w, p.h)) circle(p, Math.round(px), Math.round(py), 4, C.ink);
    [[39, 30], [36, 26], [42, 26], [33, 21], [39, 21], [45, 21]].forEach(([x, y], i) => circle(p, x, y, 2, BALL_COLORS[i]));
    p.rect(30, 16, 19, 1, C.umber); // the rack, still on
    p.center(extra || 'QUARTERS', 60, extra ? C.mint : blink ? C.paper : C.bone);
    return;
  }
  if (id === 'foos') return foosIdle(p, t, extra);
  if (id === 'trivia') return triviaIdle(p, t, extra);
  if (id === 'shuffle') {
    p.rect(0, 0, p.w, p.h, C.umber).rect(6, 0, 66, p.h, C.bone);
    p.center('HIGH SCORES', 20, C.red);
    BAR_HOUSE.forEach(([n, v], i) => p.text(`${n} ${v}`, 16, 30 + i * 8, C.ink));
    p.center(extra || 'QUARTERS', 80, extra ? C.blue : blink ? C.red : C.brick);
    return;
  }
  p.rect(0, 0, p.w, p.h, id === 'poker' ? C.navy : C.ink);
  for (let i = 0; i < 12; i++) p.rect(4 + i * 6, 4, 4, 2, (i + Math.floor(t * 6)) % 3 ? C.asphalt : C.sodium);
  p.center(id === 'poker' ? 'DEAL' : 'PRESS', 20, blink ? C.sodiumLight : C.sodium, 2);
  p.center(id === 'poker' ? 'ME IN' : 'PLAY', 33, blink ? C.sodiumLight : C.sodium, 2);
  if (id === 'pinball') {
    p.center('HIGH SCORES', 52, C.mint);
    HOUSE_SCORES.forEach(([n, v], i) => p.text(`${n} ${v}`, 12, 60 + i * 7, C.bone));
  }
  if (extra) p.center(extra, id === 'pinball' ? 96 : 60, C.mint);
}
