// Small invariant checks. Run: bun scripts/check.ts
import { OFFLINE_CAP_SECONDS, RESIST_MULT, WEAK_MULT, ZONES } from '../src/game/defs';
import { lossReason, startBattle } from '../src/game/battle';
import { collectFind, heat, newGame, openShop, renovate, renovateCost } from '../src/game/economy';
import { loadGame, saveGame } from '../src/game/save';
import { asphaltGain, bulldoze, simulateAway, step } from '../src/game/sim';

const store = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) },
});

let failed = 0;
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
};

const s = newGame(1);
check("start with uncle's vape shop + 3 vacant units", s.slots.length === 4 && s.slots[0].shop === 'vape' && s.slots.slice(1).every((x) => !x.shop));
check('payday locked at start', openShop(s, 1, 'payday') === 'Not unlocked yet');
check('dojo opens', openShop(s, 1, 'dojo') === null && s.slots[1].shop === 'dojo');
s.cash = 1e6;
check('renovate raises the building level', renovate(s, 0) === null && s.slots[0].level === 2);
check('rebrand keeps the level', openShop(s, 0, 'laundromat') === null && s.slots[0].shop === 'laundromat' && s.slots[0].level === 2);
check('renovation cost ignores shop type', renovateCost(2) === renovateCost(s.slots[0].level));

s.zone = 2;
openShop(s, 1, 'payday');
s.slots[1].level = 5;
check('heat is derived from payday levels', Math.abs(heat(s) - 0.1) < 1e-9);

// counters: a lone bouncer vs the lot loses and says why
const lone = newGame(5);
lone.slots[0].shop = 'dojo';
const b = startBattle(lone)!;
check('the lot is weak to hustlers', b.enemies.every((e) => e.weak === 'hustler') && WEAK_MULT > 1 && RESIST_MULT < 1);
let guard = 0;
while (lone.battle && guard++ < 2000) step(lone);
check('lone bouncer loses at the lot', lone.stats.losses === 1 && lone.row === 0);
check('loss names the missing counter', lossReason(b).includes('Hustler'));

// smoke break: three straight losses -> long regroup; any lineup change ends it
while (lone.lossStreak < 3 && guard++ < 50000) step(lone);
check('three straight losses = smoke break', lone.lossStreak === 3 && lone.regroup > 30);
lone.cash = 1e6;
renovate(lone, 0);
check('renovating ends the smoke break', lone.lossStreak === 0 && lone.regroup <= 3);

// walk-ins only happen while watching
const idle = newGame(6);
for (let i = 0; i < 5000; i++) step(idle);
check('no walk-ins offline', idle.find === null);
for (let i = 0; i < 5000 && !idle.find; i++) step(idle, true);
check('walk-ins appear while watching', idle.find !== null);
check('collecting a walk-in boosts the crew', collectFind(idle) === null && idle.boost > 0 && idle.find === null);

saveGame(s);
check('save round-trips', loadGame()?.slots[0].level === 2);
store.set('smw.save', '{not json');
check('corrupt save falls back to null', loadGame() === null);
store.set('smw.save', JSON.stringify({ version: 1 }));
check('old save version falls back to null', loadGame() === null);

check('offline progress is capped at 8h', simulateAway(newGame(2), 999999).seconds === OFFLINE_CAP_SECONDS);

const rich = newGame(3);
rich.zone = 2;
rich.row = 3;
const gain = ZONES[0].rows + ZONES[1].rows + 3;
check('asphalt = rows taken', asphaltGain(rich) === gain);
const next = bulldoze(rich);
check('bulldoze grants asphalt and resets', next.asphalt === gain && next.zone === 0 && next.bulldozes === 1);

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log('all checks passed');
