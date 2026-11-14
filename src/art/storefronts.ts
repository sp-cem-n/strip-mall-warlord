// Storefront facades (64x56) and the scaffolding that goes up while one is leased.
import { Grid, hash, textWidth } from './grid';
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
