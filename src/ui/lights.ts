// One timer per sign, nothing per frame. Off for prefers-reduced-motion.
// Three separate schedules:
//  - plaza tubes: the starburst ray and dead shop tubes sputter now and then; a click relights a dead shop letter until it next burns out;
//  - plaza WARLORD letters: one letter at a time burns out, at most 2 dark at once, and a letter always flickers on its way out and back;
//  - Fun Zone script: FUN, ZONE or the underline flickers, sometimes stays off a few seconds, always comes back on; now and then a ~10s tantrum.
import { app } from '../app';
import { SHOP_LIST } from '../game/defs';
import { hasDeadTube } from './art';

export const lit = new Set<string>(); // 'sign-ray' or a shop id
export const signOut = { mask: 0 }; // WARLORD letters that are dark right now
export const fzOff = new Set<FzPart>(); // Fun Zone parts that are dark right now
export type FzPart = 'fun' | 'zone' | 'line';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const later = (ms: number, f: () => void) => setTimeout(f, ms);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function candidates() {
  return ['sign-ray', ...SHOP_LIST.filter((sh) => (app.s.crews[sh.region].shops[sh.id] ?? 0) > 0 && hasDeadTube(sh.id)).map((sh) => sh.id)];
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
let letterGap = [45, 160]; // seconds between letter burnouts
let letterOut = [20, 140]; // seconds a letter stays dark
let fzGap = [20, 70]; // seconds between Fun Zone flickers
function next() {
  later(rnd(gap[0], gap[1]) * 1000, () => {
    const id = pick(candidates());
    const f = tubeFlip(id);
    if (lit.has(id) && id !== 'sign-ray') sputter(f, false, next); // a relit letter burns out again
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

// --- WARLORD letters ---
const busy = new Set<number>(); // letters flickering or dark (never more than 2)
const letterFlip = (n: number) => (dark: boolean) => (signOut.mask = dark ? signOut.mask | (1 << n) : signOut.mask & ~(1 << n));
function burnLetter(n: number, outFor: number) {
  busy.add(n);
  const f = letterFlip(n);
  sputter(f, true, () => later(outFor, () => sputter(f, false, () => busy.delete(n))));
}
function nextLetter() {
  later(rnd(letterGap[0], letterGap[1]) * 1000, () => {
    const free = [0, 1, 2, 3, 4, 5, 6].filter((n) => !busy.has(n));
    if (busy.size < 2 && free.length) burnLetter(pick(free), rnd(letterOut[0], letterOut[1]) * 1000);
    nextLetter();
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
    for (const p of (q?.get('fzoff') ?? '').split(',')) if (p === 'fun' || p === 'zone' || p === 'line') fzOff.add(p);
    return;
  }
  const fast = mode === 'fast';
  if (fast) {
    gap = [2, 5]; letterGap = [2, 4]; letterOut = [3, 6]; fzGap = [2, 4];
    (globalThis as unknown as { lights: unknown }).lights = { set: (id: string, on: boolean) => (tubeFlip(id)(on), app.refresh()), candidates, signOut, fzOff, tantrum: () => tantrum(() => {}) }; // a handle for screenshots
  }
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  next();
  nextLetter();
  nextFz();
}

export function triggerFlicker() {
  if (app.screen === 'room' && app.s.view === 0) return tantrum(() => {});
  const free = [0, 1, 2, 3, 4, 5, 6].filter((n) => !busy.has(n));
  if (busy.size < 2 && free.length) burnLetter(pick(free), rnd(4, 10) * 1000);
  const f = tubeFlip(pick(candidates()) ?? 'sign-ray');
  sputter(f, true, () => later(rnd(4, 10) * 1000, () => sputter(f, false, () => {})));
}
