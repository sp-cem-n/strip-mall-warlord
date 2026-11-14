// Arcade cabinets, 96x160, and the Fun Zone carpet. Each machine has its own body colors, marquee and side art.
// The screen (or playfield) is left dark: the mini-game draws over it every frame.
import { Grid, hash, textWidth } from './grid';
import { C } from './palette';

export interface CabinetLook { body: number; trim: number; marquee: number; ink: number; title: string; side: 'stars' | 'stripes' | 'bolts' | 'dots' | 'moon' | 'rings'; tall?: boolean }
export const CAB_W = 96;
export const CAB_H = 160;
// screen rectangle inside the cabinet (pinball's playfield is taller)
export const screenOf = (tall?: boolean) => (tall ? { x: 9, y: 25, w: 78, h: 101 } : { x: 9, y: 27, w: 78, h: 76 });

export function cabinet(l: CabinetLook, lit: boolean, sign?: string): Grid {
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
  if (sign) {
    // a paper sign taped over the dark screen
    g.boxed(sc.x + 6, sc.y + 20, sc.w - 12, 26, C.paper);
    g.text('OUT OF', 48 - Math.floor(textWidth('OUT OF') / 2), sc.y + 23, C.red).text('ORDER', 48 - Math.floor(textWidth('ORDER') / 2), sc.y + 30, C.red);
    const words = sign.toUpperCase().split(' ');
    let line = '';
    let y = sc.y + 49;
    const lines: string[] = [];
    for (const w of words) ((line + ' ' + w).trim().length * 4 > sc.w - 4 ? (lines.push(line), (line = w)) : (line = (line + ' ' + w).trim()));
    lines.push(line);
    g.boxed(sc.x + 2, y - 2, sc.w - 4, lines.length * 7 + 3, C.bone);
    for (const ln of lines) (g.text(ln, 48 - Math.floor(textWidth(ln) / 2), y, C.ink), (y += 7));
  }
  return g.outline();
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
