// The title sign: a '60s starburst and a slanted slab, sodium STRIP MALL over a pink neon WARLORD.
// One ray of the starburst is burnt out. Nobody has called anyone about it.
// ray = the few seconds a while it sputters back on; out = bitmask of WARLORD letters that are dark right now (see ui/lights.ts).
// 195x33, shown at 2x in the top bar's 390x66 slot.
import { Grid } from './grid';
import { C } from './palette';

const W = 195;
const H = 33;

// 5x7 caps for the neon tube, drawn bold (each lit pixel doubled to the right)
const F57: Record<string, string> = {
  W: '10001 10001 10001 10101 10101 11011 10001', A: '01110 10001 10001 11111 10001 10001 10001',
  R: '11110 10001 10001 11110 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  O: '01110 10001 10001 10001 10001 10001 01110', D: '11110 10001 10001 10001 10001 10001 11110',
};

function tube(g: Grid, t: string, x: number, y: number, cols: number[]) {
  [...t].forEach((ch, n) => {
    const rows = F57[ch].split(' ');
    rows.forEach((r, j) => [...r].forEach((b, i) => b === '1' && g.px(x + i, y + j, cols[n]).px(x + i + 1, y + j, cols[n])));
    x += rows[0].length + 2;
  });
  return x;
}

function starburst(ray: boolean) {
  const sb = new Grid(36, 33);
  const cx = 17, cy = 16;
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8;
    const L = k % 2 === 0 ? 15 : 8;
    for (let r = 4; r <= L; r++) sb.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, k === 6 && !ray ? C.concrete : r >= L - 2 ? C.sodiumLight : C.sodium);
  }
  for (let y = -4; y <= 4; y++)
    for (let x = -4; x <= 4; x++) {
      if (x * x + y * y <= 17) sb.px(cx + x, cy + y, C.sodium);
      if (x * x + y * y <= 8) sb.px(cx + x, cy + y, C.sodiumLight);
    }
  sb.px(cx - 1, cy - 1, C.paper).px(cx - 2, cy - 1, C.paper).px(cx - 1, cy - 2, C.paper);
  return sb.outline();
}

export function titleSign(ray = false, out = 0) {
  const g = new Grid(W, H);
  // the slab leans right, lit edge on the right, then the teal underline with daylight on both sides
  for (let y = 3; y < 31; y++) {
    const lean = Math.floor((31 - y) / 3);
    g.hline(30 + lean, y, W - 36, C.night).px(30 + lean + W - 37, y, C.asphalt);
  }
  g.outline();
  g.hline(37, 26, W - 50, C.clear).hline(37, 27, W - 50, C.teal).hline(37, 28, W - 50, C.clear);
  const sb = starburst(ray);
  for (let y = 0; y < sb.h; y++) for (let x = 0; x < sb.w; x++) if (sb.get(x, y)) g.px(x, y, sb.get(x, y));

  g.text('STRIP MALL', 46, 5, C.sodiumLight);
  // neon: a plum halo where it falls on the slab, the O dark, a paper core along the top of each lit letter
  const t = 'WARLORD';
  const halo = new Grid(W, H);
  tube(halo, t, 46, 12, Array(7).fill(C.neon));
  halo.outline(C.plum);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (halo.get(x, y) === C.plum && g.get(x, y) === C.night) g.px(x, y, C.plum);
  const cols = Array.from({ length: 7 }, (_, n) => (out & (1 << n) ? C.brick : C.neon));
  const end = tube(g, t, 46, 12, cols);
  let x = 46;
  [...t].forEach((ch, n) => {
    const top = F57[ch].split(' ')[0];
    if (!(out & (1 << n))) [...top].forEach((b, i) => b === '1' && g.px(x + i, 12, C.paper));
    x += top.length + 2;
  });

  const sx = end + 8;
  g.text('PINEWOOD PLAZA', sx, 13, C.mint).text('RT. 9', sx, 19, C.stone);
  for (const [px, py] of [[W - 22, 6], [W - 12, 19], [W - 40, 7], [sx + 30, 21]])
    g.px(px, py, C.sodiumLight).px(px - 1, py, C.sodium).px(px + 1, py, C.sodium).px(px, py - 1, C.sodium).px(px, py + 1, C.sodium);
  return g;
}
