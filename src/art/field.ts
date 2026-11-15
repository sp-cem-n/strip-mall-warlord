// The parking-lot battlefields (320x150) and the title scene.
import { DAWN } from '../game/content/dawn';
import { Grid, hash } from './grid';
import { C } from './palette';
import { facade } from './storefronts';
import { titleSign } from './sign';

// ---- the battlefield ----
const SKYLINE: Record<string, (g: Grid) => void> = {
  lot: (g) => {
    for (let x = 0; x < 320; x++) g.vline(x, 34 + Math.floor(hash(x >> 3, 3) * 8), 12, C.forest);
    g.vline(54, 20, 26, C.concrete).boxed(30, 8, 40, 14, C.bone).text('RT 9', 42, 12, C.forest);
  },
  bigbox: (g) => {
    g.boxed(70, 14, 180, 32, C.concrete).hline(70, 14, 180, C.stone);
    g.text('CIRCUIT', 96, 18, C.red, 2).text('BARN', 160, 18, C.night, 2); // the second word's tubes went first
    g.rect(200, 30, 40, 16, C.night).text('FOODWAY', 202, 33, C.sodium);
  },
  outlet: (g) => {
    g.boxed(10, 28, 300, 18, C.bone);
    for (let x = 20; x < 300; x += 46) for (let i = 0; i < 10; i++) g.hline(x + i, 27 - i, 20 - i * 2, C.paper);
    g.text('PINE CREEK OUTLETS', 110, 34, C.teal);
  },
  lifestyle: (g) => {
    g.boxed(20, 22, 280, 24, C.brick);
    for (let x = 22; x < 300; x += 6) g.vline(x, 24, 20, C.umber);
    g.boxed(150, 2, 20, 44, C.brick).rect(154, 8, 12, 12, C.paper).px(160, 11, C.ink).px(160, 13, C.ink).px(161, 14, C.ink);
    g.text('THE PROMENADE', 40, 30, C.sodiumLight);
  },
  office: (g) => {
    for (const [x, w, h] of [[30, 60, 30], [110, 80, 38], [210, 70, 26]]) {
      g.boxed(x, 46 - h, w, h, C.concrete);
      for (let y = 50 - h; y < 44; y += 5) for (let i = x + 3; i < x + w - 3; i += 6) g.rect(i, y, 3, 2, hash(i, y) < 0.2 ? C.sodiumLight : C.night);
    }
    g.text('SUNRISE', 128, 10, C.teal);
  },
  commons: (g) => {
    for (let x = 0; x < 320; x++) g.vline(x, 36 + Math.floor(hash(x >> 2, 17) * 6), 10, C.forest);
    g.boxed(40, 30, 40, 14, C.bone).text('SALES', 48, 34, C.navy); // the trailer
    g.boxed(186, 6, 120, 30, C.paper).text('PINEWOOD COMMONS', 196, 12, C.teal).text('COMING SOON', 212, 22, C.red).vline(206, 37, 9, C.stone).vline(286, 37, 9, C.stone);
    for (let i = 0; i < 12; i++) g.vline(20 + i * 26, 40, 6, C.neon); // surveyor flags
  },
  power: (g) => {
    for (const [x, w, label, c] of [[10, 90, 'SPORTS DEPOT', C.blue], [110, 100, 'HOME WAREHOUSE', C.sodium], [220, 90, 'PETZONE', C.red]] as const) g.boxed(x, 20, w, 26, C.stone).hline(x, 20, w, c).text(label, x + 4, 26, c);
  },
  campus: (g) => {
    g.boxed(60, 6, 90, 40, C.navy).boxed(170, 14, 90, 32, C.navy);
    for (let y = 8; y < 46; y += 4) g.hline(61, y, 88, C.blue).hline(171, y + 8 > 45 ? 45 : y + 8, 88, C.blue);
    g.rect(150, 40, 20, 6, C.blue).px(160, 36, C.paper).px(159, 37, C.paper).px(161, 37, C.paper); // the fountain, on, aggressively
  },
  towncenter: (g) => {
    g.vline(80, 2, 44, C.sodium).hline(60, 2, 80, C.sodium).vline(130, 2, 10, C.stone); // crane
    g.boxed(150, 18, 140, 28, C.bone).text('LIVE WORK PLAY', 166, 26, C.violet);
    for (let x = 20; x < 140; x += 10) g.vline(x, 30, 16, C.concrete);
  },
  galleria: (g) => {
    g.boxed(20, 14, 280, 32, C.paper).hline(20, 14, 280, C.navy);
    g.boxed(140, 2, 40, 44, C.blue).dither(141, 3, 38, 42, C.mint);
    g.text(DAWN.galleriaSign, 40, 26, C.navy);
  },
};

export function battlefield(zoneId: string): Grid {
  const W = 320;
  const H = 150;
  const g = new Grid(W, H);
  g.rect(0, 0, W, 46, C.night).dither(0, 0, W, 12, C.ink);
  for (let i = 0; i < 30; i++) g.px(Math.floor(hash(i, 5) * W), Math.floor(hash(5, i) * 20), C.stone);
  SKYLINE[zoneId]?.(g);
  g.rect(0, 46, W, 3, C.stone).hline(0, 49, W, C.concrete);
  g.rect(0, 50, W, H - 50, C.asphalt);
  for (let i = 0; i < 900; i++) g.px(Math.floor(hash(i, 11) * W), 50 + Math.floor(hash(11, i) * (H - 50)), hash(i, 12) < 0.7 ? C.night : C.concrete);
  // sodium pool under the lamp
  const cx = 160;
  const cy = 118;
  for (let y = 50; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = ((x - cx) / 120) ** 2 + ((y - cy) / 40) ** 2;
      if (d < 0.3 && (x + y) % 2 === 0) g.px(x, y, C.umber);
      else if (d < 1 && x % 2 === 0 && y % 2 === 0) g.px(x, y, C.umber);
    }
  // head-in stalls along both edges: straight worn lines and a wheel stop per stall
  for (let x0 = 6; x0 < W; x0 += 34) {
    for (let y = 51; y < 72; y++) if (hash(x0, y) > 0.25) g.px(x0, y, C.stone);
    for (let y = 129; y < H; y++) if (hash(y, x0) > 0.25) g.px(x0, y, C.stone);
    if (x0 + 34 < W) g.boxed(x0 + 12, 53, 10, 2, C.concrete).boxed(x0 + 12, 146, 10, 2, C.concrete);
  }
  for (let x = 0; x < W; x += 12) g.hline(x, 100, 6, C.sodium); // faded center line
  // lamp
  g.vline(cx, 14, 106, C.concrete).vline(cx + 1, 14, 106, C.asphalt).rect(cx - 8, 12, 18, 3, C.concrete).rect(cx - 7, 15, 16, 1, C.sodiumLight);
  g.rect(cx - 2, 119, 6, 3, C.concrete);
  // the cart nobody owns
  const k = 292;
  g.hline(k, 128, 12, C.stone).hline(k + 1, 132, 10, C.stone).vline(k, 128, 5, C.stone).vline(k + 11, 128, 5, C.stone).px(k + 2, 135, C.ink).px(k + 9, 135, C.ink).hline(k - 3, 127, 4, C.stone);
  return g;
}

export function lotNoise(g: Grid, x0: number, y0: number, w: number, h: number, seed: number) {
  g.rect(x0, y0, w, h, C.asphalt);
  for (let i = 0; i < (w * h) / 30; i++) g.px(x0 + Math.floor(hash(i, seed) * w), y0 + Math.floor(hash(seed, i) * h), hash(i, seed + 1) < 0.7 ? C.night : C.concrete);
}

// the title screen: your actual first four units, at night, from the far end of the lot
export function bootScene(kinds: (string | null)[], dawn = false): Grid {
  const W = 320;
  const H = 180;
  const g = new Grid(W, H);
  if (dawn) {
    // 6:10 a.m.: the sky over Rt. 9 goes plum, then pink, then sodium, and the lamps click off
    const bands = [C.plum, C.violet, C.neon, C.sodium, C.sodiumLight];
    bands.forEach((c, i) => g.rect(0, i * 10, W, 10, c).dither(0, i * 10 + 8, W, 2, bands[i + 1] ?? c));
    g.rect(0, 50, W, 62, C.sodiumLight).dither(0, 50, W, 6, C.paper);
    g.rect(262, 40, 30, 10, C.paper).rect(268, 36, 18, 4, C.paper); // the sun, coming up over the Bypass
  } else {
    g.rect(0, 0, W, 112, C.night).dither(0, 0, W, 26, C.ink);
    for (let i = 0; i < 50; i++) g.px(Math.floor(hash(i, 21) * W), Math.floor(hash(21, i) * 40), hash(i, 22) < 0.8 ? C.stone : C.bone);
  }
  // tree line behind the plaza
  for (let x = 0; x < W; x++) g.vline(x, 44 + Math.floor(hash(x >> 2, 9) * 6), 20, C.forest);
  // roof sign: the same starburst as the top bar
  const sign = titleSign(!dawn, dawn ? 1 << 4 : 0);
  const sx = Math.floor((320 - sign.w) / 2);
  g.vline(sx + 20, 40, 14, C.concrete).vline(sx + sign.w - 20, 40, 14, C.concrete);
  g.blit(sign, sx, 8);
  // the building
  g.boxed(20, 54, 280, 50, C.bone).rect(20, 54, 280, 3, C.stone);
  for (let i = 0; i < 4; i++) g.blit(facade(kinds[i] ?? null, 'home', i + 1), 32 + i * 64, 54);
  g.rect(14, 104, 292, 7, C.concrete).hline(14, 104, 292, C.stone);
  // the lot
  lotNoise(g, 0, 111, W, H - 111, 31);
  for (let x0 = 10; x0 < W; x0 += 40) for (let y = 116; y < 140; y++) if (hash(x0, y) > 0.25) g.px(x0, y, C.stone);
  for (let y = 112; y < H; y++)
    for (let x = 200; x < W; x++) {
      const d = ((x - 290) / 80) ** 2 + ((y - 170) / 36) ** 2;
      if (d < 0.35 && (x + y) % 2 === 0) g.px(x, y, C.umber);
      else if (d < 1 && x % 2 === 0 && y % 2 === 0) g.px(x, y, C.umber);
    }
  // one car, nobody in it
  const cx = 44;
  const cy = 150;
  g.boxed(cx + 9, cy - 8, 24, 7, C.navy).rect(cx + 11, cy - 7, 9, 5, C.night).rect(cx + 22, cy - 7, 9, 5, C.night).px(cx + 12, cy - 6, C.stone);
  g.boxed(cx, cy - 1, 44, 9, C.blue).hline(cx, cy - 1, 44, C.mint).hline(cx, cy + 7, 44, C.navy).rect(cx + 41, cy + 1, 3, 2, C.bone).rect(cx, cy + 1, 2, 2, C.red);
  g.boxed(cx + 6, cy + 7, 7, 4, C.ink).boxed(cx + 31, cy + 7, 7, 4, C.ink);
  // lamp + cart
  g.vline(290, 20, 150, C.concrete).vline(291, 20, 150, C.asphalt).rect(276, 18, 16, 3, C.concrete).rect(277, 21, 12, 1, C.sodiumLight);
  const k = 230;
  g.hline(k, 160, 12, C.stone).hline(k + 1, 164, 10, C.stone).vline(k, 160, 5, C.stone).vline(k + 11, 160, 5, C.stone).px(k + 2, 167, C.ink).px(k + 9, 167, C.ink).hline(k - 3, 159, 4, C.stone);
  return g;
}

// tiles and frames for the page around the game (CSS backgrounds / border-images)
