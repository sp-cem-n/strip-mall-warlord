// Browser side of the art: palette grids -> cached canvases / data URLs.
import { ZONES } from '../game/defs';
import type { Grid } from '../art/grid';
import { C } from '../art/palette';
import { crewSprite, enemySprite } from '../art/people';
import { battlefield, buttonFrame, facade, ICONS, panelFrame, type Material } from '../art/scenes';
import type { FighterKind, ShopKind } from '../game/defs';

const cache = new Map<string, HTMLCanvasElement>();
export function canvasOf(key: string, make: () => Grid): HTMLCanvasElement {
  let c = cache.get(key);
  if (!c) {
    const g = make();
    c = document.createElement('canvas');
    c.width = g.w;
    c.height = g.h;
    c.getContext('2d')!.putImageData(new ImageData(g.toRGBA() as Uint8ClampedArray<ArrayBuffer>, g.w, g.h), 0, 0);
    cache.set(key, c);
  }
  return c;
}
const urls = new Map<string, string>();
export const urlOf = (key: string, make: () => Grid) => urls.get(key) ?? (urls.set(key, canvasOf(key, make).toDataURL()), urls.get(key)!);

export const crewArt = (k: FighterKind, flash = false) => canvasOf(`crew:${k}:${flash}`, () => (flash ? crewSprite(k).silhouette(C.paper) : crewSprite(k)));
export const enemyArt = (n: string, flash = false) => canvasOf(`enemy:${n}:${flash}`, () => (flash ? enemySprite(n).silhouette(C.paper) : enemySprite(n)));
export const fieldArt = (zoneId: string) => canvasOf(`field:${zoneId}`, () => battlefield(zoneId));
export const icon = (k: keyof typeof ICONS) => urlOf(`icon:${k}`, ICONS[k]);
export const crewURL = (k: FighterKind) => urlOf(`crewurl:${k}`, () => crewSprite(k));

// storefront material comes from where the building was captured
const MATERIALS: Material[] = ['lot', 'bigbox', 'outlet', 'lifestyle'];
export function materialOf(slotId: number): Material {
  let id = 4;
  for (let z = 0; z < ZONES.length; z++) {
    if (slotId < id) return z === 0 ? 'home' : MATERIALS[z - 1];
    id += ZONES[z].captureSlots;
  }
  return slotId < id ? MATERIALS[ZONES.length - 1] : 'home';
}
export const facadeURL = (kind: ShopKind | null, slotId: number) => urlOf(`facade:${kind}:${slotId}`, () => facade(kind, materialOf(slotId), slotId + 1));

// frames as CSS border-images
export function installFrames() {
  const root = document.documentElement.style;
  root.setProperty('--frame', `url(${urlOf('frame', panelFrame)})`);
  root.setProperty('--btn', `url(${urlOf('btn', () => buttonFrame())})`);
  root.setProperty('--btn-hot', `url(${urlOf('btnhot', () => buttonFrame(C.sodium))})`);
}
