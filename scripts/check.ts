// Small invariant checks. Run: bun scripts/check.ts
import { BATTLERS, FIGHTS, GOODWILL_PER_EQUITY, OFFLINE_CAP_SECONDS, REGIONS, SHOPS, SHOP_LIST, STEP, WEAK_BONUS } from '../src/game/defs';
import { auras, enemyLineup, lossReason, startBattle, statsOf } from '../src/game/battle';
import { advance, asphaltGain, autoCovers, convert, forLease, lease, newGame, overtime, pave, renovate, renovateCost, roster, setStance, train, trainCost, view } from '../src/game/economy';
import { loadGame, saveGame } from '../src/game/save';
import { collectFind, simulateAway, step } from '../src/game/sim';
import { CREW_LOOKS, ENEMY_LOOKS } from '../src/art/people';
import type { GameState } from '../src/game/state';

const store = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) },
});

let failed = 0;
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
};
const finish = (s: GameState, r: 0 | 1) => ((s.crews[r].frontier = FIGHTS[r].length), (s.crews[r].at = FIGHTS[r].length - 2));

// content
const r9 = SHOP_LIST.filter((x) => x.region === 0);
const bp = SHOP_LIST.filter((x) => x.region === 1);
const bosses = (r: 0 | 1) => REGIONS[r].lots.map((l) => l.boss.joins);
check(`Route 9: ${r9.length} shops + ${bosses(0).length} bosses = 25 battlers`, r9.length + bosses(0).length === 25 && new Set([...r9.map((x) => x.battler), ...bosses(0)]).size === 25);
check(`Bypass: ${bp.length} shops (${bp.filter((x) => !r9.some((y) => y.battler === x.battler)).length} new kinds) + ${bosses(1).length} bosses`, bp.length >= 12 && new Set(bp.map((x) => x.battler)).size === bp.length);
check('every battler and shop id resolves', SHOP_LIST.every((x) => BATTLERS[x.battler]) && REGIONS.every((r) => r.lots.every((l) => BATTLERS[l.boss.joins])));
check('every enemy weakness is a battler that region can field', REGIONS.every((r) => r.lots.every((l) => [...l.regulars, l.boss].every((e) => [...SHOP_LIST.filter((x) => x.region === r.id).map((x) => x.battler), ...bosses(r.id)].includes(e.weak)))));
check('every battler and enemy has its own look', Object.keys(BATTLERS).every((id) => CREW_LOOKS[id] || bosses(0).includes(id) || bosses(1).includes(id)) && REGIONS.every((r) => r.lots.every((l) => [...l.regulars, l.boss].every((e) => ENEMY_LOOKS[e.name]))));
check('shops unlock in lease order', [0, 1].every((r) => { const l = SHOP_LIST.filter((x) => x.region === r && x.fight >= 0).map((x) => FIGHTS[r].findIndex((f) => f.zone === x.zone && f.i === x.fight)); return l.every((v, i) => v >= 0 && (i === 0 || v > l[i - 1])); }));
check('fight ladders: Route 9 84, Bypass 56', FIGHTS[0].length === 84 && FIGHTS[1].length === 56);
check('kill counts and pay never go down inside a lot', FIGHTS.every((L) => L.every((f, i) => i === 0 || f.boss || L[i - 1].zone !== f.zone || (f.need >= L[i - 1].need && f.pay >= L[i - 1].pay))));

// start
const s = newGame(1);
check('start: the pawn shop, one Fixer, nothing else', Object.keys(s.crews[0].shops).join() === 'pawn' && roster(s, 0).length === 1);
check('dojo not for lease at the start', lease(s, 'dojo') === 'Not available yet');
check('the Bypass is hidden', view(s, 1) !== null && !s.bypass);
for (let i = 0; i < 30 * 60 / STEP && !s.crews[0].wins; i++) step(s);
check('first win comes quickly', s.crews[0].wins > 0 && s.time < 60);
s.crews[0].cash = 1e9;
s.crews[0].frontier = 2;
check('clearing fight 2 puts the Dojo up for lease', forLease(s, 0).some((x) => x.id === 'dojo') && lease(s, 'dojo') === null && roster(s, 0)[0][0] === 'bouncer');
const before = statsOf(s, 0, 'bouncer', 1).hp;
check('renovate: +1 level, +10% HP, costs more next time', renovate(s, 'dojo') === null && s.crews[0].shops.dojo === 2 && Math.abs(statsOf(s, 0, 'bouncer', 2).hp / before - 1.1) < 0.02 && renovateCost('dojo', 2) > renovateCost('dojo', 1));
s.goodwill = 1000;
check('training costs Goodwill and only Route 9', train(s, 0, 'tank') === null && s.crews[0].train.tank === 1 && s.goodwill === 1000 - trainCost(0, 0) && s.crews[1].train.tank === 0);

// auto-advance and the ladder
check('lot 1 always on auto; Big-Box needs the Security Office', autoCovers(s, 0, 0) && !autoCovers(s, 0, 1));
s.crews[0].shops.security = 1;
check('Security Office Lv 1 covers Big-Box, Lv 6 Outlet', autoCovers(s, 0, 1) && !autoCovers(s, 0, 2) && ((s.crews[0].shops.security = 6), autoCovers(s, 0, 2)));
check('advance stops at the frontier', advance(s, 0, 1) === null && advance(s, 0, 1) === null && advance(s, 0, 1) !== null && s.crews[0].at === 2);
{
  const t = newGame(2);
  t.crews[0].frontier = 30;
  t.crews[0].at = 30;
  for (let i = 0; i < 2000 && t.crews[0].at === 30; i++) step(t);
  check('3 losses in a row: falls back one fight to farm', t.crews[0].at === 29 && t.log.some((l) => l.text.includes('Falling back')));
}

// battle rules
{
  const t = newGame(3);
  t.crews[0].shops = Object.fromEntries(r9.map((x) => [x.id, 5]));
  finish(t, 0);
  const team = roster(t, 0);
  check('25 on the field with every boss joined', team.length === 25);
  const b = startBattle(t, 0)!;
  check('aura: Personal Trainer gives tanks +20% HP (and more with Team Building)', b.crew.find((u) => u.id === 'bouncer')!.maxHp > statsOf(t, 0, 'bouncer', 5).hp * 1.2);
  check('caps hold: stun, confuse <= 35%', b.field.stun <= 0.35 && b.field.confuse <= 0.35);
  check('Copy Guy copies an aura at half strength', auras(t, ['copyguy', 'trainer'], 0).filter((a) => a.fx.k === 'hpUp').length === 2);
  check('front rank is the tanks', b.crew[0].role === 'tank' && b.crew.at(-1)!.role === 'buffer');
  check(`weakness is a small bonus (+${WEAK_BONUS * 100}%)`, WEAK_BONUS <= 0.25);
  const lu = enemyLineup(0, 0);
  check('fight 1 is one enemy; bosses bring two', lu.length === 1 && enemyLineup(0, 8).length === 3 && enemyLineup(0, 8)[0].boss);
  setStance(t, 0, 'rush');
  const rush = startBattle(t, 0)!;
  check('Rush: more damage, less HP', rush.crew[0].dmg > b.crew[0].dmg && rush.crew[0].maxHp < b.crew[0].maxHp);
  t.crews[0].cash = 1e12;
  check('overtime: costs rent, boosts the next 3 fights', overtime(t, 0) === null && t.crews[0].overtime === 3 && startBattle(t, 0)!.overtime && (t.crews[0].overtime as number) === 2);
  check('loss reason points at the play for hard hitters', lossReason({ ...b, t: 5, enemies: [{ ...b.enemies[0], hp: 1, tell: 'hard' }] }, 'even').includes('Dig In'));
}

// ending, the Bypass, paving
{
  const t = newGame(4);
  t.crews[0].shops = Object.fromEntries(r9.map((x) => [x.id, 70]));
  t.crews[0].frontier = FIGHTS[0].length - 1;
  t.crews[0].at = FIGHTS[0].length - 1;
  t.crews[0].kills = 0;
  for (let i = 0; i < 20000 && !t.bypass; i++) step(t);
  check('beating the Developer: the ending, then the Bypass', t.bypass && t.ending === 1 && roster(t, 0).some(([id]) => id === 'developer'));
  check('the Bypass is a whole new crew: Self Storage, one Auction Hunter', roster(t, 1).length === 1 && roster(t, 1)[0][0] === 'auction');
  check('keep the lights on: farming the fight before the Developer (he works for you now)', (() => { const w = t.crews[0].wins; for (let i = 0; i < 2000; i++) step(t); return t.crews[0].wins > w && t.crews[0].at === FIGHTS[0].length - 2; })());
  t.goodwill = 50 * GOODWILL_PER_EQUITY + 7;
  check(`bank: ${GOODWILL_PER_EQUITY} Goodwill -> 1 Equity`, convert(t) === null && t.equity >= 50 && t.goodwill === 7);
  t.crews[1].frontier = 3;
  const eq = t.equity;
  check('Bypass leases cost Equity, not dollars', lease(t, 'carwash') === null && t.equity === eq - SHOPS.carwash.lease);
  const bpCrew = JSON.stringify(t.crews[1].shops);
  const gain = asphaltGain(t);
  pave(t);
  check(`pave Route 9: +${gain} asphalt, Route 9 crew restarts, Bypass untouched`, t.asphalt === gain && Object.keys(t.crews[0].shops).join() === 'pawn' && t.goodwill === 0 && JSON.stringify(t.crews[1].shops) === bpCrew && t.bypass);
  check('asphalt only boosts Route 9', statsOf(t, 0, 'fixer', 1).hp > BATTLERS.fixer.hp && statsOf(t, 1, 'auction', 1).hp === BATTLERS.auction.hp);
  check('pave needs the ending', asphaltGain(newGame(5)) === 0);
}
{
  // A player who walks into the Bypass with nothing banked still wins the first fight on Lv 1 Self Storage alone.
  const t = newGame(7);
  t.bypass = true;
  for (let i = 0; i < 1500 && !t.crews[1].wins; i++) step(t);
  check(`the Bypass: a bare Lv 1 crew of 1 wins fight 1 (W ${t.crews[1].wins}, L ${t.crews[1].losses})`, t.crews[1].wins > 0);
}

// walk-ins and offline
{
  const t = newGame(6);
  const steps = (90 * 3) / STEP;
  for (let i = 0; i < steps; i++) step(t);
  check('no walk-ins unless watching', !t.find);
  for (let i = 0; i < steps && !t.find; i++) step(t, true);
  check('walk-in shows up while watching', !!t.find);
  const k = t.find!.kind;
  const c0 = t.crews[0].cash, g0 = t.goodwill;
  check(`walk-in pays out (${k})`, collectFind(t) === null && (k === 'rally' ? t.crews[0].rally > 0 : k === 'cash' ? t.crews[0].cash > c0 : t.goodwill > g0));
  const a = simulateAway(newGame(7), 20 * 3600);
  check('offline capped at 8h', a.seconds === OFFLINE_CAP_SECONDS && a.wins > 0);
}

// saves
{
  const t = newGame(8);
  saveGame(t);
  const back = loadGame();
  check('save round-trips', typeof back === 'object' && back !== null && back.crews[0].shops.pawn === 1);
  store.set('smw.save', JSON.stringify({ version: 3, slots: [], cash: 5 }));
  check('a v0.4 save reads as old (title notice, then reset)', loadGame() === 'old');
  store.set('smw.save', '{nope');
  check('a broken save does not crash', loadGame() === 'old');
}

console.log(failed ? `\n${failed} FAILED` : '\nall good');
process.exit(failed ? 1 : 0);
