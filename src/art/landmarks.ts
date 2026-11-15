// Tiny plaza icons for purchased landmarks. One per type; the tooltip carries the count.
import { Grid } from './grid';
import { C } from './palette';

export function landmarkSprite(id: string): Grid {
  if (id === 'billboard') return billboard();
  if (id === 'tower') return tower();
  return pylon();
}

// A faded roadside board on two posts, 1991 ad still hanging on.
function billboard(): Grid {
  const g = new Grid(20, 24);
  g.rect(2, 1, 16, 10, C.ink);
  g.rect(3, 2, 14, 8, C.navy);
  g.rect(4, 3, 6, 5, C.sodium);
  g.rect(11, 4, 5, 3, C.red);
  g.hline(3, 2, 14, C.stone);
  g.vline(4, 11, 11, C.concrete);
  g.vline(15, 11, 11, C.concrete);
  g.px(4, 21, C.ink).px(15, 21, C.ink);
  return g.outline();
}

// A fat tank on stilts. PINEWOOD, in rusted letters, painted on the drum.
function tower(): Grid {
  const g = new Grid(20, 24);
  g.rect(5, 2, 10, 8, C.stone);
  g.rect(4, 3, 12, 6, C.concrete);
  g.hline(5, 2, 10, C.bone);
  g.rect(8, 1, 4, 2, C.concrete);
  g.px(9, 0, C.red).px(10, 0, C.red);
  g.text('P', 6, 5, C.brick);
  g.text('W', 11, 5, C.brick);
  g.vline(6, 10, 12, C.concrete);
  g.vline(13, 10, 12, C.concrete);
  g.vline(9, 10, 6, C.stone);
  g.hline(6, 16, 8, C.stone);
  g.px(6, 21, C.ink).px(13, 21, C.ink);
  return g.outline();
}

// A second, quieter sign by the entrance: a short sodium cabinet on two posts.
function pylon(): Grid {
  const g = new Grid(20, 24);
  g.rect(5, 1, 10, 12, C.ink);
  g.rect(6, 2, 8, 3, C.sodium);
  g.rect(6, 6, 8, 6, C.navy);
  g.hline(6, 2, 8, C.sodiumLight);
  g.px(7, 8, C.red).px(12, 8, C.red);
  g.hline(7, 10, 6, C.mint);
  g.vline(7, 13, 9, C.concrete);
  g.vline(12, 13, 9, C.concrete);
  g.px(7, 21, C.ink).px(12, 21, C.ink);
  return g.outline();
}
