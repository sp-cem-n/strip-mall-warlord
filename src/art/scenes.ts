// Storefront facades (64x56), parking-lot battlefields (320x150), UI frames and icons.
import type { ShopKind } from '../game/defs';
import { Grid, textWidth } from './grid';
import { C } from './palette';

export type Material = 'home' | 'lot' | 'bigbox' | 'outlet' | 'lifestyle';
const MATERIAL: Record<Material, { wall: number; trim: number; grime: number }> = {
  home: { wall: C.bone, trim: C.stone, grime: C.stone }, // tan stucco, 1991
  lot: { wall: C.navy, trim: C.sodiumLight, grime: C.night }, // the old video store
  bigbox: { wall: C.stone, trim: C.red, grime: C.concrete },
  outlet: { wall: C.paper, trim: C.mint, grime: C.bone },
  lifestyle: { wall: C.brick, trim: C.bone, grime: C.umber }, // fake brick
};

const SIGN: Record<ShopKind, { bg: number; fg: number; text: string; awning: number }> = {
  dojo: { bg: C.red, fg: C.paper, text: 'DOJO', awning: C.red },
  vape: { bg: C.plum, fg: C.neon, text: 'VAPE', awning: C.violet },
  laundromat: { bg: C.blue, fg: C.paper, text: 'SUDS', awning: C.blue },
  pawn: { bg: C.sodium, fg: C.ink, text: 'PAWN', awning: C.sodium },
  payday: { bg: C.forest, fg: C.sodiumLight, text: 'PAYDAY', awning: C.green },
};

// cheap deterministic noise
const hash = (a: number, b: number) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

function interior(g: Grid, kind: ShopKind) {
  switch (kind) {
    case 'dojo':
      g.rect(5, 42, 36, 5, C.forest).hline(5, 42, 36, C.green);
      g.vline(32, 25, 3, C.stone).block(30, 28, 5, 11, C.red).hline(30, 28, 5, C.brick);
      g.rect(8, 28, 9, 11, C.paper).text('KO', 9, 31, C.red);
      break;
    case 'vape':
      g.hline(5, 33, 36, C.stone).hline(5, 40, 36, C.stone);
      for (let i = 0; i < 9; i++) g.rect(7 + i * 4, 30, 2, 3, [C.neon, C.mint, C.violet][i % 3]).rect(7 + i * 4, 37, 2, 3, [C.mint, C.violet, C.neon][i % 3]);
      g.text('OPEN 24', 9, 26, C.neon);
      break;
    case 'laundromat':
      for (const x of [6, 18, 30]) g.block(x, 33, 10, 13, C.stone).rect(x + 2, 36, 6, 6, C.navy).rect(x + 3, 37, 4, 4, C.blue).px(x + 3, 37, C.mint).hline(x + 1, 34, 3, C.mint);
      g.text('COIN', 9, 27, C.paper);
      break;
    case 'pawn':
      g.text('GOLD', 7, 26, C.sodiumLight);
      g.block(8, 37, 6, 6, C.umber).vline(10, 30, 7, C.umber).rect(9, 29, 3, 2, C.ink);
      g.block(22, 33, 12, 10, C.stone).rect(23, 34, 9, 7, C.blue).px(24, 35, C.mint).hline(22, 43, 12, C.concrete);
      break;
    case 'payday':
      g.text('$', 9, 27, C.green, 3);
      g.block(5, 39, 36, 8, C.stone).text('NO CREDIT', 6, 41, C.paper);
      g.vline(23, 25, 14, C.mint);
      break;
  }
}

export function facade(kind: ShopKind | null, material: Material, seed: number): Grid {
  const g = new Grid(64, 56);
  const m = MATERIAL[material];
  g.rect(0, 0, 64, 50, m.wall);
  if (material === 'lifestyle') for (let y = 4; y < 50; y += 4) g.hline(0, y, 64, C.umber).vline(((y / 4) % 2) * 6 + 3, y, 4, C.umber);
  for (let i = 0; i < 40; i++) g.px(Math.floor(hash(seed, i) * 64), Math.floor(hash(i, seed) * 50), m.grime);
  g.rect(0, 0, 64, 3, m.trim).hline(0, 3, 64, C.ink).vline(0, 0, 50, C.ink);
  // sign band
  g.boxed(3, 6, 58, 12, kind ? SIGN[kind].bg : C.concrete);
  if (kind) {
    const sgn = SIGN[kind];
    const x = 32 - Math.floor(textWidth(sgn.text, 2) / 2);
    const dead = Math.floor(hash(seed, 99) * sgn.text.length); // one tube is always out
    [...sgn.text].forEach((ch, i) => g.text(ch, x + i * 8, 7, i === dead && hash(seed, 7) < 0.6 ? sgn.bg === C.sodium ? C.tan : C.concrete : sgn.fg, 2));
  } else {
    g.text('VIDEO', 32 - Math.floor(textWidth('VIDEO', 2) / 2), 7, C.stone, 2); // ghost of the last tenant
  }
  // awning
  const aw = kind ? SIGN[kind].awning : C.stone;
  for (let x = 2; x < 62; x++) g.rect(x, 19, 1, 3, Math.floor(x / 4) % 2 ? aw : C.paper);
  for (let x = 2; x < 62; x += 2) g.px(x, 22, Math.floor(x / 4) % 2 ? aw : C.paper);
  g.hline(2, 23, 60, C.ink);
  // window + door
  g.boxed(4, 24, 38, 24, C.night);
  g.rect(44, 24, 16, 26, C.night);
  g.vline(43, 24, 26, C.ink).vline(60, 24, 26, C.ink).hline(43, 23, 18, C.ink);
  if (kind) {
    interior(g, kind);
    g.text('OPEN', 45, 27, C.neon);
  } else {
    g.dither(5, 25, 36, 22, C.bone).dither(5, 25, 36, 22, C.stone, 1);
    g.rect(10, 30, 26, 13, C.paper).text('FOR', 17, 32, C.red).text('LEASE', 13, 38, C.red);
  }
  for (let i = 0; i < 6; i++) g.px(36 - i, 26 + i, C.stone); // glass glint
  g.px(56, 37, C.sodiumLight).px(56, 38, C.sodiumLight); // door handle
  // sidewalk
  g.rect(0, 50, 64, 6, C.concrete).hline(0, 50, 64, C.stone);
  g.px(20, 52, C.asphalt).px(21, 53, C.asphalt).px(22, 53, C.asphalt).px(23, 54, C.asphalt);
  return g;
}

// ---- the battlefield ----
const SKYLINE: Record<string, (g: Grid) => void> = {
  lot: (g) => {
    for (let x = 0; x < 320; x++) g.vline(x, 34 + Math.floor(hash(x >> 3, 3) * 8), 12, C.forest);
    g.vline(54, 20, 26, C.concrete).boxed(30, 8, 50, 14, C.bone).text('EXIT 14', 38, 12, C.forest);
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

// ---- UI frame + icons ----
export function panelFrame(): Grid {
  const g = new Grid(12, 12);
  g.rect(0, 0, 12, 12, C.ink).rect(1, 1, 10, 10, C.concrete).rect(2, 2, 8, 8, C.night).hline(1, 1, 10, C.stone).vline(1, 1, 10, C.stone);
  g.px(0, 0, 0).px(11, 0, 0).px(0, 11, 0).px(11, 11, 0);
  return g;
}

export function buttonFrame(c = C.concrete): Grid {
  const g = new Grid(6, 6);
  g.rect(0, 0, 6, 6, C.ink).rect(1, 1, 4, 4, c).hline(1, 1, 4, C.stone).hline(1, 4, 4, C.asphalt);
  g.px(0, 0, 0).px(5, 0, 0).px(0, 5, 0).px(5, 5, 0);
  return g;
}

export const ICONS: Record<string, () => Grid> = {
  speaker: () => new Grid(9, 9).rect(0, 3, 2, 3, C.bone).rect(2, 2, 1, 5, C.bone).rect(3, 1, 1, 7, C.bone).vline(5, 3, 3, C.sodiumLight).vline(7, 1, 7, C.sodiumLight).px(6, 2, C.sodiumLight).px(6, 6, C.sodiumLight),
  muted: () => new Grid(9, 9).rect(0, 3, 2, 3, C.stone).rect(2, 2, 1, 5, C.stone).rect(3, 1, 1, 7, C.stone).px(5, 3, C.red).px(6, 4, C.red).px(7, 5, C.red).px(7, 3, C.red).px(5, 5, C.red),
  cash: () => new Grid(9, 9).rect(0, 2, 9, 5, C.green).rect(1, 3, 7, 3, C.forest).rect(3, 3, 3, 3, C.green).px(4, 4, C.paper).outline(),
  heat: () => new Grid(9, 9).rect(2, 2, 5, 5, C.red).rect(2, 2, 2, 5, C.blue).hline(1, 7, 7, C.stone).px(3, 3, C.paper).outline(),
  asphalt: () => new Grid(9, 9).rect(3, 1, 3, 2, C.sodium).rect(2, 3, 5, 2, C.paper).rect(1, 5, 7, 2, C.sodium).hline(0, 7, 9, C.night),
  lots: () => new Grid(9, 9).vline(1, 0, 9, C.stone).rect(2, 0, 6, 4, C.red).hline(2, 2, 6, C.paper),
  find: () => new Grid(9, 9).vline(4, 0, 9, C.sodiumLight).hline(0, 4, 9, C.sodiumLight).rect(3, 3, 3, 3, C.paper).px(2, 2, C.sodium).px(6, 6, C.sodium).px(6, 2, C.sodium).px(2, 6, C.sodium),
};

// ---- v0.4: sign samples, scaffolding, the boot scene, page textures ----

// just the sign band of a facade, burnt-out tube included
export const signSample = (kind: ShopKind, seed: number) => facade(kind, 'home', seed).crop(2, 5, 60, 14);

// goes up over a storefront while you pick a new sign
export function scaffold(): Grid {
  const g = new Grid(64, 56);
  g.dither(3, 5, 58, 14, C.blue).dither(3, 5, 58, 14, C.navy, 1).text('SIGN CO.', 17, 10, C.paper);
  for (const x of [2, 31, 61]) g.vline(x, 3, 47, C.stone);
  for (let i = 0; i < 16; i++) g.px(3 + i * 1.8, 38 - i, C.concrete).px(32 + i * 1.8, 22 + i, C.concrete);
  for (const y of [3, 21, 39]) g.rect(1, y, 62, 2, C.tan).hline(1, y + 1, 62, C.umber);
  g.rect(40, 46, 8, 4, C.sodium).hline(40, 46, 8, C.sodiumLight); // bucket
  return g.outline();
}

function lotNoise(g: Grid, x0: number, y0: number, w: number, h: number, seed: number) {
  g.rect(x0, y0, w, h, C.asphalt);
  for (let i = 0; i < (w * h) / 30; i++) g.px(x0 + Math.floor(hash(i, seed) * w), y0 + Math.floor(hash(seed, i) * h), hash(i, seed + 1) < 0.7 ? C.night : C.concrete);
}

// the title screen: your actual first four units, at night, from the far end of the lot
export function bootScene(kinds: (ShopKind | null)[]): Grid {
  const W = 320;
  const H = 180;
  const g = new Grid(W, H);
  g.rect(0, 0, W, 112, C.night).dither(0, 0, W, 26, C.ink);
  for (let i = 0; i < 50; i++) g.px(Math.floor(hash(i, 21) * W), Math.floor(hash(21, i) * 40), hash(i, 22) < 0.8 ? C.stone : C.bone);
  // tree line behind the plaza
  for (let x = 0; x < W; x++) g.vline(x, 44 + Math.floor(hash(x >> 2, 9) * 6), 20, C.forest);
  // roof sign
  g.vline(110, 44, 12, C.concrete).vline(210, 44, 12, C.concrete);
  g.boxed(66, 10, 188, 34, C.ink).rect(68, 12, 184, 30, C.night).hline(68, 12, 184, C.plum);
  const title = 'STRIP MALL WARLORD';
  const tx = 160 - Math.floor(textWidth(title, 2) / 2);
  [...title].forEach((ch, i) => g.text(ch, tx + i * 8, 16, i === 12 ? C.brick : C.neon, 2)); // the W is out
  const sub = 'PINEWOOD PLAZA  EST. 1991';
  g.text(sub, 160 - Math.floor(textWidth(sub) / 2), 33, C.sodiumLight);
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
export function cinderTile(): Grid {
  const g = new Grid(32, 16);
  g.rect(0, 0, 32, 16, C.asphalt);
  for (const [y, off] of [[0, 0], [8, 8]] as const) {
    g.hline(0, y, 32, C.night);
    for (let x = off; x < 32 + off; x += 16) g.vline(x % 32, y, 8, C.night).hline((x + 1) % 32, y + 1, 14, C.concrete);
  }
  for (let i = 0; i < 10; i++) g.px(Math.floor(hash(i, 41) * 32), Math.floor(hash(41, i) * 16), C.night);
  return g;
}

export function skyTile(): Grid {
  const g = new Grid(16, 16).rect(0, 0, 16, 16, C.night);
  for (let i = 0; i < 6; i++) g.px(Math.floor(hash(i, 51) * 16), Math.floor(hash(51, i) * 16), C.ink);
  return g;
}

// grass, curb and the edge of Rt. 9 along the bottom of the header
export function roadTile(): Grid {
  const g = new Grid(32, 16);
  g.rect(0, 0, 32, 6, C.forest);
  for (let x = 0; x < 32; x += 3) g.vline(x, 0 + Math.floor(hash(x, 61) * 3), 2, C.green);
  g.rect(0, 6, 32, 2, C.stone).hline(0, 8, 32, C.concrete);
  lotNoise(g, 0, 9, 32, 7, 62);
  g.hline(4, 13, 10, C.sodium);
  return g;
}

export function ledTile(): Grid {
  return new Grid(3, 3).rect(0, 0, 3, 3, C.ink).px(1, 1, C.night);
}

// frames: aluminum storefront glass, brick, pylon cabinet, price tag, receipt, binder, lot sign
const frame = (size: number, layers: number[], hi?: number, lo?: number) => {
  const g = new Grid(size, size);
  layers.forEach((c, i) => g.rect(i, i, size - i * 2, size - i * 2, c));
  if (hi) g.hline(1, 1, size - 2, hi).vline(1, 1, size - 2, hi);
  if (lo) g.hline(1, size - 2, size - 2, lo).vline(size - 2, 1, size - 2, lo);
  return g.px(0, 0, 0).px(size - 1, 0, 0).px(0, size - 1, 0).px(size - 1, size - 1, 0);
};
export const glassFrame = () => {
  const g = frame(16, [C.ink, C.stone, C.stone, C.stone, C.bone, C.ink, C.night], C.bone, C.concrete);
  return g.px(3, 3, C.paper);
};
export const brickFrame = () => {
  const g = frame(24, [C.ink, C.brick, C.brick, C.brick, C.brick, C.brick, C.brick, C.ink, C.night]);
  for (let y = 1; y < 23; y += 3) for (let x = (y % 2) * 3 + 1; x < 23; x += 6) if (x < 8 || x > 15 || y < 8 || y > 15) g.px(x, y, C.umber);
  for (let y = 3; y < 22; y += 3) for (let x = 1; x < 23; x++) if (x < 8 || x > 15 || y < 8 || y > 15) g.px(x, y, C.umber);
  return g;
};
export const pylonFrame = () => frame(12, [C.ink, C.concrete, C.concrete, C.ink, C.night], C.stone, C.asphalt);
export const tenantFrame = () => frame(6, [C.ink], undefined, undefined);
export const tagFrame = () => frame(8, [C.ink, C.paper], C.paper, C.bone);
export const printerFrame = () => frame(12, [C.ink, C.concrete, C.asphalt, C.asphalt, C.ink, C.night], C.stone, C.night);
export const binderFrame = () => {
  const g = frame(16, [C.ink, C.navy, C.navy, C.navy, C.navy, C.ink, C.paper], C.blue, C.ink);
  return g.px(2, 2, C.stone).px(13, 2, C.stone).px(2, 13, C.stone).px(13, 13, C.stone);
};
export const signFrame = (c = C.concrete) => frame(8, [C.ink, c, C.ink, C.night], C.stone).px(1, 1, C.bone).px(6, 1, C.bone).px(1, 6, C.bone).px(6, 6, C.bone);
export const tearTile = () => {
  const g = new Grid(8, 4);
  for (let x = 0; x < 8; x++) g.vline(x, 0, 4 - Math.abs(4 - x), C.paper);
  return g;
};
