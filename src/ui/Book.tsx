// The contractor's sample book: rebranding happens by picking a new sign, not a dropdown.
import { app, toast } from '../app';
import { FIGHTERS, INCOME_GROWTH, SHOPS, SHOP_ORDER, ZONES, type FighterKind, type ShopKind } from '../game/defs';
import { asphaltMult, openShop, unlockedShops } from '../game/economy';
import { crewURL, signURL } from './art';
import { register } from './audio';
import { fmt } from './format';

function counters(k: FighterKind): string {
  const names = new Set<string>();
  for (const z of ZONES) for (const e of [...z.regulars, z.boss]) if (e.weak === k) names.add(e.name);
  return names.size ? [...names].join(', ') : '';
}

export function Book() {
  const id = app.book;
  if (id === null) return null;
  const s = app.s;
  const sl = s.slots[id];
  if (!sl) return null;
  const open = unlockedShops(s);
  const close = () => ((app.book = null), app.refresh());
  const pick = (k: ShopKind) => {
    const err = openShop(s, id, k);
    if (err) return toast(err);
    register();
    app.raising[id] = performance.now() + 1200; // scaffolding stays up a moment, then the sign flickers on
    close();
  };
  return (
    <div class="modal-bg" onClick={close}>
      <div class="book" onClick={(e) => e.stopPropagation()}>
        <div class="book-head">
          <h2>Rt. 9 Sign &amp; Awning Co.</h2>
          <span class="dim">Sample book · "We put the letters up. Most of them."</span>
        </div>
        <p class="book-for">
          For {sl.label}, Lv {sl.level}. {sl.shop ? `Currently ${SHOPS[sl.shop].name}. ` : 'Currently nothing. '}The renovations stay with the building.
        </p>
        <div class="samples">
          {SHOP_ORDER.map((k) => {
            const d = SHOPS[k];
            const f = FIGHTERS[d.fighter];
            const locked = !open.includes(k);
            const current = sl.shop === k;
            const broke = s.cash < d.openCost;
            const from = ZONES.find((z) => z.unlocks === k);
            const c = counters(f.kind);
            return (
              <button key={k} class={`sample ${locked ? 'locked' : ''} ${current ? 'current' : ''}`} disabled={locked || current || broke} onClick={() => pick(k)}>
                <img class="sample-sign" src={signURL(k, id + 1)} width={120} height={28} alt={d.name} />
                <span class="sample-name">
                  {d.name} <span class="cost">${fmt(d.openCost)}</span>
                </span>
                <span class="sample-crew">
                  <img src={crewURL(f.kind)} width={16} height={24} alt="" />
                  <span>
                    Trains a {f.name}. Rent here ${fmt(d.income * INCOME_GROWTH ** (sl.level - 1) * asphaltMult(s))}/s.
                  </span>
                </span>
                <span class="sample-counters">{c ? `Counters: ${c}.` : f.does}</span>
                <span class="sample-status">{current ? 'Already up there' : locked ? `Sample pending: take ${from?.name ?? 'more lots'}` : broke ? `Need $${fmt(d.openCost)}` : sl.shop ? 'Put this one up' : 'Open it'}</span>
              </button>
            );
          })}
        </div>
        <button class="btn" onClick={close}>
          Close the book
        </button>
      </div>
    </div>
  );
}
