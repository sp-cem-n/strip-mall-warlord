// Headless balance run: a greedy bot plays N minutes and we print milestones.
// Usage: bun scripts/balance.ts [minutes=60] [seed=1991] [--prestige] [--no-payday]
import { ZONES } from '../src/game/defs';
import { botAct } from '../src/game/bot';
import { fighterCap, incomePerSec, newGame } from '../src/game/economy';
import { fmt, fmtTime, simulateAway, step } from '../src/game/sim';
import { STEP } from '../src/game/defs';
import type { GameState } from '../src/game/state';

const args = process.argv.slice(2);
const minutes = Number(args.filter((a) => /^\d+$/.test(a))[0] ?? 60);
const seed = Number(args.filter((a) => /^\d+$/.test(a))[1] ?? 1991);
const prestige = args.includes('--prestige');
const avoidPayday = args.includes('--no-payday');
const every = Number(args.find((a) => a.startsWith('--every='))?.slice(8) ?? 2); // seconds between player check-ins

let s: GameState = newGame(seed);
const seen = new Set<string>();
const milestones: string[] = [];
const mark = (key: string, text: string) => {
  if (seen.has(key)) return;
  seen.add(key);
  milestones.push(`${fmtTime(s.totalTime).padStart(7)}  ${text}`);
};

const total = minutes * 60;
let nextAct = 0;
let nextSnap = 300;
const snaps: string[] = [];
while (s.totalTime < total) {
  if (s.totalTime >= nextAct) {
    const before = s.bulldozes;
    s = botAct(s, { prestige, avoidPayday });
    if (s.bulldozes > before) mark(`bulldoze${s.bulldozes}`, `BULLDOZE #${s.bulldozes} → asphalt ${s.asphalt}`);
    nextAct = s.totalTime + every;
  }
  step(s);
  const r = s.roster;
  if (r.bouncer > 0) mark('fighter', 'first fighter trained');
  if (s.stats.wins > 0) mark('win', 'first win');
  if (s.stats.losses > 0) mark('loss', 'first loss');
  if (s.slots[1].leased) mark('lease1', 'leased Unit B');
  if (s.slots[2].leased) mark('lease2', 'leased Unit C');
  if (s.slots[3].leased) mark('lease3', 'leased Unit D');
  if (s.gear.weapon || s.gear.armor || s.gear.kit) mark('gear', 'first pawn-shop gear');
  if (s.heat >= 60) mark('heat', 'heat hits raid threshold');
  if (s.stats.raidsWon + s.stats.raidsLost > 0) mark('raid', `first raid (${s.stats.raidsWon ? 'won' : 'lost'})`);
  for (let z = 0; z < s.zone && z < ZONES.length; z++) mark(`cap${s.bulldozes}-${z}`, `CAPTURED ${ZONES[z].name}${s.bulldozes ? ` (run ${s.bulldozes + 1})` : ''}`);
  if (s.totalTime >= nextSnap) {
    nextSnap += 300;
    const zoneName = s.won ? 'region held' : `${ZONES[s.zone].name} ${s.wave + 1}/${ZONES[s.zone].waves}`;
    const crew = Object.entries(r).filter(([, n]) => n > 0).map(([k, n]) => `${k[0].toUpperCase()}${n}/${fighterCap(s, k as keyof typeof r)}`).join(' ');
    snaps.push(
      `${fmtTime(s.totalTime).padStart(7)}  $${fmt(s.cash).padStart(7)}  ${fmt(incomePerSec(s)).padStart(6)}/s  heat ${s.heat.toFixed(0).padStart(3)}  W${s.stats.wins}/L${s.stats.losses} R${s.stats.raidsWon}/${s.stats.raidsLost}  ${zoneName}  [${crew}]  shops: ${s.slots.filter((x) => x.shop).map((x) => `${x.shop!.kind}${x.shop!.level}`).join(',')}`,
    );
  }
}

console.log(`Strip Mall Warlord balance — ${minutes} min, seed ${seed}${prestige ? ', prestige on' : ''}${avoidPayday ? ', no payday' : ''}, acts every ${every}s, step ${STEP}s\n`);
console.log('Milestones');
for (const m of milestones) console.log(m);
console.log('\nEvery 5 minutes');
for (const m of snaps) console.log(m);

// Offline check: an idle player who opens a dojo and closes the tab for 8h.
const idle = newGame(seed);
botAct(idle);
const away = simulateAway(idle, 8 * 3600);
console.log(`\nOffline (dojo only, 8h cap): +$${fmt(away.earned)} earned, ${away.wins}W/${away.losses}L, captured: ${away.captured.join(', ') || 'none'}, trained ${away.trained}`);
