// The Lot panel: region tabs, the lot signs, the field, and the calls.
import { app, tip } from '../app';
import { FIGHTS, REGIONS, ROLES, WEAK_BONUS } from '../game/defs';
import { advance, autoCovers, lotsTaken, regionDone, topFight, view } from '../game/economy';
import { enemyLineup } from '../game/battle';
import { Calls } from './Calls';
import { Field } from './Field';
import { ZoneTrack } from './ZoneTrack';

export function Lot() {
  const s = app.s;
  const r = s.view;
  const c = s.crews[r];
  const ladder = FIGHTS[r];
  const done = regionDone(s, r);
  const f = ladder[Math.min(c.at, ladder.length - 1)];
  const lot = REGIONS[r].lots[f.zone];
  const atFrontier = c.at === c.frontier;
  const lineup = enemyLineup(r, Math.min(c.at, ladder.length - 1));
  const tells = [...new Set(lineup.map((e) => e.def.tell).filter(Boolean))];
  const boss = f.boss ? lot.boss : null;
  return (
    <section class="glass lot">
      <h2>
        <span>
          The Lot <span class="dim">· fights run themselves</span>
        </span>
        {s.bypass && (
          <span class="tabs">
            {REGIONS.map((reg) => (
              <button key={reg.id} class={`tab ${r === reg.id ? 'on' : ''}`} onClick={() => (view(s, reg.id), app.refresh())} {...tip(reg.name, `${lotsTaken(s, reg.id)}/${reg.lots.length} lots. Its own crew, its own till.`, 'Both crews fight all the time. This picks which one you manage.')}>
                {reg.name}
              </button>
            ))}
          </span>
        )}
      </h2>
      <ZoneTrack r={r} />
      <div class="field-head">
        <button class="btn small" disabled={c.at === 0} onClick={() => (advance(s, r, -1), app.refresh())} {...tip('Back one fight', 'Farm an easier fight. Wins still pay.')}>
          ◂
        </button>
        <span class="fh-main">
          <b>{boss ? boss.name : `${lot.name} · fight ${f.i + 1}/${lot.fights}`}</b>
          <span class="dim">
            {done && c.at === ladder.length - 2 ? ' · keeping the lights on' : atFrontier ? ` · ${c.kills}/${f.need} wins to move up` : ` · farming (${c.farmed} wins)`}
            {tells.length ? ` · ${tells.map((t) => (t === 'tanky' ? 'tanky' : 'hits hard')).join(', ')}` : ''}
          </span>
        </span>
        <button class="btn small" disabled={c.at >= topFight(s, r)} onClick={() => (advance(s, r, 1), app.refresh())} {...tip('Advance', 'Move up a fight now instead of waiting.', autoCovers(s, r, f.zone) ? 'This lot moves up by itself after the crew farms a while.' : 'Nobody is watching this lot yet: advance by hand.')}>
          ▸
        </button>
      </div>
      <Field r={r} />
      <Calls r={r} />
      <div class="legend dim">
        Front to back: {ROLES.map((ro) => <b key={ro} class={`role-${ro}`}>{ro} </b>)}. Enemies hit the front first. The badge is who they're weak to (+{WEAK_BONUS * 100}%).
      </div>
    </section>
  );
}
