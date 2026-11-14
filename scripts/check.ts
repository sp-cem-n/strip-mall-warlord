// Small invariant checks. Run: bun scripts/check.ts
import { OFFLINE_CAP_SECONDS } from '../src/game/defs';
import { newGame, openShop, upgradeShop, leaseUnit } from '../src/game/economy';
import { loadGame, saveGame } from '../src/game/save';
import { bulldoze, simulateAway } from '../src/game/sim';

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
check('start with one leased unit', s.slots.filter((x) => x.leased).length === 1);
check('payday locked at start', openShop(s, 0, 'payday') === 'Not unlocked yet');
check('dojo opens', openShop(s, 0, 'dojo') === null && s.slots[0].shop?.kind === 'dojo');
check('cannot afford lease yet', leaseUnit(s) === 'Not enough cash');
s.cash = 1e6;
check('upgrade raises level', upgradeShop(s, 0) === null && s.slots[0].shop!.level === 2);

saveGame(s);
check('save round-trips', loadGame()?.slots[0].shop?.level === 2);
store.set('smw.save.v1', '{not json');
check('corrupt save falls back to null', loadGame() === null);
store.set('smw.save.v1', JSON.stringify({ version: 999 }));
check('wrong version falls back to null', loadGame() === null);

const away = simulateAway(newGame(2), 999999);
check('offline progress is capped at 8h', away.seconds === OFFLINE_CAP_SECONDS);

const rich = newGame(3);
rich.zone = 2;
rich.stats.earned = 1e6;
const next = bulldoze(rich);
check('bulldoze grants asphalt and resets', next.asphalt === 2 * 2 + 6 && next.zone === 0 && next.bulldozes === 1);

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log('all checks passed');
