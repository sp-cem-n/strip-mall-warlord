// Fun Zone and Off-Ramp top-bar logos, in the same family as the roadside starburst.
import { Grid } from './grid';
import { C } from './palette';

const F57: Record<string, string> = {
  F: '11111 10000 11110 10000 10000 10000 10000', U: '10001 10001 10001 10001 10001 10001 01110',
  N: '10001 11001 10101 10011 10001 10001 10001', Z: '11111 00001 00010 00100 01000 10000 11111',
  O: '01110 10001 10001 10001 10001 10001 01110', E: '11111 10000 11110 10000 10000 10000 11111',
  A: '01110 10001 10001 11111 10001 10001 10001', R: '11110 10001 10001 11110 10100 10010 10001',
  M: '10001 11011 10101 10101 10001 10001 10001', P: '11110 10001 10001 11110 10000 10000 10000',
};

function tube(g: Grid, t: string, x: number, y: number, cols: number[], dead = -1) {
  [...t].forEach((ch, n) => {
    const rows = (F57[ch] || F57.E).split(' ');
    const c = n === dead ? C.concrete : cols[n] ?? cols[0];
    rows.forEach((r, j) => [...r].forEach((b, i) => b === '1' && g.px(x + i, y + j, c).px(x + i + 1, y + j, c)));
    x += rows[0].length + 2;
  });
}

function token(g: Grid, cx: number, cy: number, ray = false) {
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    const L = k % 2 === 0 ? 12 : 7;
    for (let r = 4; r <= L; r++) g.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, k === 3 && !ray ? C.concrete : r >= L - 1 ? C.sodiumLight : C.sodium);
  }
  for (let y = -5; y <= 5; y++)
    for (let x = -5; x <= 5; x++) {
      const d = x * x + y * y;
      if (d <= 20) g.px(cx + x, cy + y, C.sodium);
      if (d <= 10) g.px(cx + x, cy + y, C.sodiumLight);
    }
  g.text('25', cx - 4, cy - 2, C.ink);
}

export function funZoneLogo(ray = false, o = false) {
  const g = new Grid(195, 33);
  g.rect(0, 0, 195, 33, C.ink);
  token(g, 18, 16, ray);
  tube(g, 'FUN', 36, 4, Array(3).fill(C.neon));
  tube(g, 'ZONE', 36, 16, Array(4).fill(C.neon), o ? -1 : 1);
  g.text('TOKENS', 92, 6, C.mint).text('TICKETS', 92, 14, C.mint).text('NOW OPEN', 92, 22, C.stone);
  // a couple of dead bulbs on a pink lip
  g.hline(0, 32, 195, C.plum);
  for (let x = 4; x < 191; x += 8) g.px(x, 1, x === 28 || x === 140 ? C.concrete : C.neon);
  return g.outline();
}

export function offRampLogo(title = 'THE BAR', dead = false) {
  const g = new Grid(195, 33);
  g.rect(0, 0, 195, 33, C.ink);
  // a green highway-style plate, text comes from the caller so this file stays pre-dawn clean
  g.rect(4, 4, 28, 25, C.forest).rect(6, 6, 24, 21, C.green);
  g.text('OPEN', 8, 10, C.paper);
  const word = title.replace(/[^A-Z ]/g, '').slice(0, 8) || 'THE BAR';
  const parts = word.split(/\s+/);
  tube(g, (parts[0] || 'THE').slice(0, 4), 38, 4, Array(4).fill(C.mint));
  if (parts[1]) tube(g, parts[1].slice(0, 4), 38, 16, Array(4).fill(C.mint), dead ? 1 : -1);
  g.text('COLD BEER', 108, 8, C.sodiumLight).text('OPEN LATE', 108, 18, C.stone);
  // a mug
  g.rect(170, 10, 14, 14, C.bone).rect(172, 12, 10, 8, C.sodium).rect(184, 14, 5, 6, C.bone);
  g.hline(0, 32, 195, C.teal);
  return g.outline();
}

export function starsTile() {
  const g = new Grid(64, 32).rect(0, 0, 64, 32, C.night);
  const spots = [ [4, 6], [14, 3], [22, 11], [31, 5], [40, 9], [48, 2], [58, 8], [9, 14], [27, 16], [45, 13], [55, 18], [18, 20], [36, 22], [7, 24] ];
  spots.forEach(([x, y], i) => {
    const c = i % 5 === 0 ? C.sodiumLight : i % 3 === 0 ? C.bone : C.stone;
    g.px(x, y, c);
    if (i % 4 === 0) g.px(x - 1, y, C.sodium).px(x + 1, y, C.sodium).px(x, y - 1, C.sodium).px(x, y + 1, C.sodium);
  });
  return g;
}
