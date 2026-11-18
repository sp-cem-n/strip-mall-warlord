// Headless balance run: a scripted player plays N hours; prints milestones, per-lot fight stats and 30-minute snapshots.
// Usage: bun scripts/balance.ts [hours=20] [seed=1991] [--every=600] [--active] [--idle] [--room] [--pave=H] [--convert=0.5] [--quiet] [--knob NAME=value ...]
//   check-in: --every=600 (default)   active: --active --every=10   active + arcade: --active --room --every=10   idle: --idle
//   --knob swaps a knobs.ts constant for this run only, e.g. --knob FIGHT_TIMEOUT=45 --knob "LOT_JUMP=[[2,1.45,1.103,1.286,0.619,1.089],[2,5,1.01,0.45]]"
//   --guard: check-in and active on 2 seeds; exits 1 if pacing or losses leave the targets. Run it before tagging.
// Save output under out/ (git-ignored) if you want to keep it.
import type { BotOpts } from '../src/game/bot';
import type { GameState } from '../src/game/state';
declare const Bun: any; // bun runtime (no @types/bun in this repo)

const args = process.argv.slice(2);
const knobArgs: string[] = [];
args.forEach((a, i) => {
  if (a === '--knob' && args[i + 1]) knobArgs.push(args[i + 1]);
  else if (a.startsWith('--knob=')) knobArgs.push(a.slice(7));
});
if (knobArgs.length) {
  const swaps = knobArgs.map((kv) => [kv.slice(0, kv.indexOf('=')), kv.slice(kv.indexOf('=') + 1)] as const);
  Bun.plugin({
    name: 'knobs',
    setup(b: any) {
      b.onLoad({ filter: /src[\\/]game[\\/]knobs\.ts$/ }, async ({ path }: { path: string }) => {
        let src = await Bun.file(path).text();
        for (const [k, v] of swaps) {
          const re = new RegExp(`(export const ${k} = )[^;]*;`);
          if (!re.test(src)) throw new Error(`--knob: no constant ${k} in knobs.ts`);
          src = src.replace(re, `$1${v.includes(',') && !v.startsWith('[') ? `[${v}]` : v};`);
        }
        return { contents: src, loader: 'ts' };
      });
    },
  });
}

if (args.includes('--guard')) await guard();

const { FIGHTS, REGIONS, SHOP_LIST } = await import('../src/game/defs');
const { botAct, describeCrew } = await import('../src/game/bot');
const { lotsTaken, newGame, rentPerSec } = await import('../src/game/economy');
const { fightLabel, onScreen, simulateAway, step } = await import('../src/game/sim');
for (const sh of SHOP_LIST) onScreen.add(sh.id); // the active player scrolls to whoever walks in
const { fmt, fmtTime } = await import('../src/ui/format');

const nums = args.filter((a) => /^[\d.]+$/.test(a)).map(Number);
const flag = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const hours = nums[0] ?? 20;
const seed = nums[1] ?? 1991;
const every = Number(flag('every') ?? (args.includes('--active') || args.includes('--skilled') ? 10 : 600));
const quiet = args.includes('--quiet');
const skilled = args.includes('--skilled');
const o: BotOpts = { active: skilled || args.includes('--active'), room: skilled || args.includes('--room'), skilled, manual: !args.includes('--idle'), pave: flag('pave') === undefined ? undefined : Number(flag('pave')), convert: Number(flag('convert') ?? 0.5) };

let s: GameState = newGame(seed);
const seen = new Set<string>();
const lines: string[] = [];
const mark = (key: string, text: string) => !seen.has(key) && (seen.add(key), lines.push(`${fmtTime(s.totalTime).padStart(8)}  ${text}`));
const done: Record<string, number> = {};
// per lot: frontier wins / losses, HP left on frontier wins, all wins / losses
type LotStat = { fw: number; fl: number; hp: number; w: number; l: number; boss: number };
const stat: LotStat[][] = REGIONS.map((r) => r.lots.map(() => ({ fw: 0, fl: 0, hp: 0, w: 0, l: 0, boss: 0 })));
const snaps: string[] = [];
let nextAct = 0;
let nextSnap = 1800;
const t0 = Date.now();
while (s.totalTime < hours * 3600) {
  if (s.totalTime >= nextAct) {
    s = botAct(s, o, every);
    nextAct = s.totalTime + (o.active || s.totalTime >= 1800 ? every : Math.min(every, 60)); // check-in players watch the first half hour
  }
  const before = s.crews.map((c) => ({ b: c.battle, front: c.battle && c.battle.fight === c.frontier, w: c.wins, l: c.losses, paves: s.paves }));
  step(s, !!o.active);
  for (const r of [0, 1] as const) {
    const c = s.crews[r], p = before[r];
    if (!p.b || c.battle === p.b || p.paves !== s.paves || (r === 0 && s.paves)) continue;
    const st = stat[r][FIGHTS[r][p.b.fight].zone];
    const won = c.wins > p.w;
    if (won) st.w++;
    else st.l++;
    if (p.front) {
      if (won) (st.fw++, (st.hp += p.b.crew.reduce((a, u) => a + u.hp, 0) / p.b.crew.reduce((a, u) => a + u.maxHp, 0)));
      else st.fl++;
      if (FIGHTS[r][p.b.fight].boss) st.boss++;
    }
  }
  if (s.crews[0].wins) mark('win', 'first win');
  for (const r of [0, 1] as const) {
    const c = s.crews[r];
    const run = r === 0 ? s.paves : 0;
    for (const sh of SHOP_LIST) if (sh.region === r && c.shops[sh.id] && !run) mark(`l-${sh.id}`, `${REGIONS[r].name}: leased ${sh.name}`);
    if (!run) for (const z of c.contracts) mark(`k-${r}-${z}`, `${REGIONS[r].name}: patrol contract ${REGIONS[r].lots[z].name}  rent ${fmt(rentPerSec(s, r))}/s`);
    REGIONS[r].lots.forEach((l, z) => {
      if (z >= lotsTaken(s, r)) return;
      const key = `c${run}-${r}-${z}`;
      if (!seen.has(key) && !run) done[`${r}-${z}`] = s.totalTime;
      mark(key, `${REGIONS[r].name}: CAPTURED ${l.name}${run ? ` (run ${run + 1})` : ''}  rent ${fmt(rentPerSec(s, r))}/s`);
    });
  }
  if (s.bypass) mark('bypass', `ROUTE 9 ENDING. Goodwill on hand ${fmt(s.goodwill)}`);
  for (let p = 1; p <= s.paves; p++) mark(`p${p}`, `PAVE #${p} -> asphalt ${s.asphalt}`);
  if (s.totalTime >= nextSnap) {
    nextSnap += 1800;
    const at = (r: 0 | 1) => (s.crews[r].frontier >= FIGHTS[r].length ? 'done' : fightLabel(r, s.crews[r].at));
    snaps.push(`${fmtTime(s.totalTime).padStart(8)}  R9 $${fmt(s.crews[0].cash).padStart(6)} ${fmt(rentPerSec(s, 0)).padStart(5)}/s GW ${fmt(s.goodwill).padStart(6)} TK ${fmt(s.tickets)} W${s.crews[0].wins}/L${s.crews[0].losses} ${at(0)} [${describeCrew(s, 0)}]`);
    if (s.bypass) snaps.push(`${''.padStart(8)}  BP $${fmt(s.crews[1].cash).padStart(6)} ${fmt(rentPerSec(s, 1)).padStart(5)}/s EQ ${fmt(s.equity).padStart(6)} W${s.crews[1].wins}/L${s.crews[1].losses} ${at(1)} [${describeCrew(s, 1)}]`);
  }
}

const mode = o.skilled ? 'skilled' : o.active ? (o.room ? 'active + room' : 'active') : o.manual ? 'check-in' : 'idle (never presses Advance)';
console.log(`Strip Mall Warlord balance: ${hours}h, seed ${seed}, ${mode}, acts every ${every}s${o.pave !== undefined ? `, paves after ${o.pave}h` : ''}, converts ${o.convert! * 100}% (${((Date.now() - t0) / 1000).toFixed(1)}s wall)\n`);
console.log('Lot            captured   frontier W/L  loss%  HP left  all W/L   loss%  boss tries');
for (const r of [0, 1] as const)
  REGIONS[r].lots.forEach((l, z) => {
    const st = stat[r][z];
    if (!st.w && !st.l) return;
    const t = done[`${r}-${z}`];
    console.log(`${l.short.padEnd(14)} ${(t ? fmtTime(t) : '-').padStart(8)}   ${`${st.fw}/${st.fl}`.padStart(11)}  ${((100 * st.fl) / Math.max(1, st.fw + st.fl)).toFixed(0).padStart(4)}%  ${((100 * st.hp) / Math.max(1, st.fw)).toFixed(0).padStart(6)}%  ${`${st.w}/${st.l}`.padStart(8)}  ${((100 * st.l) / Math.max(1, st.w + st.l)).toFixed(0).padStart(4)}%  ${String(st.boss).padStart(5)}`);
  });
const tt = (k: string) => (done[k] ? fmtTime(done[k]) : '-');
console.log(`\nSUMMARY mode="${mode}" lot=${tt("0-0")} bigbox=${tt("0-1")} outlet=${tt("0-2")} route9=${tt('0-5')} galleria=${tt('1-3')} losses=${s.crews[0].losses}/${s.crews[0].wins + s.crews[0].losses}`);
if (quiet) process.exit(0);
console.log('\nMilestones');
lines.forEach((l) => console.log(l));
console.log('\nEvery 30 minutes');
snaps.forEach((l) => console.log(l));

const idle = botAct(newGame(seed), o, 10);
for (let i = 0; i < 300; i++) step(idle);
botAct(idle, o, 10);
const away = simulateAway(idle, 8 * 3600);
console.log(`\nOffline (1 min of play, then 8h away): +$${fmt(away.earned)}, +${fmt(away.goodwill)} Goodwill, ${away.wins}W/${away.losses}L, fights cleared +${away.cleared}, captured: ${away.captured.join(', ') || 'none'}`);

// ---- the guard: the pacing targets from docs/V07_REVISION.md, checked on 2 seeds ----
async function guard(): Promise<never> {
  const knobs = knobArgs.flatMap((k) => ['--knob', k]);
  const runs = [1991, 7].flatMap((seed) => [
    { seed, mode: 'check-in', flags: [], route9: [14, 16] },
    { seed, mode: 'active', flags: ['--active', '--every=10'], route9: [11, 15.5] }, // ~12.5h on most seeds; about 1 in 5 lands near 15h
  ]);
  runs.push({ seed: 1991, mode: 'skilled', flags: ['--skilled'], route9: [7, 12] }); // the skilled player: arcade, claw picks, smart farming; walls only, no loss floor
  const hrs = (t: string) => (t.includes('h') ? Number(t.split('h')[0]) + Number(t.split('h')[1].replace('m', '')) / 60 : Number(t.split(':')[0]) / 60);
  const out = await Promise.all(runs.map((r) => new Response(Bun.spawn([process.execPath, process.argv[1], '20', String(r.seed), ...r.flags, '--quiet', ...knobs]).stdout).text()));
  let bad = 0;
  const fail = (why: string) => (bad++, console.log(`  FAIL ${why}`));
  runs.forEach((r, i) => {
    const txt = out[i];
    const route9 = /route9=([^ ]+(?: \d+m)?) /.exec(txt)?.[1] ?? '-';
    const [l, n] = (/losses=(\d+)\/(\d+)/.exec(txt) ?? [0, 0, 1]).slice(1).map(Number);
    console.log(`seed ${r.seed} ${r.mode}: Route 9 at ${route9}, losses ${Math.round((100 * l) / n)}%`);
    if (route9 === '-' || hrs(route9) < r.route9[0] || hrs(route9) > r.route9[1]) fail(`Route 9 ending outside ${r.route9[0]}-${r.route9[1]}h`);
    if (r.mode !== 'skilled' && (l / n < 0.1 || l / n > 0.3)) fail('overall losses outside 10-30%');
    for (const row of txt.split('\n').filter((x) => /^\S.*\d+\/\d+\s+\d+%/.test(x))) {
      const lot = row.slice(0, 14).trim();
      const front = /(\d+)\/(\d+)\s+(\d+)%/.exec(row)!;
      const boss = Number(row.trim().split(/\s+/).pop());
      if (Number(front[3]) > 50) fail(`${lot}: frontier loss ${front[3]}% (over 50%)`);
      if (boss > 12) fail(`${lot}: ${boss} boss tries (over 12)`);
    }
  });
  console.log(bad ? `\nguard: ${bad} failure(s)` : '\nguard: all within targets');
  process.exit(bad ? 1 : 0);
}
