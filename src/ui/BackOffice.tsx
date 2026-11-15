// The Back Office: training (Goodwill / Equity). The arcade's door is up on the roadside, next to the receipt.
import { DAWN } from '../game/content/dawn';
import { app, tip, toast } from '../app';
import { BATTLERS, CURRENCY_SHORT, GOODWILL_PER_EQUITY, REGIONS, ROLES, TRAIN_STEP, type RegionId, type Role } from '../game/defs';
import { convert, currencyOf, purse, roster, train, trainCost } from '../game/economy';
import { fmt } from './format';

const TRACKS: Record<Role, [string, string]> = {
  tank: ['Conditioning', 'tank HP'],
  damage: ['Sparring', 'damage dealer hits'],
  heal: ['First Aid', 'heals'],
  control: ['Paperwork', 'control effects and hits'],
  buffer: ['Team Building', 'buffer auras'],
};

function Training({ r }: { r: RegionId }) {
  const s = app.s;
  const c = s.crews[r];
  const have = purse(s, r);
  const team = roster(s, r);
  return (
    <>
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
              {fmt(cost)} {CURRENCY_SHORT[REGIONS[r].trainIn]}
            </button>
          </div>
        );
      })}
      {s.bypass && (
        <div class="bank" {...tip('The bank', DAWN.bankTip)}>
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
    </>
  );
}

export function BackOffice() {
  const r = app.s.view;
  return (
    <section class="glass training backoffice">
      <h2>
        Back Office <span class="dim">· Training · {currencyOf(r)}</span>
      </h2>
      <Training r={r} />
    </section>
  );
}
