// UI frames, page tiles and icons, installed as CSS variables by ui/art.ts.
import { Grid, hash } from './grid';
import { lotNoise } from './field';
import { C } from './palette';

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
  ticket: () => new Grid(9, 9).rect(0, 2, 9, 5, C.sodiumLight).rect(2, 3, 5, 3, C.sodium).px(0, 4, C.night).px(8, 4, C.night).vline(4, 3, 3, C.sodiumLight).outline(), // a prize ticket, torn off the strip
  find: () => new Grid(9, 9).vline(4, 0, 9, C.sodiumLight).hline(0, 4, 9, C.sodiumLight).rect(3, 3, 3, 3, C.paper).px(2, 2, C.sodium).px(6, 6, C.sodium).px(6, 2, C.sodium).px(2, 6, C.sodium),
};

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
