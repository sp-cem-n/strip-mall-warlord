// Debug and screenshot params. Only loaded when the URL asks for one, so the bot and these setups stay out of the main bundle.
// Params (all optional; ?fresh, ?speed, ?seed, ?pause, ?away, ?oldsave, ?screen, ?story are read in main.tsx and the screens):
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
//   ?landmarks=1    plant the three Route 9 landmarks and a consultant, for plaza / Back Office shots
import { app } from './app';
import { botAct } from './game/bot';
import { FIGHTS, SHOP_LIST, STEP } from './game/defs';
import { rentPerSec } from './game/economy';
import { step } from './game/sim';

export function applyDebug(q: URLSearchParams) {
  const num = (k: string, d: number) => (q.has(k) ? Number(q.get(k)) : d);
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
    if (app.s.bypass) (app.s.crews[1].shops.offramp ??= 3), app.s.room.unlocked.push('darts', 'tabs', 'pool', 'poker', 'foos', 'shuffle', 'blackjack', 'fairway', 'trivia'), (app.s.room.shuffle = 1), (app.s.room.shuffleBest = 12), (app.s.room.buffs.call = 300), (app.s.crews[1].cash = Math.max(app.s.crews[1].cash, 1e7));
  }
  if (q.get('landmarks') === '1') {
    app.hasSave = true;
    app.s.landmarks = ['billboard', 'tower', 'pylon'];
    app.s.consultants = [[0, 1], app.s.consultants[1] ?? []];
  }
  if (q.get('smoke') === '1') {
    const c = app.s.crews[app.s.view];
    for (let guard = 0; !(!c.battle && c.smoke > 0 && c.regroup > 0 && c.regroup < c.smoke / 2) && guard < 40000; guard++) step(app.s);
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
}
