import { render } from 'preact';
import { app, type Screen } from './app';
import { botAct, type Strategy } from './game/bot';
import { newGame } from './game/economy';
import { clearSave, loadGame, saveGame } from './game/save';
import { STEP } from './game/defs';
import { simulateAway, step } from './game/sim';
import { App } from './ui/App';
import '@fontsource/pixelify-sans/latin-500.css';
import '@fontsource/vt323/latin-400.css';
import { installFrames } from './ui/art';
import { jingle, register, squeak, unlockAudio } from './ui/audio';
import { incomePerSec } from './game/economy';
import './ui/styles.css';

installFrames();

// Debug params (all optional):
//   ?fresh=1        ignore and wipe the save
//   ?speed=N        run the sim N× faster
//   ?seed=N         fixed RNG seed for a new game
//   ?advance=SEC    let the greedy bot play SEC seconds before showing
//   ?strategy=dojo  which bot plays (mixed | static | dojo)
//   ?midbattle=1    after advancing, stop a few seconds into a fight
//   ?away=SEC       pretend the tab was closed SEC seconds ago (stats on the title screen)
//   ?screen=NAME    boot | howto | story | game (default: boot)
//   ?story=all      show every story line at once
//   ?book=SLOT      open the sign sample book for a storefront
//   ?pause=1        freeze the sim (for screenshots)
//   ?walkin=1       put a walk-in at the first open storefront
const q = new URLSearchParams(location.search);
const num = (k: string, d: number) => (q.has(k) ? Number(q.get(k)) : d);

if (q.get('fresh') === '1') clearSave();
let s = q.get('fresh') === '1' ? null : loadGame();
app.hasSave = !!s;
if (!s) s = newGame(q.has('seed') ? num('seed', 1) : undefined);
app.s = s;
app.speed = Math.max(0, num('speed', 1));
app.paused = q.get('pause') === '1';

const strategy = (q.get('strategy') ?? 'mixed') as Strategy;
const advance = num('advance', 0);
if (advance > 0) {
  app.hasSave = true;
  for (let t = 0; t < advance; t += 10) {
    app.s = botAct(app.s, strategy);
    for (let i = 0; i < 10 / STEP; i++) step(app.s);
  }
  if (q.get('midbattle') === '1') {
    let guard = 0;
    const hit = () => [...app.s.battle!.crew, ...app.s.battle!.enemies].some((u) => u.flash > 0.25 && u.hp > 0);
    while (!(app.s.battle && app.s.battle.t > 4 && hit() && app.s.battle.crew.some((u) => u.acted > 0)) && guard++ < 20000) step(app.s);
  }
}

if (q.get('walkin') === '1') {
  const sl = app.s.slots.find((x) => x.shop === 'pawn') ?? app.s.slots.find((x) => x.shop)!;
  app.s.find = { slot: sl.id, kind: sl.shop!, name: sl.shop === 'pawn' ? 'a 4-Cell Flashlight' : 'Ex-Golden Gloves (Regional)', left: 18 };
}

const awaySec = q.has('away') ? num('away', 0) : (Date.now() - app.s.savedAt) / 1000;
if (app.hasSave && awaySec > 60) app.away = simulateAway(app.s, awaySec);
app.screen = (q.get('screen') as Screen) ?? 'boot';
if (q.has('book')) app.book = num('book', 0);

// audio waits for a gesture (browser rule, and good manners)
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, unlockAudio);

render(<App />, document.getElementById('app')!);

let last = performance.now();
let acc = 0;
let saveClock = 0;
let uiClock = 0;
let rentClock = 0;
let prev = { zone: app.s.zone, find: !!app.s.find };
function frame(now: number) {
  const dt = Math.min(1, (now - last) / 1000);
  last = now;
  const playing = app.screen === 'game';
  // the plaza keeps its hours behind the title screen too, but nobody walks in unless you're watching
  if (!app.paused && (playing || app.hasSave)) {
    const simDt = dt * app.speed;
    for (acc += simDt; acc >= STEP; acc -= STEP) step(app.s, playing);
  }
  if (playing) {
    if (app.s.zone > prev.zone) jingle();
    if (app.s.find && !prev.find) squeak();
    if ((rentClock += dt) >= 30 && incomePerSec(app.s) > 0) (rentClock = 0), register();
  }
  prev = { zone: app.s.zone, find: !!app.s.find };
  if (app.hasSave && !app.paused && (saveClock += dt) >= 5) {
    saveClock = 0;
    saveGame(app.s);
  }
  if ((uiClock += dt) >= 0.1) {
    uiClock = 0;
    app.refresh();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
const persist = () => app.hasSave && !app.paused && saveGame(app.s);
addEventListener('beforeunload', persist);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) persist();
  else if (app.hasSave && !app.paused) {
    const gap = (Date.now() - app.s.savedAt) / 1000;
    if (gap > 60) {
      // back after a while: the title screen shows what happened
      app.away = simulateAway(app.s, gap);
      app.screen = 'boot';
      app.book = null;
      saveGame(app.s);
    }
    last = performance.now();
  }
});
Object.assign(window, { __smw: app });
