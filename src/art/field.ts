// The parking-lot battlefields (320x150) and the title scene.
import { BYPASS_SKY as SKY } from '../game/content/bypass';
import { Grid, hash } from './grid';
import { C } from './palette';
import { awning, facade, sign } from './storefronts';
import { titleSign } from './sign';

// ---- the battlefield ----
// Each Route 9 lot: its old gag, one lit sign with a tube out, and one joke prop. Signs and awnings are the storefront pieces.
const SKYLINE: Record<string, (g: Grid) => void> = {
  lot: (g) => {
    for (let x = 0; x < 320; x++) g.vline(x, 34 + Math.floor(hash(x >> 3, 3) * 8), 12, C.forest);
    g.vline(54, 20, 26, C.concrete).boxed(30, 8, 40, 14, C.bone).text('RT 9', 42, 12, C.forest);
    g.vline(250, 18, 28, C.concrete);
    sign(g, 226, 4, 'MOTEL', C.navy, C.sodiumLight, [], 1, 48);
    sign(g, 226, 12, 'NO VACANCY', C.night, C.neon, [0, 1], 1, 48); // the NO went years ago
    g.boxed(118, 36, 11, 6, C.stone).vline(121, 37, 4, C.concrete).vline(124, 37, 4, C.concrete).hline(129, 36, 3, C.concrete).px(119, 43, C.concrete).px(127, 43, C.concrete); // the cart nobody owns, up on the berm
  },
  bigbox: (g) => {
    g.boxed(70, 14, 180, 32, C.concrete).hline(70, 14, 180, C.stone);
    g.text('CIRCUIT', 96, 18, C.red, 2).text('BARN', 160, 18, C.night, 2); // the second word's tubes went first
    sign(g, 200, 30, 'FOODWAY', C.night, C.sodium, [4], 1, 40);
    g.rect(204, 39, 32, 6, C.paper).text('NEW MGMT', 204, 40, C.red); // it keeps changing names
  },
  outlet: (g) => {
    g.boxed(10, 28, 300, 18, C.bone);
    for (let x = 20; x < 300; x += 46) for (let i = 0; i < 10; i++) g.hline(x + i, 27 - i, 20 - i * 2, C.paper);
    sign(g, 104, 31, 'PINE CREEK OUTLETS', C.navy, C.mint, [14]);
    awning(g, 30, 38, 40, C.red);
    g.rect(240, 36, 30, 8, C.red).text('70% OFF', 242, 38, C.paper); // permanently
  },
  lifestyle: (g) => {
    g.boxed(20, 22, 280, 24, C.brick);
    for (let x = 22; x < 300; x += 6) g.vline(x, 24, 20, C.umber);
    g.boxed(150, 2, 20, 44, C.brick).rect(154, 8, 12, 12, C.paper).px(160, 11, C.ink).px(160, 13, C.ink).px(161, 14, C.ink);
    sign(g, 36, 28, 'THE PROMENADE', C.umber, C.sodiumLight, [6]);
    awning(g, 200, 32, 64, C.forest);
    g.text('WAIT 2 HRS', 212, 39, C.paper); // the cheesecake place
  },
  office: (g) => {
    for (const [x, w, h] of [[30, 60, 30], [110, 80, 38], [210, 70, 26]]) {
      g.boxed(x, 46 - h, w, h, C.concrete);
      for (let y = 50 - h; y < 44; y += 5) for (let i = x + 3; i < x + w - 3; i += 6) g.rect(i, y, 3, 2, hash(i, y) < 0.2 ? C.sodiumLight : C.night);
    }
    sign(g, 124, 4, 'SUNRISE', C.night, C.teal, [2]);
    g.rect(214, 26, 62, 7, C.paper).text('SPACE AVAIL', 223, 27, C.navy); // since 1991
  },
  commons: (g) => {
    for (let x = 0; x < 320; x++) g.vline(x, 36 + Math.floor(hash(x >> 2, 17) * 6), 10, C.forest);
    g.boxed(40, 30, 40, 14, C.bone);
    sign(g, 46, 32, 'SALES', C.navy, C.sodiumLight, [2], 1, 28); // the trailer
    g.boxed(186, 6, 120, 30, C.paper).text('PINEWOOD COMMONS', 196, 12, C.teal).text('COMING SOON', 212, 22, C.red).vline(206, 37, 9, C.stone).vline(286, 37, 9, C.stone);
    for (let i = 0; i < 12; i++) g.vline(20 + i * 26, 40, 6, C.neon); // surveyor flags
    g.rect(112, 38, 14, 4, C.sodium).rect(117, 32, 6, 6, C.sodium).rect(118, 33, 4, 3, C.night).rect(111, 42, 16, 3, C.ink).hline(112, 43, 14, C.stone).rect(106, 37, 3, 7, C.stone).hline(109, 40, 3, C.stone).vline(124, 34, 4, C.stone); // a bulldozer, engine running
  },
  // The Bypass, same rule: a lit sign with a tube out (or something just as wrong) and one joke prop. Words live in content/bypass.ts.
  power: (g) => {
    for (const [x, w, label, c] of [[10, 90, 'SPORTS DEPOT', C.blue], [110, 100, 'HOME WAREHOUSE', C.sodium], [220, 90, 'PETZONE', C.red]] as const) g.boxed(x, 20, w, 26, C.stone).hline(x, 20, w, c).text(label, x + 4, 26, c);
    g.vline(190, 8, 12, C.concrete).vline(214, 8, 12, C.concrete);
    sign(g, 184, 2, SKY.power.sign, C.forest, C.paper, SKY.power.out, 1, 36); // the highway sign, floodlit
    g.px(186, 9, C.sodiumLight).px(212, 9, C.sodiumLight);
    for (let i = 0; i < 5; i++) // cones on a pallet in the cart corral, since opening day
      g.rect(52 + i * 4, 39, 3, 4, C.sodium).px(53 + i * 4, 38, C.sodium).hline(52 + i * 4, 41, 3, C.paper);
    g.hline(50, 43, 22, C.umber);
  },
  frontage: (g) => {
    g.boxed(16, 22, 120, 24, C.bone);
    for (let x = 22; x < 130; x += 12) g.rect(x, 28, 7, 6, C.night).rect(x + 2, 36, 4, 9, C.umber);
    g.vline(150, 10, 36, C.concrete);
    sign(g, 140, 3, 'NO', C.night, C.neon, [0, 1], 1, 14); // the NO went first
    sign(g, 154, 3, SKY.frontage.sign, C.navy, C.neon, SKY.frontage.out, 1, 36);
    g.vline(232, 24, 22, C.stone).vline(290, 24, 22, C.stone).boxed(212, 6, 98, 20, C.paper).text(SKY.frontage.board, 216, 9, C.red).text('24 HRS', 216, 17, C.navy);
    g.rect(170, 38, 18, 5, C.red).rect(172, 34, 8, 4, C.red).vline(186, 30, 8, C.stone).hline(186, 30, 5, C.stone).px(173, 44, C.ink).px(184, 44, C.ink); // the tow truck
  },
  campus: (g) => {
    g.boxed(60, 6, 90, 40, C.navy).boxed(170, 14, 90, 32, C.navy);
    for (let y = 8; y < 46; y += 4) g.hline(61, y, 88, C.blue).hline(171, y + 8 > 45 ? 45 : y + 8, 88, C.blue);
    sign(g, 76, 10, SKY.campus.sign, C.navy, C.mint, SKY.campus.out);
    g.rect(150, 40, 20, 6, C.blue).px(160, 36, C.paper).px(159, 37, C.paper).px(161, 37, C.paper); // the fountain, on, aggressively
    for (const x of [146, 152, 173]) g.rect(x, 41, 3, 2, C.bone).px(x + 3, 40, C.ink).px(x + 3, 39, C.bone); // the geese
  },
  county: (g) => {
    g.boxed(30, 14, 100, 32, C.bone);
    for (let x = 36; x < 128; x += 12) g.rect(x, 22, 4, 22, C.paper);
    for (let i = 0; i < 8; i++) g.hline(40 + i * 5, 14 - i, 82 - i * 10, C.bone); // the courthouse pediment
    g.boxed(180, 18, 100, 28, C.concrete).text(SKY.county.bank, 196, 22, C.paper);
    g.vline(250, 6, 12, C.stone);
    sign(g, 238, 0, `${SKY.county.sign}F`, C.night, C.sodium, [], 1, 26); // stuck on 88
    for (let i = 0; i < 12; i++) g.rect(132 + i * 4, 40, 2, 5, [C.red, C.blue, C.green, C.sodium, C.violet][i % 5]).px(132 + i * 4, 39, C.skin); // the DMV line, out the door and around the building
  },
  fairway: (g) => {
    for (let x = 0; x < 320; x++) g.vline(x, 38 + Math.floor(hash(x >> 3, 9) * 4), 8, C.forest);
    for (const x of [20, 70, 120]) g.boxed(x, 26, 36, 14, C.paper).px(x + 18, 20, C.brick).hline(x + 2, 25, 32, C.brick).hline(x + 6, 23, 24, C.brick).hline(x + 12, 21, 12, C.brick);
    sign(g, 170, 4, SKY.fairway.sign, C.forest, C.paper, SKY.fairway.out);
    g.rect(170, 13, 104, 7, C.paper).text(SKY.fairway.sub, 172, 14, C.forest);
    g.boxed(230, 30, 50, 14, C.bone).rect(236, 33, 8, 6, C.night).rect(258, 33, 8, 6, C.night).px(261, 35, C.paper).px(260, 34, C.bone).px(262, 36, C.bone); // the trailer and its window
  },
  towncenter: (g) => {
    g.vline(80, 2, 44, C.sodium).hline(60, 2, 80, C.sodium).vline(130, 2, 10, C.stone); // crane
    g.boxed(150, 18, 140, 28, C.bone);
    sign(g, 160, 22, SKY.towncenter.sign, C.violet, C.paper, SKY.towncenter.out); // PLAY went first
    for (let x = 20; x < 140; x += 10) g.vline(x, 30, 16, C.concrete);
    g.rect(240, 33, 30, 10, C.sodiumLight).rect(244, 35, 4, 8, C.tan).rect(252, 36, 3, 7, C.tan).rect(260, 38, 3, 5, C.tan).px(245, 34, C.tan).px(253, 35, C.tan); // the cardboard family in the model unit
  },
  bargain: (g) => {
    g.boxed(10, 16, 300, 30, C.stone);
    g.text(SKY.bargain.ghost, 30, 20, C.concrete, 2); // the dead anchor, its letters' ghosts
    sign(g, 130, 34, SKY.bargain.sign, C.red, C.paper, SKY.bargain.out);
    g.px(128, 33, C.sodiumLight).px(205, 33, C.sodiumLight);
    g.rect(220, 40, 60, 6, C.navy).dither(220, 40, 60, 6, C.blue);
    for (const x of [230, 252]) g.hline(x, 39, 8, C.stone).vline(x, 39, 3, C.stone).vline(x + 7, 39, 2, C.stone); // carts in the retention pond
  },
  crossroads: (g) => {
    g.boxed(60, 12, 200, 34, C.concrete);
    sign(g, 110, 2, SKY.crossroads.sign, C.ink, C.sodiumLight, SKY.crossroads.out);
    g.boxed(90, 16, 140, 12, C.ink).text(SKY.crossroads.marquee, 96, 19, C.paper);
    for (let x = 90; x < 230; x += 4) g.px(x, 15, (x / 4) % 2 ? C.sodiumLight : C.sodium).px(x, 28, (x / 4) % 2 ? C.sodium : C.sodiumLight); // chasing bulbs
    g.rect(284, 40, 6, 6, C.stone);
    for (let i = 0; i < 30; i++) g.px(286 - i, 40 - i, C.paper).px(287 - i, 40 - i, C.bone); // the searchlight
  },
  galleria: (g) => {
    g.boxed(20, 14, 280, 32, C.paper).hline(20, 14, 280, C.navy);
    g.boxed(140, 2, 40, 44, C.blue).dither(141, 3, 38, 42, C.mint);
    sign(g, 40, 22, SKY.galleria.sign, C.paper, C.navy, SKY.galleria.out, 2);
    g.rect(150, 36, 4, 3, C.bone).px(153, 35, C.bone).vline(151, 39, 3, C.bone).vline(152, 30, 6, C.sodium); // the carousel horse behind the glass
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
  const sign = titleSign(dawn ? 6 : -1, dawn ? 1 << 4 : 0);
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
