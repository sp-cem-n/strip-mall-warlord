// Renders every sprite plus the palette into docs/spritesheet.png (no dependencies).
// Usage: bun scripts/spritesheet.ts [out=docs/spritesheet.png]
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { BATTLERS, REGIONS, SHOP_LIST } from '../src/game/defs';
import { Grid } from '../src/art/grid';
import { C, PALETTE } from '../src/art/palette';
import { crewSprite, enemySprite } from '../src/art/people';
import { battlefield, bootScene } from '../src/art/field';
import * as S from '../src/art/frames';
import { buttonFrame, ICONS, panelFrame } from '../src/art/frames';
import { facade, scaffold } from '../src/art/storefronts';

const out = process.argv[2] ?? 'docs/spritesheet.png';
const W = 660;
const lots = REGIONS.flatMap((r) => r.lots);
const sheet = new Grid(W, 1700);
sheet.rect(0, 0, W, sheet.h, C.night);
const label = (t: string, x: number, y: number) => sheet.text(t, x, y, C.bone);
const scaled = (g: Grid, k: number) => {
  const o = new Grid(g.w * k, g.h * k);
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.data[y * o.w + x] = g.get(Math.floor(x / k), Math.floor(y / k));
  return o;
};

let y = 6;
label('STRIP MALL WARLORD - SPRITES + PALETTE (23 COLORS)', 6, y);
y += 10;
PALETTE.slice(1).forEach(([n], i) => sheet.rect(6 + i * 28, y, 26, 14, C[n]).text(String(i + 1), 8 + i * 28, y + 16, C.stone));
y += 30;

label(`CREW 16X24 (SHOWN 2X): ${Object.keys(BATTLERS).length} BATTLERS, BOTH CREWS, BOSSES WHO JOIN INCLUDED`, 6, y);
y += 8;
Object.keys(BATTLERS).forEach((id, i) => {
  const x = 6 + (i % 16) * 40;
  const yy = y + Math.floor(i / 16) * 60;
  sheet.blit(scaled(crewSprite(id), 2), x, yy);
  sheet.text(id.slice(0, 8), x, yy + 50, C.stone);
});
y += 132;
label('ENEMIES (FLIPPED)', 6, y);
y += 8;
const regulars = [...new Set(lots.flatMap((z) => z.regulars.map((e) => e.name)))];
regulars.forEach((n, i) => sheet.blit(scaled(enemySprite(n), 2), 6 + (i % 16) * 40, y + Math.floor(i / 16) * 54));
y += 108;
label('BOSSES (3X)', 6, y);
y += 8;
lots.forEach((z, i) => sheet.blit(scaled(enemySprite(z.boss.name), 3), 6 + (i % 10) * 60, y + Math.floor(i / 10) * 78));
y += 164;

label(`STOREFRONTS 64X56: ALL ${SHOP_LIST.length}, IN THEIR LOT MATERIALS (+ VACANT, SCAFFOLDING)`, 6, y);
y += 8;
const mats = ['home', 'bigbox', 'outlet', 'office', 'lifestyle'] as const;
[...SHOP_LIST.map((s) => s.id), null, 'scaffold'].forEach((id, i) => {
  const sh = SHOP_LIST.find((x) => x.id === id);
  const x = 6 + (i % 9) * 72;
  const yy = y + Math.floor(i / 9) * 62;
  if (id === 'scaffold') sheet.blit(facade('dojo', 'home', 1), x, yy).blit(scaffold(), x, yy);
  else sheet.blit(facade(id, sh ? (sh.region === 1 ? 'bypass' : mats[sh.zone]) : 'home', i + 1), x, yy);
});
y += 62 * 4 + 6;

label('BATTLEFIELDS 320X150 (SHOWN 1X): ROUTE 9 + THE BYPASS', 6, y);
y += 8;
lots.forEach((z, i) => sheet.blit(battlefield(z.id), 6 + (i % 2) * 326, y + Math.floor(i / 2) * 154));
y += 154 * 5 + 6;
label('UI FRAMES + ICONS (4X)', 6, y);
sheet.blit(scaled(panelFrame(), 4), 130, y - 2).blit(scaled(buttonFrame(), 4), 184, y - 2);
Object.values(ICONS).forEach((f, i) => sheet.blit(scaled(f(), 4), 220 + i * 40, y - 2));
y += 44;
label('TITLE SCENE + THE DAWN WIN CARD 320X180 (1X)', 6, y);
y += 8;
sheet.blit(bootScene(['pawn', 'dojo', 'laundromat', 'vape']), 6, y).blit(bootScene(['pawn', 'dojo', 'laundromat', 'vape'], true), 332, y);
y += 186;
let fx = 6;
for (const f of [S.glassFrame, S.brickFrame, S.pylonFrame, S.printerFrame, S.binderFrame, S.tagFrame, () => S.signFrame(C.sodium), S.cinderTile, S.roadTile, S.tearTile]) {
  const g = scaled(f(), 3);
  sheet.blit(g, fx, y);
  fx += g.w + 8;
}

// ---- minimal PNG encoder ----
function png(g: Grid, k = 2): Buffer {
  const w = g.w * k;
  const h = g.h * k;
  const rgba = g.toRGBA();
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let yy = 0; yy < h; yy++) {
    raw[yy * (w * 4 + 1)] = 0;
    for (let xx = 0; xx < w; xx++) {
      const si = (Math.floor(yy / k) * g.w + Math.floor(xx / k)) * 4;
      const di = yy * (w * 4 + 1) + 1 + xx * 4;
      raw[di] = rgba[si];
      raw[di + 1] = rgba[si + 1];
      raw[di + 2] = rgba[si + 2];
      raw[di + 3] = rgba[si + 3] || 255;
    }
  }
  const crcT = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b: Buffer) => {
    let c = 0xffffffff;
    for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

writeFileSync(out, png(sheet, 2));
console.log('wrote', out, `${sheet.w * 2}x${sheet.h * 2}`);
