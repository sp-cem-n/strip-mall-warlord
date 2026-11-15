// The top bar is the plaza's roadside pylon sign: stacked tenant panels, the office receipt printer, and a rented LED board.
import { DAWN } from '../game/content/dawn';
import { app, tip } from '../app';
import { ASPHALT_BONUS, REGIONS } from '../game/defs';
import { lotsTaken, rentPerSec } from '../game/economy';
import { MACHINES, roomOpen } from '../game/room';
import { icon } from './art';
import { fmt, fmtTime } from './format';
import { Receipt } from './Receipt';
import { Speaker } from './Speaker';

export function Pylon() {
  const s = app.s;
  const r = s.view;
  const c = s.crews[r];
  const rent = rentPerSec(s, r);
  return (
    <header class="roadside">
      <div class="pylon">
        <button
          class="cabinet"
          onClick={() => ((app.screen = 'boot'), (app.tip = null), app.refresh())}
          {...tip('Pinewood Plaza', 'Est. 1991. Back to the title screen.')}
        >
          <span class="pylon-title">STRIP MALL WARLORD</span>
          <span class="pylon-sub">{REGIONS[r].chrome.sub}</span>
        </button>
        <div class="tenant t-cash" {...tip(`${REGIONS[r].name} till`, `Rent: $${fmt(rent)}/s.`, 'Leases, renovations, patrols, Overtime.', 'Every tenant pays on time. Every tenant is you.')}>
          <img src={icon('cash')} width={18} height={18} alt="" />
          <span class="k">Cash</span>
          <span class="v">${fmt(c.cash)}</span>
          <span class="r">+${fmt(rent)}/s</span>
        </div>
        <div class="tenant t-goodwill" {...tip('Goodwill', 'Wins pay it. Training costs it.', s.bypass ? DAWN.goodwillTip : 'People are starting to say nice things about the plaza.')}>
          <img src={icon('goodwill')} width={18} height={18} alt="" />
          <span class="k">Goodwill</span>
          <span class="v">{fmt(s.goodwill)}</span>
        </div>
        {s.bypass && (
          <div class="tenant t-equity" {...tip(...(DAWN.equityTip as [string, ...string[]]))}>
            <img src={icon('equity')} width={18} height={18} alt="" />
            <span class="k">{DAWN.equity}</span>
            <span class="v">{fmt(s.equity)}</span>
          </div>
        )}
        {s.asphalt > 0 && (
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
      <ArcadeDoor />
      {app.speed !== 1 && <div class="debug">debug ×{app.speed}</div>}
      <div class="led-sign">
        <div class="led" {...tip(REGIONS[r].name, `${c.wins} fights won, ${c.losses} lost.`, `${fmtTime(s.totalTime)} on the clock, all runs.`, 'The board was $40 a month. It shows.')}>
          <span>
            {c.wins}W-{c.losses}L
          </span>
          <span>{fmtTime(s.totalTime)}</span>
          <span>
            LOTS {lotsTaken(s, r)}/{REGIONS[r].lots.length}
          </span>
        </div>
        <Speaker />
        <button class="help" onClick={() => ((app.howFrom = 'game'), (app.screen = 'howto'), (app.tip = null), app.refresh())} {...tip('How to play')}>
          ?
        </button>
        <div class="legs">
          <i />
          <i />
        </div>
      </div>
    </header>
  );
}

// The arcade's door: a little marquee between the receipt and the LED board, only once a machine is open.
function ArcadeDoor() {
  const s = app.s;
  const r = s.view;
  if (!roomOpen(s, r)) return null;
  const open = MACHINES.filter((m) => m.region === r && s.room.unlocked.includes(m.id)).length;
  const name = r === 0 ? 'FUN ZONE' : DAWN.barSign;
  return (
    <button
      class={`arcade-door ${r ? 'bar' : ''}`}
      onClick={() => ((app.screen = 'room'), (app.tip = null), app.refresh())}
      {...tip(r === 0 ? 'Fun Zone Arcade' : DAWN.barGo, r === 0 ? `${open}/6 machines open. ${fmt(s.tickets)} tickets.` : `${open}/6 tables open.`, 'Click to walk over.')}
    >
      <span class="bulbs" />
      <span class="marquee">{name}</span>
      <span class="slot">
        <i />
        {r === 0 ? `${fmt(s.tickets)} TK` : 'OPEN'}
      </span>
      <span class="bulbs" />
    </button>
  );
}
