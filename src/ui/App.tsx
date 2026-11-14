import { useEffect, useState } from 'preact/hooks';
import { app } from '../app';
import { ASPHALT_BONUS, ZONES } from '../game/defs';
import { heat, incomePerSec } from '../game/economy';
import { icon } from './art';
import { Lot, Log } from './Lot';
import { fmt, fmtTime } from './format';
import { Shops } from './Shops';

function TopBar() {
  const s = app.s;
  const h = heat(s);
  return (
    <header class="top">
      <div class="brand">
        STRIP MALL WARLORD<span class="dim"> · Fall 1997</span>
      </div>
      <div class="stat">
        <img src={icon('cash')} width={18} height={18} alt="" />
        <span class="k">Cash</span>
        <span class="v">${fmt(s.cash)}</span>
        <span class="dim">+${fmt(incomePerSec(s))}/s</span>
      </div>
      <div class="stat heat" title="Every Payday Loans level you own makes every enemy stronger. Rebrand it away and Heat goes with it.">
        <img src={icon('heat')} width={18} height={18} alt="" />
        <span class="k">Heat</span>
        <div class="meter">
          <div class={`meter-fill ${h >= 0.5 ? 'hot' : ''}`} style={{ width: `${Math.min(100, h * 50)}%` }} />
        </div>
        <span class="dim">+{Math.round(h * 100)}% enemy strength</span>
      </div>
      <div class="stat">
        <img src={icon('asphalt')} width={18} height={18} alt="" />
        <span class="k">Asphalt</span>
        <span class="v">{s.asphalt}</span>
        <span class="dim">+{Math.round(s.asphalt * ASPHALT_BONUS * 100)}% everything</span>
      </div>
      <div class="stat">
        <img src={icon('lots')} width={18} height={18} alt="" />
        <span class="k">Lots</span>
        <span class="v">
          {s.zone}/{ZONES.length}
        </span>
        <span class="dim">
          {s.stats.wins}W–{s.stats.losses}L · {fmtTime(s.time)}
        </span>
      </div>
      {app.speed !== 1 && <div class="debug">debug ×{app.speed}</div>}
    </header>
  );
}

function Away() {
  const a = app.away;
  if (!a) return null;
  const close = () => ((app.away = null), app.refresh());
  const rows: [string, string][] = [
    ['Rent collected', `$${fmt(a.earned)}`],
    ['Fights won / lost', `${a.wins} / ${a.losses}`],
    ['Rows taken', `${a.rows}`],
    ['Lots captured', a.captured.join(', ') || 'nothing new'],
  ];
  return (
    <div class="modal-bg" onClick={close}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <h2>While you were away</h2>
        <p class="dim">
          {fmtTime(a.seconds)} passed{a.seconds >= 8 * 3600 ? ' (8h cap)' : ''}. The plaza kept its hours.
        </p>
        {a.onBreak && <p class="hint">The crew is on a smoke break. Change the lineup or renovate and they'll go back out.</p>}
        <table>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button class="btn" onClick={close}>
          Back to work
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [, setN] = useState(0);
  useEffect(() => {
    app.refresh = () => setN((n) => n + 1);
  }, []);
  return (
    <div class="root">
      <TopBar />
      <main class="grid">
        <Shops />
        <div class="col">
          <Lot />
          <Log />
        </div>
      </main>
      {app.toast && performance.now() < app.toastUntil && <div class="toast">{app.toast}</div>}
      <Away />
    </div>
  );
}
