// Small invariant checks. Run: bun scripts/check.ts
import { OFFLINE_CAP_SECONDS, RESIST_MULT, WEAK_MULT, ZONES } from '../src/game/defs';
import { lossReason, startBattle } from '../src/game/battle';
import { collectFind, heat, incomePerSec, newGame, openShop, renovate, renovateCost } from '../src/game/economy';
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
check('a walk-in matches the shop it walked into', idle.find?.kind === idle.slots[idle.find!.slot].shop);
check('collecting clears the walk-in', collectFind(idle) === null && idle.find === null);
// each shop's walk-in does its own thing
const w = newGame(7);
const walkIn = (kind: 'pawn' | 'dojo' | 'laundromat' | 'vape' | 'payday') => {
  w.slots[1].shop = kind;
  w.find = { slot: 1, kind, name: 'test', left: 10 };
  return collectFind(w);
};
walkIn('pawn');
check('pawn walk-in: damage buff', w.buffs.dmg > 0);
walkIn('dojo');
check('dojo walk-in: bouncer toughness', w.buffs.tough > 0);
walkIn('laundromat');
check('laundromat walk-in: crew regen', w.buffs.regen > 0);
const cash0 = w.cash;
walkIn('vape');
check('vape walk-in: cash tip', w.cash > cash0);
const h0 = heat(w);
const cash1 = w.cash;
walkIn('payday');
check('payday walk-in: big cash and temporary heat', w.cash - cash1 > (cash1 - cash0) * 2 && heat(w) > h0);
for (let i = 0; i < 2000; i++) step(w);
check('buffs wear off', w.buffs.dmg === 0 && w.buffs.heat === 0 && incomePerSec(w) > 0);

saveGame(s);
check('save round-trips', loadGame()?.slots[0].level === 2);
store.set('smw.save', '{not json');
check('corrupt save falls back to null', loadGame() === null);
store.set('smw.save', JSON.stringify({ version: 1 }));
check('old save version falls back to null', loadGame() === null);
const v2 = { ...newGame(9), version: 2, boost: 12, find: { slot: 0, name: 'Maglite', left: 3 } } as Record<string, unknown>;
delete v2.buffs;
store.set('smw.save', JSON.stringify(v2));
const migrated = loadGame();
check('v0.3 save migrates to per-shop walk-ins', migrated?.version === 3 && migrated.find === null && migrated.buffs.dmg === 0 && !('boost' in migrated));

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
