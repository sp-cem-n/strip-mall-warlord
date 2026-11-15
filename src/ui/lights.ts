// Burnt-out lights: the sign's dead ray and dead O, and the one dead tube in most storefront signs.
// Every few minutes one of them sputters back on, and now and then it holds for a while before it quits again.
// One timer for the whole plaza, nothing per frame. Off for prefers-reduced-motion.
import { app } from '../app';
import { SHOP_LIST } from '../game/defs';
import { hasDeadTube } from './art';

export const lit = new Set<string>(); // 'sign-ray', 'sign-o', or a shop id

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const later = (ms: number, f: () => void) => setTimeout(f, ms);

function candidates() {
  const c = app.s.crews[0].shops;
  return ['sign-ray', 'sign-o', ...SHOP_LIST.filter((sh) => (c[sh.id] ?? 0) > 0 && hasDeadTube(sh.id)).map((sh) => sh.id)];
}

function set(id: string, on: boolean) {
  if (on) lit.add(id);
  else lit.delete(id);
  app.refresh();
}

// a sputter: a handful of short on/off blinks, ending on `end`
function sputter(id: string, end: boolean, done: () => void) {
  let t = 0;
  const n = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n * 2; i++) later((t += rnd(50, 260)), () => set(id, i % 2 === 0));
  later((t += rnd(80, 200)), () => (set(id, end), done()));
}

let gap = [120, 360]; // seconds
function next() {
  later(rnd(gap[0], gap[1]) * 1000, () => {
    const all = candidates();
    const id = all[Math.floor(Math.random() * all.length)];
    if (Math.random() < 0.35) sputter(id, true, () => later(rnd(10, 40) * 1000, () => sputter(id, false, next)));
    else sputter(id, false, next);
  });
}

export function startLights(fast = false) { // fast: ?lights=fast, every few seconds, for testing
  if (fast) ((gap = [2, 5]), ((globalThis as unknown as { lights: unknown }).lights = { set, candidates })); // and a handle for screenshots
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  next();
}

export function triggerFlicker() {
  const all = candidates();
  const id = all[Math.floor(Math.random() * all.length)] ?? 'sign-o';
  sputter(id, true, () => later(rnd(4, 10) * 1000, () => sputter(id, false, () => {})));
}
