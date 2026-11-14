// Renders every sprite plus the palette into docs/spritesheet.png (no dependencies).
// Usage: bun scripts/spritesheet.ts [out=docs/spritesheet.png]
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { ZONES, type FighterKind, SHOP_ORDER } from '../src/game/defs';
import { Grid } from '../src/art/grid';
import { C, PALETTE } from '../src/art/palette';
import { crewSprite, enemySprite } from '../src/art/people';
import * as S from '../src/art/scenes';
import { battlefield, buttonFrame, facade, ICONS, panelFrame, type Material } from '../src/art/scenes';

const out = process.argv[2] ?? 'docs/spritesheet.png';
const W = 660;
const sheet = new Grid(W, 940);
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

label('CREW 16X24 (SHOWN 2X)', 6, y);
y += 8;
(['bouncer', 'hustler', 'medic', 'fixer', 'lawyer'] as FighterKind[]).forEach((k, i) => {
  sheet.blit(scaled(crewSprite(k), 2), 6 + i * 40, y);
  sheet.text(k.slice(0, 7), 6 + i * 40, y + 50, C.stone);
});
y += 60;
label('ENEMIES (FLIPPED) + BOSSES', 6, y);
y += 8;
const regulars = [...new Set(ZONES.flatMap((z) => z.regulars.map((e) => e.name)))];
regulars.forEach((n, i) => sheet.blit(scaled(enemySprite(n), 2), 6 + i * 40, y));
y += 54;
ZONES.forEach((z, i) => sheet.blit(scaled(enemySprite(z.boss.name), 3), 6 + i * 60, y));
y += 78;

label('STOREFRONTS 64X56 (+ SCAFFOLDING)', 6, y);
y += 8;
[...SHOP_ORDER, null].forEach((k, i) => sheet.blit(facade(k, 'home', i + 1), 6 + i * 68, y));
sheet.blit(facade('dojo', 'home', 1), 414, y).blit(S.scaffold(), 414, y).blit(S.signSample('pawn', 3), 486, y + 4).blit(S.signSample('payday', 4), 486, y + 22);
y += 60;
label('CAPTURED-LOT MATERIALS', 6, y);
y += 8;
(['lot', 'bigbox', 'outlet', 'lifestyle'] as Material[]).forEach((m, i) => sheet.blit(facade(SHOP_ORDER[i], m, 20 + i), 6 + i * 68, y));
y += 62;

label('BATTLEFIELDS 320X150 (SHOWN 1X)', 6, y);
y += 8;
ZONES.forEach((z, i) => sheet.blit(battlefield(z.id), 6 + (i % 2) * 326, y + Math.floor(i / 2) * 154));
y += 310;
label('UI FRAMES + ICONS (4X)', 6, y);
sheet.blit(scaled(panelFrame(), 4), 130, y - 2).blit(scaled(buttonFrame(), 4), 184, y - 2);
Object.values(ICONS).forEach((f, i) => sheet.blit(scaled(f(), 4), 220 + i * 40, y - 2));
y += 44;
label('TITLE SCENE 320X180 (1X) + PAGE FRAMES AND TILES (3X)', 6, y);
y += 8;
sheet.blit(S.bootScene(['vape', 'dojo', null, 'pawn']), 6, y);
let fx = 336;
let fy = y;
for (const f of [S.glassFrame, S.brickFrame, S.pylonFrame, S.printerFrame, S.binderFrame, S.tagFrame, () => S.signFrame(C.sodium), S.cinderTile, S.roadTile, S.tearTile]) {
  const g = scaled(f(), 3);
  if (fx + g.w > W - 6) (fx = 336), (fy += 84);
  sheet.blit(g, fx, fy);
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
