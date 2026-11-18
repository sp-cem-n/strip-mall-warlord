// The Off-Ramp's three new games: Pull-Tabs (bartop luck), Blackjack (a dealer, H / S / D / P) and Fairway 9 (a trackball golf cabinet).
// Like every cabinet they only report q (0..1); room.ts pays. In-game money only.
import { C } from '../art/palette';
import { BJ_Q } from '../game/room';
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

// ---- Blackjack: the bartender deals from a six-deck shoe. Hit, Stand, Double, sPlit; dealer stands on 17. ----
// q is hands won over two (BJ_Q for a natural), so a double or a split that wins both is a 1.
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
const BUTTONS = ['HIT', 'STD', 'DBL', 'SPL'];
export function blackjack(): Game {
  const shoe: number[] = [];
  for (let d = 0; d < 6; d++) for (let c = 0; c < 52; c++) shoe.push(c);
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  const hands = [{ cards: [shoe.pop()!, shoe.pop()!], bet: 1 }];
  const house = [shoe.pop()!, shoe.pop()!];
  let at = 0, phase: 'you' | 'dealer' | 'done' = 'you', clock = 0, end = -1;
  const hand = () => hands[at];
  const natural = (h: number[]) => h.length === 2 && valueOf(h) === 21;
  const settle = () => {
    const b = valueOf(house);
    let won = 0;
    for (const h of hands) {
      const a = valueOf(h.cards);
      if (a <= 21 && (b > 21 || a > b)) won += h.bet;
    }
    const nat = hands.length === 1 && natural(hands[0].cards) && !natural(house);
    g.q = nat ? BJ_Q : Math.min(1, won / 2);
    g.label = nat ? 'BLACKJACK' : won ? (won > 1 ? `WON ${won}` : 'YOU WIN') : hands.every((h) => valueOf(h.cards) > 21) ? 'BUST' : 'HOUSE WINS';
    g.score = valueOf(hands[0].cards);
    phase = 'done';
    end = 0;
  };
  // the next hand, or the dealer once every hand is played
  const next = () => {
    if (at < hands.length - 1) return void at++;
    phase = hands.every((h) => valueOf(h.cards) > 21) ? (settle(), 'done') : 'dealer';
  };
  if (natural(hands[0].cards)) phase = 'dealer';
  const canDouble = () => phase === 'you' && hand().cards.length === 2 && hands.length === 1;
  const canSplit = () => phase === 'you' && hands.length === 1 && hand().cards.length === 2 && hand().cards[0] % 13 === hand().cards[1] % 13;
  const act = (i: number) => {
    if (phase !== 'you') return;
    if (i === 0) {
      hand().cards.push(shoe.pop()!);
      if (valueOf(hand().cards) >= 21) next();
    } else if (i === 1) next();
    else if (i === 2 && canDouble()) {
      hand().bet = 2;
      hand().cards.push(shoe.pop()!);
      next();
    } else if (i === 3 && canSplit()) {
      const [c1, c2] = hand().cards;
      hands.splice(0, 1, { cards: [c1, shoe.pop()!], bet: 1 }, { cards: [c2, shoe.pop()!], bet: 1 });
    }
  };
  const card = (p: Pen, c: number, x: number, y: number, down = false) => {
    p.rect(x, y, 13, 18, C.ink);
    if (down) return void p.rect(x + 1, y + 1, 11, 16, C.navy).rect(x + 3, y + 3, 7, 12, C.blue);
    const red = Math.floor(c / 13) % 4 < 2;
    p.rect(x + 1, y + 1, 11, 16, C.paper);
    p.text(RANK[c % 13], x + 2, y + 2, red ? C.red : C.ink);
    p.rect(x + 5, y + 10, 3, 3, red ? C.red : C.ink);
  };
  const live = (i: number) => (i === 0 ? true : i === 1 ? true : i === 2 ? canDouble() : canSplit());
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
      const split = hands.length > 1;
      hands.forEach((h, k) => {
        const x0 = split ? 4 + k * 37 : 4;
        p.text(split ? `${valueOf(h.cards)}${h.bet > 1 ? 'X2' : ''}` : `YOU ${valueOf(h.cards)}${h.bet > 1 ? ' X2' : ''}`, x0, 33, phase === 'you' && k === at ? C.sodiumLight : C.bone);
        h.cards.forEach((c, i) => card(p, c, x0 + i * (split ? 6 : 9), 40));
      });
      if (phase === 'you')
        BUTTONS.forEach((b, i) => {
          const x = 3 + i * 18;
          p.rect(x, p.h - 13, 17, 10, C.ink).rect(x + 1, p.h - 12, 15, 8, live(i) ? [C.red, C.navy, C.sodium, C.violet][i] : C.asphalt);
          p.text(b, x + 3, p.h - 10, live(i) ? C.paper : C.concrete);
        });
      else p.center(end >= 0 ? (g.label ?? '') : 'DEALER DRAWS', p.h - 11, C.sodiumLight);
    },
    down(x, y) {
      if (y >= 76 - 14) act(clamp(Math.floor((x - 3) / 18), 0, 3));
    },
    up() {},
    key(k, down) {
      if (!down) return;
      const i = 'hsdp'.indexOf(k.toLowerCase());
      if (i >= 0) act(i);
    },
  };
  return g;
}

// ---- Fairway 9: an upright trackball golf cabinet. Par 36, seen from behind the golfer. ----
// Aim with the mouse (or A/D), hold to pull the trackball back, let go to roll through. The red notch on the meter
// is the sweet spot: it carries the club's full yardage dead straight; off it, the ball comes up short and sprays.
interface Hole { par: number; yards: number; water?: [number, number]; bunker?: number; dogleg: number }
const COURSE: Hole[] = [
  { par: 4, yards: 360, bunker: 230, dogleg: 0 },
  { par: 3, yards: 165, water: [60, 130], dogleg: 0 },
  { par: 5, yards: 510, bunker: 260, dogleg: 12 },
  { par: 4, yards: 312, water: [180, 215], dogleg: -10 },
  { par: 4, yards: 395, bunker: 250, dogleg: 8 },
  { par: 3, yards: 180, bunker: 165, dogleg: 0 },
  { par: 4, yards: 340, water: [200, 240], dogleg: 0 },
  { par: 5, yards: 525, water: [300, 340], dogleg: -12 },
  { par: 4, yards: 420, bunker: 270, dogleg: 6 },
];
export const FAIRWAY_PAR = COURSE.reduce((n, h) => n + h.par, 0);
const SWEET = 0.86;
export function fairway(): Game {
  let hole = 0, strokes = 0, total = 0, togo = COURSE[0].yards, lat = 0, aim = 0, hold = -1, keyL = false, keyR = false;
  let end = -1, msg = 'HOLE 1 PAR 4', pause = 1.2, flight = -1, shot = { from: 0, to: 0, lat0: 0, lat1: 0 };
  const H = () => COURSE[Math.min(hole, 8)];
  const wind = () => ((hole * 7) % 5) - 2; // mph, + is to the right
  const club = () => (strokes === 0 && H().par > 3 ? 250 : Math.min(230, togo)); // the cabinet picks the club
  const done = (n: number, text: string) => {
    total += n - H().par;
    strokes = 0;
    msg = text;
    pause = 1.3;
    hole++;
    if (hole >= 9) {
      end = 0;
      g.score = FAIRWAY_PAR + total;
      g.q = clamp((9 - total) / 13, 0, 1); // -4 is a perfect card, +9 pays nothing
      g.label = `${FAIRWAY_PAR + total} (${total > 0 ? '+' : total < 0 ? '' : 'E'}${total || ''})`;
      return;
    }
    togo = H().yards;
    lat = aim = 0;
  };
  const land = () => {
    const h = H();
    togo = Math.abs(shot.to);
    lat = shot.lat1;
    const along = h.yards - togo;
    if (h.water && along > h.water[0] && along < h.water[1] && Math.abs(lat) < 40) {
      strokes++;
      togo = h.yards - shot.from;
      lat = shot.lat0;
      msg = 'WATER +1';
      pause = 0.9;
    } else if (togo < 14 && Math.abs(lat) < 14) {
      const putts = togo + Math.abs(lat) < 6 ? 1 : 2;
      const n = strokes + putts;
      return done(n, n === 1 ? 'ACE!' : `${putts} PUTT${putts > 1 ? 'S' : ''}`);
    } else msg = h.bunker && Math.abs(along - h.bunker) < 15 ? 'BUNKER' : Math.abs(lat) > 30 ? 'ROUGH' : '';
    if (strokes >= H().par + 3) done(H().par + 3, 'PICKED UP');
  };
  const swing = (pow: number) => {
    const h = H();
    const miss = pow - SWEET;
    const rough = Math.abs(lat) > 30 || (h.bunker && Math.abs(h.yards - togo - h.bunker) < 15) ? 0.7 : 1;
    const carry = club() * Math.min(pow, SWEET) / SWEET * (1 - Math.abs(miss) * 0.8) * rough;
    const spray = miss * 90 + wind() * 4 + aim * 40;
    strokes++;
    shot = { from: h.yards - togo, to: togo - carry, lat0: lat, lat1: lat + spray + h.dogleg * (carry / h.yards) };
    flight = 0;
  };
  const yAt = (r: number) => 22 + 48 * 40 / (40 + r); // screen y for r yards ahead
  const kAt = (r: number) => 40 / (40 + r);
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      if (end >= 0) return void ((end += dt) > 1.8 && (g.over = true));
      if (flight >= 0) return void ((flight += dt) >= 1.1 && ((flight = -1), land()));
      if (pause > 0) return void ((pause -= dt) <= 0 && (msg = ''));
      if (hold >= 0) hold += dt;
      if (keyL) aim = clamp(aim - 0.8 * dt, -1, 1);
      if (keyR) aim = clamp(aim + 0.8 * dt, -1, 1);
    },
    draw(p, t) {
      const h = H();
      p.rect(0, 0, p.w, p.h, C.navy).rect(0, 14, p.w, 6, C.plum);
      for (let x = 0; x < p.w; x += 4) p.rect(x, 17 - ((x * 7) % 5), 4, 6, C.forest); // tree line
      p.rect(0, 22, p.w, p.h - 22, C.forest);
      // the fairway, from the ball to the green
      for (let y = 22; y < p.h; y++) {
        const r = 40 * 48 / (y - 22 || 0.5) - 40;
        const k = kAt(r);
        const cx = 39 - lat * k * 0.9 + (h.dogleg * Math.min(r, togo)) / togo * k * 0.6;
        const w = 30 * k;
        if (r < togo + 10) p.rect(Math.round(cx - w), y, Math.round(w * 2), 1, y % 3 ? C.green : C.forest);
        if (h.water) {
          const along = h.yards - togo + r;
          if (along > h.water[0] && along < h.water[1]) p.rect(Math.round(cx - w * 1.4), y, Math.round(w * 2.8), 1, C.blue);
        }
        if (h.bunker && Math.abs(h.yards - togo + r - h.bunker) < 12) p.rect(Math.round(cx + w * 0.3), y, Math.round(w * 0.6), 1, C.tan);
      }
      const gy = Math.round(yAt(togo)), gk = kAt(togo);
      const gx = Math.round(39 - lat * gk * 0.9 + h.dogleg * gk * 0.6);
      circle(p, gx, gy, Math.max(1, Math.round(9 * gk)), C.mint);
      p.rect(gx, gy - 7, 1, 7, C.paper).rect(gx + 1, gy - 7, 3, 2, C.red);
      // the golfer from behind, and the ball in the air
      if (flight >= 0) {
        const f = flight / 1.1;
        const r = (shot.from === h.yards - togo ? togo - shot.to : 0) * f;
        const y = yAt(r) - Math.sin(f * Math.PI) * 18;
        p.rect(Math.round(39 + (shot.lat1 - shot.lat0) * kAt(r) * f * 0.9), Math.round(y), 1, 1, C.paper);
      } else p.rect(39, 66, 1, 1, C.paper);
      p.rect(36, 60, 4, 8, C.paper).rect(37, 57, 3, 3, C.skin).rect(36, 56, 4, 1, C.red);
      p.rect(40 - (hold >= 0 ? 4 : 0), 58, 1, 6, C.stone); // the club, back when you pull
      if (flight < 0 && end < 0 && pause <= 0) for (let k = 0; k < 4; k++) p.rect(Math.round(39 + aim * 12 * (k + 1) / 4), 52 - k * 6, 1, 2, C.sodiumLight);
      // HUD and the power meter (the red notch is the sweet spot)
      p.rect(0, 0, p.w, 13, C.ink);
      p.text(`H${Math.min(9, hole + 1)} P${h.par} ${Math.round(togo)}Y`, 2, 1, C.paper);
      p.text(`${total > 0 ? '+' : ''}${total || 'E'} W${wind() > 0 ? 'R' : wind() < 0 ? 'L' : ''}${Math.abs(wind())}`, 2, 7, C.mint);
      const m = hold >= 0 ? tri(hold, 1.6) : 0;
      p.rect(p.w - 6, 24, 5, 42, C.ink).rect(p.w - 5, 65 - Math.round(m * 40), 3, Math.round(m * 40), C.sodium);
      p.rect(p.w - 7, 65 - Math.round(SWEET * 40), 7, 1, C.red);
      p.text(hold >= 0 ? 'ROLL' : 'BACK', 2, p.h - 7, C.stone);
      if (end >= 0) (p.rect(0, 30, p.w, 11, C.ink), p.center(g.label ?? '', 33, C.sodiumLight));
      else if (msg) (p.rect(0, 30, p.w, 9, C.ink), p.center(msg, 32, Math.floor(t * 4) % 2 ? C.sodiumLight : C.paper));
    },
    move(x) {
      if (hold < 0 && flight < 0) aim = clamp((x - 39) / 30, -1, 1);
    },
    down(x, y) {
      if (end >= 0 || pause > 0 || flight >= 0) return;
      if (x > -900) g.move?.(x, y);
      hold = 0;
    },
    up() {
      if (hold < 0) return;
      const pow = tri(hold, 1.6);
      hold = -1;
      swing(pow);
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
