import { render } from 'preact';
import { app, type Screen } from './app';
import { botAct } from './game/bot';
import { FIGHTS, SHOP_LIST, STEP } from './game/defs';
import { lotsTaken, newGame, rentPerSec } from './game/economy';
import { clearSave, loadGame, saveGame } from './game/save';
import { simulateAway, step } from './game/sim';
import { App } from './ui/App';
import '@fontsource/pixelify-sans/latin-500.css';
import '@fontsource/vt323/latin-400.css';
import { installFrames } from './ui/art';
import { jingle, register, squeak, unlockAudio } from './ui/audio';
import './ui/styles.css';

installFrames();

// Debug params (all optional):
//   ?fresh=1        ignore and wipe the save
//   ?speed=N        run the sim N× faster
//   ?seed=N         fixed RNG seed for a new game
//   ?advance=SEC    let the scripted player play SEC seconds before showing (?active=1: grabs walk-ins, calls plays)
//   ?midbattle=1    after advancing, stop a few seconds into a fight
//   ?smoke=1        after advancing, stop halfway through a smoke break
//   ?walkup=1       after advancing, stop as the next group walks in on a hurt crew
//   ?roster=full    Route 9 finished: all 19 shops at Lv 45 and the 6 bosses on the crew (25 on the field)
//   ?win=1          with roster=full: show the dawn win card
//   ?region=1       watch the Bypass crew (needs the Bypass found: roster=full does that)
//   ?away=SEC       pretend the tab was closed SEC seconds ago (stats on the title screen)
//   ?oldsave=1      show the "lease was renegotiated" notice
//   ?screen=NAME    boot | howto | story | game | room (default: boot)
//   ?story=all      show every story line at once
//   ?pause=1        freeze the sim (for screenshots)
//   ?walkin=1       put a walk-in at the first shop
//   ?room=full      every arcade machine unlocked, 3,000 tickets, a few perks (after roster=full: the bar too)
const q = new URLSearchParams(location.search);
const num = (k: string, d: number) => (q.has(k) ? Number(q.get(k)) : d);

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

const advance = num('advance', 0);
const opts = { active: q.get('active') === '1' };
if (advance > 0) {
  app.hasSave = true;
  for (let t = 0; t < advance; t += 10) {
    app.s = botAct(app.s, opts);
    for (let i = 0; i < 10 / STEP; i++) step(app.s, opts.active);
  }
}
if (q.get('roster') === 'full') {
  app.hasSave = true;
  const c = app.s.crews[0];
  for (const sh of SHOP_LIST) if (sh.region === 0) c.shops[sh.id] = 45;
  c.frontier = FIGHTS[0].length;
  c.at = FIGHTS[0].length - 2;
  c.cash = rentPerSec(app.s, 0) * 60;
  app.s.goodwill = 42000;
  app.s.bypass = true;
  app.s.ending = q.get('win') === '1' ? 1 : 0;
  if (q.get('region') === '1') {
    app.s.view = 1;
    app.s.equity = 140;
    for (let i = 0; i < 2000; i++) step(app.s);
  }
}
if (q.get('room') === 'full') {
  app.hasSave = true;
  app.s.crews[0].shops.funzone ??= 5;
  app.s.room.unlocked = ['pusher', 'whac', 'skee', 'claw', 'pinball', 'cyclone'];
  app.s.tickets = 3000;
  app.s.room.perks = { slot: 1, walkins: 1 };
  app.s.room.attract = { pusher: 1, skee: 2 };
  app.s.room.board = 2;
  app.s.room.best = 31250;
  app.s.room.buffs = { bat: 420 };
  app.s.crews[0].cash = Math.max(app.s.crews[0].cash, 1e6);
  if (app.s.bypass) (app.s.crews[1].shops.offramp ??= 3), app.s.room.unlocked.push('darts', 'pool', 'poker', 'shuffle'), (app.s.room.shuffle = 1), (app.s.room.shuffleBest = 12), (app.s.room.buffs.call = 300), (app.s.crews[1].cash = Math.max(app.s.crews[1].cash, 1e7));
}
if (q.get('smoke') === '1') {
  const c = app.s.crews[app.s.view];
  for (let guard = 0; !(c.smoke > 0 && c.regroup < c.smoke / 2) && guard < 40000; guard++) step(app.s);
}
if (q.get('walkup') === '1') {
  const c = app.s.crews[app.s.view];
  for (let guard = 0; !(c.battle && !c.battle.fresh && c.battle.enter > 0 && c.battle.enter < 1.2) && guard < 40000; guard++) step(app.s);
}
if (q.get('midbattle') === '1') {
  const c = app.s.crews[app.s.view];
  let guard = 0;
  const hit = () => [...c.battle!.crew, ...c.battle!.enemies].some((u) => u.flash > 0.25 && u.hp > 0);
  while (!(c.battle && c.battle.t > 3 && hit() && c.battle.crew.some((u) => u.acted > 0)) && guard++ < 20000) step(app.s);
}
if (q.get('walkin') === '1') {
  const sh = SHOP_LIST.find((x) => x.region === app.s.view && app.s.crews[app.s.view].shops[x.id])!;
  app.s.find = { shop: sh.id, kind: sh.walkin.kind, name: 'a 4-Cell Flashlight', left: 18 };
}

const awaySec = q.has('away') ? num('away', 0) : (Date.now() - app.s.savedAt) / 1000;
if (app.hasSave && awaySec > 60) app.away = simulateAway(app.s, awaySec);
app.screen = (q.get('screen') as Screen) ?? 'boot';

// audio waits for a gesture (browser rule, and good manners)
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, unlockAudio);

render(<App />, document.getElementById('app')!);

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
