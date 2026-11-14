// The arcade's mini-games. Each one runs inside its cabinet's screen at art scale and reports a quality q (0..1)
// when it's over; the payout itself is game/room.ts's job, so Attract Mode and the bot pay the same way.
import { glyph } from '../art/font';
import { C, HEX } from '../art/palette';
import { HOUSE_SCORES, PINBALL_TOP, type MachineId } from '../game/room';

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
}
const circle = (p: Pen, cx: number, cy: number, r: number, c: number) => {
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
      for (let i = 0; i < 8; i++) p.rect(4 + i * 10, 4, 6, 6, i % 2 ? C.sodium : C.violet);
      p.rect(chute - 4, 12, 9, 4, C.stone);
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
        if (spill) for (let i = 0; i < Math.round(1 + drop.q * 5); i++) p.rect(10 + i * 11, 62 + Math.min(10, spill * 20) + (i % 2) * 2, 5, 2, C.sodium);
      }
      p.text(`PILE ${pile}`, 2, 68, C.bone);
      if (!drop) p.text('CLICK TO DROP', 2, 20, C.mint);
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
function whac(): Game {
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
function claw(onGrab: (q: number) => boolean): Game {
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
function pinball(): Game {
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

export function newGame(id: MachineId, o: { shelf: number; speed: number; jackpot: string; onGrab: (q: number) => boolean }): Game {
  switch (id) {
    case 'pusher': return pusher(o.shelf);
    case 'whac': return whac();
    case 'skee': return skee();
    case 'claw': return claw(o.onGrab);
    case 'pinball': return pinball();
    case 'cyclone': return cyclone(o.speed, o.jackpot);
  }
}

// What a cabinet shows between games: attract-mode lights.
export function idle(p: Pen, id: MachineId, t: number, extra: string) {
  p.rect(0, 0, p.w, p.h, C.ink);
  const blink = Math.floor(t * 2) % 2;
  for (let i = 0; i < 12; i++) p.rect(4 + i * 6, 4, 4, 2, (i + Math.floor(t * 6)) % 3 ? C.asphalt : C.sodium);
  p.center('INSERT', 20, blink ? C.sodiumLight : C.sodium, 2);
  p.center('COIN', 33, blink ? C.sodiumLight : C.sodium, 2);
  if (id === 'pinball') {
    p.center('HIGH SCORES', 52, C.mint);
    HOUSE_SCORES.forEach(([n, v], i) => p.text(`${n} ${v}`, 12, 60 + i * 7, C.bone));
  }
  if (extra) p.center(extra, id === 'pinball' ? 96 : 60, C.mint);
}
