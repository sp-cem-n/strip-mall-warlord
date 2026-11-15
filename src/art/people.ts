// Crew and enemy sprites: 16x24 cells, drawn facing right, auto-outlined. Enemies are flipped.
import { REGIONS } from '../game/defs';
import { Grid } from './grid';
import { C } from './palette';

interface Look {
  skin?: number;
  hair?: number | null;
  shirt: number;
  sleeves?: number; // defaults to shirt; skin = short sleeves
  pants: number;
  shoes?: number;
  wide?: boolean; // bouncers and bosses
  belly?: boolean;
  extra?: (g: Grid) => void;
}

export function person(l: Look): Grid {
  const g = new Grid(16, 24);
  const skin = l.skin ?? C.skin;
  const x0 = l.wide ? 3 : 4;
  const tw = l.wide ? 10 : 8;
  // legs + shoes
  g.block(5, 17, 2, 5, l.pants).block(9, 17, 2, 5, l.pants);
  g.hline(4, 22, 3, l.shoes ?? C.night).hline(9, 22, 3, l.shoes ?? C.night);
  // torso and arms
  g.block(x0, 10, tw, 7, l.shirt);
  if (l.belly) g.block(x0 + 1, 14, tw, 3, l.shirt);
  const sl = l.sleeves ?? l.shirt;
  g.vline(x0 - 1, 10, 6, sl).vline(x0 + tw, 10, 6, sl);
  if (sl === skin) g.vline(x0 - 1, 10, 2, l.shirt).vline(x0 + tw, 10, 2, l.shirt);
  g.px(x0 - 1, 16, skin).px(x0 + tw, 16, skin);
  // head, eye, hair
  g.block(5, 3, 6, 7, skin);
  g.px(9, 6, C.ink);
  if (l.hair) g.hline(5, 2, 6, l.hair).hline(5, 3, 6, l.hair).vline(5, 4, 2, l.hair);
  l.extra?.(g);
  return g.outline();
}

const tie = (c: number) => (g: Grid) => g.vline(8, 10, 5, c).px(8, 10, C.paper).px(7, 10, C.paper);

const badge = (g: Grid) => g.px(6, 11, C.sodiumLight);
const cap = (c: number) => (g: Grid) => g.hline(5, 2, 7, c).hline(10, 3, 3, c);
const clipboard = (g: Grid) => g.rect(12, 12, 4, 5, C.umber).rect(13, 13, 2, 3, C.paper);
const vest = (c: number) => (g: Grid) => g.rect(4, 10, 2, 7, c).rect(10, 10, 2, 7, c);

// Crew, by battler id. Bosses who join use their enemy look, facing right.
export const CREW_LOOKS: Record<string, Look> = {
  bouncer: { skin: C.tan, hair: null, shirt: C.red, sleeves: C.tan, pants: C.night, wide: true, extra: (g) => g.hline(6, 9, 5, C.umber).hline(5, 11, 4, C.paper) },
  hustler: { hair: C.violet, shirt: C.violet, pants: C.navy, shoes: C.paper, extra: (g) => g.vline(10, 3, 2, C.violet).rect(12, 14, 2, 3, C.ink).px(7, 12, C.plum).px(8, 12, C.plum) },
  medic: { hair: C.umber, shirt: C.blue, pants: C.blue, shoes: C.paper, extra: (g) => g.rect(6, 11, 3, 3, C.paper).px(7, 11, C.red).hline(6, 12, 3, C.red).px(7, 13, C.red).rect(12, 15, 2, 3, C.mint) },
  fixer: { hair: C.night, shirt: C.umber, pants: C.navy, extra: (g) => g.vline(8, 10, 6, C.bone).px(7, 11, C.sodiumLight).px(8, 12, C.sodiumLight).px(9, 11, C.sodiumLight).px(12, 16, C.sodiumLight) },
  lawyer: { hair: C.umber, shirt: C.green, pants: C.forest, extra: (g) => { tie(C.red)(g); g.rect(12, 16, 4, 4, C.umber).hline(13, 15, 2, C.ink); } },
  watchman: { hair: C.stone, shirt: C.navy, pants: C.navy, belly: true, extra: (g) => { cap(C.navy)(g); badge(g); g.rect(12, 13, 2, 5, C.sodiumLight).px(12, 12, C.paper); } }, // flashlight
  latefee: { hair: C.umber, shirt: C.blue, sleeves: C.skin, pants: C.night, extra: (g) => g.rect(5, 11, 6, 2, C.sodium).rect(12, 14, 3, 4, C.night).hline(12, 15, 3, C.paper) }, // a tape
  tokenkid: { hair: C.sodium, shirt: C.mint, sleeves: C.skin, pants: C.blue, shoes: C.red, extra: (g) => { cap(C.red)(g); g.rect(12, 14, 2, 4, C.bone).px(12, 18, C.stone); } }, // the sock of quarters
  nailtech: { hair: C.night, shirt: C.neon, pants: C.night, shoes: C.neon, extra: (g) => g.hline(5, 2, 6, C.night).vline(11, 3, 5, C.night).px(12, 16, C.neon) },
  tanning: { skin: C.sodium, hair: C.sodiumLight, shirt: C.paper, sleeves: C.sodium, pants: C.mint, extra: (g) => g.hline(6, 5, 4, C.ink) }, // goggles
  karaoke: { hair: C.violet, shirt: C.plum, pants: C.night, extra: (g) => { g.vline(8, 10, 6, C.sodiumLight); g.rect(12, 11, 2, 2, C.stone).vline(12, 13, 4, C.ink); } },
  notary: { hair: C.stone, shirt: C.paper, pants: C.concrete, extra: (g) => { tie(C.navy)(g); g.rect(12, 15, 4, 2, C.red).vline(13, 12, 3, C.umber); } }, // the stamp
  driving: { hair: C.tan, shirt: C.sodiumLight, pants: C.concrete, extra: (g) => { clipboard(g); g.hline(5, 6, 5, C.ink); } },
  groomer: { hair: C.tan, shirt: C.mint, pants: C.navy, extra: (g) => g.rect(11, 18, 5, 3, C.bone).rect(14, 16, 2, 2, C.bone).px(15, 16, C.ink).vline(11, 21, 1, C.bone) }, // the dog
  copyguy: { hair: C.umber, shirt: C.blue, sleeves: C.paper, pants: C.stone, extra: (g) => g.rect(12, 13, 4, 5, C.paper).hline(12, 14, 4, C.stone).px(6, 11, C.paper) },
  hygienist: { hair: C.umber, shirt: C.mint, pants: C.mint, shoes: C.paper, extra: (g) => g.rect(5, 7, 6, 3, C.paper).vline(13, 12, 5, C.stone) },
  mattress: { skin: C.tan, hair: C.night, shirt: C.blue, pants: C.navy, wide: true, belly: true, extra: (g) => g.rect(5, 12, 6, 3, C.paper).text('S', 6, 12, C.red) },
  kiosk: { hair: C.night, shirt: C.night, pants: C.night, shoes: C.paper, extra: (g) => g.vline(4, 4, 4, C.stone).rect(12, 12, 2, 4, C.mint).px(9, 4, C.ink) }, // headset
  trainer: { skin: C.tan, hair: C.sodium, shirt: C.red, sleeves: C.tan, pants: C.night, shoes: C.paper, extra: (g) => g.vline(12, 9, 1, C.paper).rect(12, 16, 4, 2, C.stone) },
  clown: { skin: C.paper, hair: C.red, shirt: C.violet, pants: C.sodium, shoes: C.red, belly: true, extra: (g) => g.px(10, 7, C.red).px(5, 4, C.red).px(10, 4, C.red).rect(6, 12, 2, 2, C.sodiumLight).rect(9, 14, 2, 2, C.mint) },
  auction: { hair: C.tan, shirt: C.sodium, sleeves: C.skin, pants: C.navy, extra: (g) => { cap(C.sodium)(g); g.rect(12, 14, 4, 4, C.umber).vline(13, 11, 3, C.stone); } }, // bolt cutters
  detailer: { hair: C.night, shirt: C.mint, pants: C.navy, shoes: C.paper, extra: (g) => g.rect(12, 14, 4, 3, C.sodiumLight).px(6, 11, C.paper) },
  nurse: { hair: C.umber, shirt: C.teal, pants: C.teal, shoes: C.paper, extra: (g) => g.vline(7, 10, 4, C.stone).px(7, 14, C.stone).rect(12, 14, 3, 4, C.paper) },
  bartender: { skin: C.skin, hair: C.umber, shirt: C.paper, sleeves: C.paper, pants: C.ink, wide: true, extra: (g) => g.rect(5, 13, 7, 5, C.ink).hline(5, 9, 7, C.umber).px(12, 14, C.paper) }, // apron, mustache, a bar rag
  bondsman: { skin: C.tan, hair: C.night, shirt: C.night, sleeves: C.night, pants: C.concrete, wide: true, belly: true, extra: (g) => g.hline(5, 2, 7, C.night).px(7, 11, C.sodiumLight).px(8, 12, C.sodiumLight).px(9, 11, C.sodiumLight) }, // gold chain
  preparer: { hair: C.stone, shirt: C.paper, pants: C.concrete, extra: (g) => { tie(C.green)(g); g.rect(12, 12, 4, 5, C.bone).hline(12, 13, 4, C.green); g.hline(6, 6, 4, C.ink); } },
  golfpro: { hair: C.sodium, shirt: C.paper, pants: C.green, shoes: C.paper, extra: (g) => { cap(C.paper)(g); g.vline(13, 8, 10, C.stone).rect(12, 18, 3, 1, C.stone); } },
  planner: { hair: C.night, shirt: C.paper, pants: C.night, extra: (g) => { clipboard(g); g.px(6, 11, C.neon); } },
  usher: { hair: C.umber, shirt: C.red, pants: C.night, extra: (g) => g.px(6, 11, C.sodiumLight).px(9, 11, C.sodiumLight).rect(12, 13, 2, 4, C.night).px(12, 12, C.paper) },
  sal: { skin: C.tan, hair: C.paper, shirt: C.bone, sleeves: C.bone, pants: C.umber, wide: true, belly: true, extra: (g) => g.hline(5, 2, 6, C.tan).px(5, 2, C.paper).px(10, 2, C.paper).rect(12, 15, 3, 3, C.sodiumLight).px(13, 16, C.ink) }, // cardigan, the ring of keys
  pretzel: { hair: C.tan, shirt: C.sodium, pants: C.navy, extra: (g) => { cap(C.red)(g); g.rect(12, 13, 4, 3, C.sodium).px(13, 14, C.umber); } },
};

export const ENEMY_LOOKS: Record<string, Look> = {
  'Rent-a-Cop': { hair: C.navy, shirt: C.blue, pants: C.navy, extra: (g) => g.hline(10, 4, 2, C.navy).px(6, 11, C.sodiumLight) },
  'Lot Attendant': { hair: C.umber, shirt: C.bone, sleeves: C.bone, pants: C.navy, extra: (g) => g.rect(4, 10, 3, 7, C.sodium).rect(9, 10, 3, 7, C.sodium).hline(4, 14, 8, C.sodiumLight) },
  'Cart Wrangler': { hair: C.tan, shirt: C.red, sleeves: C.skin, pants: C.night, extra: (g) => { vest(C.sodium)(g); g.rect(12, 15, 4, 3, C.stone); } },
  'Loss Prevention Associate': { hair: C.tan, shirt: C.red, pants: C.bone, extra: (g) => g.vline(7, 10, 4, C.paper).rect(7, 14, 2, 2, C.paper) },
  Greeter: { hair: C.stone, shirt: C.blue, pants: C.concrete, belly: true, extra: (g) => { vest(C.navy)(g); g.rect(6, 11, 3, 2, C.paper).hline(6, 7, 3, C.ink); } },
  'Rent-a-Cop (Senior)': { hair: C.stone, shirt: C.blue, pants: C.navy, belly: true, extra: (g) => g.hline(10, 4, 2, C.navy).hline(7, 8, 3, C.stone).px(6, 11, C.sodiumLight) },
  'Code Enforcement Officer': { hair: C.umber, shirt: C.teal, pants: C.concrete, extra: (g) => g.rect(11, 12, 4, 5, C.umber).rect(12, 13, 2, 3, C.paper) },
  'HOA President': { hair: C.stone, shirt: C.violet, pants: C.bone, extra: (g) => g.hline(5, 3, 7, C.mint).hline(10, 4, 2, C.mint).vline(8, 10, 6, C.paper) },
  'Mall Walker': { hair: C.paper, shirt: C.mint, sleeves: C.mint, pants: C.violet, shoes: C.paper, extra: (g) => g.hline(5, 4, 6, C.neon) }, // sweatband
  'Badge-Reader Guard': { hair: C.night, shirt: C.navy, pants: C.navy, extra: (g) => { badge(g); g.rect(12, 13, 3, 4, C.stone).px(13, 14, C.red); } },
  'Parking Validator': { hair: C.umber, shirt: C.bone, pants: C.navy, extra: (g) => { tie(C.teal)(g); g.rect(12, 14, 4, 2, C.red); } },
  'Facilities Guy': { hair: C.stone, shirt: C.concrete, pants: C.navy, belly: true, extra: (g) => g.rect(4, 15, 8, 2, C.umber).rect(12, 12, 2, 6, C.sodium) }, // tool belt, wrench
  'Developer Private Security': { hair: C.night, shirt: C.night, pants: C.night, extra: (g) => { tie(C.ink)(g); g.hline(7, 6, 4, C.ink).px(5, 7, C.paper); } },
  'Placemaking Consultant': { hair: C.umber, shirt: C.bone, pants: C.navy, extra: (g) => g.vline(7, 10, 6, C.teal).vline(8, 10, 6, C.teal).rect(12, 13, 3, 4, C.ink).px(13, 14, C.mint) },
  Valet: { hair: C.night, shirt: C.red, pants: C.night, extra: (g) => { vest(C.night)(g); g.px(13, 15, C.sodiumLight).px(14, 16, C.sodiumLight); } },
  'Leasing Agent': { hair: C.sodiumLight, shirt: C.teal, pants: C.night, extra: (g) => g.rect(12, 12, 4, 5, C.paper).hline(12, 13, 4, C.teal) },
  'Survey Crew': { hair: C.tan, shirt: C.sodium, pants: C.concrete, extra: (g) => { cap(C.paper)(g); vest(C.sodiumLight)(g); g.vline(13, 6, 14, C.red); } },
  'Bulldozer Operator': { skin: C.tan, hair: C.night, shirt: C.sodium, sleeves: C.tan, pants: C.navy, wide: true, extra: (g) => { cap(C.sodiumLight)(g); g.hline(5, 11, 6, C.umber); } },
  'Power Center Security': { hair: C.night, shirt: C.paper, pants: C.navy, extra: (g) => { cap(C.navy)(g); badge(g); } },
  'Inventory Specialist': { hair: C.umber, shirt: C.blue, pants: C.concrete, extra: (g) => { vest(C.red)(g); g.rect(12, 13, 3, 4, C.night).px(13, 14, C.red); } },
  'Sweeper Truck Driver': { skin: C.tan, hair: C.stone, shirt: C.concrete, sleeves: C.tan, pants: C.navy, wide: true, belly: true, extra: (g) => vest(C.sodiumLight)(g) },
  'Campus Security': { hair: C.stone, shirt: C.navy, pants: C.concrete, extra: (g) => { cap(C.navy)(g); badge(g); g.rect(12, 12, 2, 5, C.night); } },
  'Synergy Consultant': { hair: C.sodium, shirt: C.paper, pants: C.navy, extra: (g) => { tie(C.violet)(g); g.rect(12, 13, 4, 3, C.stone); } },
  'Shuttle Driver': { hair: C.night, shirt: C.blue, sleeves: C.skin, pants: C.night, belly: true, extra: (g) => cap(C.blue)(g) },
  'Construction Flagger': { skin: C.tan, hair: C.night, shirt: C.sodium, pants: C.navy, wide: true, extra: (g) => { cap(C.sodiumLight)(g); g.rect(12, 6, 4, 4, C.red).vline(13, 10, 6, C.stone); } }, // SLOW paddle
  'Brand Ambassador': { hair: C.sodiumLight, shirt: C.neon, pants: C.paper, shoes: C.paper, extra: (g) => g.rect(12, 13, 4, 5, C.bone).hline(12, 13, 4, C.neon) },
  'Render Artist': { hair: C.night, shirt: C.ink, pants: C.ink, extra: (g) => g.hline(5, 6, 6, C.ink).rect(12, 11, 4, 6, C.paper).px(13, 13, C.green).px(14, 14, C.blue) },
  'Mall Cop (Segway)': { hair: C.navy, shirt: C.blue, pants: C.navy, extra: (g) => { cap(C.navy)(g); badge(g); g.hline(3, 23, 10, C.stone).vline(12, 12, 11, C.stone); } },
  'Kiosk Manager': { hair: C.night, shirt: C.night, pants: C.concrete, extra: (g) => { tie(C.mint)(g); g.vline(4, 4, 4, C.stone); } },
  'Escalator Tech': { skin: C.tan, hair: C.umber, shirt: C.concrete, sleeves: C.tan, pants: C.navy, wide: true, extra: (g) => g.rect(3, 15, 10, 2, C.umber).rect(12, 12, 2, 6, C.stone) },
  // bosses
  'Night Shift Supervisor': { hair: C.stone, shirt: C.blue, pants: C.navy, wide: true, belly: true, extra: (g) => g.hline(10, 4, 2, C.navy).rect(12, 12, 4, 5, C.umber).rect(13, 13, 2, 3, C.paper).px(6, 11, C.sodiumLight) },
  'District Loss Prevention Manager': { hair: C.tan, shirt: C.red, pants: C.bone, wide: true, belly: true, extra: (g) => { tie(C.navy)(g); g.hline(5, 3, 7, C.red).hline(10, 4, 2, C.red); } },
  'Outlet Mall General Manager': { hair: C.umber, shirt: C.navy, pants: C.navy, wide: true, extra: (g) => { tie(C.mint)(g); g.px(6, 14, C.red).px(7, 15, C.mint).px(9, 15, C.sodiumLight).px(10, 14, C.paper); } },
  'Building Manager': { hair: C.stone, shirt: C.teal, pants: C.concrete, wide: true, belly: true, extra: (g) => g.rect(12, 14, 3, 3, C.sodiumLight).px(13, 13, C.sodiumLight).hline(5, 2, 7, C.stone) }, // keys
  'Regional Property Manager': { hair: C.night, shirt: C.stone, pants: C.concrete, wide: true, extra: (g) => { tie(C.red)(g); g.rect(13, 16, 3, 4, C.umber).px(13, 15, C.sodiumLight).hline(5, 2, 7, C.night); } },
  'The Developer': { hair: C.paper, shirt: C.ink, pants: C.ink, wide: true, extra: (g) => { tie(C.sodium)(g); g.rect(12, 9, 4, 9, C.paper).hline(12, 11, 4, C.teal).hline(12, 14, 4, C.green); } }, // the rendering
  'Leasing Director': { hair: C.night, shirt: C.navy, pants: C.navy, wide: true, extra: (g) => { tie(C.sodium)(g); g.rect(12, 12, 4, 6, C.paper); } },
  'VP of Real Estate Strategy': { hair: C.stone, shirt: C.paper, sleeves: C.paper, pants: C.navy, wide: true, extra: (g) => { tie(C.blue)(g); g.vline(4, 4, 4, C.stone).px(12, 16, C.night); } },
  'Managing Partner': { hair: C.paper, shirt: C.navy, pants: C.bone, wide: true, belly: true, extra: (g) => g.rect(5, 2, 6, 2, C.paper).hline(4, 3, 8, C.navy).px(6, 11, C.sodiumLight) }, // captain's hat
  'The Chairman': { hair: C.stone, shirt: C.ink, pants: C.ink, wide: true, belly: true, extra: (g) => { tie(C.red)(g); g.vline(13, 12, 10, C.umber).px(12, 11, C.sodiumLight); } }, // cane
};

const BOSS_NAME: Record<string, string> = Object.fromEntries(REGIONS.flatMap((r) => r.lots.map((l) => [l.boss.joins, l.boss.name])));
export const crewSprite = (id: string) => person(CREW_LOOKS[id] ?? ENEMY_LOOKS[BOSS_NAME[id]] ?? CREW_LOOKS.fixer);
export const enemySprite = (name: string) => person(ENEMY_LOOKS[name] ?? ENEMY_LOOKS['Rent-a-Cop']).flip();
