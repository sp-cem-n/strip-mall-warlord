// One timer per sign, nothing per frame. Off for prefers-reduced-motion.
// Three separate schedules:
//  - shop signs: dead letters sputter now and then; a click relights one until it next burns out;
//  - the SMW logo: at most one WARLORD letter and one starburst ray out, mostly the O and the southwest ray, always a flicker on the way;
//  - Fun Zone script: FUN, ZONE or the underline flickers, sometimes stays off a few seconds, always comes back on; now and then a ~10s tantrum.
import { app } from '../app';
import { SHOP_LIST } from '../game/defs';
import { hasDeadTube } from './art';

export const lit = new Set<string>(); // shops whose dead letter is on right now
export const signOut = { mask: 0, ray: 6 }; // the dark WARLORD letter (a bitmask, so a flicker can blink it) and the dark ray, -1 for none
export const fzOff = new Set<FzPart>(); // Fun Zone parts that are dark right now
export type FzPart = 'fun' | 'zone' | 'line';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const later = (ms: number, f: () => void) => setTimeout(f, ms);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function candidates() {
  return SHOP_LIST.filter((sh) => (app.s.crews[sh.region].shops[sh.id] ?? 0) > 0 && hasDeadTube(sh.id)).map((sh) => sh.id);
}

// a sputter: a handful of short on/off blinks of `flip`, ending on `end`
function sputter(flip: (on: boolean) => void, end: boolean, done: () => void, blinks = [2, 5]) {
  let t = 0;
  const n = Math.floor(rnd(blinks[0], blinks[1] + 1));
  for (let i = 0; i < n * 2; i++) later((t += rnd(50, 260)), () => (flip(i % 2 === 0), app.refresh()));
  later((t += rnd(80, 200)), () => (flip(end), app.refresh(), done()));
}
const tubeFlip = (id: string) => (on: boolean) => (on ? lit.add(id) : lit.delete(id));

let gap = [120, 360]; // seconds, plaza tubes
let letterGap = [60, 240]; // seconds the logo holds a look
let fzGap = [20, 70]; // seconds between Fun Zone flickers
function next() {
  later(rnd(gap[0], gap[1]) * 1000, () => {
    const id = pick(candidates());
    if (!id) return next();
    const f = tubeFlip(id);
    if (lit.has(id)) sputter(f, false, next); // a relit letter burns out again
    else if (Math.random() < 0.35) sputter(f, true, () => later(rnd(10, 40) * 1000, () => sputter(f, false, next)));
    else sputter(f, false, next);
  });
}
// A click on a shop's dark letter: it sputters back on and stays lit until the schedule burns it out again.
export function relight(id: string): boolean {
  if (!hasDeadTube(id) || lit.has(id)) return false;
  sputter(tubeFlip(id), true, () => {}, [1, 3]);
  app.s.stats.relit = (app.s.stats.relit ?? 0) + 1;
  return true;
}

// --- the SMW logo ---
const O = 4; // W A R L O R D
const SW = 6; // the starburst ray pointing down-left
// [dark letter, dark ray, weight]: mostly all lit, the O, the southwest ray, or both; anything else is rare
const LOOKS: [number, number, number][] = [[-1, -1, 30], [O, -1, 22], [-1, SW, 22], [O, SW, 16], [0, -1, 1], [1, -1, 1], [2, -1, 1], [3, -1, 1], [5, -1, 1], [6, -1, 1], [-1, 2, 1], [-1, 10, 1], [-1, 14, 1], [O, 12, 1]];
function pickLook() {
  let r = Math.random() * LOOKS.reduce((n, l) => n + l[2], 0);
  return LOOKS.find((l) => (r -= l[2]) < 0) ?? LOOKS[0];
}
// Move the logo to a new look: the old letter flickers back on, the new one flickers out, then the same for the ray.
function settle(letter: number, ray: number, done: () => void) {
  const was = signOut.mask ? Math.log2(signOut.mask) : -1;
  const setRay = () => {
    const from = signOut.ray;
    if (from === ray) return done();
    if (from >= 0) return sputter((on) => (signOut.ray = on ? -1 : from), true, setRay);
    sputter((dark) => (signOut.ray = dark ? ray : -1), true, done);
  };
  const darken = () => (letter < 0 ? setRay() : sputter((dark) => (signOut.mask = dark ? 1 << letter : 0), true, setRay));
  if (was === letter) setRay();
  else if (was < 0) darken();
  else sputter((dark) => (signOut.mask = dark ? 1 << was : 0), false, darken);
}
function nextLetter() {
  later(rnd(letterGap[0], letterGap[1]) * 1000, () => {
    const [letter, ray] = pickLook();
    settle(letter, ray, nextLetter);
  });
}

// --- Fun Zone script ---
const fzFlip = (p: FzPart) => (dark: boolean) => (dark ? fzOff.add(p) : fzOff.delete(p));
function fzBlink(p: FzPart, done: () => void) {
  const f = fzFlip(p);
  // a couple of blinks; sometimes it hangs dark a few seconds first; always ends lit
  if (Math.random() < 0.4) sputter(f, true, () => later(rnd(2, 5) * 1000, () => sputter(f, false, done, [1, 3])), [1, 3]);
  else sputter(f, false, done, [2, 3]);
}
function tantrum(done: () => void) {
  const parts: FzPart[] = ['fun', 'zone', 'line'];
  const stop = performance.now() + rnd(9, 11) * 1000;
  const step = () => {
    if (performance.now() > stop) return (fzOff.clear(), app.refresh(), done());
    const p = pick(parts);
    fzFlip(p)(!fzOff.has(p));
    app.refresh();
    later(rnd(40, 320), step);
  };
  step();
}
function nextFz() {
  later(rnd(fzGap[0], fzGap[1]) * 1000, () => {
    if (Math.random() < 0.12) tantrum(nextFz);
    else fzBlink(pick<FzPart>(['fun', 'zone', 'line']), nextFz);
  });
}

// ?lights=fast: every few seconds, for testing. ?lights=still&signout=MASK&fzoff=zone,line: frozen, for screenshots.
export function startLights(mode: string | null = null, q?: URLSearchParams) {
  if (mode === 'still') {
    signOut.mask = Number(q?.get('signout') ?? 0) & 127;
    signOut.ray = Number(q?.get('signray') ?? SW);
    for (const p of (q?.get('fzoff') ?? '').split(',')) if (p === 'fun' || p === 'zone' || p === 'line') fzOff.add(p);
    return;
  }
  const fast = mode === 'fast';
  if (fast) {
    gap = [2, 5]; letterGap = [2, 4]; fzGap = [2, 4];
    (globalThis as unknown as { lights: unknown }).lights = { set: (id: string, on: boolean) => (tubeFlip(id)(on), app.refresh()), candidates, signOut, fzOff, tantrum: () => tantrum(() => {}) }; // a handle for screenshots
  }
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  next();
  nextLetter();
  nextFz();
}

export function triggerFlicker() {
  if (app.screen === 'room' && app.s.view === 0) return tantrum(() => {});
  const [letter, ray] = pickLook();
  settle(letter, ray, () => {});
  const id = pick(candidates());
  if (id) sputter(tubeFlip(id), !lit.has(id), () => {});
}
