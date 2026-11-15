// Fun Zone and Off-Ramp top-bar logos. Their own shapes, not the title sign's slanted slab.
// Keep post-dawn words out of this file: the Off-Ramp title and plate text come from the caller.
import { Grid } from './grid';
import { C } from './palette';

const F57: Record<string, string> = {
  F: '11111 10000 11110 10000 10000 10000 10000', U: '10001 10001 10001 10001 10001 10001 01110',
  N: '10001 11001 10101 10011 10001 10001 10001', Z: '11111 00001 00010 00100 01000 10000 11111',
  O: '01110 10001 10001 10001 10001 10001 01110', E: '11111 10000 11110 10000 10000 10000 11111',
  A: '01110 10001 10001 11111 10001 10001 10001', R: '11110 10001 10001 11110 10100 10010 10001',
  M: '10001 11011 10101 10101 10001 10001 10001', P: '11110 10001 10001 11110 10000 10000 10000',
  T: '11111 00100 00100 00100 00100 00100 00100', H: '10001 10001 10001 11111 10001 10001 10001',
  I: '11111 00100 00100 00100 00100 00100 11111', L: '10000 10000 10000 10000 10000 10000 11111',
  C: '01111 10000 10000 10000 10000 10000 01111', D: '11110 10001 10001 10001 10001 10001 11110',
  B: '11110 10001 10001 11110 10001 10001 11110',
};

function tube(g: Grid, t: string, x: number, y: number, cols: number[], dead = -1) {
  [...t].forEach((ch, n) => {
    const rows = (F57[ch] || F57.E).split(' ');
    const c = n === dead ? C.concrete : cols[n] ?? cols[0];
    rows.forEach((r, j) => [...r].forEach((b, i) => b === '1' && g.px(x + i, y + j, c).px(x + i + 1, y + j, c)));
    x += rows[0].length + 2;
  });
  return x;
}

function haloTube(g: Grid, t: string, x: number, y: number, fill: number, glow: number, dead = -1) {
  const halo = new Grid(g.w, g.h);
  tube(halo, t, x, y, Array(t.length).fill(fill), dead);
  halo.outline(glow);
  for (let yy = 0; yy < g.h; yy++)
    for (let xx = 0; xx < g.w; xx++)
      if (halo.get(xx, yy) === glow && g.get(xx, yy)) g.px(xx, yy, glow);
  return tube(g, t, x, y, Array(t.length).fill(fill), dead);
}

// A 25¢ arcade token. Reeded edge, sits off the marquee so the silhouette isn't a box.
function token(g: Grid, cx: number, cy: number, lit: boolean) {
  for (let y = -13; y <= 13; y++)
    for (let x = -13; x <= 13; x++) {
      const d = x * x + y * y;
      if (d <= 169) g.px(cx + x, cy + y, C.ink);
      if (d <= 144) g.px(cx + x, cy + y, lit ? C.sodium : C.concrete);
      if (d <= 100) g.px(cx + x, cy + y, lit ? C.sodiumLight : C.stone);
      if (d <= 64) g.px(cx + x, cy + y, lit ? C.sodium : C.concrete);
    }
  // reeded edge ticks
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8;
    g.px(cx + Math.round(Math.cos(a) * 12), cy + Math.round(Math.sin(a) * 12), lit ? C.paper : C.bone);
  }
  g.text('25', cx - 4, cy - 5, C.ink);
  g.text('C', cx - 2, cy + 2, C.ink);
}

function bulb(g: Grid, x: number, y: number, on: boolean, hot: number, dim: number) {
  g.px(x, y, on ? hot : dim);
  if (on) g.px(x - 1, y, hot).px(x + 1, y, hot).px(x, y - 1, hot).px(x, y + 1, dim);
}

// Arcade marquee: a chrome-framed cabinet sign with chasing bulbs, not a slanted slab.
export function funZoneLogo(ray = false, o = false) {
  const g = new Grid(195, 33);
  const x0 = 24, y0 = 3, x1 = 193, y1 = 29;
  // ink frame, plum fill, neon inner lip
  g.rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, C.ink);
  g.rect(x0 + 2, y0 + 2, x1 - x0 - 3, y1 - y0 - 3, C.plum);
  g.rect(x0 + 3, y0 + 3, x1 - x0 - 5, y1 - y0 - 5, C.night);
  // chasing bulbs around the frame (one stays burnt unless the lights sputter)
  let n = 0;
  const light = (x: number, y: number) => {
    const burnt = n === 11 && !ray;
    const hot = n % 2 === 0 ? C.neon : C.sodiumLight;
    bulb(g, x, y, !burnt, hot, C.concrete);
    n++;
  };
  for (let x = x0 + 4; x <= x1 - 4; x += 6) light(x, y0 + 1);
  for (let y = y0 + 5; y <= y1 - 5; y += 5) light(x1 - 1, y);
  for (let x = x1 - 4; x >= x0 + 4; x -= 6) light(x, y1 - 1);
  for (let y = y1 - 5; y >= y0 + 5; y -= 5) light(x0 + 1, y);

  token(g, 16, 16, true);
  haloTube(g, 'FUN', 38, 6, C.neon, C.plum);
  haloTube(g, 'ZONE', 38, 16, C.neon, C.plum, o ? -1 : 1);
  g.text('ARCADE', 108, 7, C.mint);
  g.text('TOKENS 25C', 108, 15, C.stone);
  g.text('OPEN LATE', 108, 21, C.sodiumLight);
  return g;
}

// Dive-bar neon: a fat off-ramp arrow, mint tubes, a highway plate, a mug. Not a slab.
export function offRampLogo(title = 'THE BAR', sub = 'OPEN LATE', plate = '14', dead = false) {
  const g = new Grid(195, 33);
  // arrow body: rounded-left cabinet, chevron point on the right
  const y0 = 3, y1 = 29;
  for (let y = y0; y <= y1; y++) {
    const along = (y - 16) / 13;
    const tip = 194 - Math.floor(Math.abs(along) * 22);
    const left = 26 + (y === y0 || y === y1 ? 2 : 0);
    g.hline(left, y, tip - left + 1, C.ink);
    if (y > y0 && y < y1) g.hline(left + 2, y, tip - left - 4, y === y0 + 1 || y === y1 - 1 ? C.teal : C.umber);
    if (y > y0 + 2 && y < y1 - 2) g.hline(left + 3, y, tip - left - 7, C.ink);
  }
  // a little highlight along the top of the arrow
  g.hline(30, y0 + 1, 130, C.teal);

  // interstate-style exit plate, number from the caller
  g.rect(3, 5, 28, 22, C.ink);
  g.rect(5, 6, 24, 6, C.red);
  g.rect(5, 12, 24, 14, C.navy);
  g.text('EXIT', 8, 7, C.paper);
  const n = (plate || '14').slice(0, 3);
  g.text(n, 9 + (n.length < 3 ? 2 : 0), 16, C.paper);

  const word = title.replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim() || 'THE BAR';
  const parts = word.split(' ');
  const head = parts[0] && parts.length > 1 ? parts[0] : '';
  const rest = parts[0] && parts.length > 1 ? parts.slice(1) : parts;
  if (head) g.text(head, 36, 6, C.sodiumLight);
  const y = head ? 13 : 10;
  // OFF-RAMP as two tube words with a hyphen, not a run-on. The A in the last word flickers.
  let x = 36;
  rest.forEach((w, i) => {
    if (i) {
      g.rect(x, y + 3, 4, 2, C.mint).rect(x, y + 2, 4, 1, C.teal);
      x += 7;
    }
    const flick = dead && i === rest.length - 1 ? Math.min(1, w.length - 1) : -1;
    x = haloTube(g, w.slice(0, 6), x, y, C.mint, C.teal, flick) + 1;
  });

  const sx = 128;
  g.text(sub.slice(0, 12), sx, 8, C.sodiumLight);
  g.text('COLD BEER', sx, 16, C.stone);
  // neon mug, foam on top
  g.rect(176, 14, 10, 12, C.teal);
  g.rect(178, 16, 6, 8, C.mint);
  g.rect(177, 12, 8, 3, C.paper);
  g.rect(186, 17, 4, 6, C.teal);
  g.px(179, 13, C.bone).px(181, 13, C.bone).px(183, 13, C.bone);
  return g;
}

// Transparent tile: a handful of dim 1-px stars, menu-screen sparse, no fill.
export function starsTile() {
  const g = new Grid(128, 64);
  const spots: [number, number, boolean][] = [
    [18, 8, false], [54, 14, false], [97, 6, true], [12, 28, false],
    [71, 22, false], [110, 31, false], [40, 36, false], [88, 44, false],
  ];
  for (const [x, y, plus] of spots) {
    g.px(x, y, plus ? C.bone : C.stone);
    if (plus) g.px(x - 1, y, C.concrete).px(x + 1, y, C.concrete).px(x, y - 1, C.concrete).px(x, y + 1, C.concrete);
  }
  return g;
}
