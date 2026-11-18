// A scripted player for balance runs and the debug `advance` param. Plays like someone who checks in now and then.
import { FIGHTS, RETRY_AFTER, ROLES, SHOPS, REGIONS, type RegionId } from './defs';
import { advance, bal, buyPatrol, buySlot, convert, curb, forLease, leased, lease, lineupOf, lotsTaken, patrolBlock, patrolPrice, pave, purse, regionDone, renovate, renovateCost, rentPerSec, slotPrice, topFight, train, trainCost, view } from './economy';
import { collectFind } from './sim';
import type { GameState } from './state';
import { BAR_BUFFS, QUIZ, serviced, MACHINE, PINBALL_TOP, SHUFFLE_TOP, buffOn, buyPerk, endPlay, perkPrice, pokerQ, postScore, postShuffle, shelfOf, startPlay, type MachineId } from './room';
import { rand } from './rng';

// The room player: half of online time, at about 70% skill. Keeps a claw toy going, spends tickets at the counter.
const MIX: [MachineId, number][] = [['pusher', 0.35], ['skee', 0.25], ['whac', 0.15], ['pinball', 0.1], ['cyclone', 0.15]];
const BAR_MIX: [MachineId, number][] = [['darts', 0.3], ['pool', 0.35], ['foos', 0.2], ['shuffle', 0.15]];
function barAct(s: GameState, o: BotOpts) {
  for (let g = 0; g < 20 && o.barBudget! > 0; g++) {
    let id: MachineId;
    if (s.room.unlocked.includes('poker') && !BAR_BUFFS.some(([b]) => buffOn(s, b))) id = 'poker';
    else if (s.room.unlocked.includes('trivia') && !QUIZ.some(([b]) => buffOn(s, b)) && !serviced(s, 'trivia')) id = 'trivia';
    else {
      const open = BAR_MIX.filter(([m]) => s.room.unlocked.includes(m)).map(([m, w]) => [m, m === 'shuffle' && s.room.shuffle >= 5 ? 0.03 : w] as [MachineId, number]);
      let x = rand(s) * open.reduce((a, [, w]) => a + w, 0);
      id = open.find(([, w]) => (x -= w) < 0)?.[0] ?? open[0][0];
    }
    o.barBudget! -= MACHINE[id].secs;
    if (startPlay(s, id)) continue;
    const skill = 0.7 * (0.75 + 0.5 * rand(s));
    const q = id === 'poker' ? pokerQ(s, true) : id === 'trivia' ? Math.round((0.45 + 0.55 * rand(s)) * 5) / 5 : id === 'pool' ? (rand(s) < 0.05 ? 1 : Math.min(5, Math.round(skill * 6)) / 6) : id === 'darts' ? (rand(s) < 0.03 ? 1 : Math.min(0.95, skill * 0.8)) : Math.min(1, skill);
    if (id === 'shuffle') postShuffle(s, Math.round(q * SHUFFLE_TOP));
    endPlay(s, id, q, true);
  }
}
function roomAct(s: GameState, o: BotOpts, dt: number) {
  // once the bar is open, most of the room time goes there
  const bar = s.room.unlocked.includes('darts');
  o.barBudget = (o.barBudget ?? 0) + (bar ? dt * 0.35 : 0);
  if (bar) barAct(s, o);
  o.roomBudget = (o.roomBudget ?? 0) + dt * (bar ? 0.15 : 0.5);
  // cheapest affordable prize first; never sit on tickets for a later slot
  const buyShelf = () => {
    const ids = shelfOf(s).slice().sort((a, b) => perkPrice(s, a) - perkPrice(s, b));
    for (const id of ids) while (isFinite(perkPrice(s, id)) && s.tickets >= perkPrice(s, id) && !buyPerk(s, id));
  };
  buyShelf();
  for (let g = 0; g < 20 && o.roomBudget > 0; g++) {
    let id: MachineId | undefined;
    if (s.tickets >= 50 && !buffOn(s, 'bat') && !buffOn(s, 'duck') && s.room.unlocked.includes('claw')) id = 'claw';
    else {
      const open = MIX.filter(([m]) => s.room.unlocked.includes(m));
      if (!open.length) break;
      let x = rand(s) * open.reduce((a, [, w]) => a + w, 0);
      id = open.find(([, w]) => (x -= w) < 0)?.[0] ?? open[0][0];
    }
    o.roomBudget -= MACHINE[id].secs;
    if (startPlay(s, id)) continue;
    const q = id === 'cyclone' ? (rand(s) < 0.12 ? 1 : rand(s) < 0.4 ? 0.5 : 0) : id === 'claw' ? 0.6 : Math.min(1, 0.7 * (0.75 + 0.5 * rand(s)));
    if (id === 'pinball') postScore(s, Math.round(q * PINBALL_TOP));
    endPlay(s, id, q, true);
  }
  buyShelf();
}

export interface BotOpts {
  active?: boolean; // grabs walk-ins and calls plays
  manual?: boolean; // presses Advance (default true); false = pure idle
  pave?: number; // paves Route 9 after farming its last fight this many hours (undefined = never)
  doneAt?: number;
  convert?: number; // share of Goodwill converted to Equity once the Bypass is open
  room?: boolean; // plays the arcade / bar half the time it's online
  roomBudget?: number;
  barBudget?: number;
}

function crewAct(s: GameState, r: RegionId, o: BotOpts) {
  const c = s.crews[r];
  const R = REGIONS[r];
  // The Fun Zone is a cash sink, not a ladder shop: don't freeze renovations to save up for it.
  const open = () => forLease(s, r).filter((x) => !x.dawn && x.id !== 'funzone').sort((a, b) => a.lease - b.lease);
  for (let g = 0; g < 5; g++) {
    const next = open()[0];
    if (!next || lease(s, next.id)) break;
  }
  // Plaza Management: leased in Equity once there's twice its price on hand
  const mgmt = forLease(s, r).find((x) => x.dawn);
  if (mgmt && s.equity >= 2 * mgmt.lease) lease(s, mgmt.id);
  const pending = open()[0]?.lease ?? 0;
  const arcade = forLease(s, r).find((x) => x.id === 'funzone');
  // Players can buy it at Parking Lot fight 7; the official bot waits until Outlet, as it used to, so early $20K does not starve Big-Box.
  if (arcade && lotsTaken(s, 0) >= 2 && c.cash >= arcade.lease) lease(s, arcade.id);
  // Patrol contracts for every lot reached; save up for one when it's under half an hour of rent.
  const zone = FIGHTS[r][Math.min(c.frontier, FIGHTS[r].length - 1)].zone;
  let reserve = 0;
  for (let z = 0; z <= zone; z++) {
    if (patrolBlock(s, r, z)) continue;
    const price = patrolPrice(s, r, z);
    if (buyPatrol(s, r, z) && price < rentPerSec(s, r) * 1800) reserve = Math.max(reserve, price);
  }
  // fighter slots, then training
  while (isFinite(slotPrice(s, r)) && !(R.trainIn === R.leaseIn && pending && bal(s, r, R.trainIn) - slotPrice(s, r) < pending) && !buySlot(s, r));
  // renovate what fights or buffs (and the Security Office), cheapest first
  const useful = new Set([...lineupOf(s, r), ...curb(s, r).map(([id]) => id)]);
  const cands = leased(s, r).filter((x) => useful.has(x.battler));
  for (let g = 0; g < 200; g++) {
    const cheapest = cands.sort((a, b) => renovateCost(a.id, c.shops[a.id]) - renovateCost(b.id, c.shops[b.id]))[0];
    if (!cheapest) break;
    const cost = renovateCost(cheapest.id, c.shops[cheapest.id]);
    if (R.leaseIn === 'cash' && pending && cost > pending * 0.25) break;
    if (reserve && c.cash - cost < reserve) break;
    if (renovate(s, cheapest.id)) break;
  }
  const eqPending = R.leaseIn === R.trainIn ? pending : 0;
  for (let g = 0; g < 50; g++) {
    const role = [...ROLES].sort((a, b) => c.train[a] - c.train[b])[0];
    if (eqPending && trainCost(r, c.train[role]) > purse(s, r) - eqPending) break;
    // save up for the next fighter slot once it costs less than a handful of training levels
    if (slotPrice(s, r) <= 6 * trainCost(r, c.train[role]) && trainCost(r, c.train[role]) > purse(s, r) - slotPrice(s, r)) break;
    if (purse(s, r) < trainCost(r, c.train[role]) || train(s, r, role)) break;
  }
  if (o.manual !== false && c.at < topFight(s, r) && c.farmed >= RETRY_AFTER) advance(s, r, 1);
}

export function botAct(s: GameState, o: BotOpts = {}, dt = 10): GameState {
  if (o.room) roomAct(s, o, dt);
  if (o.active && s.find) collectFind(s);
  if (s.ending) s.ending = 0; // dismiss the win card, keep the lights on
  if (s.bypass) {
    const share = o.convert ?? 0.5;
    const n = Math.floor((s.goodwill * share) / 100);
    if (n >= 1) convert(s, n);
  }
  crewAct(s, 0, o);
  if (s.bypass) crewAct(s, 1, o);
  if (o.pave !== undefined && regionDone(s, 0)) {
    o.doneAt ??= s.totalTime;
    if (s.totalTime - o.doneAt >= o.pave * 3600) {
      convert(s); // bank the Goodwill first: paving zeroes it
      pave(s);
      o.doneAt = undefined;
    }
  }
  if (o.active && s.bypass) view(s, s.view === 0 ? 1 : 0); // the active player flips between crews
  return s;
}

export const describeCrew = (s: GameState, r: RegionId) =>
  leased(s, r)
    .map((x) => `${SHOPS[x.id].name.split(' ')[0].slice(0, 4)}${s.crews[r].shops[x.id]}`)
    .join(' ');
