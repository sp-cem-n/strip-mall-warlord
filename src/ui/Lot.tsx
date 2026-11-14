// The Lot panel: region tabs, the lot signs, the field, and the calls.
import { app, tip, toast } from '../app';
import { FIGHTS, REGIONS, type RegionId } from '../game/defs';
import { advance, autoCovers, autoPick, bal, buySlot, curb, lineupOf, lotsTaken, regionDone, slotPrice, slotsOf, topFight, view } from '../game/economy';
import { CURRENCY_SHORT } from '../game/defs';
import { fmt } from './format';
import { enemyLineup } from '../game/battle';
import { Calls } from './Calls';
import { Field } from './Field';
import { ZoneTrack } from './ZoneTrack';

function Slots({ r }: { r: RegionId }) {
  const s = app.s;
  const c = s.crews[r];
  const n = slotsOf(s, r);
  const used = lineupOf(s, r).length;
  const price = slotPrice(s, r);
  const cur = REGIONS[r].trainIn;
  return (
    <span class="slots dim">
      <span {...tip('Fighter slots', `${used} of ${n} fielded. ${curb(s, r).length} on the curb, always on.`, c.lineup ? 'Picked by hand.' : 'Auto picks the lineup for each fight.')}>
        · {used}/{n} fielding · {curb(s, r).length} on the curb
      </span>
      <button class={`btn small ${c.lineup ? '' : 'on'}`} onClick={() => (autoPick(s, r), app.refresh())} {...tip('Auto lineup', 'Best tank, a healer, counters for this fight, then raw power.')}>
        AUTO
      </button>
      {isFinite(price) && (
        <button class="btn small" disabled={bal(s, r, cur) < price} onClick={() => (toast(buySlot(s, r) ?? `Slot ${n + 1}`), app.refresh())} {...tip('Another slot', `One more fighter on the lot. ${fmt(price)} ${CURRENCY_SHORT[cur]}.`)}>
          +1 slot {fmt(price)} {CURRENCY_SHORT[cur]}
        </button>
      )}
    </span>
  );
}

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
          The Lot <Slots r={r} />
        </span>
        {s.bypass && (
          <span class="tabs">
            {REGIONS.map((reg) => (
              <button key={reg.id} class={`tab ${r === reg.id ? 'on' : ''}`} onClick={() => (view(s, reg.id), app.refresh())} {...tip(reg.name, `${lotsTaken(s, reg.id)}/${reg.lots.length} lots.`)}>
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
    </section>
  );
}
