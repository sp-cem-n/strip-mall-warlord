// The Lot panel: region tabs, the lot signs, the field, and the calls.
import { app, tip, toast } from '../app';
import { FIGHTS, REGIONS, type RegionId } from '../game/defs';
import { advance, autoCovers, autoPick, bal, buySlot, curb, lineupOf, slotPrice, slotsOf, topFight } from '../game/economy';
import { CURRENCY_SHORT } from '../game/defs';
import { fmt } from './format';
import { enemyLineup } from '../game/battle';
import { Field } from './Field';
import { fightRate } from '../game/sim';
import { useState } from 'preact/hooks';
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

// The farm-rate card in the lot's sky: what the fights around this one have actually paid lately, per minute or per
// second, smoke breaks and losses included. Fights you haven't run show a dash.
const RATE_KEY = 'smw.farmRate';
function FarmRate({ r }: { r: RegionId }) {
  const s = app.s;
  const [on, setOn] = useState(() => globalThis.localStorage?.getItem(RATE_KEY) === '1');
  const flip = () => (setOn(!on), localStorage.setItem(RATE_KEY, on ? '0' : '1'));
  const at = s.crews[r].at;
  const cur = CURRENCY_SHORT[REGIONS[r].pay];
  const rows = [at - 1, at, at + 1].filter((i) => i >= 0 && i <= topFight(s, r));
  return (
    <div class={`farm-rate ${on ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
      <button class="fr-i" onClick={flip} {...tip('Farm rate', `What each fight has paid lately, ${cur} per minute or second.`, 'Losses and smoke breaks count.')}>
        i
      </button>
      {on &&
        rows.map((i) => {
          const f = FIGHTS[r][i];
          const rt = fightRate(s, r, i);
          const fast = rt && rt.perSec >= 1.5;
          return (
            <div key={i} class={i === at ? 'here' : ''}>
              <span>{f.boss ? 'BOSS' : `${REGIONS[r].lots[f.zone].short} ${f.i + 1}`}</span>
              <b>{rt ? `${fmt(fast ? rt.perSec : rt.perSec * 60)} ${cur}/${fast ? 's' : 'm'}` : '—'}</b>
              <span>{rt ? `${Math.round(rt.won * 100)}% won` : ''}</span>
            </div>
          );
        })}
    </div>
  );
}

export function Lot() {
  const s = app.s;
  const r = s.view;
  const c = s.crews[r];
  const ladder = FIGHTS[r];
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
      </h2>
      <ZoneTrack r={r} />
      <div class="field-head">
        <button class="btn small" disabled={c.at === 0} onClick={() => (advance(s, r, -1), app.refresh())} {...tip('Back one fight', 'Farm an easier fight. Wins still pay.', 'The patrol waits here until you press ▸.')}>
          ◂
        </button>
        <span class="fh-main">
          <b>{boss ? boss.name : `${lot.name} · fight ${f.i + 1}/${lot.fights}`}</b>
          <span class="dim">
            {atFrontier ? ` · ${c.kills}/${f.need} wins to move up` : ` · farming (${c.farmed} wins)`}
            {tells.length ? ` · ${tells.map((t) => (t === 'tanky' ? 'tanky' : 'hits hard')).join(', ')}` : ''}
          </span>
        </span>
        <button class="btn small" disabled={c.at >= topFight(s, r)} onClick={() => (advance(s, r, 1), app.refresh())} {...tip('Advance', 'Move up a fight now instead of waiting.', !autoCovers(s, r, f.zone) ? 'Nobody is watching this lot yet: advance by hand.' : c.parked ? 'The patrol is paused here. Press ▸ to let it climb again.' : 'This lot moves up by itself after the crew farms a while.')}>
          ▸
        </button>
      </div>
      <div class="field-box">
        <Field r={r} />
        <FarmRate r={r} />
      </div>
    </section>
  );
}
