import { app, toast } from '../app';
import { FIGHTERS, SHOPS, ZONES, type ShopKind } from '../game/defs';
import {
  fighterCap,
  leaseUnit,
  nextLeaseCost,
  openCost,
  openShop,
  shopIncome,
  trainRate,
  unlockedShops,
  upgradeCost,
  upgradeShop,
} from '../game/economy';
import { fmt } from '../game/sim';
import type { Slot } from '../game/state';

function act(err: string | null) {
  if (err) toast(err);
  app.refresh();
}

function Storefront({ slot }: { slot: Slot }) {
  const s = app.s;
  if (!slot.leased) {
    const cost = nextLeaseCost(s);
    const isNext = s.slots.find((x) => x.origin === 'home' && !x.leased)?.id === slot.id;
    return (
      <div class="store vacant">
        <div class="store-label">{slot.label}</div>
        <div class="store-empty">FOR LEASE</div>
        <div class="store-sub">Inquire within. Do not inquire within.</div>
        {isNext && cost !== null ? (
          <button class="btn" disabled={s.cash < cost} onClick={() => act(leaseUnit(s))}>
            Sign lease · ${fmt(cost)}
          </button>
        ) : (
          <div class="store-sub dim">Lease the unit next door first.</div>
        )}
      </div>
    );
  }
  if (!slot.shop) {
    return (
      <div class="store empty">
        <div class="store-label">{slot.label}</div>
        <div class="store-empty">VACANT</div>
        <div class="open-list">
          {unlockedShops(s).map((k: ShopKind) => {
            const c = openCost(s, k);
            return (
              <button key={k} class="btn small" disabled={s.cash < c} onClick={() => act(openShop(s, slot.id, k))} title={SHOPS[k].blurb}>
                {SHOPS[k].name} <span class="cost">${fmt(c)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  const shop = slot.shop;
  const d = SHOPS[shop.kind];
  const f = FIGHTERS[d.fighter];
  const cap = fighterCap(s, d.fighter);
  const full = s.roster[d.fighter] >= cap;
  const up = upgradeCost(shop.kind, shop.level);
  const perFighter = 1 / trainRate(s, shop.kind, shop.level);
  return (
    <div class={`store open k-${shop.kind}`}>
      <div class="store-label">
        {slot.label}
        <span class="lvl">Lv {shop.level}</span>
      </div>
      <div class="store-name">{d.name}</div>
      <div class="store-sign">{d.sign}</div>
      <div class="store-row">
        <span>${fmt(shopIncome(s, shop.kind, shop.level))}/s</span>
        {d.heat > 0 && <span class="heat-tag">+{(d.heat * shop.level).toFixed(2)} heat/s</span>}
      </div>
      <div class="train">
        <div class="train-bar">
          <div class="train-fill" style={{ width: `${(full ? 1 : shop.train) * 100}%` }} />
        </div>
        <span class="train-txt">
          {full ? `${f.plural}: bench full (${cap})` : `Training ${f.name.toLowerCase()} · ${perFighter.toFixed(0)}s each`}
        </span>
      </div>
      <button class="btn" disabled={s.cash < up} onClick={() => act(upgradeShop(s, slot.id))}>
        Renovate → Lv {shop.level + 1} · ${fmt(up)}
      </button>
    </div>
  );
}

export function Shops() {
  const s = app.s;
  const home = s.slots.filter((x) => x.origin === 'home');
  const captured = s.slots.filter((x) => x.origin === 'captured');
  const locked = ZONES.filter((_, i) => i >= s.zone)
    .map((z) => z.unlocks)
    .filter((k): k is ShopKind => !!k);
  return (
    <section class="panel shops">
      <h2>
        Pinewood Plaza <span class="dim">est. 1991 · Rt. 9</span>
      </h2>
      <div class="store-grid">
        {home.map((sl) => (
          <Storefront key={sl.id} slot={sl} />
        ))}
      </div>
      {captured.length > 0 && (
        <>
          <h3>Captured storefronts</h3>
          <div class="store-grid">
            {captured.map((sl) => (
              <Storefront key={sl.id} slot={sl} />
            ))}
          </div>
        </>
      )}
      {locked.length > 0 && (
        <p class="dim note">
          Not yet available: {locked.map((k) => SHOPS[k].name).join(', ')}. Capture rival lots to attract new tenants.
        </p>
      )}
    </section>
  );
}
