// The whole game uses these 23 colors (+ transparent). See docs/ART_DIRECTION.md.
export const PALETTE = [
  ['clear', '#00000000'],
  ['ink', '#1a1420'],
  ['night', '#24222b'],
  ['asphalt', '#3a3941'],
  ['concrete', '#5f5c66'],
  ['stone', '#8f8a86'],
  ['bone', '#cfc6b0'],
  ['paper', '#f2ecdc'],
  ['sodium', '#e39a3b'],
  ['sodiumLight', '#f6d27a'],
  ['brick', '#7d3528'],
  ['red', '#c4553f'],
  ['navy', '#2c3858'],
  ['blue', '#4d73a6'],
  ['teal', '#367470'],
  ['mint', '#6fb3a2'],
  ['forest', '#3c5a34'],
  ['green', '#6a9150'],
  ['plum', '#4f3a6b'],
  ['violet', '#8261a8'],
  ['skin', '#e2a77f'],
  ['tan', '#a8694a'],
  ['umber', '#5a3a28'],
  ['neon', '#e0588c'],
] as const;

export type ColorName = (typeof PALETTE)[number][0];
export const C = Object.fromEntries(PALETTE.map(([n], i) => [n, i])) as Record<ColorName, number>;
export const HEX = PALETTE.map(([, h]) => h);

// One step darker on the same ramp. Light comes from the sodium lamp, upper left.
const SHADE: Partial<Record<ColorName, ColorName>> = {
  paper: 'bone', bone: 'stone', stone: 'concrete', concrete: 'asphalt', asphalt: 'night', night: 'ink',
  sodiumLight: 'sodium', sodium: 'tan', red: 'brick', brick: 'umber', blue: 'navy', navy: 'ink',
  mint: 'teal', teal: 'navy', green: 'forest', forest: 'ink', violet: 'plum', plum: 'ink',
  skin: 'tan', tan: 'umber', umber: 'ink', neon: 'red',
};
export const shade = (c: number) => (c ? C[SHADE[PALETTE[c][0]] ?? 'ink'] : 0);

export function rgba(c: number): [number, number, number, number] {
  if (!c) return [0, 0, 0, 0];
  const h = HEX[c];
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
}
