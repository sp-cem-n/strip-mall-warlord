// Browser side of the art: palette grids -> cached canvases / data URLs.
import { SHOPS } from '../game/defs';
import type { Grid } from '../art/grid';
import { C } from '../art/palette';
import { crewSprite, enemySprite } from '../art/people';
import { battlefield, bootScene } from '../art/field';
import * as F from '../art/frames';
import { buttonFrame, ICONS, panelFrame } from '../art/frames';
import { facade, scaffold, type Material } from '../art/storefronts';

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

export const crewArt = (id: string, flash = false) => canvasOf(`crew:${id}:${flash}`, () => (flash ? crewSprite(id).silhouette(C.paper) : crewSprite(id)));
export const enemyArt = (n: string, flash = false) => canvasOf(`enemy:${n}:${flash}`, () => (flash ? enemySprite(n).silhouette(C.paper) : enemySprite(n)));
export const fieldArt = (zoneId: string) => canvasOf(`field:${zoneId}`, () => battlefield(zoneId));
export const icon = (k: keyof typeof ICONS) => urlOf(`icon:${k}`, ICONS[k]);
export const crewURL = (id: string) => urlOf(`crewurl:${id}`, () => crewSprite(id));

// storefront material comes from where the shop turns up
const MATERIALS: Material[] = ['home', 'bigbox', 'outlet', 'office', 'lifestyle'];
export const materialOf = (id: string): Material => (SHOPS[id].region === 1 ? 'bypass' : MATERIALS[SHOPS[id].zone] ?? 'home');
export const facadeURL = (id: string, leased: boolean) => urlOf(`facade:${id}:${leased}`, () => facade(leased ? id : null, materialOf(id), id.length * 7 + id.charCodeAt(0), SHOPS[id].region === 1 ? 'COMING' : 'SHOES'));
export const scaffoldURL = () => urlOf('scaffold', scaffold);
export const bootURL = (kinds: (string | null)[], dawn = false) => urlOf(`boot:${kinds.join(',')}:${dawn}`, () => bootScene(kinds, dawn));
// frames and tiles as CSS variables (border-image / background)
export function installFrames() {
  const root = document.documentElement.style;
  const set = (k: string, make: () => Grid) => root.setProperty(`--${k}`, `url(${urlOf(k, make)})`);
  set('frame', panelFrame);
  set('btn', () => buttonFrame());
  set('btn-hot', () => buttonFrame(C.sodium));
  set('glass', F.glassFrame);
  set('brick', F.brickFrame);
  set('pylon', F.pylonFrame);
  set('tenant', F.tenantFrame);
  set('tag', F.tagFrame);
  set('printer', F.printerFrame);
  set('binder', F.binderFrame);
  set('lotsign', () => F.signFrame());
  set('lotsign-now', () => F.signFrame(C.sodium));
  set('lotsign-done', () => F.signFrame(C.green));
  set('cinder', F.cinderTile);
  set('sky', F.skyTile);
  set('road', F.roadTile);
  set('led', F.ledTile);
  set('tear', F.tearTile);
}
