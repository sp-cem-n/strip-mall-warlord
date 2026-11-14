// A scripted player for balance runs and the debug `advance` param. Plays like someone who checks in now and then.
import { FIGHTS, ROLES, SHOPS, REGIONS, type RegionId } from './defs';
import { enemyLineup } from './battle';
import { advance, bal, buyPatrol, buySlot, convert, curb, forLease, leased, lease, lineupOf, overtime, overtimeCost, patrolBlock, patrolPrice, pave, purse, regionDone, renovate, renovateCost, rentPerSec, retryAfter, setStance, slotPrice, topFight, train, trainCost, view } from './economy';
import { collectFind } from './sim';
import type { GameState } from './state';

export interface BotOpts {
  active?: boolean; // grabs walk-ins, calls plays, buys overtime for bosses
  manual?: boolean; // presses Advance (default true); false = pure idle
  pave?: number; // paves Route 9 after farming its last fight this many hours (undefined = never)
  doneAt?: number;
  convert?: number; // share of Goodwill converted to Equity once the Bypass is open
  room?: boolean; // plays the arcade / bar half the time it's online
}

function crewAct(s: GameState, r: RegionId, o: BotOpts) {
  const c = s.crews[r];
  const R = REGIONS[r];
  for (let g = 0; g < 5; g++) {
    const next = forLease(s, r).sort((a, b) => a.lease - b.lease)[0];
    if (!next || lease(s, next.id)) break;
  }
  const pending = forLease(s, r).sort((a, b) => a.lease - b.lease)[0]?.lease ?? 0;
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
  const cands = leased(s, r).filter((x) => useful.has(x.battler) || x.id === R.security);
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
    if (purse(s, r) < trainCost(r, c.train[role]) || train(s, r, role)) break;
  }
  if (o.manual !== false && c.at < topFight(s, r) && (c.at + 1 < c.frontier || c.farmed >= retryAfter(s, r))) advance(s, r, 1);
  if (o.active) {
    const f = FIGHTS[r][Math.min(c.at, FIGHTS[r].length - 1)];
    const tells = enemyLineup(r, c.at).map((e) => e.def.tell);
    const lead = tells[0];
    setStance(s, r, lead === 'tanky' ? 'rush' : lead === 'hard' ? 'dig' : 'even');
    if (f.boss && c.at === c.frontier && c.streak > 0 && c.overtime === 0 && c.cash >= overtimeCost(s, r) && overtimeCost(s, r) < (pending || Infinity) * 0.5) overtime(s, r);
  }
}

export function botAct(s: GameState, o: BotOpts = {}, _dt = 10): GameState {
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
