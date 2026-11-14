import { app, toast } from '../app';
import { FIGHTERS, HEAT_PER_PAYDAY_LEVEL, SHOPS, STAT_GROWTH, ZONES, type ShopKind } from '../game/defs';
import { asphaltMult, openShop, renovate, renovateCost, slotIncome, unlockedShops } from '../game/economy';
import type { Slot } from '../game/state';
import { fmt } from './format';

const act = (err: string | null) => (err && toast(err), app.refresh());

function ShopButtons({ slot }: { slot: Slot }) {
  const s = app.s;
  return (
    <div class={slot.shop ? 'rebrand' : 'open-list'}>
      {slot.shop && <span class="dim">Rebrand:</span>}
      {unlockedShops(s)
        .filter((k) => k !== slot.shop)
        .map((k: ShopKind) => (
          <button key={k} class={`btn small k-${k}`} disabled={s.cash < SHOPS[k].openCost} onClick={() => act(openShop(s, slot.id, k))} title={FIGHTERS[SHOPS[k].fighter].does}>
            {slot.shop ? SHOPS[k].name.split(' ')[0] : `${SHOPS[k].name} → ${FIGHTERS[SHOPS[k].fighter].name}`} <span class="cost">${fmt(SHOPS[k].openCost)}</span>
          </button>
        ))}
    </div>
  );
}

function Storefront({ slot }: { slot: Slot }) {
  const s = app.s;
  const head = (
    <div class="store-label">
      {slot.label}
      {slot.level > 1 && <span class="lvl">Lv {slot.level}</span>}
    </div>
  );
  if (!slot.shop)
    return (
      <div class="store empty">
        {head}
        <div class="store-empty">VACANT</div>
        <ShopButtons slot={slot} />
      </div>
    );
  const f = FIGHTERS[SHOPS[slot.shop].fighter];
  const m = STAT_GROWTH ** (slot.level - 1) * asphaltMult(s);
  const cost = renovateCost(slot.level);
  return (
    <div class={`store open k-${slot.shop}`}>
      {head}
      <div class="store-name">
        {SHOPS[slot.shop].name} <span class="dim">· ${fmt(slotIncome(s, slot))}/s</span>
      </div>
      <div class="fighter">
        <span class="chip sm">{f.name[0]}</span>
        <strong>{f.name}</strong>
        <span class="dim">
          {Math.round(f.hp * m)} HP · {f.kind === 'medic' ? `heals ${Math.round(f.dmg * m)}` : `${Math.round(f.dmg * m)} dmg`}
        </span>
      </div>
      <div class="does dim">{f.does}</div>
      {slot.shop === 'payday' && <div class="heat-tag">+{Math.round(slot.level * HEAT_PER_PAYDAY_LEVEL * 100)}% enemy strength (Heat)</div>}
      <button class="btn" disabled={s.cash < cost} onClick={() => act(renovate(s, slot.id))}>
        Renovate → Lv {slot.level + 1} · ${fmt(cost)}
      </button>
      <ShopButtons slot={slot} />
    </div>
  );
}

export function Shops() {
  const s = app.s;
  const locked = ZONES.slice(s.zone).flatMap((z) => (z.unlocks ? [z.unlocks] : []));
  return (
    <section class="panel shops">
      <h2>
        Pinewood Plaza <span class="dim">· each storefront earns rent and sends one crew member</span>
      </h2>
      <div class="store-grid">
        {s.slots.map((sl) => (
          <Storefront key={sl.id} slot={sl} />
        ))}
      </div>
      <p class="dim note">
        Renovations stay with the building, so a rebrand keeps the level.
        {locked.length > 0 && ` Not yet available: ${locked.map((k) => SHOPS[k].name).join(', ')}. Capture lots to attract them.`}
      </p>
    </section>
  );
}
