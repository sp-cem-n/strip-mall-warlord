import { render } from 'preact';
import { app } from './app';
import { botAct } from './game/bot';
import { newGame } from './game/economy';
import { clearSave, loadGame, saveGame } from './game/save';
import { simulateAway, step, tick } from './game/sim';
import { App } from './ui/App';
import './ui/styles.css';

// Debug params (all optional):
//   ?fresh=1        ignore and wipe the save
//   ?speed=N        run the sim N× faster
//   ?seed=N         fixed RNG seed for a new game
//   ?advance=SEC    let the greedy bot play SEC seconds before showing
//   ?bot=1          keep the bot playing live
//   ?midbattle=1    after advancing, stop a few seconds into a fight
//   ?away=SEC       pretend the tab was closed SEC seconds ago (shows the summary)
//   ?pause=1        freeze the sim (for screenshots)
const q = new URLSearchParams(location.search);
const num = (k: string, d: number) => (q.has(k) ? Number(q.get(k)) : d);

if (q.get('fresh') === '1') clearSave();
let s = q.get('fresh') === '1' ? null : loadGame();
if (!s) s = newGame(q.has('seed') ? num('seed', 1) : undefined);
app.s = s;
app.speed = Math.max(0, num('speed', 1));
app.bot = q.get('bot') === '1';
app.paused = q.get('pause') === '1';

const advance = num('advance', 0);
if (advance > 0) {
  for (let t = 0; t < advance; t += 2) {
    app.s = botAct(app.s);
    for (let i = 0; i < 10; i++) step(app.s);
  }
  if (q.get('midbattle') === '1') {
    let guard = 0;
    while (!(app.s.battle && app.s.battle.t > 4 && app.s.battle.crew.some((u) => u.hp < u.maxHp)) && guard++ < 5000) step(app.s);
  }
}

const awaySec = q.has('away') ? num('away', 0) : (Date.now() - app.s.savedAt) / 1000;
if (awaySec > 60) app.away = simulateAway(app.s, awaySec);

render(<App />, document.getElementById('app')!);

let last = performance.now();
let botClock = 0;
let saveClock = 0;
let uiClock = 0;
function frame(now: number) {
  const dt = Math.min(1, (now - last) / 1000);
  last = now;
  if (!app.paused && !app.away) {
    const simDt = dt * app.speed;
    tick(app.s, simDt);
    if (app.bot && (botClock += simDt) >= 2) {
      botClock = 0;
      app.s = botAct(app.s);
    }
  }
  if ((saveClock += dt) >= 5) {
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
addEventListener('beforeunload', () => saveGame(app.s));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) saveGame(app.s);
  else {
    const gap = (Date.now() - app.s.savedAt) / 1000;
    if (gap > 60) {
      app.away = simulateAway(app.s, gap);
      saveGame(app.s);
    }
    last = performance.now();
  }
});
Object.assign(window, { __smw: app });
