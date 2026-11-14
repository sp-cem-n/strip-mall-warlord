import { app, toast } from '../app';
import { FIGHTERS, HEAT_PER_PAYDAY_LEVEL, SHOPS, STAT_GROWTH, ZONES, type ShopKind } from '../game/defs';
import { asphaltMult, collectFind, openShop, renovate, renovateCost, slotIncome, unlockedShops } from '../game/economy';
import type { Slot } from '../game/state';
import { crewURL, facadeURL, icon } from './art';
import { fmt } from './format';

const act = (err: string | null) => (err && toast(err), app.refresh());

function Storefront({ slot }: { slot: Slot }) {
  const s = app.s;
  const f = slot.shop ? FIGHTERS[SHOPS[slot.shop].fighter] : null;
  const m = STAT_GROWTH ** (slot.level - 1) * asphaltMult(s);
  const cost = renovateCost(slot.level);
  const find = s.find?.slot === slot.id ? s.find : null;
  return (
    <div class={`unit ${slot.shop ? '' : 'vacant'}`}>
      <div class="facade" title={f ? `${f.name}: ${f.does}` : 'Vacant'}>
        <img src={facadeURL(slot.shop, slot.id)} width={128} height={112} alt={slot.shop ? SHOPS[slot.shop].name : 'Vacant storefront'} />
        {find && (
          <button class="walkin" onClick={() => act(collectFind(s))} title={`Someone's here to pawn a ${find.name}. Click to take it.`}>
            <img src={icon('find')} width={27} height={27} alt="" />
            <span>{find.name}?</span>
          </button>
        )}
      </div>
      <div class="unit-info">
        <div class="unit-head">
          <span>{slot.label}</span>
          <span>Lv {slot.level}</span>
        </div>
        {f ? (
          <div class="crewline">
            <img src={crewURL(f.kind)} width={16} height={24} alt="" />
            <span>
              <strong>{f.name}</strong> {Math.round(f.hp * m)}hp · {f.kind === 'medic' ? `+${Math.round(f.dmg * m)}` : Math.round(f.dmg * m)}
              <br />
              <span class="dim">rent ${fmt(slotIncome(s, slot))}/s</span>
              {slot.shop === 'payday' && <span class="heat-tag"> heat +{Math.round(slot.level * HEAT_PER_PAYDAY_LEVEL * 100)}%</span>}
            </span>
          </div>
        ) : (
          <div class="crewline dim">Nobody. Open something.</div>
        )}
        {slot.shop && (
          <button class="btn" disabled={s.cash < cost} onClick={() => act(renovate(s, slot.id))}>
            Renovate ${fmt(cost)}
          </button>
        )}
        <select
          class="btn"
          value=""
          onChange={(e) => {
            const k = (e.target as HTMLSelectElement).value as ShopKind;
            if (k) act(openShop(s, slot.id, k));
          }}
        >
          <option value="">{slot.shop ? 'Rebrand…' : 'Open a shop…'}</option>
          {unlockedShops(s)
            .filter((k) => k !== slot.shop)
            .map((k) => (
              <option key={k} value={k} disabled={s.cash < SHOPS[k].openCost}>
                {SHOPS[k].name} → {FIGHTERS[SHOPS[k].fighter].name} · ${fmt(SHOPS[k].openCost)}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}

export function Shops() {
  const s = app.s;
  const locked = ZONES.slice(s.zone).flatMap((z) => (z.unlocks ? [SHOPS[z.unlocks].name] : []));
  return (
    <section class="panel shops">
      <h2>
        Pinewood Plaza <span class="dim">· est. 1991 · every storefront pays rent and sends one crew member</span>
      </h2>
      <div class="strip">
        {s.slots.map((sl) => (
          <Storefront key={sl.id} slot={sl} />
        ))}
      </div>
      <p class="dim note">Renovations stay with the building; a rebrand keeps the level.{locked.length > 0 && ` Coming once you capture more lots: ${locked.join(', ')}.`}</p>
    </section>
  );
}
