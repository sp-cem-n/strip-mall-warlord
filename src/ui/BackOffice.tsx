// The Back Office: training (Goodwill / Equity). The arcade's door is up on the roadside, next to the receipt.
import { DAWN } from '../game/content/dawn';
import { app, tip, toast } from '../app';
import { BATTLERS, CURRENCY_SHORT, GOODWILL_PER_EQUITY, REGIONS, ROLES, TRAIN_STEP, type RegionId, type Role } from '../game/defs';
import { convert, currencyOf, purse, roster, train, trainCost } from '../game/economy';
import {
  BLITZ,
  LANDMARKS,
  autoRenoCost,
  blitzCost,
  blitzLevel,
  blitzOpen,
  buyAutoReno,
  buyBlitz,
  buyLandmark,
  buyRetainer,
  consultCost,
  consultOpen,
  hasAutoReno,
  hasConsultant,
  hasLandmark,
  hireConsultant,
  landmarkCost,
  landmarkOpen,
  retainCost,
  retainOpen,
} from '../game/sinks';
import { fmt } from './format';
import { SaveBox } from './Screens';

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
    <div class="tracks">
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
    </div>
  );
}

function Plaza({ r }: { r: RegionId }) {
  const s = app.s;
  const cash = s.crews[r].cash;
  const lots = REGIONS[r].lots;
  const items: { key: string; name: string; does: string; cost: number; ok: boolean; have: boolean; buy: () => string | null }[] = [];
  lots.forEach((lot, z) => {
    if (hasConsultant(s, r, z) || consultOpen(s, r, z)) {
      const have = hasConsultant(s, r, z);
      items.push({
        key: `c-${r}-${z}`,
        name: `${lot.name} consultant`,
        does: have ? (hasAutoReno(s, r, z) ? 'Keeping the lights on, and renovating when the till allows.' : 'Keeping the lights on.') : 'They keep the lights on after you move on.',
        cost: consultCost(s, r),
        ok: consultOpen(s, r, z) && cash >= consultCost(s, r),
        have,
        buy: () => hireConsultant(s, r, z),
      });
      if (have && !hasAutoReno(s, r, z)) {
        items.push({
          key: `ar-${r}-${z}`,
          name: `${lot.name} auto-reno`,
          does: 'Renovates a shop on this lot when the till can cover it twice over.',
          cost: autoRenoCost(s, r),
          ok: cash >= autoRenoCost(s, r),
          have: false,
          buy: () => buyAutoReno(s, r, z),
        });
      }
    }
  });
  if (r === 0) {
    for (const d of LANDMARKS) {
      if (hasLandmark(s, d.id) || landmarkOpen(s, d.id)) {
        items.push({
          key: d.id,
          name: d.name,
          does: d.does,
          cost: landmarkCost(s, 0, d.id),
          ok: landmarkOpen(s, d.id) && cash >= landmarkCost(s, 0, d.id),
          have: hasLandmark(s, d.id),
          buy: () => buyLandmark(s, d.id),
        });
      }
    }
    for (const d of BLITZ) {
      if (blitzOpen(s, d.id)) {
        const lv = blitzLevel(s, d.id);
        items.push({
          key: d.id,
          name: lv ? `${d.name} · run ${lv + 1}` : d.name,
          does: d.does,
          cost: blitzCost(s, 0, d.id),
          ok: cash >= blitzCost(s, 0, d.id),
          have: false,
          buy: () => buyBlitz(s, d.id),
        });
      }
    }
  }
  if (retainOpen(s, r) || s.retainers > 0) {
    items.push({
      key: 'retain',
      name: s.retainers ? `Crew contract · ${s.retainers + 1}` : 'Crew contract',
      does: 'Veterans hold a little harder. Stacks.',
      cost: retainCost(s, r),
      ok: retainOpen(s, r) && cash >= retainCost(s, r),
      have: false,
      buy: () => buyRetainer(s, r),
    });
  }
  if (!items.length) return null;
  return (
    <div class="plaza-buy">
      {items.map((it) => (
        <div key={it.key} class="item">
          <b>{it.name}</b>
          <span class="dim">{it.does}</span>
          {it.have ? (
            <span class="dim">Bought</span>
          ) : (
            <button class="btn small" disabled={!it.ok} onClick={() => (toast(it.buy() ?? it.name), app.refresh())}>
              ${fmt(it.cost)}
            </button>
          )}
        </div>
      ))}
    </div>
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
      <h2>
        Plaza <span class="dim">· Consultants, signs, contracts</span>
      </h2>
      <Plaza r={r} />
      <h2>
        Lease <span class="dim">· A code for this run</span>
      </h2>
      <SaveBox />
    </section>
  );
}
