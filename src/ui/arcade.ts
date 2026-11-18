// Fun Zone v2 playfields (Toad's 2.5D mockups), drawn in the existing cabinet screen, plus the YOU WON slip.
import { C } from '../art/palette';
import { BUFFS, PINBALL_TOP, type BuffKind, type PusherField } from '../game/room';
import { circle, type Game, type Pen } from './machines';

const coin = (p: Pen, x: number, y: number, kind: 'coin' | 'rent' | 'ticket' = 'coin') => {
  const c = kind === 'rent' ? C.green : kind === 'ticket' ? C.violet : C.sodium;
  const hi = kind === 'rent' ? C.mint : kind === 'ticket' ? C.bone : C.sodiumLight;
  p.rect(x - 2, y, 5, 2, C.tan).rect(x - 2, y - 1, 5, 2, c).rect(x - 1, y - 1, 3, 1, hi);
  if (kind === 'rent') p.rect(x, y - 1, 1, 1, C.paper);
};

export function drawSlip(p: Pen, o: { amount: string; sub: string; tickets?: boolean; t: number }) {
  p.rect(0, 0, p.w, p.h, C.ink);
  const pop = Math.min(1, o.t * 3);
  const cx = Math.floor(p.w / 2);
  const w = Math.round(70 * pop), h = Math.round(44 * pop);
  const x0 = cx - Math.floor(w / 2), y0 = Math.floor((p.h - h) / 2);
  if (w < 8) return;
  p.rect(x0 + 1, y0 + 1, w, h, C.ink);
  p.rect(x0, y0, w, h, C.night);
  p.rect(x0, y0, w, 1, C.sodiumLight);
  p.rect(x0 + 1, y0 + 1, w - 2, 1, C.plum);
  p.center('YOU WON', y0 + 4, C.sodiumLight);
  if (o.tickets) {
    p.rect(cx - 22, y0 + 14, 10, 6, C.sodium);
    p.rect(cx - 21, y0 + 15, 8, 4, C.sodiumLight);
    p.rect(cx - 20, y0 + 16, 2, 2, C.ink);
  } else {
    p.rect(cx - 22, y0 + 14, 10, 6, C.forest);
    p.rect(cx - 21, y0 + 15, 8, 4, C.green);
    p.rect(cx - 20, y0 + 16, 6, 1, C.paper);
  }
  p.text(o.amount, cx - 10, y0 + 15, C.paper);
  if (h > 30) p.center(o.sub, y0 + 26, C.mint);
  if (h > 38 && o.t > 0.8) p.center('CLICK OR ANY KEY', y0 + h - 8, C.stone);
}

// ---- Coin Pusher v2: 3 coins a drop, persistent pile, bonus hole, hopper, tower, visible Rent Check ----
export function pusherV2(field: PusherField): Game {
  const f = field;
  let t = 0, phase: 'aim' | 'fall' | 'settle' = 'aim';
  const drops: { x: number; y: number; vy: number; kind: PusherCoinKind }[] = [];
  let settled = 0, thisOut = 0;
  type PusherCoinKind = 'coin' | 'rent' | 'ticket';
  const chuteX = () => 8 + Math.abs(((t / 1.8) % 2) - 1) * 62;
  const push = () => Math.sin(t * 2.4) * 3;
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      t += dt;
      const bar = 24 + push();
      if (phase === 'fall' || phase === 'settle') {
        for (const d of drops) {
          d.vy += 180 * dt;
          d.y += d.vy * dt;
          if (d.y >= bar + 2) {
            f.coins.push({ x: d.x, y: bar + 2, layer: 'shelf', kind: d.kind });
            d.y = 200;
          }
        }
        for (let i = drops.length - 1; i >= 0; i--) if (drops[i].y > 100) drops.splice(i, 1);
        // shelf coins get shoved toward the field when the bar moves down
        const shoving = Math.cos(t * 2.4) < 0;
        for (const c of f.coins) {
          if (c.layer === 'shelf') {
            if (shoving) c.y += 8 * dt;
            if (c.y > 36) ((c.layer = 'field'), (c.y = 40));
            // bonus hole on the right
            if (c.x > 58 && c.y > 28 && c.y < 34) {
              c.y = 999;
              f.hopper = Math.min(f.hopper, 2);
              for (let k = 0; k < 5 && f.coins.length < 56; k++) f.coins.push({ x: 12 + k * 4, y: 40, layer: 'field', kind: 'coin' });
            }
          } else {
            c.y += (shoving ? 3 : 0.4) * dt;
            if (c.y >= 62) {
              thisOut++;
              f.out++;
              c.y = 999;
            }
          }
        }
        f.coins = f.coins.filter((c) => c.y < 200);
        if (phase === 'fall' && !drops.length) phase = 'settle';
        if (phase === 'settle' && (settled += dt) > 1.2) {
          const q = Math.max(0, Math.min(1, thisOut / 8));
          g.q = q;
          g.label = `${thisOut} OFF THE EDGE`;
          g.over = true;
        }
      }
    },
    draw(p) {
      const W = p.w, H = p.h;
      p.rect(0, 0, W, H, C.brick);
      p.rect(0, 0, W, 14, C.navy);
      p.rect(1, 1, 40, 6, C.ink);
      p.text('IN', 2, 2, C.stone);
      p.text(String(f.inn), 12, 2, C.paper);
      p.text('OUT', 22, 2, C.stone);
      p.text(String(f.out), 36, 2, C.paper);
      const net = f.out - f.inn;
      p.text(net >= 0 ? `+${net}` : String(net), 50, 2, net >= 0 ? C.mint : C.red);
      p.text('PUSHER', 2, 8, C.sodiumLight);
      // chute
      const cx = Math.round(chuteX());
      p.rect(4, 15, 70, 2, C.stone);
      p.rect(cx - 6, 12, 13, 7, phase === 'aim' && Math.abs(cx - 39) < 10 ? C.mint : C.ink);
      p.text('X3', cx - 4, 13, phase === 'aim' && Math.abs(cx - 39) < 10 ? C.ink : C.bone);
      // hopper
      p.rect(4, 19, 18, 6, C.ink);
      p.text(`D${Math.max(0, Math.ceil(f.hopper))}`, 5, 20, C.sodiumLight);
      // shelf + bonus hole
      const bar = 24 + push();
      p.rect(4, bar, 70, 6, C.concrete);
      p.rect(4, bar, 70, 1, C.bone);
      circle(p, 66, bar + 3, 3, C.sodiumLight);
      circle(p, 66, bar + 3, 2, C.ink);
      // field
      p.rect(2, 38, 74, 24, C.asphalt);
      // tower
      const tx = 22, ty = 58;
      for (let k = 0; k < f.tower; k++) coin(p, tx + Math.floor(k / 2), ty - k * 2, k === f.tower - 1 && !f.coins.some((c) => c.kind === 'rent') ? 'rent' : 'coin');
      if (f.tower > 3) p.text('TOWER', 2, 50, C.paper);
      for (const c of f.coins) coin(p, Math.round(c.x), Math.round(c.y), c.kind);
      for (const d of drops) coin(p, Math.round(d.x), Math.round(Math.min(d.y, 70)), d.kind);
      // lip
      p.rect(0, 62, W, 3, C.stone);
      p.rect(0, 62, W, 1, C.paper);
      p.rect(0, 65, W, H - 65, C.red);
      if (phase === 'aim') (p.text('PILE STAYS', 2, 68, C.sodiumLight), p.center('DROP X3', 8, C.paper));
      if (phase === 'settle' || phase === 'fall') p.center(`${thisOut} OFF THE EDGE`, 68, thisOut ? C.mint : C.stone);
    },
    down() {
      if (phase !== 'aim') return;
      const x = chuteX();
      f.inn += 3;
      const kinds: PusherCoinKind[] = ['coin', 'coin', 'coin'];
      drops.push({ x: x - 4, y: 16, vy: 10, kind: kinds[0] }, { x, y: 14, vy: 6, kind: kinds[1] }, { x: x + 4, y: 16, vy: 12, kind: kinds[2] });
      phase = 'fall';
    },
    up() {},
  };
  return g;
}

// ---- Whac-a-Shoplifter v2: flat 3x3 brick slab, bandits vs shoppers ----
export function whacV2(): Game {
  let t = 0, bonks = 0, next = 0.6, flash = 0, pop: { i: number; n: number; left: number } | null = null;
  const holes: { kind: 'thief' | 'shopper' | null; left: number; hit: number; up: number }[] = Array.from({ length: 9 }, () => ({ kind: null, left: 0, hit: 0, up: 0 }));
  const spot = (i: number) => [6 + (i % 3) * 24, 12 + Math.floor(i / 3) * 18] as const;
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      t += dt;
      flash = Math.max(0, flash - dt);
      if (pop) pop.left -= dt;
      if (pop && pop.left <= 0) pop = null;
      for (const h of holes) {
        h.hit = Math.max(0, h.hit - dt);
        if (h.kind) {
          h.up = Math.min(1, h.up + dt * 4);
          if ((h.left -= dt) <= 0) ((h.kind = null), (h.up = 0));
        }
      }
      if ((next -= dt) <= 0) {
        next = 0.35 + r() * 0.45;
        const free = holes.filter((h) => !h.kind);
        if (free.length) {
          const h = free[Math.floor(r() * free.length)];
          h.kind = r() < 0.75 ? 'thief' : 'shopper';
          h.left = 0.65 + r() * 0.55;
          h.up = 0;
        }
      }
      if (t >= 30) ((g.over = true), (g.q = Math.max(0, bonks) / 30), (g.label = `${bonks} BONKS`));
    },
    draw(p) {
      p.rect(0, 0, p.w, p.h, C.bone);
      p.rect(0, 0, p.w, 9, C.brick);
      p.text(`${Math.max(0, Math.ceil(30 - t))}S`, 2, 2, C.paper);
      p.text(`${bonks}`, p.w - 4 * String(bonks).length - 2, 2, flash ? C.red : C.mint);
      p.rect(0, 9, p.w, 2, C.concrete);
      // shelf row
      p.rect(0, 11, p.w, 1, C.stone);
      p.rect(0, 12, p.w, p.h - 20, C.brick);
      p.rect(0, 12, p.w, 2, C.red);
      holes.forEach((h, i) => {
        const [x, y] = spot(i);
        const lit = h.hit ? (h.hit && bonks >= 0 && !flash ? C.sodiumLight : C.red) : C.brick;
        // hole rim
        p.rect(x, y + 8, 20, 5, C.umber);
        p.rect(x + 1, y + 9, 18, 3, C.ink);
        if (h.kind) {
          const top = y + 8 - Math.round(10 * h.up);
          const thief = h.kind === 'thief';
          p.rect(x + 6, top + 5, 8, y + 9 - (top + 5), thief ? C.navy : C.teal);
          if (thief) p.rect(x + 6, top + 6, 8, 1, C.blue);
          p.rect(x + 7, top, 6, 6, C.skin);
          p.rect(x + 7, top, 6, 2, thief ? C.ink : C.umber);
          if (thief) {
            p.rect(x + 7, top + 3, 6, 1, C.ink);
            p.rect(x + 14, top + 4, 3, 3, C.bone); // sack
          } else {
            p.rect(x + 3, top + 6, 4, 3, C.red); // basket
          }
          if (h.hit) p.rect(x + 7, top + 2, 6, 1, C.ink);
        }
        p.rect(x + 2, y + 11, 16, 1, lit);
      });
      if (pop) {
        const [x, y] = spot(pop.i);
        p.text(pop.n > 0 ? '+1' : '-2', x + 6, y, pop.n > 0 ? C.sodiumLight : C.red);
      }
      p.rect(0, p.h - 8, p.w, 8, C.red);
      p.center('BONK BEANIES', p.h - 7, C.paper);
    },
    down(x, y) {
      holes.forEach((h, i) => {
        const [hx, hy] = spot(i);
        if (x >= hx && x < hx + 20 && y >= hy && y < hy + 16 && h.kind) {
          const n = h.kind === 'thief' ? 1 : -2;
          bonks += n;
          if (h.kind === 'shopper') flash = 0.4;
          h.kind = null;
          h.hit = 0.3;
          pop = { i, n, left: 0.4 };
        }
      });
    },
    up() {},
  };
  return g;
}

const TOYS: { id: BuffKind; x: number; y: number; r: number; easy: boolean }[] = [
  { id: 'bat', x: 22, y: 50, r: 7, easy: true },
  { id: 'duck', x: 39, y: 50, r: 7, easy: true },
  { id: 'ball', x: 56, y: 50, r: 6, easy: true },
  { id: 'troll', x: 28, y: 64, r: 6, easy: true },
  { id: 'slap', x: 50, y: 64, r: 5, easy: false },
];

function toyIcon(p: Pen, id: BuffKind, x: number, y: number) {
  if (id === 'bat') (circle(p, x, y, 4, C.violet), p.rect(x - 6, y - 2, 4, 2, C.plum), p.rect(x + 3, y - 2, 4, 2, C.plum));
  else if (id === 'duck') (circle(p, x, y, 4, C.sodiumLight), p.rect(x + 3, y - 1, 3, 2, C.sodium));
  else if (id === 'troll') (p.rect(x - 3, y - 2, 6, 6, C.green), p.rect(x - 2, y - 5, 4, 3, C.skin), p.rect(x, y - 8, 1, 4, C.neon));
  else if (id === 'slap') (p.rect(x - 5, y - 1, 11, 3, C.neon), p.rect(x - 3, y - 1, 2, 3, C.ink), p.rect(x + 1, y - 1, 2, 3, C.sodium), p.rect(x - 6, y - 2, 1, 2, C.neon), p.rect(x + 6, y - 2, 1, 2, C.neon));
  else (circle(p, x, y, 4, C.teal), p.rect(x - 3, y, 6, 1, C.mint));
}

// ---- Claw v2: spots with gaps, hover to read, miss / slip / lift ----
export function clawV2(onGrab: (q: number, prize?: BuffKind) => boolean, grip = 0): Game {
  const items = TOYS.map((t) => ({ ...t, gone: false }));
  let x = 10, y = 8, phase: 'aim' | 'down' | 'up' | 'done' = 'aim';
  let hover: (typeof items)[number] | null = null;
  let got: BuffKind | null = null;
  let slipping: BuffKind | null = null;
  let hold = 0, slipY = 0;
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      if (phase === 'down') {
        y += dt * 36;
        if (y >= 48) {
          const live = items.filter((it) => !it.gone);
          const best = live.reduce((a, b) => (Math.hypot(b.x - x, b.y - (y + 6)) < Math.hypot(a.x - x, a.y - (y + 6)) ? b : a), live[0]);
          const d = best ? Math.hypot(best.x - x, best.y - (y + 6)) : 99;
          const need = (best?.easy ? 7 : 4) + 2 * grip;
          if (best && d < need * 0.55) {
            got = best.id;
            best.gone = true;
            g.q = Math.max(0.6, 1 - d / need);
            onGrab(g.q, got);
          } else if (best && d < need) {
            slipping = best.id;
            best.gone = true;
            g.q = 0.15;
            onGrab(0.15, slipping);
            slipY = y + 8;
          } else {
            g.q = 0;
            onGrab(0);
          }
          phase = 'up';
        }
      }
      if (phase === 'up') {
        y -= dt * 28;
        if (slipping) slipY += dt * 40;
        if (y <= 8) ((phase = 'done'), (hold = 0.7));
      }
      if (phase === 'done' && (hold -= dt) <= 0) {
        g.over = true;
        g.label = got ? 'GOT ONE' : slipping ? 'SLIPPED' : 'MISS';
      }
    },
    draw(p) {
      p.rect(0, 0, p.w, p.h, C.navy);
      for (let i = 0; i < p.w; i += 8) p.rect(i, 0, 1, p.h, C.night);
      p.rect(0, 2, p.w, 2, C.stone);
      p.rect(0, 70, p.w, p.h - 70, C.plum);
      p.rect(1, 58, 12, 16, C.concrete);
      p.text('PRIZE', 1, 71, C.paper);
      for (const it of items) if (!it.gone) {
        circle(p, it.x, it.y + 1, it.r + 1, C.plum);
        toyIcon(p, it.id, it.x, it.y);
      }
      // claw
      const cx = Math.round(x), cy = Math.round(y);
      p.rect(cx, 4, 1, cy - 4, C.bone);
      p.rect(cx - 3, cy, 7, 2, C.stone);
      const open = phase === 'aim' || (phase === 'down' && y < 44);
      if (open) {
        p.rect(cx - 6, cy + 2, 2, 4, C.stone);
        p.rect(cx + 5, cy + 2, 2, 4, C.stone);
      } else {
        p.rect(cx - 2, cy + 2, 2, 5, C.stone);
        p.rect(cx + 1, cy + 2, 2, 5, C.stone);
      }
      if (got && (phase === 'up' || phase === 'done')) toyIcon(p, got, cx, cy + 8);
      if (slipping && phase !== 'done') toyIcon(p, slipping, cx + 4, Math.round(slipY));
      if (hover && phase === 'aim') {
        const tx = Math.min(p.w - 44, Math.max(2, hover.x - 8));
        const ty = Math.max(8, hover.y - 22);
        p.rect(tx, ty, 42, 16, C.night);
        p.rect(tx, ty, 42, 1, C.sodiumLight);
        p.text(BUFFS[hover.id].name.split(' ').slice(-1)[0], tx + 1, ty + 1, C.sodiumLight);
        p.text(hover.easy ? 'GRIP EASY' : 'GRIP HARD', tx + 1, ty + 8, hover.easy ? C.mint : C.stone);
      }
      p.rect(0, p.h - 7, p.w, 7, C.brick);
      p.center(phase === 'aim' ? 'HOVER, THEN GRAB' : got ? 'GOT ONE' : slipping ? 'SLIP!' : phase === 'done' ? 'MISS' : '', p.h - 6, C.paper);
    },
    move(mx, my) {
      if (phase !== 'aim') return;
      x = Math.max(8, Math.min(70, mx));
      hover = items.filter((it) => !it.gone).reduce((a, b) => (Math.hypot(b.x - mx, b.y - my) < Math.hypot((a?.x ?? 999) - mx, (a?.y ?? 999) - my) ? b : a), null as (typeof items)[number] | null);
      if (hover && Math.hypot(hover.x - mx, hover.y - my) > 12) hover = null;
    },
    down(mx) {
      if (phase !== 'aim') return;
      if (mx) x = Math.max(8, Math.min(70, mx));
      phase = 'down';
    },
    up() {},
  };
  return g;
}

// ---- Night Shift v2: ramps, standups, a punch-clock mode, flippers on A/D/arrows/click ----
export function pinballV2(): Game {
  const W = 78, H = 101;
  type Ball = { x: number; y: number; vx: number; vy: number };
  const balls: Ball[] = [{ x: 72, y: 90, vx: -5, vy: -100 }];
  let left = 3, score = 0, launched = true, wait = 0, mode = 0, multi = 0;
  const L = { on: false, a: 0 }, R = { on: false, a: 0 };
  const bumpers = [{ x: 22, y: 28, r: 5, lit: 0 }, { x: 42, y: 22, r: 5, lit: 0 }, { x: 34, y: 40, r: 5, lit: 0 }];
  const standups = [18, 30, 42].map((x) => ({ x, y: 12, on: false }));
  const letters = 'NIGHT'.split('').map((ch, i) => ({ ch, x: 10 + i * 10, on: false }));
  const flip = (side: -1 | 1, a: number) => {
    const px = side < 0 ? 22 : 56, len = 15;
    const ang = side < 0 ? 0.45 - a * 0.9 : Math.PI - 0.45 + a * 0.9;
    return { x1: px, y1: 88, x2: px + Math.cos(ang) * len, y2: 88 + Math.sin(ang) * len };
  };
  const add = (n: number) => (score += mode > 0 ? n * 2 : n);
  const g: Game = {
    over: false, q: 0, score: 0,
    update(dt) {
      L.a = Math.max(0, Math.min(1, L.a + (L.on ? 12 : -8) * dt));
      R.a = Math.max(0, Math.min(1, R.a + (R.on ? 12 : -8) * dt));
      for (const b of bumpers) b.lit = Math.max(0, b.lit - dt);
      if (mode > 0) mode = Math.max(0, mode - dt);
      if (!launched) {
        if ((wait -= dt) <= 0) {
          balls.length = 0;
          balls.push({ x: 72, y: 90, vx: -5, vy: -100 });
          if (multi > 0) (balls.push({ x: 68, y: 88, vx: -20, vy: -90 }), multi--);
          launched = true;
        }
        return;
      }
      const sub = 4;
      for (let k = 0; k < sub; k++) {
        const h = dt / sub;
        for (let bi = balls.length - 1; bi >= 0; bi--) {
          const ball = balls[bi];
          ball.vy += 70 * h;
          ball.x += ball.vx * h;
          ball.y += ball.vy * h;
          if (ball.x < 3) ((ball.x = 3), (ball.vx = Math.abs(ball.vx) * 0.8));
          if (ball.x > W - 3) ((ball.x = W - 3), (ball.vx = -Math.abs(ball.vx) * 0.8));
          if (ball.y < 3) ((ball.y = 3), (ball.vy = Math.abs(ball.vy) * 0.8));
          // launch lane curve
          if (ball.x > 62 && ball.y < 16) ball.vx -= 320 * h;
          // time-clock ramp on the right: punch in
          if (ball.x > 58 && ball.y > 24 && ball.y < 48 && ball.vy < 0) {
            ball.vy = -Math.abs(ball.vy) - 10;
            ball.x = Math.min(ball.x, 60);
            if (mode <= 0) ((mode = 20), add(2500), (multi = Math.max(multi, 1)));
          }
          for (const b of bumpers) {
            const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy);
            if (d < b.r + 2 && d > 0) {
              const nx = dx / d, ny = dy / d;
              ball.x = b.x + nx * (b.r + 2);
              ball.y = b.y + ny * (b.r + 2);
              const sp = Math.max(70, Math.hypot(ball.vx, ball.vy));
              ball.vx = nx * sp;
              ball.vy = ny * sp;
              if (b.lit <= 0) add(500);
              b.lit = 0.2;
            }
          }
          for (const s of standups) {
            if (!s.on && Math.abs(ball.x - s.x) < 3 && Math.abs(ball.y - s.y) < 3 && ball.vy < 0) {
              s.on = true;
              add(800);
              if (standups.every((x) => x.on)) (standups.forEach((x) => (x.on = false)), add(4000), (mode = Math.max(mode, 12)));
            }
          }
          if (ball.y < 10 && ball.vy < 0) for (const l of letters) if (!l.on && Math.abs(ball.x - l.x - 1) < 4) ((l.on = true), add(1000));
          if (letters.every((l) => l.on)) (letters.forEach((l) => (l.on = false)), add(5000), (multi = Math.max(multi, 1)));
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
          if (ball.y > 70 && ball.x < 14 && ball.y < 88) ((ball.vx = Math.abs(ball.vx) + 10), add(10));
          if (ball.y > 70 && ball.x > W - 14 && ball.y < 88) ((ball.vx = -Math.abs(ball.vx) - 10), add(10));
          if (ball.y > H + 3) {
            balls.splice(bi, 1);
            if (!balls.length) {
              left--;
              launched = false;
              wait = 1;
              if (left <= 0) ((g.over = true), (g.score = score), (g.q = Math.min(1, score / PINBALL_TOP)), (g.label = `${score}`));
            }
          }
        }
      }
    },
    draw(p) {
      p.rect(0, 0, W, H, C.navy);
      for (let y = 0; y < H; y += 2) for (let x = (y / 2) % 2; x < W; x += 6) p.rect(x, y, 1, 1, C.night);
      // time-clock ramp
      p.rect(62, 22, 8, 28, C.concrete);
      p.rect(60, 20, 12, 4, mode > 0 ? C.sodiumLight : C.sodium);
      p.rect(61, 24, 10, 5, C.plum);
      if (mode > 0) p.text(`${Math.ceil(mode)}`, 64, 26, C.ink);
      for (const l of letters) p.text(l.ch, l.x, 2, l.on ? C.sodiumLight : C.asphalt);
      for (const s of standups) p.rect(s.x - 1, s.y - 2, 3, 4, s.on ? C.mint : C.stone);
      for (const b of bumpers) (circle(p, b.x, b.y, b.r, b.lit ? C.paper : C.red), circle(p, b.x, b.y, b.r - 2, b.lit ? C.sodiumLight : C.neon));
      p.rect(0, 70, 12, 2, C.mint).rect(W - 12, 70, 12, 2, C.mint);
      for (const [side, st] of [[-1, L], [1, R]] as const) {
        const f = flip(side, st.a);
        for (let i = 0; i <= 10; i++) p.rect(f.x1 + ((f.x2 - f.x1) * i) / 10 - 1, f.y1 + ((f.y2 - f.y1) * i) / 10 - 1, 3, 2, C.paper);
      }
      for (const b of balls) circle(p, Math.round(b.x), Math.round(b.y), 2, C.bone);
      p.rect(0, H - 8, W, 8, C.ink);
      p.text(String(score), 2, H - 7, C.sodiumLight);
      p.text(mode > 0 ? '2X' : `BALL ${4 - Math.max(1, left)}`, W - 26, H - 7, mode > 0 ? C.sodiumLight : C.bone);
      if (!L.on && !R.on && score === 0) (p.text('A', 14, 78, C.concrete), p.text('D', 61, 78, C.concrete));
    },
    down(x) {
      if (x < W / 2) L.on = true;
      else R.on = true;
    },
    up() {
      L.on = false;
      R.on = false;
    },
    key(k, down) {
      const low = k.toLowerCase();
      if (low === 'a' || k === 'ArrowLeft') L.on = down;
      if (low === 'd' || k === 'ArrowRight') R.on = down;
    },
  };
  return g;
}
