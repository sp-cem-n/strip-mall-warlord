// Training: five tracks, one per role. Route 9 trains with Goodwill; the Bypass with Equity. Plus the bank.
import { app, tip, toast } from '../app';
import { BATTLERS, GOODWILL_PER_EQUITY, REGIONS, ROLES, TRAIN_STEP, type Role } from '../game/defs';
import { convert, currencyOf, purse, roster, train, trainCost } from '../game/economy';
import { fmt } from './format';

const TRACKS: Record<Role, [string, string]> = {
  tank: ['Conditioning', 'tank HP'],
  damage: ['Sparring', 'damage dealer hits'],
  heal: ['First Aid', 'heals'],
  control: ['Paperwork', 'control effects and hits'],
  buffer: ['Team Building', 'buffer auras'],
};

export function Training() {
  const s = app.s;
  const r = s.view;
  const c = s.crews[r];
  const cur = currencyOf(r);
  const have = purse(s, r);
  const team = roster(s, r);
  return (
    <section class="glass training">
      <h2>
        Training <span class="dim">· {cur} · +{TRAIN_STEP * 100}% a level, this crew only</span>
      </h2>
      {ROLES.map((role) => {
        const [name, what] = TRACKS[role];
        const lv = c.train[role];
        const cost = trainCost(r, lv);
        const who = team.filter(([id]) => BATTLERS[id].role === role).length;
        return (
          <div key={role} class="track">
            <span class={`role-${role}`} {...tip(name, `+${TRAIN_STEP * 100}% ${what} per level.`, `${who} on the crew.`)}>
              <b>{name}</b>
            </span>
            <span class="dim">
              Lv {lv} · +{Math.round(lv * TRAIN_STEP * 100)}%
            </span>
            <button class="btn small" disabled={have < cost} onClick={() => (toast(train(s, r, role) ?? `${name} Lv ${lv + 1}`), app.refresh())}>
              {fmt(cost)} {r === 0 ? 'GW' : 'EQ'}
            </button>
          </div>
        );
      })}
      {s.bypass && (
        <div class="bank" {...tip('The bank', `${GOODWILL_PER_EQUITY} Goodwill buys 1 Equity. One way.`, 'Route 9 Goodwill is how the Bypass gets built. Paving Route 9 makes every later Goodwill worth more.')}>
          <span>
            <b>Bank:</b> {fmt(s.goodwill)} GW → {fmt(Math.floor(s.goodwill / GOODWILL_PER_EQUITY))} EQ
          </span>
          <button class="btn small" disabled={s.goodwill < GOODWILL_PER_EQUITY} onClick={() => (convert(s, Math.max(1, Math.floor(s.goodwill / GOODWILL_PER_EQUITY / 2))), app.refresh())}>
            Half
          </button>
          <button class="btn small hot" disabled={s.goodwill < GOODWILL_PER_EQUITY} onClick={() => (convert(s), app.refresh())}>
            All
          </button>
        </div>
      )}
      <div class="dim tnote">{r === 0 ? 'Goodwill comes from Route 9 wins.' : `Bypass wins pay a little Equity. The bank pays the rest. Equity also buys Bypass leases.`} {REGIONS[r].name} crew: {team.length}.</div>
    </section>
  );
}
