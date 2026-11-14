import { useEffect, useState } from 'preact/hooks';
import { app } from '../app';
import { ASPHALT_BONUS, HEAT_RAID_AT, PRESTIGE_MIN_ZONE, ZONES } from '../game/defs';
import { heatPerSec, incomePerSec } from '../game/economy';
import { asphaltGain, bulldoze, canBulldoze, fmt, fmtTime } from '../game/sim';
import { saveGame } from '../game/save';
import { Battle } from './Battle';
import { Crew, Log } from './Crew';
import { Shops } from './Shops';

function TopBar() {
  const s = app.s;
  const net = heatPerSec(s) - 0.05;
  return (
    <header class="top">
      <div class="brand">
        STRIP MALL WARLORD
        <span class="dim"> · Fall 1997</span>
      </div>
      <div class="stat">
        <span class="k">Cash</span>
        <span class="v">${fmt(s.cash)}</span>
        <span class="dim">+${fmt(incomePerSec(s))}/s</span>
      </div>
      <div class="stat heat">
        <span class="k">Heat</span>
        <div class="meter" title={`Raids start at ${HEAT_RAID_AT}. Payday loan shops raise it; it cools ${0.05}/s.`}>
          <div class={`meter-fill ${s.heat >= HEAT_RAID_AT ? 'hot' : ''}`} style={{ width: `${s.heat}%` }} />
          <div class="meter-mark" style={{ left: `${HEAT_RAID_AT}%` }} />
        </div>
        <span class="dim">
          {s.heat.toFixed(0)}/100 {net > 0 ? `▲${net.toFixed(2)}/s` : ''}
        </span>
      </div>
      <div class="stat">
        <span class="k">Asphalt</span>
        <span class="v">{s.asphalt}</span>
        <span class="dim">+{Math.round(s.asphalt * ASPHALT_BONUS * 100)}% speed</span>
      </div>
      <div class="stat">
        <span class="k">Territory</span>
        <span class="v">
          {Math.min(s.zone, ZONES.length)}/{ZONES.length}
        </span>
        <span class="dim">lots held</span>
      </div>
      {app.speed !== 1 && <div class="debug">debug ×{app.speed}</div>}
    </header>
  );
}

function Prestige() {
  const s = app.s;
  const ok = canBulldoze(s);
  const gain = asphaltGain(s);
  return (
    <section class="panel prestige">
      <h2>Bulldoze into a parking lot</h2>
      <p class="dim">
        Tear it all down. Shops, crew, captured lots, cash: gone. You keep Asphalt, and every point makes every shop {Math.round(ASPHALT_BONUS * 100)}% faster at earning and training. Permanently.
      </p>
      <button
        class="btn danger"
        disabled={!ok}
        onClick={() => {
          if (!confirm(`Bulldoze everything for +${gain} asphalt?`)) return;
          app.s = bulldoze(s);
          saveGame(app.s);
          app.refresh();
        }}
      >
        {ok ? `Bulldoze · +${gain} asphalt` : `Capture ${ZONES[PRESTIGE_MIN_ZONE - 1].name} first`}
      </button>
      {ok && s.time - s.lastCapture > 300 && !s.won && <p class="hint">No new lot in {fmtTime(s.time - s.lastCapture)}. Paving might be the move.</p>}
    </section>
  );
}

function Away() {
  const a = app.away;
  if (!a) return null;
  return (
    <div class="modal-bg" onClick={() => ((app.away = null), app.refresh())}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <h2>While you were away</h2>
        <p class="dim">
          {fmtTime(a.seconds)} passed{a.seconds >= 8 * 3600 ? ' (8h cap)' : ''}. The plaza kept its hours.
        </p>
        <table>
          <tbody>
            <tr>
              <td>Shops earned</td>
              <td>${fmt(a.earned)}</td>
            </tr>
            <tr>
              <td>Fights won / lost</td>
              <td>
                {a.wins} / {a.losses}
              </td>
            </tr>
            <tr>
              <td>Rent &amp; fines paid</td>
              <td>${fmt(a.rentPaid)}</td>
            </tr>
            <tr>
              <td>New crew</td>
              <td>{a.trained}</td>
            </tr>
            {a.raids > 0 && (
              <tr>
                <td>Raids</td>
                <td>{a.raids}</td>
              </tr>
            )}
            <tr>
              <td>Captured</td>
              <td>{a.captured.length ? a.captured.join(', ') : 'nothing new'}</td>
            </tr>
          </tbody>
        </table>
        <button class="btn" onClick={() => ((app.away = null), app.refresh())}>
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
        <div class="col left">
          <Shops />
          <Prestige />
        </div>
        <div class="col mid">
          <Battle />
          <Log />
        </div>
        <div class="col right">
          <Crew />
        </div>
      </main>
      {app.toast && performance.now() < app.toastUntil && <div class="toast">{app.toast}</div>}
      <Away />
    </div>
  );
}
