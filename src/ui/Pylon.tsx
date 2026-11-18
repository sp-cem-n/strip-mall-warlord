// The top bar is the plaza's roadside pylon sign: stacked tenant panels, the office receipt printer, the game room doors and a rented LED board.
// The game rooms use the same bar (room = true): their marquee on the sign, their own tenants, a door back to the plaza.
import { useEffect, useRef } from 'preact/hooks';
import { DAWN } from '../game/content/dawn';
import { app, tip } from '../app';
import { ASPHALT_BONUS, REGIONS, type RegionId } from '../game/defs';
import { lotsTaken, rentPerSec, view } from '../game/economy';
import { lumps, rateLabel, type RateKey } from '../game/rates';
import { MACHINES, roomOpen } from '../game/room';
import { FZ_LOGO, icon, barLogoURL, titleSignURL } from './art';
import { fzOff, signOut } from './lights';
import { fmt, fmtClock, fmtWL } from './format';
import { Receipt } from './Receipt';
import { Speaker } from './Speaker';

const POP_SECONDS = 2.5;
function Tenant({ cls, ic, k, v, rk, pre = '', tipArgs }: { cls: string; ic: string; k: string; v: string; rk?: RateKey; pre?: string; tipArgs: [string, ...string[]] }) {
  const s = app.s;
  const lump = rk && lumps.get(rk);
  const pop = lump && s.totalTime - lump.at < POP_SECONDS && s.totalTime >= lump.at;
  return (
    <div class={`tenant ${cls}`} {...tip(...tipArgs)}>
      <img src={icon(ic)} width={18} height={18} alt="" />
      <span class="k">{k}</span>
      <span class="v">{v}</span>
      {rk && (() => {
        const { n, unit } = rateLabel(s, rk);
        return (
          <span class="r">
            +{pre}
            {fmt(n)}/{unit}
          </span>
        );
      })()}
      {pop && (
        <span class="pop" key={lump.at}>
          +{pre}
          {fmt(lump.n)}
        </span>
      )}
    </div>
  );
}

// Walk into a game room; leaving it goes back to the road you came from.
export const roomFrom = { r: 0 as RegionId };
export function enterRoom(r: RegionId) {
  if (app.screen !== 'room') roomFrom.r = app.s.view;
  view(app.s, r);
  app.screen = 'room';
  app.tip = null;
  app.refresh();
}
export function leaveRoom() {
  view(app.s, roomFrom.r);
  app.screen = 'game';
  app.tip = null;
  app.refresh();
}

function Sign({ room }: { room: boolean }) {
  const s = app.s;
  const r = s.view;
  if (room)
    return (
      <div class={`title-sign ${r ? 'pub' : 'fz'}`}>
        {r ? (
          <img src={barLogoURL()} width={390} height={66} alt={DAWN.bar} />
        ) : (
          <span class="fz-logo" role="img" aria-label="Fun Zone Arcade">
            <img src={FZ_LOGO.base} width={390} height={66} alt="" />
            {(['fun', 'zone', 'line'] as const).map((p) => <img key={p} src={FZ_LOGO[p]} width={390} height={66} alt="" class={fzOff.has(p) ? 'off' : ''} />)}
          </span>
        )}
      </div>
    );
  return (
    <span class="title-sign" {...tip('Pinewood Plaza', 'Est. 1991.')}>
      <img src={titleSignURL(signOut.ray, signOut.mask)} width={390} height={66} alt="Strip Mall Warlord" />
    </span>
  );
}

export function Pylon({ room = false }: { room?: boolean }) {
  const s = app.s;
  const r = s.view;
  const c = s.crews[r];
  const ref = useRef<HTMLElement>(null);
  // the bar's height, for whatever sticks under it
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--bar', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const cashKey: RateKey = r ? 'cash1' : 'cash0';
  const bar = room && r === 1;
  return (
    <header class={`roadside ${room ? (r ? 'in-room pub' : 'in-room fz') : ''}`} ref={ref}>
      <div class="pylon">
        <Sign room={room} />
        <Tenant cls="t-cash" ic="cash" k="Cash" v={`$${fmt(c.cash)}`} rk={cashKey} pre="$" tipArgs={[`${REGIONS[r].name} till`, (() => { const { n, unit } = rateLabel(s, cashKey); return `Live rate: $${fmt(n)}/${unit}, rent $${fmt(rentPerSec(s, r))}/s of it.`; })(), 'Leases, renovations, patrols, Overtime.', 'Every tenant pays on time. Every tenant is you.']} />
        {!bar && <Tenant cls="t-goodwill" ic="goodwill" k="Goodwill" v={fmt(s.goodwill)} rk="goodwill" tipArgs={['Goodwill', 'Wins pay it. Training costs it.', s.bypass ? DAWN.goodwillTip : 'People are starting to say nice things about the plaza.']} />}
        {s.bypass && (!room || bar) && <Tenant cls="t-equity" ic="equity" k={DAWN.equity} v={fmt(s.equity)} rk="equity" tipArgs={DAWN.equityTip as [string, ...string[]]} />}
        {room && !bar && <Tenant cls="t-tickets" ic="ticket" k="Tickets" v={fmt(s.tickets)} rk="tickets" tipArgs={['Tickets', 'Skee-Ball, the Cyclone, a few machines more.', 'The prize counter takes them.']} />}
        {!room && s.asphalt > 0 && (
          <div class="tenant t-asphalt" {...tip(`Asphalt ${s.asphalt}`, `+${Math.round(ASPHALT_BONUS * 100)}% Route 9 rent, stats and Goodwill each, forever.`, `Paved ${s.paves} time${s.paves === 1 ? '' : 's'}.`, 'The one thing you and the developer agree on.')}>
            <img src={icon('asphalt')} width={18} height={18} alt="" />
            <span class="k">Asphalt</span>
            <span class="v">{s.asphalt}</span>
            <span class="r">+{Math.round(s.asphalt * ASPHALT_BONUS * 100)}%</span>
          </div>
        )}
        <div class="pole">
          <i />
          <i />
        </div>
      </div>
      <Receipt />
      <Doors room={room} />
      {app.speed !== 1 && <div class="debug">debug ×{app.speed}</div>}
      <div class="led-sign">
        <div class="scoreboard">
          {s.bypass && !room && (
            <button class="hwy" onClick={() => (view(s, r ? 0 : 1), (app.tip = null), app.refresh())} {...tip(REGIONS[r ? 0 : 1].name, `${lotsTaken(s, r ? 0 : 1)}/${REGIONS[r ? 0 : 1].lots.length} lots.`)}>
              {DAWN.hwy[r]}
            </button>
          )}
          <div class="led" {...tip(REGIONS[r].name, `${c.wins} fights won, ${c.losses} lost.`, `${fmtClock(s.totalTime)} on the clock, all runs.`, 'The board was $40 a month. It shows.')}>
            <span class="cell wl">
              {fmtWL(c.wins)}-{fmtWL(c.losses)}
              <small>W-L</small>
            </span>
            <span class="cell clock">
              {fmtClock(s.totalTime)}
              <small>CLOCK</small>
            </span>
            <span class="cell lots">
              {lotsTaken(s, r)}/{REGIONS[r].lots.length}
              <small>LOTS</small>
            </span>
          </div>
          <div class="legs">
            <i />
            <i />
          </div>
        </div>
        <div class="led-buttons">
          <button class="boot-door save" onClick={() => ((app.savePop = true), (app.tip = null), app.refresh())} {...tip('Lease code', 'Copy your save out, or load one in.')} aria-label="Save code">
            <Floppy />
          </button>
          <Speaker />
          <button class="help" onClick={() => ((app.howFrom = room ? 'room' : 'game'), (app.screen = 'howto'), (app.tip = null), app.refresh())} {...tip('How to play')}>
            ?
          </button>
        </div>
      </div>
      {room && <div class="room-lip" aria-hidden="true" />}
    </header>
  );
}

// A 3.5" floppy, 14x14 pixels.
function Floppy() {
  return (
    <svg width="20" height="20" viewBox="0 0 14 14" shape-rendering="crispEdges" aria-hidden="true">
      <path d="M1 1h11l1 1v11H1z" fill="#1a1420" />
      <path d="M2 2h10v10H2z" fill="#4a6aa8" />
      <path d="M4 2h6v4H4z" fill="#cfc6b0" />
      <path d="M8 3h1v2H8z" fill="#1a1420" />
      <path d="M3 8h8v4H3z" fill="#f3e6c8" />
      <path d="M4 9h6v1H4zM4 11h4v1H4z" fill="#8f8a86" />
    </svg>
  );
}

// The game room doors: little neon marquees between the receipt and the LED board, stacked (Fun Zone on top).
// Inside a room, the top one is the way back to the plaza.
function Doors({ room }: { room: boolean }) {
  const s = app.s;
  const doors = ([0, 1] as const).filter((r) => roomOpen(s, r) && (room ? r !== s.view : true));
  if (!doors.length && !room) return null;
  return (
    <div class="doors">
      {room && (
        <button class="arcade-door home" onClick={leaveRoom} {...tip('Back outside', `To ${REGIONS[roomFrom.r].chrome.plaza}.`)}>
          <span class="bulbs" />
          <span class="marquee">◂ PLAZA</span>
          <span class="slot">back to the lot</span>
          <span class="bulbs" />
        </button>
      )}
      {doors.map((r) => {
        const open = MACHINES.filter((m) => m.region === r && s.room.unlocked.includes(m.id)).length;
        return (
          <button key={r} class={`arcade-door ${r ? "pub" : ""}`} onClick={() => enterRoom(r)} {...tip(r === 0 ? 'Fun Zone Arcade' : DAWN.barGo, r === 0 ? `${open}/6 machines open. ${fmt(s.tickets)} tickets.` : `${open}/6 tables open.`, 'Click to walk over.')}>
            <span class="bulbs" />
            <span class="marquee">{r === 0 ? 'FUN ZONE' : DAWN.barSign}</span>
            <span class="slot">
              <i />
              {r === 0 ? `${fmt(s.tickets)} TK` : 'OPEN'}
            </span>
            <span class="bulbs" />
          </button>
        );
      })}
    </div>
  );
}
