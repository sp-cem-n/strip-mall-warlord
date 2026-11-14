// Storefront facades (64x56), parking-lot battlefields (320x150), UI frames and icons.
import { Grid, textWidth } from './grid';
import { C } from './palette';

export type Material = 'home' | 'bigbox' | 'outlet' | 'office' | 'lifestyle' | 'bypass';
const MATERIAL: Record<Material, { wall: number; trim: number; grime: number }> = {
  home: { wall: C.bone, trim: C.stone, grime: C.stone }, // tan stucco, 1991
  bigbox: { wall: C.stone, trim: C.red, grime: C.concrete },
  outlet: { wall: C.paper, trim: C.mint, grime: C.bone },
  office: { wall: C.concrete, trim: C.teal, grime: C.asphalt }, // poured concrete, 1984
  lifestyle: { wall: C.brick, trim: C.bone, grime: C.umber }, // fake brick
  bypass: { wall: C.paper, trim: C.navy, grime: C.stone }, // EIFS, 1998, still white
};

type Decor = 'dojo' | 'vape' | 'laundromat' | 'pawn' | 'payday' | 'desk' | 'shelves' | 'chair' | 'mic' | 'beds' | 'gym' | 'pets' | 'phones' | 'tooth' | 'tan' | 'wash' | 'storage' | 'golf' | 'dress' | 'film' | 'pretzel';
interface ShopArt { text: string; bg: number; fg: number; awning: number; decor: Decor; label?: string }
const A = (text: string, bg: number, fg: number, awning: number, decor: Decor, label?: string): ShopArt => ({ text, bg, fg, awning, decor, label });
// one sign per shop; Bypass franchises reuse the original's sign
const SHOP_ART: Record<string, ShopArt> = {
  pawn: A('PAWN', C.sodium, C.ink, C.sodium, 'pawn'),
  dojo: A('DOJO', C.red, C.paper, C.red, 'dojo'),
  laundromat: A('SUDS', C.blue, C.paper, C.blue, 'laundromat'),
  vape: A('VAPE', C.plum, C.neon, C.violet, 'vape'),
  security: A('GUARD', C.navy, C.sodiumLight, C.navy, 'desk', 'CCTV'),
  video: A('VIDEO', C.navy, C.sodiumLight, C.blue, 'shelves', 'NEW'),
  payday: A('PAYDAY', C.forest, C.sodiumLight, C.green, 'payday'),
  nails: A('NAILS', C.neon, C.paper, C.neon, 'chair', 'WALK-IN'),
  tanning: A('TAN', C.sodiumLight, C.brick, C.sodium, 'tan'),
  karaoke: A('KARAOKE', C.plum, C.sodiumLight, C.violet, 'mic'),
  checks: A('CHECKS', C.green, C.paper, C.forest, 'desk', 'CASHED'),
  driving: A('DRIVING', C.paper, C.red, C.red, 'desk', 'PERMITS'),
  grooming: A('PETS', C.mint, C.navy, C.teal, 'pets'),
  copy: A('COPIES', C.bone, C.blue, C.blue, 'shelves', '5 CENTS'),
  dentist: A('DENTIST', C.paper, C.teal, C.mint, 'tooth'),
  mattress: A('BEDS', C.blue, C.sodiumLight, C.navy, 'beds', 'SALE'),
  kiosk: A('PHONES', C.night, C.mint, C.teal, 'phones'),
  gym: A('GYM', C.red, C.paper, C.night, 'gym'),
  party: A('PARTY', C.violet, C.sodiumLight, C.neon, 'shelves', 'BALLOONS'),
  storage: A('STORAGE', C.sodium, C.navy, C.sodium, 'storage'),
  carwash: A('CARWASH', C.blue, C.paper, C.mint, 'wash'),
  urgent: A('URGENT', C.paper, C.red, C.red, 'desk', 'WAIT 3H'),
  bail: A('BAIL', C.night, C.sodiumLight, C.sodium, 'desk', '24 HRS'),
  tax: A('TAX', C.green, C.paper, C.green, 'desk', 'REFUNDS'),
  golf: A('GOLF', C.forest, C.paper, C.green, 'golf'),
  bridal: A('BRIDAL', C.paper, C.neon, C.bone, 'dress'),
  cineplex: A('CINEMA', C.ink, C.sodiumLight, C.red, 'film'),
  pretzel: A('PRETZEL', C.sodium, C.umber, C.sodiumLight, 'pretzel'),
};
for (const [id, base] of [['dojo2', 'dojo'], ['security2', 'security'], ['laundry2', 'laundromat'], ['payday2', 'payday'], ['party2', 'party'], ['grooming2', 'grooming']]) SHOP_ART[id] = SHOP_ART[base];

// cheap deterministic noise
const hash = (a: number, b: number) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

function interior(g: Grid, art: ShopArt) {
  const label = (c: number) => art.label && g.text(art.label, 6, 26, c);
  switch (art.decor) {
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
    case 'desk': // a counter, a monitor, a bell
      label(C.sodiumLight);
      g.block(5, 39, 36, 8, C.umber).hline(5, 39, 36, C.tan);
      g.block(22, 30, 11, 8, C.stone).rect(23, 31, 9, 6, C.navy).px(24, 32, C.mint).px(25, 33, C.mint).rect(26, 38, 3, 1, C.stone);
      g.rect(10, 37, 3, 2, C.sodiumLight);
      break;
    case 'shelves':
      label(C.paper);
      for (const y of [33, 39]) {
        g.hline(5, y + 4, 36, C.stone);
        for (let i = 0; i < 8; i++) g.rect(6 + i * 4, y, 3, 4, [C.red, C.blue, C.sodium, C.green, C.violet][(i + y) % 5]);
      }
      break;
    case 'chair':
      label(C.neon);
      for (const x of [8, 26]) g.block(x, 34, 8, 6, C.neon).rect(x + 1, 40, 6, 2, C.stone).vline(x + 3, 42, 4, C.stone).block(x, 30, 3, 5, C.neon);
      break;
    case 'tan':
      g.text('8 MIN', 8, 26, C.sodiumLight);
      g.block(6, 38, 32, 7, C.sodium).rect(8, 34, 28, 4, C.mint).dither(8, 34, 28, 4, C.paper);
      break;
    case 'mic':
      g.block(26, 28, 13, 9, C.stone).rect(27, 29, 11, 7, C.blue).text('LA', 28, 30, C.paper);
      g.vline(12, 32, 13, C.stone).rect(11, 29, 3, 3, C.ink).hline(9, 45, 7, C.stone);
      g.text('TONIGHT', 6, 26, C.sodiumLight);
      break;
    case 'beds':
      label(C.red);
      g.block(6, 37, 15, 7, C.paper).hline(6, 37, 15, C.blue).block(23, 35, 16, 9, C.paper).hline(23, 35, 16, C.blue).rect(24, 33, 5, 2, C.bone);
      break;
    case 'gym':
      g.text('NO PAIN', 6, 26, C.paper);
      g.hline(8, 38, 26, C.stone).block(6, 35, 3, 7, C.ink).block(33, 35, 3, 7, C.ink).hline(6, 45, 32, C.red);
      break;
    case 'pets':
      g.text('GROOM', 7, 26, C.mint);
      g.block(10, 36, 14, 6, C.bone).block(22, 32, 6, 6, C.bone).px(26, 34, C.ink).vline(11, 42, 3, C.bone).vline(21, 42, 3, C.bone).px(9, 35, C.bone);
      g.block(30, 38, 9, 7, C.mint);
      break;
    case 'phones':
      for (let i = 0; i < 5; i++) g.block(7 + i * 7, 33, 4, 7, [C.night, C.blue, C.stone, C.neon, C.mint][i]).px(8 + i * 7, 34, C.mint);
      g.text('PAGERS', 6, 26, C.mint).hline(5, 41, 36, C.stone);
      break;
    case 'tooth':
      g.text('SMILE', 7, 26, C.teal);
      g.block(14, 31, 12, 8, C.paper).rect(14, 39, 4, 5, C.paper).rect(22, 39, 4, 5, C.paper).hline(14, 31, 12, C.bone);
      break;
    case 'wash':
      g.text('$5 WASH', 6, 26, C.paper);
      for (const x of [9, 30]) g.block(x, 31, 6, 14, C.blue).dither(x, 31, 6, 14, C.mint);
      g.hline(5, 45, 36, C.stone).rect(17, 38, 11, 5, C.red).rect(19, 35, 7, 3, C.red);
      break;
    case 'storage':
      for (let i = 0; i < 3; i++) g.block(6 + i * 12, 31, 10, 15, C.sodium).hline(6 + i * 12, 31, 10, C.sodiumLight).rect(10 + i * 12, 43, 2, 2, C.ink);
      g.text('114', 7, 26, C.paper);
      break;
    case 'golf':
      g.text('TRY IT', 6, 26, C.paper);
      g.dither(5, 30, 36, 16, C.green).vline(30, 30, 15, C.bone).rect(31, 30, 4, 3, C.red).px(14, 41, C.paper);
      break;
    case 'dress':
      g.text('SAY YES', 6, 26, C.neon);
      for (const x of [9, 25]) g.block(x + 2, 30, 6, 5, C.paper).rect(x, 35, 10, 10, C.paper).hline(x, 44, 10, C.bone);
      break;
    case 'film':
      g.text('TONIGHT', 6, 26, C.sodiumLight);
      g.block(7, 32, 14, 12, C.paper).text('?', 12, 35, C.red).block(25, 32, 14, 12, C.paper).text('2', 30, 35, C.blue);
      break;
    case 'pretzel':
      g.text('HOT', 7, 26, C.sodiumLight);
      for (const x of [9, 24]) g.rect(x, 34, 9, 2, C.sodium).rect(x, 34, 2, 7, C.sodium).rect(x + 7, 34, 2, 7, C.sodium).rect(x + 2, 39, 5, 2, C.sodium).px(x + 4, 36, C.sodium);
      g.hline(5, 44, 36, C.stone);
      break;
  }
}

export function facade(kind: string | null, material: Material, seed: number, ghost = 'SHOES'): Grid {
  const g = new Grid(64, 56);
  const m = MATERIAL[material];
  g.rect(0, 0, 64, 50, m.wall);
  if (material === 'lifestyle') for (let y = 4; y < 50; y += 4) g.hline(0, y, 64, C.umber).vline(((y / 4) % 2) * 6 + 3, y, 4, C.umber);
  for (let i = 0; i < 40; i++) g.px(Math.floor(hash(seed, i) * 64), Math.floor(hash(i, seed) * 50), m.grime);
  g.rect(0, 0, 64, 3, m.trim).hline(0, 3, 64, C.ink).vline(0, 0, 50, C.ink);
  // sign band
  const sgn = kind ? SHOP_ART[kind] : null;
  g.boxed(3, 6, 58, 12, sgn ? sgn.bg : C.concrete);
  if (sgn) {
    const x = 32 - Math.floor(textWidth(sgn.text, 2) / 2);
    const dead = Math.floor(hash(seed, 99) * sgn.text.length); // one tube is always out
    [...sgn.text].forEach((ch, i) => g.text(ch, x + i * 8, 7, i === dead && hash(seed, 7) < 0.6 ? sgn.bg === C.sodium ? C.tan : C.concrete : sgn.fg, 2));
  } else {
    g.text(ghost, 32 - Math.floor(textWidth(ghost, 2) / 2), 7, C.stone, 2); // ghost of the last tenant
  }
  // awning
  const aw = sgn ? sgn.awning : C.stone;
  for (let x = 2; x < 62; x++) g.rect(x, 19, 1, 3, Math.floor(x / 4) % 2 ? aw : C.paper);
  for (let x = 2; x < 62; x += 2) g.px(x, 22, Math.floor(x / 4) % 2 ? aw : C.paper);
  g.hline(2, 23, 60, C.ink);
  // window + door
  g.boxed(4, 24, 38, 24, C.night);
  g.rect(44, 24, 16, 26, C.night);
  g.vline(43, 24, 26, C.ink).vline(60, 24, 26, C.ink).hline(43, 23, 18, C.ink);
  if (sgn) {
    interior(g, sgn);
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
    g.text('BYPASS GALLERIA', 40, 26, C.navy);
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
  goodwill: () => new Grid(9, 9).rect(1, 2, 3, 3, C.neon).rect(5, 2, 3, 3, C.neon).rect(2, 5, 5, 2, C.neon).px(4, 7, C.neon).px(2, 3, C.paper).outline(), // a heart, from the comment card
  equity: () => new Grid(9, 9).rect(1, 6, 2, 2, C.mint).rect(4, 4, 2, 4, C.mint).rect(7, 1, 2, 7, C.mint).hline(0, 8, 9, C.stone).outline(), // up and to the right
  asphalt: () => new Grid(9, 9).rect(3, 1, 3, 2, C.sodium).rect(2, 3, 5, 2, C.paper).rect(1, 5, 7, 2, C.sodium).hline(0, 7, 9, C.night),
  lots: () => new Grid(9, 9).vline(1, 0, 9, C.stone).rect(2, 0, 6, 4, C.red).hline(2, 2, 6, C.paper),
  find: () => new Grid(9, 9).vline(4, 0, 9, C.sodiumLight).hline(0, 4, 9, C.sodiumLight).rect(3, 3, 3, 3, C.paper).px(2, 2, C.sodium).px(6, 6, C.sodium).px(6, 2, C.sodium).px(2, 6, C.sodium),
};

// ---- v0.4: sign samples, scaffolding, the boot scene, page textures ----

// just the sign band of a facade, burnt-out tube included

// goes up over a storefront while it's being leased or renovated
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
  // roof sign
  g.vline(110, 44, 12, C.concrete).vline(210, 44, 12, C.concrete);
  g.boxed(66, 10, 188, 34, C.ink).rect(68, 12, 184, 30, C.night).hline(68, 12, 184, C.plum);
  const title = 'STRIP MALL WARLORD';
  const tx = 160 - Math.floor(textWidth(title, 2) / 2);
  [...title].forEach((ch, i) => g.text(ch, tx + i * 8, 16, dawn ? C.concrete : i === 12 ? C.brick : C.neon, 2)); // the W is out; at dawn they're all off
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
