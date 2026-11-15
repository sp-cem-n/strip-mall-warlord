import { startLights } from './ui/lights';
import { render } from 'preact';
import { app, type Screen } from './app';
import { STEP } from './game/defs';
import { lotsTaken, newGame, rentPerSec } from './game/economy';
import { clearSave, loadGame, saveGame, useTestSave } from './game/save';
import { simulateAway, step } from './game/sim';
import { App } from './ui/App';
import '@fontsource/pixelify-sans/latin-500.css';
import '@fontsource/vt323/latin-400.css';
import { installFrames } from './ui/art';
import { jingle, register, squeak, unlockAudio } from './ui/audio';
import './ui/styles.css';

installFrames();

// URL params: ?test=1 test mode (own save, a panel to jump around), ?fresh=1 wipes the save, ?seed=N, ?speed=N, ?pause=1, ?away=SEC, ?oldsave=1, ?screen=NAME. The rest are in debug.ts.
const q = new URLSearchParams(location.search);
const num = (k: string, d: number) => (q.has(k) ? Number(q.get(k)) : d);
const DEBUG = /[?&](advance|roster|room|smoke|walkup|midbattle|walkin)=/;

const TEST = q.get('test') === '1';
if (TEST) useTestSave();
if (q.get('fresh') === '1') clearSave();
const loaded = q.get('fresh') === '1' ? null : loadGame();
app.oldSave = loaded === 'old' || q.get('oldsave') === '1';
if (loaded === 'old') clearSave(); // an old plaza lives on at its own /vX.Y/
let s = loaded && loaded !== 'old' ? loaded : null;
app.hasSave = !!s;
if (!s) s = newGame(q.has('seed') ? num('seed', 1) : undefined);
app.s = s;
app.speed = Math.max(0, num('speed', 1));
app.paused = q.get('pause') === '1';

if (DEBUG.test(location.search)) (await import('./debug')).applyDebug(q);
if (TEST) app.testPanel = (await import('./ui/TestPanel')).TestPanel;

const awaySec = q.has('away') ? num('away', 0) : (Date.now() - app.s.savedAt) / 1000;
if (app.hasSave && awaySec > 60) app.away = simulateAway(app.s, awaySec);
app.screen = (q.get('screen') as Screen) ?? 'boot';

// audio waits for a gesture (browser rule, and good manners)
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, unlockAudio);

render(<App />, document.getElementById('app')!);
startLights(q.get('lights'), q);

let last = performance.now();
let acc = 0;
let saveClock = 0;
let uiClock = 0;
let rentClock = 0;
const lotsNow = () => lotsTaken(app.s, 0) + lotsTaken(app.s, 1);
let prev = { lots: lotsNow(), find: !!app.s.find };
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
    if (lotsNow() > prev.lots) jingle();
    if (app.s.find && !prev.find) squeak();
    if ((rentClock += dt) >= 30 && rentPerSec(app.s, app.s.view) > 0) (rentClock = 0), register();
  }
  prev = { lots: lotsNow(), find: !!app.s.find };
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
      saveGame(app.s);
    }
    last = performance.now();
  }
});
Object.assign(window, { __smw: app });
