import { C, rgba, shade } from './palette';
import { glyph } from './font';

// A palette-indexed pixel grid. Sprites are drawn into these, then converted to RGBA once.
export class Grid {
  data: Uint8Array;
  constructor(public w: number, public h: number) {
    this.data = new Uint8Array(w * h);
  }
  get(x: number, y: number) {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.data[y * this.w + x];
  }
  px(x: number, y: number, c: number) {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.data[y * this.w + x] = c;
    return this;
  }
  rect(x: number, y: number, w: number, h: number, c: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
    return this;
  }
  // filled rect with a 1px darker right edge (the shading rule: light from the upper left)
  block(x: number, y: number, w: number, h: number, c: number) {
    this.rect(x, y, w, h, c);
    this.rect(x + w - 1, y, 1, h, shade(c));
    return this;
  }
  // filled rect with a 1px ink frame just outside it
  boxed(x: number, y: number, w: number, h: number, c: number) {
    this.rect(x - 1, y - 1, w + 2, h + 2, C.ink);
    return this.rect(x, y, w, h, c);
  }
  hline(x: number, y: number, w: number, c: number) {
    return this.rect(x, y, w, 1, c);
  }
  vline(x: number, y: number, h: number, c: number) {
    return this.rect(x, y, 1, h, c);
  }
  // 50% checker dither, used for light falloff and grime
  dither(x: number, y: number, w: number, h: number, c: number, phase = 0) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((x + i + y + j + phase) % 2 === 0) this.px(x + i, y + j, c);
    return this;
  }
  text(s: string, x: number, y: number, c: number, scale = 1) {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      const g = glyph(ch);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i]) this.rect(cx + i * scale, y + j * scale, scale, scale, c);
      cx += 4 * scale;
    }
    return this;
  }
  // 1px ink outline around every filled region (the outline rule)
  outline(c = C.ink) {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (!this.get(x, y) && (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1))) add.push(y * this.w + x);
    for (const i of add) this.data[i] = c;
    return this;
  }
  flip() {
    const g = new Grid(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) g.data[y * this.w + x] = this.get(this.w - 1 - x, y);
    return g;
  }
  blit(src: Grid, x: number, y: number) {
    for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) if (src.get(i, j)) this.px(x + i, y + j, src.get(i, j));
    return this;
  }
  // every filled pixel -> one color (hit flash silhouettes)
  silhouette(c: number) {
    const g = new Grid(this.w, this.h);
    for (let i = 0; i < this.data.length; i++) g.data[i] = this.data[i] ? c : 0;
    return g;
  }
  toRGBA(): Uint8ClampedArray {
    const out = new Uint8ClampedArray(this.w * this.h * 4);
    for (let i = 0; i < this.data.length; i++) out.set(rgba(this.data[i]), i * 4);
    return out;
  }
}

export const textWidth = (s: string, scale = 1) => s.length * 4 * scale - scale;

// cheap deterministic noise
export const hash = (a: number, b: number) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
