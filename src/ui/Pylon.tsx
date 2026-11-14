// The top bar is the plaza's roadside pylon sign: stacked tenant panels, and a rented LED board.
import { app, tip } from '../app';
import { ASPHALT_BONUS, HEAT_PER_PAYDAY_LEVEL, WALKIN_HEAT, ZONES } from '../game/defs';
import { heat, incomePerSec, paydayHeat } from '../game/economy';
import { icon } from './art';
import { fmt, fmtTime } from './format';
import { Speaker } from './Speaker';

export function Pylon() {
  const s = app.s;
  const h = heat(s);
  const open = s.slots.filter((x) => x.shop).length;
  return (
    <header class="roadside">
      <div class="pylon">
        <button
          class="cabinet"
          onClick={() => ((app.screen = 'boot'), (app.tip = null), app.refresh())}
          {...tip('Pinewood Plaza', 'Est. 1991. Back to the title screen.', 'The fights keep going while you look at it.')}
        >
          <span class="pylon-title">STRIP MALL WARLORD</span>
          <span class="pylon-sub">Pinewood Plaza · Rt. 9 · Fall 1997</span>
        </button>
        <div class="tenant t-cash" {...tip('Cash', `Rent: $${fmt(incomePerSec(s))}/s from ${open} storefront${open === 1 ? '' : 's'}.`, 'Every tenant pays on time. Every tenant is you.')}>
          <img src={icon('cash')} width={18} height={18} alt="" />
          <span class="k">Cash</span>
          <span class="v">${fmt(s.cash)}</span>
          <span class="r">+${fmt(incomePerSec(s))}/s</span>
        </div>
        <div
          class="tenant t-heat"
          {...tip(
            `Heat +${Math.round(h * 100)}%`,
            `Every Payday Loans level you own: +${HEAT_PER_PAYDAY_LEVEL * 100}% enemy health and damage, every fight (now +${Math.round(paydayHeat(s) * 100)}%).`,
            s.buffs.heat > 0 ? `A borrower's paperwork adds +${WALKIN_HEAT * 100}% for ${Math.ceil(s.buffs.heat)}s more.` : `A desperate borrower adds +${WALKIN_HEAT * 100}% for 3 minutes, if you take the money.`,
            'Rebrand Payday Loans and the Heat goes with it. The cruisers at the lot entrance are for you.',
          )}
        >
          <img src={icon('heat')} width={18} height={18} alt="" />
          <span class="k">Heat</span>
          <span class="meter">
            <span class={`meter-fill ${h >= 0.5 ? 'hot' : ''}`} style={{ width: `${Math.min(100, h * 50)}%` }} />
          </span>
          <span class="r">+{Math.round(h * 100)}%</span>
        </div>
        <div class="tenant t-asphalt" {...tip(`Asphalt ${s.asphalt}`, `+${Math.round(ASPHALT_BONUS * 100)}% rent and crew stats each, forever. One per row taken, paid when you bulldoze.`, 'The one thing you and the developer agree on.')}>
          <img src={icon('asphalt')} width={18} height={18} alt="" />
          <span class="k">Asphalt</span>
          <span class="v">{s.asphalt}</span>
          <span class="r">+{Math.round(s.asphalt * ASPHALT_BONUS * 100)}% all</span>
        </div>
        <div class="pole">
          <i />
          <i />
        </div>
      </div>
      {app.speed !== 1 && <div class="debug">debug ×{app.speed}</div>}
      <div class="led-sign">
        <div class="led" {...tip('This run', `${s.stats.wins} fights won, ${s.stats.losses} lost, ${fmtTime(s.time)} on the clock.`, `${s.zone} of ${ZONES.length} lots captured. The board was $40 a month. It shows.`)}>
          <span>
            {s.stats.wins}W-{s.stats.losses}L
          </span>
          <span>{fmtTime(s.time)}</span>
          <span>
            LOTS {s.zone}/{ZONES.length}
          </span>
        </div>
        <Speaker />
        <div class="legs">
          <i />
          <i />
        </div>
      </div>
    </header>
  );
}
