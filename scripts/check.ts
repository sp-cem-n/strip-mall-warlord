// Small invariant checks. Run: bun scripts/check.ts
import { BATTLERS, FIGHTS, GOODWILL_PER_EQUITY, MAX_SLOTS, OFFLINE_CAP_SECONDS, REGIONS, SHOPS, SMOKE_BREAK_SECONDS, SHOP_LIST, START_SLOTS, STEP, WEAK_BONUS } from '../src/game/defs';
import { auras, enemyLineup, startBattle, statsOf, stepBattle } from '../src/game/battle';
import { advance, asphaltGain, fieldFull, autoCovers, buyPatrol, buySlot, convert, curb, forLease, lease, lineupOf, newGame, overtime, patrolBlock, powerLevel, rentPerSec, patrolPrice, pave, renovate, renovateCost, roster, slotsOf, tierOf, toggleField, train, trainCost, view } from '../src/game/economy';
import { loadGame, old, saveGame } from '../src/game/save';
import { collectFind, simulateAway, step } from '../src/game/sim';
import { CREW_LOOKS, ENEMY_LOOKS } from '../src/art/people';
import type { GameState } from '../src/game/state';
import { HOW, STORY } from '../src/game/content/copy';
import { botAct } from '../src/game/bot';
import { QUESTIONS } from '../src/ui/bargames';
import { BAR_BUFFS, BUFFS, MACHINES, PERKS, QUIZ, boardBonus, buffOn, buyAttract, buyPerk, endPlay, grant, perk, perkPrice, postShuffle, shelfOf, startPlay } from '../src/game/room';
import { handTier } from '../src/ui/machines';
import { readdirSync, readFileSync } from 'node:fs';

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
check(`Route 9: ${r9.length} shops + ${bosses(0).length} bosses = 27 battlers`, r9.length + bosses(0).length === 27 && new Set([...r9.map((x) => x.battler), ...bosses(0)]).size === 27);
check(`Bypass: ${bp.length} shops (${bp.filter((x) => !r9.some((y) => y.battler === x.battler)).length} new kinds) + ${bosses(1).length} bosses`, bp.length >= 12 && new Set(bp.map((x) => x.battler)).size === bp.length);
check('every battler and shop id resolves', SHOP_LIST.every((x) => BATTLERS[x.battler]) && REGIONS.every((r) => r.lots.every((l) => BATTLERS[l.boss.joins])));
check('every enemy weakness is a battler that region can field', REGIONS.every((r) => r.lots.every((l) => [...l.regulars, l.boss].every((e) => [...SHOP_LIST.filter((x) => x.region === r.id).map((x) => x.battler), ...bosses(r.id)].includes(e.weak)))));
check('every battler and enemy has its own look', Object.keys(BATTLERS).every((id) => CREW_LOOKS[id] || bosses(0).includes(id) || bosses(1).includes(id)) && REGIONS.every((r) => r.lots.every((l) => [...l.regulars, l.boss].every((e) => ENEMY_LOOKS[e.name]))));
check('shops unlock in lease order', [0, 1].every((r) => { const l = SHOP_LIST.filter((x) => x.region === r && x.fight >= 0).map((x) => FIGHTS[r].findIndex((f) => f.zone === x.zone && f.i === x.fight)); return l.every((v, i) => v >= 0 && (i === 0 || v >= l[i - 1])); }));
check('fight ladders: Route 9 84, Bypass 56', FIGHTS[0].length === 84 && FIGHTS[1].length === 56);
check('wins to clear and pay never go down inside a lot', FIGHTS.every((L) => L.every((f, i) => i === 0 || f.boss || L[i - 1].zone !== f.zone || (f.need >= L[i - 1].need && f.pay >= L[i - 1].pay))));
check(`wins to clear grow gently: ${FIGHTS[0][0].need} at the start, ${FIGHTS[0].at(-2)!.need} at the end; bosses 1`, FIGHTS[0][0].need === 3 && FIGHTS[0].at(-2)!.need === 10 && FIGHTS.every((L) => L.every((f) => !f.boss || f.need === 1)));
check('enemy strength never goes down inside a lot', FIGHTS.every((L) => L.every((f, i) => i === 0 || L[i - 1].zone !== f.zone || f.strength >= L[i - 1].strength)));
check('enemy groups grow: 1 at the start, 6 by Pinewood Commons', enemyLineup(0, 0).length === 1 && enemyLineup(0, FIGHTS[0].length - 2).length === 6);
check('shop tiers: the Pawn Shop is tier 0, later shops sit higher', tierOf('pawn') === 0 && tierOf(r9.at(-1)!.id) > tierOf(r9[3].id));

// roster: a full field says where more slots come from, and stops offering once there are none
{
  const t = newGame(5);
  const m = fieldFull(t, 0);
  check('full field: bench someone, or the Back Office / prize counter', m.includes('Bench someone first') && m.includes('Back Office') && m.includes('prize counter'));
  t.crews[0].slotBuys = 2;
  t.room.perks.slot = 2;
  const m2 = fieldFull(t, 0);
  check(`maxed field (${slotsOf(t, 0)}/${MAX_SLOTS}): just bench someone, no buy line`, slotsOf(t, 0) === MAX_SLOTS && m2.includes('Bench someone first') && !/buy|Back Office|prize/i.test(m2));
}
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
{
  const t = newGame(11);
  check('Parking Lot patrol is $50 from the start', patrolPrice(t, 0, 0) === 50 && !autoCovers(t, 0, 0) && patrolBlock(t, 0, 0) === null);
  t.crews[0].cash = 50;
  check('signing it turns on auto for the lot', buyPatrol(t, 0, 0) === null && autoCovers(t, 0, 0) && t.crews[0].cash === 0);
  t.crews[0].frontier = 9;
  check('Big-Box patrol: sold once the lot is reached, at its sign price', patrolBlock(t, 0, 1) === null && patrolPrice(t, 0, 1) === REGIONS[0].lots[1].patrol);
}
check('advance stops at the frontier', advance(s, 0, 1) === null && advance(s, 0, 1) === null && advance(s, 0, 1) !== null && s.crews[0].at === 2);
{
  const t = newGame(2);
  t.crews[0].frontier = 30;
  t.crews[0].at = 30;
  for (let i = 0; i < 2000 && t.crews[0].at === 30; i++) step(t);
  check('a fresh loss at the frontier: smoke break, back one fight to farm', t.crews[0].at === 29 && t.crews[0].losses === 1 && t.crews[0].tries === 1 && t.crews[0].smoke === SMOKE_BREAK_SECONDS && Object.keys(t.crews[0].wounds).length === 0);
}
{
  // damage carries over: a win leaves wounds, the next fight starts on them
  const t = newGame(4);
  t.crews[0].frontier = 0;
  t.crews[0].at = 0;
  let worn = false;
  for (let i = 0; i < 4000 && !worn; i++) {
    step(t);
    const b = t.crews[0].battle;
    worn = !!b && b.t === 0 && !b.fresh && b.crew.some((u) => u.hp < u.maxHp);
  }
  check('damage carries over: after a win the next group walks in on a hurt crew', worn);
  const c = t.crews[0];
  c.frontier = Math.max(c.frontier, c.at + 2);
  advance(t, 0, 1);
  check('moving to a new fight is a smoke break: full HP', Object.keys(c.wounds).length === 0 && c.smoke === SMOKE_BREAK_SECONDS && c.regroup === SMOKE_BREAK_SECONDS);
}

// battle rules
{
  const t = newGame(3);
  t.crews[0].shops = Object.fromEntries(r9.map((x) => [x.id, 5]));
  finish(t, 0);
  const team = roster(t, 0);
  check('27 on the crew with every boss joined', team.length === 27);
  const b = startBattle(t, 0)!;
  check(`${START_SLOTS} fighter slots to start; buffers stand on the curb, not in a slot`, slotsOf(t, 0) === START_SLOTS && b.crew.length === START_SLOTS && b.crew.every((u) => u.role !== 'buffer') && curb(t, 0).length > 0);
  check('aura from the curb: Personal Trainer gives tanks +20% HP', b.crew.find((u) => u.role === 'tank')!.maxHp > statsOf(t, 0, b.crew.find((u) => u.role === 'tank')!.id, 5 + tierOf(r9.find((x) => x.battler === b.crew.find((u) => u.role === 'tank')!.id)?.id ?? 'pawn')).hp * 1.15);
  check('caps hold: stun, confuse <= 35%', b.field.stun <= 0.35 && b.field.confuse <= 0.35);
  check('Copy Guy copies an aura at half strength', auras(t, [['copyguy', 5], ['trainer', 5]], 0).filter((a) => a.fx.k === 'hpUp').length === 2);
  check('front rank is the tanks', b.crew[0].role === 'tank');
  t.goodwill = 1e9;
  check(`slots: buy up to ${MAX_SLOTS}, never more`, (() => { for (let i = 0; i < 10; i++) buySlot(t, 0); return slotsOf(t, 0) === MAX_SLOTS - 2 && buySlot(t, 0) !== null; })());
  const bench = lineupOf(t, 0)[1];
  check('bench and field by hand', toggleField(t, 0, bench) === null && !lineupOf(t, 0).includes(bench) && toggleField(t, 0, bench) === null && lineupOf(t, 0).includes(bench));
  {
    // spread hits: across a few fights, someone besides the tank takes damage
    const u = structuredClone(t);
    u.crews[0].at = 60;
    let spread = false;
    for (let k = 0; k < 5 && !spread; k++) {
      const bb = startBattle(u, 0)!;
      for (let i = 0; i < 400 && !stepBattle(u, bb, 0.2, false); i++) if (bb.crew.some((x) => x.role !== 'tank' && x.hp < x.maxHp)) spread = true;
    }
    check('spread hits: enemies get past the tank', spread);
  }
  check(`weakness is a small bonus (+${WEAK_BONUS * 100}%)`, WEAK_BONUS <= 0.25);
  const lu = enemyLineup(0, 0);
  check('fight 1 is one enemy; the first boss brings two', lu.length === 1 && enemyLineup(0, 8).length === 3 && enemyLineup(0, 8)[0].boss);
  t.crews[0].cash = 1e12;
  check('overtime: costs rent, boosts the next 3 fights', overtime(t, 0) === null && t.crews[0].overtime === 3 && startBattle(t, 0)!.overtime && (t.crews[0].overtime as number) === 2);
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
  {
    // Plaza Management: hidden before dawn, leased in Equity after, every level +5% rent on both roads
    const pre = newGame(9);
    check('Plaza Management is not for lease before dawn', !forLease(pre, 0).some((x) => x.id === 'mgmt') && lease(pre, 'mgmt') !== null);
    const m = structuredClone(t);
    delete m.crews[0].shops.mgmt;
    m.crews[1].shops = { storage: 1 };
    m.equity = 100;
    const cash = m.crews[0].cash;
    const r0 = rentPerSec(m, 0), r1 = rentPerSec(m, 1);
    check('Plaza Management: for lease after dawn, in Equity', forLease(m, 0).some((x) => x.id === 'mgmt') && lease(m, 'mgmt') === null && m.equity === 100 - SHOPS.mgmt.lease && m.crews[0].cash === cash);
    m.crews[0].shops.mgmt = 3;
    check('Plaza Management Lv 3: +9% rent on both roads', Math.abs(rentPerSec(m, 0) / r0 - 1.09) < 1e-9 && Math.abs(rentPerSec(m, 1) / r1 - 1.09) < 1e-9);
    check("Uncle Sal fights at the best shop's level, plus his own", powerLevel(m, 'mgmt') === Math.max(...r9.filter((x) => x.id !== 'mgmt').map((x) => powerLevel(m, x.id))) + 2);
  }
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
  const v5 = JSON.stringify({ version: 4, crews: [], cash: 5 });
  store.set('smw.save', v5);
  check('a v0.5 save reads as old and is copied where /v0.5/ finds it', loadGame() === 'old' && old.from === 'v0.5' && store.get('smw-v0.5:smw.save') === v5);
  store.set('smw.save', '{nope');
  check('a broken save does not crash', loadGame() === 'old');
}

// the Fun Zone
{
  const t = newGame(13);
  t.crews[0].cash = 1e9;
  const fzAt = FIGHTS[0].findIndex((f) => f.zone === 0 && f.i === 6);
  t.crews[0].frontier = fzAt;
  check('the Fun Zone is not for lease before Parking Lot fight 7', lease(t, 'funzone') !== null);
  t.crews[0].frontier = fzAt + 1;
  check('the Fun Zone leases at Parking Lot fight 7 for $20K and opens the Coin Pusher', SHOPS.funzone.lease === 20000 && (step(t), !t.room.unlocked.length) && lease(t, 'funzone') === null && (step(t), t.room.unlocked.includes('pusher')) && roster(t, 0).some(([id]) => id === 'tokenkid'));
  const c0 = t.crews[0].cash;
  check('a quarter in, dollars out', startPlay(t, 'pusher') === null && t.crews[0].cash < c0 && (endPlay(t, 'pusher', 0.8), t.crews[0].cash > c0));
  check('locked machines stay dark', startPlay(t, 'claw') !== null);
  {
    const u = newGame(14);
    u.crews[0].frontier = FIGHTS[0].findIndex((f) => f.zone === 3);
    step(u);
    check('every machine needs the lease: Big-Box captured, no Fun Zone, no Whac', !u.room.unlocked.includes('whac'));
    u.room.shelf = [0, 0];
    for (let i = 0; i < 60 / STEP; i++) step(u);
    check('the pusher pile and the darts pot come back one a minute', Math.abs(u.room.shelf[0] - 1) < 0.05 && Math.abs(u.room.shelf[1] - 1) < 0.05);
  }
  t.room.unlocked.push('claw');
  t.tickets = 49;
  check('the claw costs 50 tickets', startPlay(t, 'claw') !== null && ((t.tickets = 50), startPlay(t, 'claw') === null) && t.tickets === 0);
  t.tickets = 7500;
  check('prize counter: slots 6 and 7 for tickets', buyPerk(t, 'slot') === null && buyPerk(t, 'slot') === null && slotsOf(t, 0) === START_SLOTS + 2 && buyPerk(t, 'slot') !== null);
  const firstPrice = Math.min(...Object.keys(PERKS).map((id) => perkPrice(newGame(1), id as keyof typeof PERKS)));
  check(`prize counter: ${Object.keys(PERKS).length} pre-dawn prizes, first costs ${firstPrice} tickets`, Object.keys(PERKS).length >= 8 && Object.keys(PERKS).length <= 10 && firstPrice >= 200 && firstPrice <= 400);
  {
    const u = newGame(14);
    u.room.unlocked.push('pusher', 'skee');
    u.tickets = 400;
    check('prize counter sells the cheapest prize first', buyPerk(u, 'mug') === null && u.tickets === 150 && perk(u, 'mug') === 1);
    check('the back room is closed before dawn', shelfOf(u).every((id) => id in PERKS) && perkPrice(u, 'bpSlot') === Infinity);
  }
  {
    const u = newGame(14);
    u.room.unlocked.push('skee');
    u.crews[0].cash = 1e6;
    u.tickets = 0;
    let next = 0;
    while (u.totalTime < 2 * 3600) {
      if (u.totalTime >= next) (botAct(u, { room: true }, 600), (next = u.totalTime + 600));
      step(u);
    }
    const bought = Object.values(u.room.perks).some((n) => (n ?? 0) > 0);
    check(`a Fun Zone visit buys a first prize within 2h of Skee (tickets ${u.tickets}, perks ${JSON.stringify(u.room.perks)})`, bought);
  }
  {
    const u = newGame(14);
    u.bypass = true;
    view(u, 1);
    const ot0 = u.crews[0].overtime;
    grant(u, 'watch');
    grant(u, 'ball');
    check('claw toys apply to the crew that is fighting', u.crews[1].overtime === 5 && u.crews[1].rally >= 30 && u.crews[0].overtime === ot0);
    u.tickets = 2000;
    check('the back room opens after dawn', shelfOf(u).includes('bpSlot') && buyPerk(u, 'bpSlot') === null && slotsOf(u, 1) === START_SLOTS + 1);
  }
  const typ = MACHINES.find((m) => m.id === 'skee')!.pay(newGame(1), 0.7).tickets ?? 0;
  check(`Skee typical payout is ${typ} tickets at 70% quality`, typ >= 50 && typ < 140);
  check('Attract Mode plays by itself, rarely', buyAttract(t, 'pusher') === null && (() => { const p = t.room.plays; for (let i = 0; i < (300 + 10) / STEP + 5; i++) step(t); return t.room.plays === p + 1; })());
  t.crews[0].frontier = FIGHTS[0].length;
  t.ending = 0;
  const room = JSON.stringify({ ...t.room, clock: 0, shelf: 0, buffs: 0 });
  pave(t);
  check('the Fun Zone survives paving: tickets, perks, unlocks, Attract Mode', JSON.stringify({ ...t.room, clock: 0, shelf: 0, buffs: 0 }) === room && slotsOf(t, 0) === START_SLOTS + 2);
}

// the Off-Ramp
{
  const t = newGame(14);
  finish(t, 0);
  t.bypass = true;
  view(t, 1);
  t.equity = 50;
  t.crews[1].frontier = 5;
  check('the Off-Ramp leases at Exit 14 fight 4 for 2 Equity and opens Darts', SHOPS.offramp.lease === 2 && lease(t, 'offramp') === null && (step(t), t.room.unlocked.includes('darts')) && roster(t, 1).some(([id]) => id === 'bartender') && BATTLERS.bartender.role === 'tank');
  const c0 = t.crews[1].cash = 1e6;
  check('darts take the Bypass till and pay it back on a good round', startPlay(t, 'darts') === null && t.crews[1].cash < c0 && (endPlay(t, 'darts', 0.9), t.crews[1].cash > c0));
  check('the bar takes no tickets: Attract Mode upgrades cost $', (t.tickets = 0, buyAttract(t, 'darts') === null && buyAttract(t, 'darts') === null));
  t.room.unlocked.push('poker');
  check('video poker: a full house is +30% for 10 minutes, nothing pays nothing', !endPlay(t, 'poker', 0).buff && endPlay(t, 'poker', 0.75).buff === 'top' && t.room.buffs.top === 600);
  const hp = (r: 0 | 1) => { const u = startBattle(t, r)!.crew; return u.reduce((a, x) => a + x.maxHp, 0); };
  const withBuff = hp(1);
  t.room.buffs = {};
  check('bar buffs only lift the Bypass crew', withBuff > hp(1) * 1.25 && !BAR_BUFFS.some(([b]) => buffOn(t, b)));
  check('hands: royal, full house, jacks, low pair', handTier([12, 11, 10, 9, 8]).join() === '4,ROYAL FLUSH' && handTier([0, 13, 26, 1, 14])[0] === 3 && handTier([9, 22, 2, 30, 45])[0] === 1 && handTier([0, 13, 5, 30, 45])[0] === 0);
  const s0 = slotsOf(t, 1);
  check('shuffleboard: each house score is +6% Equity per win, the third adds a slot', postShuffle(t, 14) === 2 && slotsOf(t, 1) === s0 && postShuffle(t, 17) === 1 && slotsOf(t, 1) === s0 + 1);
  check('six at the bar, like the arcade', MACHINES.filter((m) => m.region === 1).length === 6 && MACHINES.filter((m) => m.region === 0).length === 6);
  t.room.unlocked.push('foos', 'trivia');
  const e0 = t.equity;
  check('foosball pays Equity by the goal', startPlay(t, 'foos') === null && (endPlay(t, 'foos', 0.3), t.equity > e0));
  const base = 1 + 0.06 * t.room.shuffle;
  check('trivia: three right is +10% Equity per win, five is +25%', !endPlay(t, 'trivia', 0.4).buff && endPlay(t, 'trivia', 0.6).buff === 'quiz' && Math.abs(boardBonus(t, 1) - base - 0.1) < 1e-9 && endPlay(t, 'trivia', 1).buff === 'genius' && Math.abs(boardBonus(t, 1) - base - 0.25) < 1e-9 && boardBonus(t, 0) === 1 + 0.06 * t.room.board);
  check('trivia questions fit the screen', QUESTIONS.every((q) => q.slice(1).every((a) => a.length <= 19) && q.slice(1).length === 4 && new Set(q.slice(1)).size === 4));
}

// pre-dawn copy: nothing before the Route 9 ending may hint at the Bypass, Equity or a second crew
{
  const LEAK = /bypass|equity|second crew|both crews|each crew|other crew|this crew only|only this crew|own till|exit 14|route 9 north/i;
  const texts: string[] = [...HOW.flat(), ...STORY.map((x) => x.text)];
  for (const sh of r9) texts.push(sh.name, sh.tagline, sh.walkin.who, ...Object.values(sh.walkin).flat().map(String));
  for (const id of [...r9.map((x) => x.battler), ...bosses(0)]) texts.push(BATTLERS[id].name, BATTLERS[id].does, BATTLERS[id].line);
  for (const l of REGIONS[0].lots) texts.push(l.name, l.blurb, l.clearText, ...[...l.regulars, l.boss].flatMap((e) => [e.name, e.title]));
  texts.push(REGIONS[0].name, ...Object.values(REGIONS[0].chrome));
  for (const m of MACHINES.filter((x) => x.region === 0)) texts.push(m.name, m.blurb, m.needs);
  for (const [k, b] of Object.entries(BUFFS)) if (k !== 'shot' && ![...BAR_BUFFS, ...QUIZ].some(([x]) => x === k)) texts.push(b.name, b.does);
  for (const p of Object.values(PERKS)) texts.push(p.name, p.does);
  let t = newGame(12);
  let next = 0;
  while (!t.bypass && t.totalTime < 30 * 3600) {
    if (t.totalTime >= next) ((t = botAct(t, { active: true }, 10)), (next = t.totalTime + 10));
    step(t, true);
  }
  const pre = t.log.filter((l) => l.r === 0 && !l.text.includes(REGIONS[0].ending));
  texts.push(...pre.map((l) => l.text));
  const bad = texts.filter((x) => LEAK.test(x));
  check(`pre-dawn copy: ${texts.length} strings and receipt lines, no Bypass / Equity / second-crew hints${bad.length ? ` (${bad.slice(0, 3).join(' | ')})` : ''}`, bad.length === 0);
  // every post-dawn word lives in content/dawn.ts or content/bypass.ts: grep the strings in the rest of src/
  const DAWN_WORDS = /bypass|equity|exit 14|off-ramp|galleria|route 9 north|second crew|both crews|each crew|other crew|own till/i;
  const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${d}/${e.name}`] : []));
  const OK = new Set(['src/game/content/dawn.ts', 'src/game/content/bypass.ts', 'src/debug.ts']);
  const strays: string[] = [];
  for (const f of walk('src').filter((x) => !OK.has(x))) {
    const code = readFileSync(f, 'utf8').split('\n').filter((x) => !/^\s*(\/\/|import )/.test(x)).map((x) => x.replace(/\s\/\/ .*$/, '')).join('\n');
    const lits = code.match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`|>[^<>{}\n]*</g) ?? [];
    for (const l of lits.map((x) => x.replace(/\$\{[^}]*\}/g, ''))) if (DAWN_WORDS.test(l) && !/^['"`][a-z0-9 _-]+['"`]$/.test(l)) strays.push(`${f.slice(4)}: ${l.slice(0, 50)}`);
  }
  check(`post-dawn words only in content/dawn.ts and content/bypass.ts${strays.length ? ` (${strays.slice(0, 4).join(' | ')})` : ''}`, strays.length === 0);
  const CUT = /fights run themselves|nice to have|never required|ignoring them|this crew only|only this crew|both crews|own till|every shop pays rent and sends/i;
  const ui = readdirSync('src/ui').filter((f) => f.endsWith('.tsx')).flatMap((f) => readFileSync(`src/ui/${f}`, 'utf8').split('\n').filter((x) => CUT.test(x)).map((x) => `${f}: ${x.trim().slice(0, 60)}`));
  check(`no design-explaining copy in the UI${ui.length ? ` (${ui.join(' | ')})` : ''}`, ui.length === 0);
}

console.log(failed ? `\n${failed} FAILED` : '\nall good');
process.exit(failed ? 1 : 0);
