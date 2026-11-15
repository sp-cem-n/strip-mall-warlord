// Test mode (?test=1): its own save, and a small panel to jump around Route 9, top up, open every machine and speed time up.
// Loaded only with ?test=1. Route 9 only: nothing here names what comes after it.
import { useState } from 'preact/hooks';
import { app, toast } from '../app';
import { botAct } from '../game/bot';
import { FIGHTS, REGIONS, SHOP_LIST, STEP } from '../game/defs';
import { forLease, rentPerSec } from '../game/economy';
import { MACHINES } from '../game/room';
import { fightLabel, payFor, step } from '../game/sim';
import { fmt } from './format';

const R9 = FIGHTS[0];
const firstOf = (zone: number) => R9.findIndex((f) => f.zone === zone);
const done = () => (app.hasSave = true, app.refresh());

// Move the crew to a fight: lots behind it captured and patrolled, every shop unlocked by then leased at Lv 1.
function jump(idx: number) {
  const s = app.s;
  const c = s.crews[0];
  Object.assign(c, { frontier: idx, at: idx, kills: 0, farmed: 0, tries: 0, battle: null, wounds: {}, regroup: 1 });
  c.contracts = [...new Set([...c.contracts, ...REGIONS[0].lots.map((_, z) => z).filter((z) => z <= R9[idx].zone)])];
  for (let g = 0; g < 40; g++) for (const sh of forLease(s, 0)) c.shops[sh.id] = 1;
  toast(`Jumped to ${fightLabel(0, idx)}`);
  done();
}

// The scripted player plays (actively, fast) until the crew reaches a fight; yields between chunks so the page stays alive.
function botTo(idx: number, setBusy: (b: string) => void) {
  const s = app.s;
  const start = s.totalTime;
  const chunk = () => {
    for (let t = 0; t < 900 && s.crews[0].frontier < idx; t += 10) {
      botAct(s, { active: true }, 10);
      for (let i = 0; i < 10 / STEP; i++) step(s, true);
    }
    const c = s.crews[0];
    if (c.frontier < idx && s.totalTime - start < 30 * 3600) return (setBusy(`Bot playing… ${fightLabel(0, Math.min(c.frontier, R9.length - 1))}`), setTimeout(chunk, 0));
    setBusy('');
    toast(c.frontier >= idx ? `Bot got there in ${((s.totalTime - start) / 3600).toFixed(1)}h of game time` : 'Bot stopped after 30h of game time');
    done();
  };
  setBusy('Bot playing…');
  setTimeout(chunk, 0);
}

function finishRoute9() {
  const s = app.s;
  const c = s.crews[0];
  for (const sh of SHOP_LIST) if (sh.region === 0) c.shops[sh.id] = Math.max(c.shops[sh.id] ?? 0, 30);
  Object.assign(c, { frontier: R9.length, at: R9.length - 2, battle: null, wounds: {} });
  c.contracts = REGIONS[0].lots.map((_, z) => z);
  s.bypass = true;
  s.ending = 1;
  done();
}

function unlockAll() {
  const s = app.s;
  s.crews[0].shops.funzone ||= 1;
  if (s.bypass) s.crews[1].shops.offramp ||= 1;
  s.room.unlocked = MACHINES.map((m) => m.id);
  toast('Every machine is plugged in');
  done();
}

export function TestPanel() {
  const [open, setOpen] = useState(true);
  const [lot, setLot] = useState(0);
  const [fight, setFight] = useState(0);
  const [busy, setBusy] = useState('');
  const s = app.s;
  if (!open) return <button class="test-tab" onClick={() => setOpen(true)}>TEST</button>;
  const L = REGIONS[0].lots[lot];
  const idx = Math.min(firstOf(lot) + fight, R9.length - 1);
  const c = s.crews[0];
  return (
    <div class="test-panel">
      <div class="tp-head">
        <b>TEST MODE</b> <span class="dim">own save · {fightLabel(0, Math.min(c.at, R9.length - 1))}</span>
        <button class="btn small" onClick={() => setOpen(false)}>hide</button>
      </div>
      <div class="tp-row">
        <select value={lot} onChange={(e) => (setLot(Number((e.target as HTMLSelectElement).value)), setFight(0))}>
          {REGIONS[0].lots.map((l, z) => <option key={l.id} value={z}>{l.name}</option>)}
        </select>
        <select value={fight} onChange={(e) => setFight(Number((e.target as HTMLSelectElement).value))}>
          {Array.from({ length: L.fights + 1 }, (_, i) => <option key={i} value={i}>{i === L.fights ? 'boss' : `fight ${i + 1}`}</option>)}
        </select>
      </div>
      <div class="tp-row">
        <button class="btn small" disabled={!!busy} onClick={() => jump(idx)}>Jump there</button>
        <button class="btn small" disabled={!!busy} onClick={() => botTo(idx, setBusy)}>Bot plays to there</button>
        <button class="btn small" disabled={!!busy} onClick={finishRoute9}>Finish Route 9</button>
      </div>
      {busy && <div class="tp-row dim">{busy}</div>}
      <div class="tp-row">
        <button class="btn small" onClick={() => ((c.cash += Math.max(1e4, rentPerSec(s, 0) * 3600)), done())}>+1h rent (${fmt(Math.max(1e4, rentPerSec(s, 0) * 3600))})</button>
        <button class="btn small" onClick={() => ((s.goodwill += Math.max(1000, payFor(s, 0) * 100)), done())}>+{fmt(Math.max(1000, payFor(s, 0) * 100))} GW</button>
        <button class="btn small" onClick={() => ((s.tickets += 1000), done())}>+1,000 tickets</button>
      </div>
      <div class="tp-row">
        <button class="btn small" onClick={unlockAll}>Unlock every machine</button>
        <button class="btn small" onClick={() => ((app.screen = app.screen === 'room' ? 'game' : 'room'), app.refresh())}>{app.screen === 'room' ? 'Back to the plaza' : 'Go to the arcade'}</button>
      </div>
      <div class="tp-row">
        <span class="dim">Speed</span>
        {[1, 10, 60].map((x) => (
          <button key={x} class={`btn small ${app.speed === x && !app.paused ? 'hot' : ''}`} onClick={() => ((app.speed = x), (app.paused = false), app.refresh())}>
            {x}×
          </button>
        ))}
        <button class={`btn small ${app.paused ? 'hot' : ''}`} onClick={() => ((app.paused = !app.paused), app.refresh())}>pause</button>
      </div>
    </div>
  );
}
