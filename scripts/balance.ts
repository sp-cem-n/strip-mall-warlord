// Headless balance run: a scripted player plays N hours and we print milestones.
// Usage: bun scripts/balance.ts [hours=20] [seed=1991] [--every=10] [--active] [--idle] [--pave=H] [--convert=0.5]
import { FIGHTS, REGIONS, SHOP_LIST, STEP } from '../src/game/defs';
import { botAct, describeCrew, type BotOpts } from '../src/game/bot';
import { lotsTaken, newGame, rentPerSec } from '../src/game/economy';
import { fightLabel, simulateAway, step } from '../src/game/sim';
import type { GameState } from '../src/game/state';
import { fmt, fmtTime } from '../src/ui/format';

const args = process.argv.slice(2);
const nums = args.filter((a) => /^[\d.]+$/.test(a)).map(Number);
const flag = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const hours = nums[0] ?? 20;
const seed = nums[1] ?? 1991;
const every = Number(flag('every') ?? 10);
const o: BotOpts = { active: args.includes('--active'), manual: !args.includes('--idle'), pave: flag('pave') === undefined ? undefined : Number(flag('pave')), convert: Number(flag('convert') ?? 0.5) };

let s: GameState = newGame(seed);
const seen = new Set<string>();
const lines: string[] = [];
const mark = (key: string, text: string) => !seen.has(key) && (seen.add(key), lines.push(`${fmtTime(s.totalTime).padStart(8)}  ${text}`));
const snaps: string[] = [];
let nextAct = 0;
let nextSnap = 1800;
let last = { gw: 0, eq: 0, bank: 0 };
const t0 = Date.now();
while (s.totalTime < hours * 3600) {
  if (s.totalTime >= nextAct) {
    s = botAct(s, o);
    nextAct = s.totalTime + every;
  }
  step(s, o.active);
  const run = s.paves;
  if (s.crews[0].wins) mark('win', 'first win');
  for (const r of [0, 1] as const) {
    const c = s.crews[r];
    for (const sh of SHOP_LIST) if (sh.region === r && c.shops[sh.id]) mark(`l${run}-${sh.id}`, `${REGIONS[r].name}: leased ${sh.name}${r === 0 && run ? ` (run ${run + 1})` : ''}`);
    REGIONS[r].lots.forEach((l, z) => z < lotsTaken(s, r) && mark(`c${r === 0 ? run : 'b'}-${r}-${z}`, `${REGIONS[r].name}: CAPTURED ${l.name}${r === 0 && run ? ` (run ${run + 1})` : ''}`));
  }
  if (s.bypass) mark('bypass', `ROUTE 9 ENDING. The Bypass found. Goodwill banked ${fmt(s.goodwill)}`);
  for (let p = 1; p <= s.paves; p++) mark(`p${p}`, `PAVE #${p} -> asphalt ${s.asphalt}`);
  if (s.totalTime >= nextSnap) {
    nextSnap += 1800;
    // Income over the last half hour: Goodwill from Route 9 wins, Equity from Bypass wins, Equity from the bank.
    const gwRate = (s.stats.goodwill - last.gw) / 1800, eqRate = (s.stats.equity - last.eq) / 1800, bankRate = (s.stats.banked - last.bank) / 1800;
    last = { gw: s.stats.goodwill, eq: s.stats.equity, bank: s.stats.banked };
    const at = (r: 0 | 1) => (s.crews[r].frontier >= FIGHTS[r].length ? 'done' : fightLabel(r, s.crews[r].at));
    snaps.push(`${fmtTime(s.totalTime).padStart(8)}  R9 $${fmt(s.crews[0].cash).padStart(6)} ${fmt(rentPerSec(s, 0)).padStart(5)}/s GW ${fmt(s.goodwill).padStart(6)} +${fmt(gwRate)}/s W${s.crews[0].wins}/L${s.crews[0].losses} ${at(0)} [${describeCrew(s, 0)}]`);
    if (s.bypass) snaps.push(`${''.padStart(8)}  BP $${fmt(s.crews[1].cash).padStart(6)} ${fmt(rentPerSec(s, 1)).padStart(5)}/s EQ ${fmt(s.equity).padStart(6)} +${fmt(eqRate)}/s wins +${fmt(bankRate)}/s bank W${s.crews[1].wins}/L${s.crews[1].losses} ${at(1)} [${describeCrew(s, 1)}]`);
  }
}

console.log(`Strip Mall Warlord balance: ${hours}h, seed ${seed}, ${o.active ? 'active' : 'checks in'}${o.manual ? '' : ', pure idle (never presses Advance)'}${o.pave !== undefined ? `, paves after ${o.pave}h of farming` : ''}, converts ${o.convert! * 100}% of Goodwill, acts every ${every}s, step ${STEP}s (${((Date.now() - t0) / 1000).toFixed(1)}s wall)\n`);
console.log('Milestones');
lines.forEach((l) => console.log(l));
console.log('\nEvery 30 minutes');
snaps.forEach((l) => console.log(l));

const idle = botAct(newGame(seed), o);
for (let i = 0; i < 300; i++) step(idle);
botAct(idle, o);
const away = simulateAway(idle, 8 * 3600);
console.log(`\nOffline (1 min of play, then 8h away): +$${fmt(away.earned)}, +${fmt(away.goodwill)} Goodwill, ${away.wins}W/${away.losses}L, fights cleared +${away.cleared}, captured: ${away.captured.join(', ') || 'none'}`);
