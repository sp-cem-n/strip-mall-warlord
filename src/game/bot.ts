// A simple greedy player used by the balance script and the ?advance= debug param.
import { SHOP_ORDER, type ShopKind } from './defs';
import { leaseUnit, nextLeaseCost, openCost, openShop, shopsOf, unlockedShops, upgradeCost, upgradeShop } from './economy';
import { asphaltGain, bulldoze, canBulldoze } from './sim';
import type { GameState } from './state';

export interface BotOptions {
  prestige?: boolean;
  avoidPayday?: boolean;
}

export function botAct(s: GameState, opts: BotOptions = {}): GameState {
  for (let guard = 0; guard < 20; guard++) {
    const empty = s.slots.find((sl) => sl.leased && !sl.shop);
    const kinds = unlockedShops(s).filter((k) => !(opts.avoidPayday && k === 'payday'));
    type Option = { cost: number; weight: number; run: () => unknown };
    const options: Option[] = [];
    if (empty) {
      const missing = SHOP_ORDER.filter((k) => kinds.includes(k) && shopsOf(s, k).length === 0);
      const kind: ShopKind = missing.length ? missing[missing.length - 1] : kinds.reduce((a, b) => (openCost(s, a) < openCost(s, b) ? a : b));
      // newest unlock first, unless we can't field a front line yet
      const k = shopsOf(s, 'dojo').length === 0 ? 'dojo' : kind;
      options.push({ cost: openCost(s, k), weight: 0.4, run: () => openShop(s, empty.id, k) });
    }
    const lease = nextLeaseCost(s);
    if (lease !== null && !empty) options.push({ cost: lease, weight: 0.6, run: () => leaseUnit(s) });
    for (const sl of s.slots) if (sl.shop) options.push({ cost: upgradeCost(sl.shop.kind, sl.shop.level), weight: 1, run: () => upgradeShop(s, sl.id) });
    if (!options.length) break;
    const best = options.reduce((a, b) => (a.cost * a.weight < b.cost * b.weight ? a : b));
    if (best.cost > s.cash) break;
    best.run();
  }
  // bulldoze once progress has stalled for 8 minutes and the payout is worth it
  if (opts.prestige && canBulldoze(s) && s.time - s.lastCapture > 480 && asphaltGain(s) >= Math.max(5, s.asphalt * 0.6)) return bulldoze(s);
  return s;
}
