// Arcade cabinets, 96x160, and the Fun Zone carpet. Each machine has its own body colors, marquee and side art.
// The screen (or playfield) is left dark: the mini-game draws over it every frame.
import { Grid, hash, textWidth } from './grid';
import { C } from './palette';

export interface CabinetLook { body: number; trim: number; marquee: number; ink: number; title: string; side: 'stars' | 'stripes' | 'bolts' | 'dots' | 'moon' | 'rings'; tall?: boolean; bar?: 'darts' | 'pool' | 'shuffle' }
export const CAB_W = 96;
export const CAB_H = 160;
// screen rectangle inside the cabinet (pinball's playfield is taller)
export const screenOf = (tall?: boolean) => (tall ? { x: 9, y: 25, w: 78, h: 101 } : { x: 9, y: 27, w: 78, h: 76 });

export function cabinet(l: CabinetLook, lit: boolean, sign?: string): Grid {
  if (l.bar) return barPiece(l, lit, sign);
  const g = new Grid(CAB_W, CAB_H);
  const body = lit ? l.body : C.asphalt;
  const trim = lit ? l.trim : C.concrete;
  // body with a 1px t-molding and a lit left edge
  g.rect(2, 2, 92, 156, body).vline(3, 2, 156, trim).vline(92, 2, 156, trim);
  g.dither(4, 4, 6, 150, lit ? l.trim : C.night, 1);
  // side art
  for (let i = 0; i < 26; i++) {
    const x = 4 + Math.floor(hash(i, l.title.length) * 5);
    const y = 30 + Math.floor(hash(l.title.length, i) * 120);
    const c = lit ? l.marquee : C.concrete;
    if (l.side === 'stars') g.px(x, y, c).px(x + 1, y, c).px(x, y + 1, c);
    else if (l.side === 'dots') g.px(x, y, c);
    else if (l.side === 'bolts') g.px(x, y, c).px(x + 1, y + 1, c).px(x, y + 2, c);
  }
  if (l.side === 'stripes') for (let y = 30; y < 150; y += 8) g.hline(4, y, 6, lit ? l.marquee : C.concrete).hline(86, y + 4, 6, lit ? l.marquee : C.concrete);
  if (l.side === 'rings') for (let y = 34; y < 150; y += 14) g.rect(5, y, 4, 4, lit ? l.marquee : C.concrete).rect(6, y + 1, 2, 2, body);
  if (l.side === 'moon') g.rect(5, 40, 4, 6, lit ? C.sodiumLight : C.concrete).rect(7, 41, 2, 4, body);
  // marquee: back-lit sign
  const mq = lit ? l.marquee : C.night;
  g.boxed(6, 5, 84, 17, mq);
  if (lit) g.hline(6, 5, 84, C.paper).dither(6, 6, 84, 2, C.paper);
  const scale = textWidth(l.title, 2) <= 80 ? 2 : 1;
  const tx = 48 - Math.floor(textWidth(l.title, scale) / 2);
  const ty = scale === 2 ? 9 : 11;
  if (lit) g.text(l.title, tx + 1, ty + 1, l.ink === C.ink ? C.bone : C.ink, scale);
  g.text(l.title, tx, ty, lit ? l.ink : C.asphalt, scale);
  // bezel around the screen
  const sc = screenOf(l.tall);
  g.rect(sc.x - 3, sc.y - 3, sc.w + 6, sc.h + 6, C.ink).rect(sc.x - 2, sc.y - 2, sc.w + 4, sc.h + 4, lit ? C.night : C.ink);
  g.rect(sc.x, sc.y, sc.w, sc.h, C.ink);
  // control panel (not on pinball: the flippers are the buttons on its sides)
  const py = sc.y + sc.h + 4;
  if (!l.tall) {
    g.boxed(5, py, 86, 16, lit ? C.concrete : C.night).hline(5, py, 86, lit ? C.stone : C.asphalt);
    g.rect(14, py + 5, 5, 5, lit ? C.red : C.brick).px(15, py + 5, lit ? C.paper : C.asphalt);
    g.rect(77, py + 5, 5, 5, lit ? C.green : C.forest).px(78, py + 5, lit ? C.paper : C.asphalt);
    g.vline(48, py + 3, 6, C.ink).rect(47, py + 2, 3, 2, lit ? C.red : C.brick); // joystick
  } else {
    g.rect(2, 70, 3, 8, lit ? C.paper : C.concrete).rect(91, 70, 3, 8, lit ? C.paper : C.concrete);
  }
  // coin door: two slots, a price sticker, a light
  const cy = l.tall ? 132 : 128;
  g.boxed(34, cy, 28, 22, lit ? C.ink : C.night).rect(35, cy + 1, 26, 20, lit ? C.asphalt : C.night);
  g.rect(39, cy + 4, 6, 6, lit ? C.sodium : C.asphalt).vline(42, cy + 5, 4, C.ink);
  g.rect(51, cy + 4, 6, 6, lit ? C.sodium : C.asphalt).vline(54, cy + 5, 4, C.ink);
  g.rect(38, cy + 13, 20, 5, lit ? C.paper : C.concrete).text('25C', 42, cy + 13, C.red);
  // feet and kick plate
  g.rect(2, 155, 92, 3, C.ink).rect(6, 158, 10, 2, C.ink).rect(80, 158, 10, 2, C.ink);
  if (sign) paperSign(g, sc, sign, 'OUT OF', 'ORDER');
  return g.outline();
}

function paperSign(g: Grid, sc: { x: number; y: number; w: number; h: number }, sign: string, a: string, b: string) {
  g.boxed(sc.x + 6, sc.y + 20, sc.w - 12, 26, C.paper);
  g.text(a, 48 - Math.floor(textWidth(a) / 2), sc.y + 23, C.red).text(b, 48 - Math.floor(textWidth(b) / 2), sc.y + 30, C.red);
  const lines: string[] = [];
  let line = '';
  for (const w of sign.toUpperCase().split(' ')) ((line + ' ' + w).trim().length * 4 > sc.w - 4 ? (lines.push(line), (line = w)) : (line = (line + ' ' + w).trim()));
  lines.push(line);
  let y = sc.y + 49;
  g.boxed(sc.x + 2, y - 2, sc.w - 4, lines.length * 7 + 3, C.bone);
  for (const ln of lines) (g.text(ln, 48 - Math.floor(textWidth(ln) / 2), y, C.ink), (y += 7));
}

// The bar's pieces: a dartboard cabinet on the wall, a pool table and a shuffleboard table seen from above.
// Same 96x160 footprint and screen rectangle as the cabinets, so the room lays them out the same way.
function barPiece(l: CabinetLook, lit: boolean, sign?: string): Grid {
  const g = new Grid(CAB_W, CAB_H);
  const wood = lit ? C.tan : C.asphalt, dark = lit ? C.umber : C.night, glow = lit ? l.marquee : C.concrete;
  const sc = screenOf(l.tall);
  // neon tube sign on the paneling above it
  const tw = textWidth(l.title, 2) <= 84 ? 2 : 1;
  const tx = 48 - Math.floor(textWidth(l.title, tw) / 2);
  g.rect(tx - 4, 3, textWidth(l.title, tw) + 8, tw === 2 ? 16 : 11, C.ink);
  if (lit) g.text(l.title, tx + 1, 6, l.trim, tw);
  g.text(l.title, tx, 5, glow, tw);
  if (l.bar === 'darts') {
    // wall cabinet: doors open on both sides, chalkboards inside
    g.rect(sc.x - 6, sc.y - 5, sc.w + 12, sc.h + 10, dark).rect(sc.x - 4, sc.y - 3, sc.w + 8, sc.h + 6, wood);
    for (let y = sc.y - 3; y < sc.y + sc.h + 3; y += 5) g.hline(sc.x - 4, y, sc.w + 8, dark);
    g.rect(sc.x - 2, sc.y - 1, sc.w + 4, sc.h + 2, C.ink);
    g.rect(sc.x, sc.y, sc.w, sc.h, C.ink);
    // chalkboard and tally under it
    const cy = sc.y + sc.h + 8;
    g.boxed(10, cy, 76, 26, dark).rect(12, cy + 2, 72, 22, lit ? C.forest : C.night);
    if (lit) {
      g.text('HOME', 15, cy + 4, C.bone).text('AWAY', 55, cy + 4, C.bone);
      for (let i = 0; i < 7; i++) g.vline(16 + i * 3 + (i > 3 ? 2 : 0), cy + 12, 6, C.paper);
      g.hline(14, cy + 15, 14, C.paper);
      for (let i = 0; i < 3; i++) g.vline(57 + i * 3, cy + 12, 6, C.paper);
      g.rect(46, cy + 2, 1, 22, C.bone);
    }
    // the oche: tape on the floor
    g.rect(14, 152, 68, 3, lit ? C.sodium : C.concrete).hline(14, 152, 68, lit ? C.sodiumLight : C.stone);
  } else {
    // a table from above: heavy rails, diamonds, six pockets
    g.rect(sc.x - 7, sc.y - 6, sc.w + 14, sc.h + 12, dark).rect(sc.x - 5, sc.y - 4, sc.w + 10, sc.h + 8, wood);
    g.hline(sc.x - 5, sc.y - 4, sc.w + 10, lit ? C.sodiumLight : C.stone);
    for (let i = 1; i < 4; i++) g.px(sc.x + Math.round((sc.w * i) / 4), sc.y - 2, lit ? C.paper : C.stone).px(sc.x + Math.round((sc.w * i) / 4), sc.y + sc.h + 1, lit ? C.paper : C.stone);
    for (let i = 1; i < 8; i++) g.px(sc.x - 3, sc.y + Math.round((sc.h * i) / 8), lit ? C.paper : C.stone).px(sc.x + sc.w + 2, sc.y + Math.round((sc.h * i) / 8), lit ? C.paper : C.stone);
    g.rect(sc.x, sc.y, sc.w, sc.h, C.ink);
    if (l.bar === 'pool') for (const [x, y] of [[0, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [1, 1]]) g.rect(sc.x - 4 + x * (sc.w + 2), sc.y - 4 + y * (sc.h + 2), 6, 6, C.ink);
    const by = sc.y + sc.h + 9;
    if (l.bar === 'pool') {
      // the cue rack and the chalk
      g.rect(8, by, 80, 3, dark);
      for (let i = 0; i < 5; i++) g.rect(14 + i * 15, by + 3, 2, 14, lit ? C.bone : C.concrete).px(14 + i * 15, by + 3, lit ? C.blue : C.asphalt);
      g.rect(80, by + 10, 4, 4, lit ? C.blue : C.asphalt);
    } else {
      // a can of shuffleboard wax and the spare pucks
      g.rect(12, by + 2, 8, 10, lit ? C.sodium : C.asphalt).rect(12, by + 2, 8, 2, lit ? C.paper : C.concrete);
      for (let i = 0; i < 4; i++) g.rect(30 + i * 13, by + 6, 8, 6, i % 2 ? (lit ? C.red : C.brick) : (lit ? C.blue : C.navy)).hline(31 + i * 13, by + 6, 6, lit ? C.paper : C.stone);
    }
  }
  if (sign) paperSign(g, sc, sign, 'TABLE', 'CLOSED');
  return g.outline();
}

// The Off-Ramp's wood paneling, 64x64: vertical boards, a chair rail, nail heads.
export function paneling(): Grid {
  const g = new Grid(64, 64);
  g.rect(0, 0, 64, 64, C.umber);
  for (let x = 0; x < 64; x += 8) g.vline(x, 0, 64, C.ink).vline(x + 1, 0, 64, C.tan);
  for (let i = 0; i < 40; i++) g.vline(Math.floor(hash(i, 5) * 64), Math.floor(hash(9, i) * 64), 3 + (i % 5), C.brick); // grain
  g.rect(0, 40, 64, 3, C.tan).hline(0, 40, 64, C.sodium).hline(0, 43, 64, C.ink);
  return g;
}

// The Fun Zone carpet: black-light confetti on navy. Tiles at 64x64.
export function carpet(): Grid {
  const g = new Grid(64, 64);
  g.rect(0, 0, 64, 64, C.navy);
  const cs = [C.neon, C.mint, C.sodiumLight, C.violet];
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(hash(i, 3) * 64);
    const y = Math.floor(hash(7, i) * 64);
    const c = cs[i % 4];
    if (i % 3 === 0) g.px(x, y, c).px(x + 1, y, c).px(x + 2, y + 1, c);
    else if (i % 3 === 1) g.px(x, y, c).px(x, y + 1, c);
    else g.px(x, y, c);
  }
  for (let i = 0; i < 90; i++) g.px(Math.floor(hash(i, 11) * 64), Math.floor(hash(13, i) * 64), C.plum);
  return g;
}
