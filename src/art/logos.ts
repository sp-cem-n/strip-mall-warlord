// Plaza night-sky tile. Room logos are PNGs drawn from Toad's mockups: fz-*.png (Fun Zone, layered for the flicker) and bar-logo.png.
import { Grid } from './grid';
import { C } from './palette';

// Transparent tile: a handful of dim 1-px stars, menu-screen sparse, no fill.
export function starsTile() {
  const g = new Grid(128, 64);
  const spots: [number, number, boolean][] = [
    [18, 8, false], [54, 14, false], [97, 6, true], [12, 28, false],
    [71, 22, false], [110, 31, false], [40, 36, false], [88, 44, false],
  ];
  for (const [x, y, plus] of spots) {
    g.px(x, y, plus ? C.bone : C.stone);
    if (plus) g.px(x - 1, y, C.concrete).px(x + 1, y, C.concrete).px(x, y - 1, C.concrete).px(x, y + 1, C.concrete);
  }
  return g;
}
