// Fun Zone and Off-Ramp top-bar logos, same slanted slab as the roadside starburst.
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

function slab(g: Grid) {
  const W = g.w, H = g.h;
  for (let y = 3; y < H - 2; y++) {
    const lean = Math.floor((H - 2 - y) / 3);
    g.hline(30 + lean, y, W - 36, C.night).px(30 + lean + W - 37, y, C.asphalt);
  }
  g.outline();
  g.hline(37, H - 7, W - 50, C.clear).hline(37, H - 6, W - 50, C.teal).hline(37, H - 5, W - 50, C.clear);
}

function sparkles(g: Grid, pts: [number, number][]) {
  for (const [px, py] of pts)
    g.px(px, py, C.sodiumLight).px(px - 1, py, C.sodium).px(px + 1, py, C.sodium).px(px, py - 1, C.sodium).px(px, py + 1, C.sodium);
}

// A small 25¢ token, in the same spot as the title starburst, not a second burst.
function token(g: Grid, cx: number, cy: number, ray = false) {
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    const L = k % 2 === 0 ? 11 : 6;
    for (let r = 5; r <= L; r++) g.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, k === 3 && !ray ? C.concrete : r >= L - 1 ? C.sodiumLight : C.sodium);
  }
  for (let y = -5; y <= 5; y++)
    for (let x = -5; x <= 5; x++) {
      const d = x * x + y * y;
      if (d <= 22) g.px(cx + x, cy + y, C.sodium);
      if (d <= 12) g.px(cx + x, cy + y, C.sodiumLight);
    }
  g.text('25', cx - 4, cy - 2, C.ink);
}

export function funZoneLogo(ray = false, o = false) {
  const g = new Grid(195, 33);
  slab(g);
  token(g, 17, 16, ray);
  const halo = new Grid(195, 33);
  tube(halo, 'FUN', 36, 5, Array(3).fill(C.neon));
  halo.outline(C.plum);
  for (let y = 0; y < 33; y++) for (let x = 0; x < 195; x++) if (halo.get(x, y) === C.plum && g.get(x, y) === C.night) g.px(x, y, C.plum);
  tube(g, 'FUN', 36, 5, Array(3).fill(C.neon));
  tube(g, 'ZONE', 36, 16, [C.neon, C.neon, C.neon, C.neon], o ? -1 : 1);
  g.text('ARCADE', 100, 6, C.mint).text('TOKENS 25C', 100, 14, C.stone).text('OPEN LATE', 100, 20, C.sodiumLight);
  sparkles(g, [[180, 6], [188, 18], [170, 22]]);
  return g;
}

// title / sub / plate are passed in so this file stays pre-dawn clean.
export function offRampLogo(title = 'THE BAR', sub = 'OPEN LATE', plate = '14', dead = false) {
  const g = new Grid(195, 33);
  slab(g);
  // a little highway plate, number from the caller
  g.rect(6, 5, 22, 22, C.forest).rect(8, 7, 18, 18, C.green);
  const n = (plate || '14').slice(0, 3);
  g.text(n, 11 + (n.length < 3 ? 2 : 0), 13, C.paper);
  const word = title.replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim() || 'THE BAR';
  const parts = word.split(' ');
  // "THE" in sodium, the rest in mint tubes (THE OFF-RAMP -> THE + OFF / RAMP)
  const head = parts[0] && parts.length > 1 ? parts[0] : '';
  const rest = parts[0] && parts.length > 1 ? parts.slice(1) : parts;
  if (head) g.text(head, 34, 5, C.sodiumLight);
  const line1 = (rest[0] || 'BAR').slice(0, 6);
  const line2 = (rest[1] || '').slice(0, 6);
  const y1 = head ? 12 : 6;
  tube(g, line1, 34, y1, Array(line1.length).fill(C.mint), dead ? 0 : -1);
  if (line2) tube(g, line2, 34, y1 + 10, Array(line2.length).fill(C.mint));
  const sx = 120;
  g.text(sub.slice(0, 12), sx, 8, C.sodiumLight);
  g.text('COLD BEER', sx, 16, C.stone);
  // a small mug
  g.rect(176, 10, 10, 12, C.bone).rect(178, 12, 6, 7, C.sodium).rect(186, 13, 4, 5, C.bone);
  sparkles(g, [[168, 6], [186, 24]]);
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
