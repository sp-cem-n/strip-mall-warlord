// Crew and enemy sprites: 16x24 cells, drawn facing right, auto-outlined. Enemies are flipped.
import type { FighterKind } from '../game/defs';
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

export const CREW_LOOKS: Record<FighterKind, Look> = {
  bouncer: { skin: C.tan, hair: null, shirt: C.red, sleeves: C.tan, pants: C.night, wide: true, extra: (g) => g.hline(6, 9, 5, C.umber).hline(5, 11, 4, C.paper) },
  hustler: { hair: C.violet, shirt: C.violet, pants: C.navy, shoes: C.paper, extra: (g) => g.vline(10, 3, 2, C.violet).rect(12, 14, 2, 3, C.ink).px(7, 12, C.plum).px(8, 12, C.plum) },
  medic: { hair: C.umber, shirt: C.blue, pants: C.blue, shoes: C.paper, extra: (g) => g.rect(6, 11, 3, 3, C.paper).px(7, 11, C.red).hline(6, 12, 3, C.red).px(7, 13, C.red).rect(12, 15, 2, 3, C.mint) },
  fixer: { hair: C.night, shirt: C.umber, pants: C.navy, extra: (g) => g.vline(8, 10, 6, C.bone).px(7, 11, C.sodiumLight).px(8, 12, C.sodiumLight).px(9, 11, C.sodiumLight).px(12, 16, C.sodiumLight) },
  lawyer: { hair: C.umber, shirt: C.green, pants: C.forest, extra: (g) => { tie(C.red)(g); g.rect(12, 16, 4, 4, C.umber).hline(13, 15, 2, C.ink); } },
};

export const ENEMY_LOOKS: Record<string, Look> = {
  'Rent-a-Cop': { hair: C.navy, shirt: C.blue, pants: C.navy, extra: (g) => g.hline(10, 4, 2, C.navy).px(6, 11, C.sodiumLight) },
  'Lot Attendant': { hair: C.umber, shirt: C.bone, sleeves: C.bone, pants: C.navy, extra: (g) => g.rect(4, 10, 3, 7, C.sodium).rect(9, 10, 3, 7, C.sodium).hline(4, 14, 8, C.sodiumLight) },
  'Loss Prevention Associate': { hair: C.tan, shirt: C.red, pants: C.bone, extra: (g) => g.vline(7, 10, 4, C.paper).rect(7, 14, 2, 2, C.paper) },
  'Rent-a-Cop (Senior)': { hair: C.stone, shirt: C.blue, pants: C.navy, belly: true, extra: (g) => g.hline(10, 4, 2, C.navy).hline(7, 8, 3, C.stone).px(6, 11, C.sodiumLight) },
  'Code Enforcement Officer': { hair: C.umber, shirt: C.teal, pants: C.concrete, extra: (g) => g.rect(11, 12, 4, 5, C.umber).rect(12, 13, 2, 3, C.paper) },
  'HOA President': { hair: C.stone, shirt: C.violet, pants: C.bone, extra: (g) => g.hline(5, 3, 7, C.mint).hline(10, 4, 2, C.mint).vline(8, 10, 6, C.paper) },
  'Developer Private Security': { hair: C.night, shirt: C.night, pants: C.night, extra: (g) => { tie(C.ink)(g); g.hline(7, 6, 4, C.ink).px(5, 7, C.paper); } },
  'Placemaking Consultant': { hair: C.umber, shirt: C.bone, pants: C.navy, extra: (g) => g.vline(7, 10, 6, C.teal).vline(8, 10, 6, C.teal).rect(12, 13, 3, 4, C.ink).px(13, 14, C.mint) },
  // bosses
  'Night Shift Supervisor': { hair: C.stone, shirt: C.blue, pants: C.navy, wide: true, belly: true, extra: (g) => g.hline(10, 4, 2, C.navy).rect(12, 12, 4, 5, C.umber).rect(13, 13, 2, 3, C.paper).px(6, 11, C.sodiumLight) },
  'District Loss Prevention Manager': { hair: C.tan, shirt: C.red, pants: C.bone, wide: true, belly: true, extra: (g) => { tie(C.navy)(g); g.hline(5, 3, 7, C.red).hline(10, 4, 2, C.red); } },
  'Outlet Mall General Manager': { hair: C.umber, shirt: C.navy, pants: C.navy, wide: true, extra: (g) => { tie(C.mint)(g); g.px(6, 14, C.red).px(7, 15, C.mint).px(9, 15, C.sodiumLight).px(10, 14, C.paper); } },
  'Regional Property Manager': { hair: C.night, shirt: C.stone, pants: C.concrete, wide: true, extra: (g) => { tie(C.red)(g); g.rect(13, 16, 3, 4, C.umber).px(13, 15, C.sodiumLight).hline(5, 2, 7, C.night); } },
};

export const crewSprite = (k: FighterKind) => person(CREW_LOOKS[k]);
export const enemySprite = (name: string) => person(ENEMY_LOOKS[name] ?? ENEMY_LOOKS['Rent-a-Cop']).flip();
