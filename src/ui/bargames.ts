// The Off-Ramp's last two: Foosball (a tall table, first to five) and Bar Trivia (a countertop touchscreen, five questions).
import { C } from '../art/palette';
import { circle, type Game, type Pen } from './machines';

// ---- Foosball: rows from the top are their goalie, your forwards, their forwards, your goalie. Move to slide your rods, click to shoot. ----
const ROWS = [
  { y: 10, red: true, xs: [27, 51] },
  { y: 30, red: false, xs: [13, 39, 65] },
  { y: 70, red: true, xs: [13, 39, 65] },
  { y: 90, red: false, xs: [27, 51] },
];
const MOUTH = [27, 51];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function table(p: Pen) {
  p.rect(0, 0, p.w, p.h, C.forest);
  p.rect(0, Math.floor(p.h / 2), p.w, 1, C.green);
  circle(p, 39, Math.floor(p.h / 2), 8, C.green);
  circle(p, 39, Math.floor(p.h / 2), 7, C.forest);
  p.rect(MOUTH[0], 0, MOUTH[1] - MOUTH[0], 2, C.ink).rect(MOUTH[0], p.h - 2, MOUTH[1] - MOUTH[0], 2, C.ink);
}
function rods(p: Pen, blue: number, red: number) {
  for (const r of ROWS) {
    p.rect(0, r.y, p.w, 1, C.stone);
    for (const x of r.xs) {
      const mx = Math.round(x + (r.red ? red : blue));
      p.rect(mx - 1, r.y - 2, 3, 5, r.red ? C.red : C.blue).rect(mx, r.y - 1, 1, 1, C.paper);
    }
  }
}
export function foos(): Game {
  let me = 0, them = 0, blue = 0, red = 0, kick = 0, pause = 1, end = -1, msg = 'FIRST TO 5';
  const ball = { x: 39, y: 50, vx: 0, vy: 0 };
  const hitCool = [0, 0, 0, 0];
  const serve = (down: boolean) => {
    Object.assign(ball, { x: 39, y: 50, vx: (Math.random() - 0.5) * 40, vy: down ? 30 : -30 });
    pause = 0.8;
  };
  serve(Math.random() < 0.5);
  const goal = (mine: boolean) => {
    if (mine) me++;
    else them++;
    msg = mine ? 'GOAL' : 'THEIRS';
    if (me >= 5 || them >= 5) {
      g.q = me >= 5 ? 1 - them * 0.1 : me * 0.1;
      g.score = me;
      g.label = `${me}-${them}${me >= 5 ? ' WIN' : ''}`;
      end = 0;
    } else serve(mine);
  };
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      if (end >= 0) return void ((end += dt) > 1.5 && (g.over = true));
      kick = Math.max(0, kick - dt);
      // their rods chase the ball, not quite fast enough
      const near = ROWS[ball.vy < 0 ? 0 : 2].xs.reduce((a, x) => (Math.abs(x + red - ball.x) < Math.abs(a + red - ball.x) ? x : a));
      red += clamp(ball.x - (near + red), -32 * dt, 32 * dt);
      red = clamp(red, -12, 12);
      if (pause > 0) return void (pause -= dt);
      if (pause <= 0) msg = '';
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.x < 2 || ball.x > 76) ((ball.vx = -ball.vx), (ball.x = clamp(ball.x, 2, 76)));
      if (ball.y <= 1) {
        if (ball.x >= MOUTH[0] && ball.x <= MOUTH[1]) return goal(true);
        ((ball.vy = Math.abs(ball.vy)), (ball.y = 1));
      }
      if (ball.y >= 99) {
        if (ball.x >= MOUTH[0] && ball.x <= MOUTH[1]) return goal(false);
        ((ball.vy = -Math.abs(ball.vy)), (ball.y = 99));
      }
      ROWS.forEach((r, i) => {
        hitCool[i] = Math.max(0, hitCool[i] - dt);
        if (hitCool[i] || Math.abs(ball.y - r.y) > 2.5) return;
        const off = r.red ? red : blue;
        const man = r.xs.find((x) => Math.abs(x + off - ball.x) <= 2.5);
        if (man === undefined) return;
        hitCool[i] = 0.25;
        const aim = 39 + (Math.random() - 0.5) * 30;
        if (r.red) ((ball.vy = 46 + Math.random() * 14), (ball.vx = ((aim - ball.x) / (100 - ball.y)) * ball.vy));
        else if (kick > 0) ((ball.vy = -78), (ball.vx = ((aim - ball.x) / ball.y) * 78), (kick = 0));
        else ((ball.vy = -Math.max(25, Math.abs(ball.vy) * 0.7)), (ball.vx += (ball.x - (man + off)) * 8));
      });
      ball.vx = clamp(ball.vx, -60, 60);
    },
    draw(p) {
      table(p);
      rods(p, blue, red);
      if (end < 0) p.rect(Math.round(ball.x) - 1, Math.round(ball.y) - 1, 2, 2, C.paper);
      p.text(`${me}`, 2, 46, C.blue);
      p.text(`${them}`, 2, 52, C.red);
      if (end >= 0) p.center(g.label ?? '', 44, C.sodiumLight);
      else if (msg) p.center(msg, 40, C.sodiumLight);
    },
    move(x) {
      blue = clamp(x - 39, -12, 12);
    },
    down(x) {
      blue = clamp(x - 39, -12, 12);
      kick = 0.22;
    },
    up() {},
  };
  return g;
}
export function foosIdle(p: Pen, t: number, extra: string) {
  table(p);
  rods(p, Math.sin(t) * 6, -Math.sin(t * 1.3) * 6);
  p.center(extra || 'QUARTERS', 44, extra ? C.mint : Math.floor(t * 2) % 2 ? C.paper : C.bone);
}

// ---- Bar Trivia: five questions, ten seconds each. Faster right answers score more. ----
// [question, right answer, wrong, wrong, wrong]. Nothing after 1997.
export const QUESTIONS: [string, string, string, string, string][] = [
  ['What year did the Berlin Wall fall?', '1989', '1991', '1987', '1985'],
  ['How many holes on a regulation golf course?', '18', '9', '12', '24'],
  ['Who sang Thriller?', 'Michael Jackson', 'Prince', 'Lionel Richie', 'Billy Ocean'],
  ['Capital of Australia?', 'Canberra', 'Sydney', 'Melbourne', 'Perth'],
  ['VCR: Video Cassette what?', 'Recorder', 'Receiver', 'Rewinder', 'Rotator'],
  ['Players on the field for one baseball team?', '9', '11', '10', '8'],
  ['Which planet is the Red Planet?', 'Mars', 'Venus', 'Jupiter', 'Mercury'],
  ['Who was President in 1985?', 'Reagan', 'Carter', 'Bush', 'Ford'],
  ['How many sides on a stop sign?', '8', '6', '10', '12'],
  ['Who painted the Mona Lisa?', 'Da Vinci', 'Michelangelo', 'Raphael', 'Rembrandt'],
  ['How many ounces in a pound?', '16', '12', '8', '20'],
  ['Who won Super Bowl XXXI, January 1997?', 'Packers', 'Patriots', 'Cowboys', 'Broncos'],
  ['First man on the moon?', 'Armstrong', 'Aldrin', 'Glenn', 'Collins'],
  ['Largest ocean?', 'Pacific', 'Atlantic', 'Indian', 'Arctic'],
  ['How many states in the USA?', '50', '48', '52', '51'],
  ['Who wrote Romeo and Juliet?', 'Shakespeare', 'Dickens', 'Chaucer', 'Marlowe'],
  ['Blackjack pays what on a natural?', '3 to 2', 'Even money', '2 to 1', '6 to 5'],
  ['How many pins in ten-pin bowling?', '10', '9', '12', '8'],
  ['What year did the Titanic sink?', '1912', '1905', '1921', '1898'],
  ['Longest river in the world?', 'Nile', 'Amazon', 'Mississippi', 'Yangtze'],
  ['Who had a hit with Like a Virgin?', 'Madonna', 'Cyndi Lauper', 'Paula Abdul', 'Cher'],
  ['Water freezes at how many degrees F?', '32', '0', '100', '12'],
  ['Cards in a deck, no jokers?', '52', '54', '48', '56'],
  ['Who gave the US the Statue of Liberty?', 'France', 'England', 'Spain', 'Italy'],
  ['Jordan won the 1997 title with which team?', 'Bulls', 'Lakers', 'Celtics', 'Knicks'],
  ['Hardest natural stone?', 'Diamond', 'Granite', 'Quartz', 'Ruby'],
  ['Minutes in an NHL period?', '20', '15', '30', '25'],
  ['Monopoly: pass Go, collect how much?', '$200', '$100', '$500', '$50'],
  ['Who sang Born in the U.S.A.?', 'Springsteen', 'Bon Jovi', 'Mellencamp', 'Bob Seger'],
  ['What city has the Space Needle?', 'Seattle', 'Portland', 'Denver', 'Tacoma'],
  ['Most you can score with one dart?', '60', '50', '20', '100'],
  ['A perfect game of bowling scores?', '300', '200', '250', '360'],
  ['Balls racked for eight-ball?', '15', '16', '10', '9'],
  ['How many strings on a standard guitar?', '6', '4', '7', '8'],
  ['What does a barometer measure?', 'Air pressure', 'Humidity', 'Wind speed', 'Rainfall'],
  ['How many dots on a pair of dice?', '42', '36', '21', '48'],
];
const WRAP = 19;
const wrap = (s: string) => {
  const out: string[] = [];
  for (const w of s.split(' ')) {
    const last = out[out.length - 1];
    if (last !== undefined && last.length + 1 + w.length <= WRAP) out[out.length - 1] = `${last} ${w}`;
    else out.push(w);
  }
  return out;
};
const shuffled = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const LIMIT = 10;
export function trivia(): Game {
  const qs = shuffled(QUESTIONS).slice(0, 5).map(([q, ...a]) => ({ lines: wrap(q), right: a[0], opts: shuffled(a) }));
  let i = 0, left = LIMIT, picked = -1, reveal = 0, right = 0, score = 0, end = -1;
  const answer = (k: number) => {
    picked = k;
    reveal = 0.9;
    if (k >= 0 && qs[i].opts[k] === qs[i].right) ((right += 1), (score += Math.round(100 + (900 * left) / LIMIT)));
  };
  const g: Game = {
    over: false, q: 0,
    update(dt) {
      if (end >= 0) return void ((end += dt) > 1.8 && (g.over = true));
      if (reveal > 0) {
        if ((reveal -= dt) > 0) return;
        ((picked = -1), (left = LIMIT));
        if (++i === qs.length) ((g.q = right / 5), (g.score = score), (g.label = `${right}/5  ${score}`), (end = 0));
        return;
      }
      if ((left -= dt) <= 0) answer(-1);
    },
    draw(p) {
      p.rect(0, 0, p.w, p.h, C.night);
      if (end >= 0) {
        p.center('FINAL', 22, C.neon);
        p.center(g.label ?? '', 32, C.sodiumLight);
        return;
      }
      const cur = qs[i];
      p.rect(0, 0, Math.round((p.w * Math.max(0, left)) / LIMIT), 2, left < 3 ? C.red : C.violet);
      cur.lines.slice(0, 3).forEach((l, k) => p.text(l, 2, 4 + k * 6, C.paper));
      cur.opts.forEach((o, k) => {
        const y = 24 + k * 12;
        const good = reveal > 0 && o === cur.right, bad = reveal > 0 && k === picked && o !== cur.right;
        p.rect(1, y, p.w - 2, 10, good ? C.green : bad ? C.red : C.navy);
        p.text(o.slice(0, WRAP), 3, y + 3, good || bad ? C.paper : C.sodiumLight);
      });
      p.text(`Q${i + 1}/5`, 2, 71, C.concrete);
      p.text(`${score}`, p.w - 2 - 4 * String(score).length, 71, C.concrete);
    },
    down(_x, y) {
      if (reveal > 0 || end >= 0) return;
      const k = Math.floor((y - 24) / 12);
      if (k >= 0 && k < 4 && (y - 24) % 12 < 10) answer(k);
    },
    up() {},
  };
  return g;
}
export function triviaIdle(p: Pen, t: number, extra: string) {
  p.rect(0, 0, p.w, p.h, C.night);
  for (let i = 0; i < 12; i++) p.rect(4 + i * 6, 4, 4, 2, (i + Math.floor(t * 6)) % 3 ? C.asphalt : C.violet);
  p.center('BAR', 16, C.neon, 2);
  p.center('TRIVIA', 29, C.neon, 2);
  p.center(extra || 'TOUCH TO PLAY', 52, extra ? C.mint : Math.floor(t * 2) % 2 ? C.paper : C.violet);
}
