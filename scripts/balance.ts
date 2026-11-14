// Headless balance run: a scripted player plays N minutes and we print milestones.
// Usage: bun scripts/balance.ts [minutes=60] [seed=1991] [--every=10] [--strategy=mixed|static|dojo] [--prestige] [--active]
import { STEP, ZONES } from '../src/game/defs';
import { botAct, describeCrew, type Strategy } from '../src/game/bot';
import { heat, incomePerSec, newGame } from '../src/game/economy';
import { simulateAway, step } from '../src/game/sim';
import type { GameState } from '../src/game/state';
import { fmt, fmtTime } from '../src/ui/format';

const args = process.argv.slice(2);
const nums = args.filter((a) => /^\d+$/.test(a)).map(Number);
const flag = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const minutes = nums[0] ?? 60;
const seed = nums[1] ?? 1991;
const every = Number(flag('every') ?? 10);
const strategy = (flag('strategy') ?? 'mixed') as Strategy;
const prestige = args.includes('--prestige');
const active = args.includes('--active'); // a player who keeps the tab open and grabs walk-ins

let s: GameState = newGame(seed);
const seen = new Set<string>();
const lines: string[] = [];
const mark = (key: string, text: string) => !seen.has(key) && (seen.add(key), lines.push(`${fmtTime(s.totalTime).padStart(7)}  ${text}`));
const snaps: string[] = [];
let nextAct = 0;
let nextSnap = 300;
while (s.totalTime < minutes * 60) {
  if (s.totalTime >= nextAct) {
    const before = s.bulldozes;
    s = botAct(s, strategy, prestige);
    if (s.bulldozes > before) mark(`b${s.bulldozes}`, `BULLDOZE #${s.bulldozes} → asphalt ${s.asphalt}`);
    nextAct = s.totalTime + every;
  }
  step(s, active);
  if (s.stats.wins) mark('win', 'first win');
  if (s.stats.losses) mark('loss', 'first loss');
  for (let z = 0; z < s.zone; z++) mark(`c${s.bulldozes}-${z}`, `CAPTURED ${ZONES[z].name}${s.bulldozes ? ` (run ${s.bulldozes + 1})` : ''}`);
  if (s.totalTime >= nextSnap) {
    nextSnap += 300;
    const where = s.zone >= ZONES.length ? 'region taken' : `${ZONES[s.zone].name} ${s.row + 1}/${ZONES[s.zone].rows}`;
    snaps.push(`${fmtTime(s.totalTime).padStart(7)}  $${fmt(s.cash).padStart(7)}  ${fmt(incomePerSec(s)).padStart(6)}/s  heat +${Math.round(heat(s) * 100)}%  W${s.stats.wins}/L${s.stats.losses}  ${where}  [${describeCrew(s)}]`);
  }
}

console.log(`Strip Mall Warlord balance — ${minutes} min, seed ${seed}, strategy ${strategy}${prestige ? ', prestige on' : ''}${active ? ', active (walk-ins)' : ''}, acts every ${every}s, step ${STEP}s\n`);
console.log('Milestones');
lines.forEach((l) => console.log(l));
console.log('\nEvery 5 minutes');
snaps.forEach((l) => console.log(l));

const idle = botAct(newGame(seed), strategy);
for (let i = 0; i < 300; i++) step(idle); // one minute of play, then close the tab
botAct(idle, strategy);
const away = simulateAway(idle, 8 * 3600);
console.log(`\nOffline (1 min of play, then 8h away): +$${fmt(away.earned)}, ${away.wins}W/${away.losses}L, rows +${away.rows}, captured: ${away.captured.join(', ') || 'none'}`);
