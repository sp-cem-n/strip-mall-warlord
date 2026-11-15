// The Off-Ramp's three new games: Pull-Tabs (bartop luck), Blackjack (a dealer, H / S) and Fairway 9 (cabinet golf).
// Like every cabinet they only report q (0..1); room.ts pays. In-game money only.
import { C } from '../art/palette';
import { circle, type Game, type Pen } from './machines';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const tri = (t: number, period: number) => {
  const x = (t / period) % 1;
  return x < 0.5 ? x * 2 : 2 - x * 2;
};

// ---- Pull-Tabs: three tickets, three windows each. Three of a kind in a ticket wins it. ----
const SYMS = ['7', 'BAR', 'CHRY', 'BELL', 'X'];
const SYM_PAY = [1, 0.6, 0.4, 0.3, 0]; // share of a perfect play
export function pullTabs(): Game {
  // the house prints a few winners per box; most are blanks
  const tickets = [0, 1, 2].map(() => {
    const r = Math.random();
    if (r < 0.04) return [0, 0, 0];
    if (r < 0.12) return [1, 1, 1];
    if (r < 0.24) return [2, 2, 2];
    if (r < 0.4) return [3, 3, 3];
    const a = Math.floor(Math.random() * 5);
    let b = Math.floor(Math.random() * 5);
    if (b === a) b = (b + 1) % 5;
    return [a, b, Math.floor(Math.random() * 5)].sort(() => Math.random() - 0.5);
  });
  const open = tickets.map(() => [false, false, false]);
  let end = -1, msg = 'PULL A TAB', won = 0;
  const done = () => open.every((t) => t.every(Boolean));
  const pull = (ti: number) => {
    const w = open[ti].indexOf(false);
    if (w < 0) return;
    open[ti][w] = true;
    if (open[ti].every(Boolean)) {
      const [a, b, c] = tickets[ti];
      const hit = a === b && b === c;
      won += hit ? SYM_PAY[a] : 0;
      msg = hit ? `${SYMS[a]} ${SYMS[a]} ${SYMS[a]}!` : 'NOTHING';
    }
    if (done()) ((end = 0), (g.q = clamp(won, 0, 1)), (g.label = won > 0 ? 'WINNER' : 'NO LUCK'));
  };
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      if (end >= 0 && (end += dt) > 1.6) g.over = true;
    },
    draw(p) {
      p.rect(0, 0, p.w, p.h, C.umber);
      for (let y = 0; y < p.h; y += 4) p.rect(0, y, p.w, 1, C.brick); // the bartop
      tickets.forEach((t, ti) => {
        const x = 3 + ti * 25;
        p.rect(x, 6, 23, 52, C.ink).rect(x + 1, 7, 21, 50, ti === 1 ? C.sodiumLight : ti === 2 ? C.mint : C.neon);
        p.text('LUCKY', x + 2, 9, C.ink);
        t.forEach((sym, w) => {
          const y = 18 + w * 12;
          if (open[ti][w]) {
            p.rect(x + 2, y, 19, 10, C.paper);
            p.text(SYMS[sym].slice(0, 4), x + 3 + (4 - Math.min(4, SYMS[sym].length)) * 2, y + 3, sym === 0 ? C.red : C.ink);
          } else {
            p.rect(x + 2, y, 19, 10, C.stone);
            for (let k = 0; k < 4; k++) p.rect(x + 3 + k * 5, y + 4, 3, 1, C.concrete); // the perforation
          }
        });
      });
      p.center(end >= 0 ? (g.label ?? '') : msg, 64, end >= 0 && won > 0 ? C.sodiumLight : C.paper);
    },
    down(x) {
      if (end >= 0) return;
      pull(clamp(Math.floor((x - 3) / 25), 0, 2));
    },
    up() {},
    key(k, down) {
      if (!down || end >= 0) return;
      if (k === ' ') pull(open.findIndex((t) => t.includes(false)));
      if (k === '1' || k === '2' || k === '3') pull(Number(k) - 1);
    },
  };
  return g;
}

// ---- Blackjack: the bartender deals from a six-deck shoe. Hit or stand; dealer stands on 17. ----
const RANK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const valueOf = (hand: number[]) => {
  let v = 0, aces = 0;
  for (const c of hand) {
    const r = c % 13;
    v += r === 0 ? 11 : Math.min(10, r + 1);
    if (r === 0) aces++;
  }
  while (v > 21 && aces--) v -= 10;
  return v;
};
export const bjValue = valueOf;
export function blackjack(): Game {
  const shoe: number[] = [];
  for (let d = 0; d < 6; d++) for (let c = 0; c < 52; c++) shoe.push(c);
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  const me = [shoe.pop()!, shoe.pop()!], house = [shoe.pop()!, shoe.pop()!];
  let phase: 'you' | 'dealer' | 'done' = 'you', clock = 0, end = -1;
  const settle = () => {
    const a = valueOf(me), b = valueOf(house);
    const bj = a === 21 && me.length === 2;
    const [q, label] = a > 21 ? [0, 'BUST'] : bj && !(b === 21 && house.length === 2) ? [1, 'BLACKJACK'] : b > 21 || a > b ? [0.6, 'YOU WIN'] : a === b ? [0.25, 'PUSH'] : [0, 'HOUSE WINS'];
    g.q = q;
    g.label = label;
    g.score = a;
    phase = 'done';
    end = 0;
  };
  if (valueOf(me) === 21) phase = 'dealer';
  const hit = () => {
    if (phase !== 'you') return;
    me.push(shoe.pop()!);
    if (valueOf(me) >= 21) phase = valueOf(me) > 21 ? (settle(), 'done') : 'dealer';
  };
  const stand = () => phase === 'you' && (phase = 'dealer');
  const card = (p: Pen, c: number, x: number, y: number, down = false) => {
    p.rect(x, y, 13, 18, C.ink);
    if (down) return void p.rect(x + 1, y + 1, 11, 16, C.navy).rect(x + 3, y + 3, 7, 12, C.blue);
    const red = Math.floor(c / 13) % 4 < 2;
    p.rect(x + 1, y + 1, 11, 16, C.paper);
    p.text(RANK[c % 13], x + 2, y + 2, red ? C.red : C.ink);
    p.rect(x + 5, y + 10, 3, 3, red ? C.red : C.ink);
  };
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      if (end >= 0) return void ((end += dt) > 1.8 && (g.over = true));
      if (phase !== 'dealer') return;
      if ((clock += dt) < 0.55) return;
      clock = 0;
      if (valueOf(house) < 17) house.push(shoe.pop()!);
      else settle();
    },
    draw(p) {
      p.rect(0, 0, p.w, p.h, C.forest);
      p.rect(2, 2, p.w - 4, p.h - 4, C.green).rect(3, 3, p.w - 6, p.h - 6, C.forest);
      p.text('DEALER', 4, 4, C.sodiumLight);
      house.forEach((c, i) => card(p, c, 4 + i * 9, 11, phase === 'you' && i === 1));
      if (phase !== 'you') p.text(`${valueOf(house)}`, p.w - 14, 4, C.paper);
      p.text('YOU', 4, 34, C.sodiumLight);
      me.forEach((c, i) => card(p, c, 4 + i * 9, 41));
      p.text(`${valueOf(me)}`, p.w - 14, 34, C.paper);
      if (phase === 'you') {
        p.rect(4, p.h - 13, 32, 10, C.ink).rect(5, p.h - 12, 30, 8, C.red);
        p.text('HIT', 14, p.h - 10, C.paper);
        p.rect(p.w - 36, p.h - 13, 32, 10, C.ink).rect(p.w - 35, p.h - 12, 30, 8, C.navy);
        p.text('STAND', p.w - 30, p.h - 10, C.paper);
      } else p.center(end >= 0 ? (g.label ?? '') : 'DEALER DRAWS', p.h - 11, C.sodiumLight);
    },
    down(x) {
      if (x < 39) hit();
      else stand();
    },
    up() {},
    key(k, down) {
      if (!down) return;
      const low = k.toLowerCase();
      if (low === 'h') hit();
      if (low === 's') stand();
    },
  };
  return g;
}

// ---- Fairway 9: a short nine on a cabinet. Aim (mouse, A/D), hold for power, the green slows you down. ----
// Each hole: tee at the bottom, cup up top, a hazard in between. Par 2 a hole, 3 shots and you pick it up.
interface Hole { cup: [number, number]; hazard: [number, number, number]; water: boolean }
const HOLES: Hole[] = Array.from({ length: 9 }, (_, i) => ({
  cup: [16 + ((i * 23) % 46), 9 + (i % 3) * 3],
  hazard: [20 + ((i * 37 + 11) % 38), 30 + ((i * 7) % 14), 6 + (i % 3) * 2],
  water: i % 2 === 1,
}));
const TEE: [number, number] = [39, 66];
const ROLL = 34; // decel on the fairway, per second
export function fairway(): Game {
  let hole = 0, shots = 0, total = 0, aim = -Math.PI / 2, hold = -1, keyL = false, keyR = false, end = -1, msg = 'HOLE 1 PAR 2', pause = 0;
  const ball = { x: TEE[0], y: TEE[1], vx: 0, vy: 0 };
  let last = { x: TEE[0], y: TEE[1] };
  const H = () => HOLES[hole];
  const nextHole = (strokes: number, text: string) => {
    total += strokes;
    msg = text;
    pause = 1;
    hole++;
    if (hole >= HOLES.length) {
      end = 0;
      g.score = total;
      g.q = clamp((27 - total) / (27 - 14), 0, 1); // 14 or better is a perfect card
      g.label = `${total} (${total - 18 >= 0 ? '+' : ''}${total - 18})`;
      return;
    }
    Object.assign(ball, { x: TEE[0], y: TEE[1], vx: 0, vy: 0 });
    shots = 0;
    aim = Math.atan2(H().cup[1] - TEE[1], H().cup[0] - TEE[0]);
  };
  aim = Math.atan2(H().cup[1] - TEE[1], H().cup[0] - TEE[0]);
  const rolling = () => Math.hypot(ball.vx, ball.vy) > 0.5;
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      if (end >= 0) return void ((end += dt) > 1.8 && (g.over = true));
      if (pause > 0) return void ((pause -= dt) <= 0 && (msg = ''));
      if (hold >= 0) hold += dt;
      if (keyL) aim -= 1.6 * dt;
      if (keyR) aim += 1.6 * dt;
      if (!rolling()) return;
      const h = H();
      const [hx, hy, hr] = h.hazard;
      const inHaz = Math.hypot(ball.x - hx, ball.y - hy) < hr;
      const v = Math.hypot(ball.vx, ball.vy);
      const dec = (inHaz && !h.water ? ROLL * 4 : ROLL) * dt;
      const nv = Math.max(0, v - dec);
      ball.vx *= nv / v;
      ball.vy *= nv / v;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.x < 2 || ball.x > 76) ((ball.vx = -ball.vx * 0.6), (ball.x = clamp(ball.x, 2, 76)));
      if (ball.y < 2 || ball.y > 72) ((ball.vy = -ball.vy * 0.6), (ball.y = clamp(ball.y, 2, 72)));
      const dc = Math.hypot(ball.x - h.cup[0], ball.y - h.cup[1]);
      if (dc < 2.2 && nv < 40) return nextHole(shots, shots === 1 ? 'ACE!' : shots === 2 ? 'PAR' : 'BOGEY');
      if (inHaz && h.water) {
        // in the drink: a stroke and back to where you hit it from
        shots++;
        Object.assign(ball, { x: last.x, y: last.y, vx: 0, vy: 0 });
        msg = 'WATER +1';
        pause = 0.8;
        if (shots >= 3) return nextHole(4, 'PICKED UP');
        return;
      }
      if (!rolling() && shots >= 3) nextHole(4, 'PICKED UP');
    },
    draw(p) {
      const h = H() ?? HOLES[8];
      p.rect(0, 0, p.w, p.h, C.forest);
      for (let y = 0; y < p.h; y += 6) p.rect(0, y, p.w, 3, C.green); // mowed stripes
      circle(p, h.cup[0], h.cup[1], 7, C.mint); // the green
      const [hx, hy, hr] = h.hazard;
      circle(p, hx, hy, hr, h.water ? C.blue : C.tan);
      if (h.water) p.rect(hx - 2, hy - 1, 4, 1, C.paper);
      circle(p, h.cup[0], h.cup[1], 1, C.ink);
      p.rect(h.cup[0], h.cup[1] - 7, 1, 6, C.paper).rect(h.cup[0] + 1, h.cup[1] - 7, 3, 2, C.red); // the flag
      p.rect(TEE[0] - 3, TEE[1] + 2, 7, 2, C.tan);
      if (!rolling() && end < 0 && pause <= 0) {
        for (let k = 2; k < 14; k += 3) p.rect(Math.round(ball.x + Math.cos(aim) * k), Math.round(ball.y + Math.sin(aim) * k), 1, 1, C.paper);
        const m = hold >= 0 ? tri(hold, 1.6) : 0;
        p.rect(p.w - 5, 30, 4, 42, C.ink);
        p.rect(p.w - 4, 71 - Math.round(m * 40), 2, Math.round(m * 40), C.red);
      }
      p.rect(Math.round(ball.x) - 1, Math.round(ball.y) - 1, 2, 2, C.paper);
      p.text(`H${Math.min(9, hole + 1)} ${total}`, 2, 2, C.paper);
      if (end >= 0) (p.rect(0, 30, p.w, 11, C.ink), p.center(g.label ?? '', 33, C.sodiumLight));
      else if (msg) p.center(msg, 33, C.sodiumLight);
    },
    move(x, y) {
      if (hold < 0 && !rolling()) aim = Math.atan2(y - ball.y, x - ball.x);
    },
    down(x, y) {
      if (end >= 0 || pause > 0 || rolling()) return;
      if (x > -900) g.move?.(x, y);
      hold = 0;
    },
    up() {
      if (hold < 0) return;
      const pow = tri(hold, 1.6);
      hold = -1;
      const v = 18 + pow * 70;
      last = { x: ball.x, y: ball.y };
      ball.vx = Math.cos(aim) * v;
      ball.vy = Math.sin(aim) * v;
      shots++;
    },
    key(k, down) {
      const low = k.toLowerCase();
      if (low === 'a' || k === 'ArrowLeft') keyL = down;
      if (low === 'd' || k === 'ArrowRight') keyR = down;
      if (k === ' ') down ? hold < 0 && g.down(-999, -999) : g.up(0, 0);
    },
  };
  return g;
}
