// A scripted player for balance runs and the debug `advance` param. Plays like someone who checks in now and then.
import { FIGHTS, ROLES, SHOPS, REGIONS, type RegionId } from './defs';
import { enemyLineup } from './battle';
import { advance, autoCovers, topFight, convert, forLease, leased, lease, overtime, overtimeCost, pave, purse, regionDone, renovate, renovateCost, setStance, train, trainCost, view } from './economy';
import { collectFind } from './sim';
import type { GameState } from './state';

export interface BotOpts {
  active?: boolean; // grabs walk-ins, calls plays, buys overtime for bosses
  manual?: boolean; // presses Advance (default true); false = pure idle
  pave?: number; // paves Route 9 after farming its last fight this many hours (undefined = never)
  doneAt?: number;
  convert?: number; // share of Goodwill converted to Equity once the Bypass is open
}

function crewAct(s: GameState, r: RegionId, o: BotOpts) {
  const c = s.crews[r];
  for (let g = 0; g < 5; g++) {
    const next = forLease(s, r).sort((a, b) => a.lease - b.lease)[0];
    if (!next || lease(s, next.id)) break;
  }
  const pending = r === 0 ? (forLease(s, r).sort((a, b) => a.lease - b.lease)[0]?.lease ?? 0) : 0;
  // the Security Office first when the next lot isn't covered
  const sec = REGIONS[r].security;
  const nextLot = FIGHTS[r][Math.min(c.frontier, FIGHTS[r].length - 1)].zone;
  if (c.shops[sec] && !autoCovers(s, r, nextLot) && o.manual === false) for (let g = 0; g < 10 && !renovate(s, sec); g++);
  for (let g = 0; g < 200; g++) {
    const cheapest = leased(s, r).filter((x) => x.id !== sec || !autoCovers(s, r, Math.min(nextLot + 1, REGIONS[r].lots.length - 1))).sort((a, b) => renovateCost(a.id, c.shops[a.id]) - renovateCost(b.id, c.shops[b.id]))[0];
    if (!cheapest) break;
    const cost = renovateCost(cheapest.id, c.shops[cheapest.id]);
    if (pending && cost > pending * 0.25) break;
    if (renovate(s, cheapest.id)) break;
  }
  const eqPending = r === 1 ? (forLease(s, 1).sort((a, b) => a.lease - b.lease)[0]?.lease ?? 0) : 0;
  for (let g = 0; g < 50; g++) {
    if (r === 1 && eqPending && trainCost(r, c.train[ROLES[0]]) > (s.equity - eqPending) ) break;
    const role = [...ROLES].sort((a, b) => c.train[a] - c.train[b])[0];
    if (purse(s, r) < trainCost(r, c.train[role]) || train(s, r, role)) break;
  }
  if (o.manual !== false && c.at < topFight(s, r) && (c.at + 1 < c.frontier || c.farmed >= 10)) advance(s, r, 1);
  if (o.active) {
    const f = FIGHTS[r][Math.min(c.at, FIGHTS[r].length - 1)];
    const tells = enemyLineup(r, c.at).map((e) => e.def.tell);
    const lead = tells[0];
    setStance(s, r, lead === 'tanky' ? 'rush' : lead === 'hard' ? 'dig' : 'even');
    if (f.boss && c.at === c.frontier && c.streak > 0 && c.overtime === 0 && c.cash >= overtimeCost(s, r) && overtimeCost(s, r) < (pending || Infinity) * 0.5) overtime(s, r);
  }
}

export function botAct(s: GameState, o: BotOpts = {}): GameState {
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
