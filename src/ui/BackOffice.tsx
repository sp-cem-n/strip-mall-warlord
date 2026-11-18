// The Back Office: training (Goodwill / Equity). The arcade's door is up on the roadside, next to the receipt.
import { DAWN } from '../game/content/dawn';
import { app, tip, toast } from '../app';
import { BATTLERS, CURRENCY_SHORT, GOODWILL_PER_EQUITY, REGIONS, ROLES, TRAIN_STEP, type RegionId, type Role } from '../game/defs';
import { convert, currencyOf, purse, roster, train, trainCost } from '../game/economy';
import {
  BLITZ,
  BLITZ_WALKIN,
  CONSULT_DOES,
  LANDMARKS,
  blitzCost,
  blitzLevel,
  blitzOpen,
  buyBlitz,
  buyLandmark,
  consultCost,
  consultOpen,
  hireConsultant,
  landmarkBuff,
  landmarkCost,
  landmarkCount,
  landmarkOpen,
} from '../game/sinks';
import { fmt } from './format';
import type { GameState } from '../game/state';

export const TRACKS: Record<Role, [string, string]> = {
  tank: ['Conditioning', 'tank HP'],
  damage: ['Sparring', 'damage dealer hits'],
  heal: ['First Aid', 'heals'],
  control: ['Paperwork', 'control effects and hits'],
  buffer: ['Team Building', 'buffer auras'],
};

// For hovers: the Back Office track that lifts this role, and where it stands.
export function trainedBy(s: GameState, r: RegionId, role: Role) {
  const lv = s.crews[r].train[role];
  return `${TRACKS[role][0]} (${currencyOf(r)}) Lv ${lv}: +${Math.round(lv * TRAIN_STEP * 100)}% ${TRACKS[role][1]}`;
}

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

const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;

// The plaza's buys, each card printing what it does. Hired consultants leave the grid and get one line underneath.
function Plaza({ r }: { r: RegionId }) {
  const s = app.s;
  const cash = s.crews[r].cash;
  const lots = REGIONS[r].lots;
  const items: { key: string; name: string; does: string; cost: number; buy: () => string | null }[] = [];
  lots.forEach((lot, z) => {
    if (consultOpen(s, r, z)) items.push({ key: `c-${z}`, name: `${lot.short} consultant`, does: CONSULT_DOES, cost: consultCost(s, r), buy: () => hireConsultant(s, r, z) });
  });
  if (r === 0) {
    for (const d of LANDMARKS) {
      if (!landmarkOpen(s, d.id)) continue;
      const n = landmarkCount(s, d.id);
      const next = d.buff * (n ? 0.5 : 1);
      items.push({ key: d.id, name: n ? `${d.name} · ${n + 1}` : d.name, does: `+${pct(next)} ${d.does}${n ? `, ${pct(landmarkBuff(s, d.id))} now` : ''}. ${d.art}`, cost: landmarkCost(s, d.id), buy: () => buyLandmark(s, d.id) });
    }
    for (const d of BLITZ) {
      if (!blitzOpen(s, d.id)) continue;
      const lv = blitzLevel(s, d.id);
      items.push({ key: d.id, name: lv ? `${d.name} · run ${lv + 1}` : d.name, does: `+${pct(d.rent)} Route 9 rent, walk-ins ${pct(BLITZ_WALKIN)} sooner. Stacks.`, cost: blitzCost(s, d.id), buy: () => buyBlitz(s, d.id) });
    }
  }
  const hired = s.consultants[r].map((z) => lots[z].short);
  if (!items.length && !hired.length) return null;
  return (
    <>
      <div class="plaza-buy">
        {items.map((it) => (
          <div key={it.key} class="item">
            <b>{it.name}</b>
            <span class="does">{it.does}</span>
            <button class="btn small" disabled={cash < it.cost} onClick={() => (toast(it.buy() ?? it.name), app.refresh())}>
              ${fmt(it.cost)}
            </button>
          </div>
        ))}
      </div>
      {hired.length > 0 && <p class="dim plaza-hired">Consultants renovating: {hired.join(', ')}.</p>}
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
      <h2>
        Plaza <span class="dim">· {app.s.bypass ? 'Landmarks, ads, consultants' : 'Landmarks and ads'}</span>
      </h2>
      <Plaza r={r} />
    </section>
  );
}
