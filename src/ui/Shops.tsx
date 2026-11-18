// The plaza: one fixed-layout card per storefront. Leased shops renovate; new ones come up for lease in order.
import { lit, relight } from './lights';
import { useEffect, useRef } from 'preact/hooks';
import { DAWN } from '../game/content/dawn';
import { app, tip, toast } from '../app';
import { BATTLERS, CURRENCY_NAME, REGIONS, SHOPS, WALKIN_STAYS, type RegionId, type ShopDef } from '../game/defs';
import { bal, leaseCur, tierOf, bossLevel, currencyOf, forLease, joined, lease, leased, lineupOf, regionDone, renovate, renovateCost, rentOf, toggleField } from '../game/economy';
import { statsOf } from '../game/battle';
import { collectFind, walkInValue } from '../game/sim';
import { LANDMARKS, hasLandmark } from '../game/sinks';
import type { GameState } from '../game/state';
import { crewURL, facadeURL, landmarkURL, scaffoldURL } from './art';
import { register } from './audio';
import { fmt } from './format';

const act = (err: string | null) => (err && toast(err), app.refresh());
const RAISE_MS = 1400;
const EFFECT = { cash: (v: number) => `+$${fmt(v)} cash`, referral: (v: number) => `+${fmt(v)} ${currencyOf(app.s.view)}`, rally: () => 'Crew hits 25% harder for 30s' };

function WalkIn({ sh }: { sh: ShopDef }) {
  const s = app.s;
  const f = s.find!;
  const v = walkInValue(s, f.kind);
  return (
    <button
      class={`walkin w-${f.kind}`}
      onClick={(e) => {
        e.stopPropagation();
        if (f.kind === 'cash') register();
        act(collectFind(s));
        app.tip = null;
      }}
      {...tip(`Walk-in at the ${sh.name}`, `${sh.walkin.who}: ${f.name}.`, `Click: ${EFFECT[f.kind](v)}.`, `Leaves in ${Math.ceil(f.left)}s.`)}
    >
      <b>{sh.walkin.who}</b>
      <span>{f.name}</span>
      <i style={{ width: `${(f.left / WALKIN_STAYS) * 100}%` }} />
    </button>
  );
}

const statLine = (role: string, hp: number, dmg: number) => `HP ${fmt(hp)} · ${role === 'heal' ? 'HEAL' : 'DMG'} ${fmt(dmg)}`;

function Unit({ sh }: { sh: ShopDef }) {
  const s = app.s;
  const c = s.crews[sh.region];
  const lv = c.shops[sh.id] ?? 0;
  const d = BATTLERS[sh.battler];
  const now = performance.now();
  const raising = now < (app.raising[sh.id] ?? 0);
  const st = statsOf(s, sh.region, sh.battler, Math.max(1, lv) + tierOf(sh.id));
  const nx = statsOf(s, sh.region, sh.battler, lv + 1 + tierOf(sh.id));
  const cost = lv ? renovateCost(sh.id, lv) : sh.lease;
  const cur = lv ? 'cash' : leaseCur(sh);
  const afford = bal(s, sh.region, cur) >= cost;
  const rent = rentOf(s, sh.id, lv);
  const dRent = rentOf(s, sh.id, lv + 1) - rent;
  return (
    <div class={`unit ${lv ? '' : 'vacant'}`}>
      <div class="facade" {...tip(sh.name, sh.tagline, lv ? `Rent $${fmt(rent)}/s. Sends one ${d.name}.` : `For lease. Sends one ${d.name}: ${d.does}`)}>
        <img
          class={!raising && now < (app.raising[sh.id] ?? 0) + 700 ? 'flicker' : ''}
          onClick={(e) => lv > 0 && e.offsetY < e.currentTarget.clientHeight / 3 && relight(sh.id)} // the sign band is the top third
          src={facadeURL(sh.id, lv > 0 && !raising, lit.has(sh.id))} width={192} height={168} alt={sh.name} />
        {raising && <img class="scaffold" src={scaffoldURL()} width={192} height={168} alt="" />}
        {s.find?.shop === sh.id && <WalkIn sh={sh} />}
      </div>
      <div class="unit-info">
        <div class="unit-head">
          <span>{sh.name}</span>
          <span class="uh-r">
            {lv > 0 && <FieldToggle r={sh.region} id={d.id} />}
            {lv ? `Lv ${lv}` : 'NEW'}
          </span>
        </div>
        <div class="crewline" {...tip(`${d.name}${lv ? ` · Lv ${lv}` : ''}`, d.does, `${d.role} · every ${d.interval}s`, d.line)}>
          <img src={crewURL(d.id)} width={16} height={24} alt="" />
          <span class="cl">
            <b class={`role-${d.role}`}>{d.name}</b>
            <span>{statLine(d.role, st.hp, st.dmg)}</span>
            <span class="dim">{lv ? `rent $${fmt(rent)}/s` : `rent $${fmt(sh.rent)}/s`}</span>
          </span>
        </div>
        <div class="next" {...tip('Next renovation', `+${fmt(nx.hp - st.hp)} HP, +${fmt(nx.dmg - st.dmg)} ${d.role === 'heal' ? 'heal' : 'damage'}${sh.rent ? `, +$${fmt(dRent)}/s rent` : ''}.`, `Lv ${lv} → ${lv + 1}. Renovations are the big stat jump.`)}>
          {lv ? (
            <>
              <span>
                ▲ +{fmt(nx.hp - st.hp)} HP +{fmt(nx.dmg - st.dmg)} {d.role === 'heal' ? 'HEAL' : 'DMG'}
              </span>
              <span>{sh.rent ? `▲ +$${fmt(dRent)}/s rent` : 'no rent'}</span>
            </>
          ) : (
            <>
              <span>{d.does}</span>
              <span class="dim">{cur === 'cash' ? '' : `Leased in ${CURRENCY_NAME[cur]}`}</span>
            </>
          )}
        </div>
        <button
          class={`btn ${lv ? '' : 'hot'}`}
          disabled={!afford}
          onClick={() => {
            if (lv) return act(renovate(s, sh.id));
            const err = lease(s, sh.id);
            if (!err) (app.raising[sh.id] = performance.now() + RAISE_MS), register();
            act(err);
          }}
        >
          {lv ? `Renovate $${fmt(cost)}` : cur === 'cash' ? `Lease it $${fmt(cost)}` : `Lease ${fmt(cost)} ${CURRENCY_NAME[cur]}`}
        </button>
      </div>
    </div>
  );
}

// FIELD / BENCH for fighters; buffers stand on the curb and are always on.
function FieldToggle({ r, id }: { r: RegionId; id: string }) {
  const s = app.s;
  if (BATTLERS[id].role === 'buffer') return <span class="ft curb" {...tip('On the curb', 'Buffers never take a slot. Their aura is always on.')}>CURB</span>;
  const on = lineupOf(s, r).includes(id);
  return (
    <button class={`ft ${on ? 'on' : ''}`} onClick={(e) => (e.stopPropagation(), act(toggleField(s, r, id)))} {...tip(on ? 'Fielded' : 'Benched', on ? 'Click to bench. You pick the lineup from here on.' : 'Click to field.')}>
      {on ? 'FIELD' : 'BENCH'}
    </button>
  );
}

// Bosses who quit and joined. No rent, no renovations: they level with the crew's average.
function BreakRoom({ r }: { r: RegionId }) {
  const s = app.s;
  const ids = joined(s, r);
  if (!ids.length) return null;
  const lv = bossLevel(s, r);
  return (
    <div class="breakroom">
      <h3>
        Break room <span class="dim">· Lv {lv}, the crew's average</span>
      </h3>
      <div class="bo-row">
        {ids.map((id) => {
          const d = BATTLERS[id];
          const st = statsOf(s, r, id, lv);
          return (
            <div key={id} class="bo" {...tip(d.name, d.does, statLine(d.role, st.hp, st.dmg), d.line)}>
              <img src={crewURL(id)} width={32} height={48} alt="" />
              <span>
                <b class={`role-${d.role}`}>{d.name}</b>
                <span class="dim">{d.does}</span>
              </span>
              <FieldToggle r={r} id={id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// The uncle's note: one line about what to do next.
function uncleSays(s: GameState, r: RegionId): string {
  const c = s.crews[r];
  if (r === 1) {
    if (c.wins < 5) return DAWN.hintNew;
    if (forLease(s, 1).length) return DAWN.hintLease;
    return regionDone(s, 1) ? DAWN.hintDone : 'Same rules, bigger checks.';
  }
  if (!c.shops.dojo && forLease(s, 0).some((x) => x.id === 'dojo')) return 'Lease the Dojo. Somebody has to stand in front.';
  if (forLease(s, 0).length) return 'Something is for lease. Every shop is one more person in the lot.';
  if (c.tries >= 3) return 'Losing? Renovate, train, or let them farm the fight behind them.';
  if (!c.contracts.includes(0) && c.cash >= 50) return 'Fifty bucks and the Parking Lot patrols itself.';
  return regionDone(s, 0) ? "They didn't pave it. You might. Asphalt keeps." : "Don't let them pave it.";
}

// 21 units: 7 or 3 to a row, so every row comes out full. Tiles are the 64px storefronts at 3x (4x when 3 to a row
// leaves room); only when 7 don't fit at 3x do they shrink to whatever whole pixel width fits.
const GUTTER = 12;
export function plazaFit(w: number): { cols: number; tile: number } {
  const fit = (n: number) => Math.floor((w - (n + 1) * GUTTER) / n);
  const step = (t: number) => (t >= 256 ? 256 : t >= 192 ? 192 : t);
  return fit(7) >= 150 ? { cols: 7, tile: step(Math.min(fit(7), 192)) } : { cols: 3, tile: step(fit(3)) };
}

export function Shops() {
  const s = app.s;
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { cols, tile } = plazaFit(el.clientWidth);
      el.style.setProperty('--cols', String(cols));
      el.style.setProperty('--z', String(tile / 192));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const r = s.view;
  const list = [...leased(s, r), ...forLease(s, r)];
  const order = Object.keys(SHOPS);
  list.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return (
    <section class="wall shops">
      <h2 class="plaza-title">
        <span>{REGIONS[r].chrome.plaza}</span>
        <span class="landmarks">
          {LANDMARKS.filter((d) => hasLandmark(s, d.id)).map((d) => {
            const n = s.landmarks.filter((id) => id === d.id).length;
            return (
              <img
                key={d.id}
                src={landmarkURL(d.id)}
                width={20}
                height={24}
                alt={d.name}
                {...tip(d.name, n > 1 ? `×${n} on the lot.` : 'On the lot.', d.does)}
              />
            );
          })}
        </span>
      </h2>
      <div class="strip" ref={strip}>
        {list.map((sh) => (
          <Unit key={sh.id} sh={sh} />
        ))}
      </div>
      <BreakRoom r={r} />
      <div class="uncle" {...tip("Uncle's note", 'Taped to the register. Updated, somehow.')}>
        <b>Uncle's note:</b> {uncleSays(s, r)}
      </div>
    </section>
  );
}
