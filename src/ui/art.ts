// Browser side of the art: palette grids -> cached canvases / data URLs.
import { SHOPS } from '../game/defs';
import type { Grid } from '../art/grid';
import { C } from '../art/palette';
import { crewSprite, enemySprite } from '../art/people';
import { battlefield, bootScene } from '../art/field';
import * as F from '../art/frames';
import { buttonFrame, ICONS, panelFrame } from '../art/frames';
import { facade, scaffold, type Material } from '../art/storefronts';
import { titleSign } from '../art/sign';
import { starsTile } from '../art/logos';
import barLogo from '../art/bar-logo.png';
import fzBase from '../art/fz-base.png';
import fzFun from '../art/fz-fun.png';
import fzZone from '../art/fz-zone.png';
import fzLine from '../art/fz-line.png';
import { landmarkSprite } from '../art/landmarks';

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
const seedOf = (id: string) => id.length * 7 + id.charCodeAt(0);
// About one sign in four has a letter out, hashed from the whole id so no two shops share the answer.
const idHash = (id: string) => [...id].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261) >>> 0;
export const hasDeadTube = (id: string) => idHash(id) / 2 ** 32 < 0.25;
export const facadeURL = (id: string, leased: boolean, lit = false) => {
  const dead = hasDeadTube(id) && !lit;
  return urlOf(`facade:${id}:${leased}:${dead}`, () => facade(leased ? id : null, materialOf(id), seedOf(id), SHOPS[id].region === 1 ? 'COMING' : 'SHOES', dead));
};
export const scaffoldURL = () => urlOf('scaffold', scaffold);
export const titleSignURL = (ray = false, out = 0) => urlOf(`titlesign:${ray}:${out}`, () => titleSign(ray, out));
// Fun Zone neon script (option B): dead tubes underneath, each lit part on its own layer so it can flicker.
export const FZ_LOGO = { base: fzBase, fun: fzFun, zone: fzZone, line: fzLine };
export const barLogoURL = () => barLogo; // the painted matchbook on plywood, Josh's pick
export const landmarkURL = (id: string) => urlOf(`landmark:${id}`, () => landmarkSprite(id));

export const bootURL = (kinds: (string | null)[], dawn = false) => urlOf(`boot:${kinds.join(',')}:${dawn}`, () => bootScene(kinds, dawn));
// frames and tiles as CSS variables (border-image / background)
export function installFrames() {
  const root = document.documentElement.style;
  const set = (k: string, make: () => Grid) => root.setProperty(`--${k}`, `url(${urlOf(k, make)})`);
  set('frame', panelFrame);
  set('btn', () => buttonFrame());
  set('btn-hot', () => buttonFrame(C.sodium));
  set('glass', F.glassFrame);
  set('brickwall', F.brickFrame); // not --brick: that one is the color
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
  set('stars', starsTile);
  set('road', F.roadTile);
  set('led', F.ledTile);
  set('tear', F.tearTile);
}
