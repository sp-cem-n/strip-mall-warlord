// The plaza: one fixed-layout card per storefront. Leased shops renovate; new ones come up for lease in order.
import { lit, relight } from './lights';
import { useEffect, useRef } from 'preact/hooks';
import { DAWN } from '../game/content/dawn';
import { app, tip, toast } from '../app';
import { BATTLERS, CURRENCY_NAME, REGIONS, SHOPS, WALKIN_STAYS, type RegionId, type ShopDef } from '../game/defs';
import { bal, patrolPrice, leaseCur, tierOf, bossLevel, currencyOf, forLease, joined, lease, leased, lineupOf, regionDone, renovate, renovateCost, rentOf, toggleField } from '../game/economy';
import { fxScale, statsOf } from '../game/battle';
import { collectFind, onScreen, walkInValue } from '../game/sim';
import { LANDMARKS, hasLandmark, landmarkBuff } from '../game/sinks';
import type { GameState } from '../game/state';
import { crewURL, facadeURL, landmarkURL, scaffoldURL } from './art';
import { register } from './audio';
import { trainedBy } from './BackOffice';
import { fmt } from './format';

const act = (err: string | null) => (err && toast(err), app.refresh());
const RAISE_MS = 1400;
const EFFECT = { rally: () => 'Crew hits 25% harder for 30s', pay: () => `+${fmt(walkInValue(app.s))} ${currencyOf(app.s.view)}`, ticket: () => (app.s.view ? 'Maybe a rumor slip' : 'Maybe some tickets') };

function WalkIn({ sh }: { sh: ShopDef }) {
  const s = app.s;
  const f = s.find!;
  return (
    <button
      class={`walkin w-${f.kind}`}
      onClick={(e) => {
        e.stopPropagation();
        if (f.kind !== 'rally') register();
        act(collectFind(s));
        app.tip = null;
      }}
      {...tip(`Walk-in at the ${sh.name}`, `${f.who}.`, `Click: ${EFFECT[f.kind]()}.`, `Leaves in ${Math.ceil(f.left)}s.`)}
    >
      <b>{f.who}</b>
      <span>{EFFECT[f.kind]()}</span>
      <i style={{ width: `${(f.left / WALKIN_STAYS) * 100}%` }} />
    </button>
  );
}

// What a renovation raises, in the unit's own words: control and buffers their effect, tanks HP, the rest their hit or heal.
const FX_WORD: Partial<Record<string, string>> = { hpUp: 'HP aura', dmgUp: 'damage aura', haste: 'haste', payUp: 'pay', regen: 'regen', revive: 'revive', dr: 'armor', mark: 'mark', slow: 'slow', weaken: 'weaken', stun: 'stun', confuse: 'confuse', copy: 'copy' };
const pctOf = (v: number) => `${v < 0.1 ? (v * 100).toFixed(1) : Math.round(v * 100)}%`;
function mainThing(r: RegionId, id: string, lv: number): [string, string, string] {
  const s = app.s;
  const d = BATTLERS[id];
  const fx = d.fx && 'v' in d.fx && (d.role === 'control' || d.role === 'buffer') ? d.fx : null;
  if (fx) return [FX_WORD[fx.k] ?? fx.k, pctOf(fx.v * fxScale(s, r, id, lv)), pctOf(fx.v * fxScale(s, r, id, lv + 1))];
  const [a, b] = [statsOf(s, r, id, lv), statsOf(s, r, id, lv + 1)];
  if (d.role === 'tank') return ['HP', fmt(a.hp), fmt(b.hp)];
  return [d.role === 'heal' ? 'heal' : 'hit', fmt(a.dmg), fmt(b.dmg)];
}
const statLine = (role: string, hp: number, dmg: number) => `HP ${fmt(hp)} · ${role === 'heal' ? 'HEAL' : 'DMG'} ${fmt(dmg)}`;

// one observer for the whole plaza: which storefronts are mostly on screen
let watcher: IntersectionObserver | null = null;
const watch = () =>
  (watcher ??= new IntersectionObserver(
    (es) => {
      for (const e of es) {
        const id = (e.target as HTMLElement).dataset.shop!;
        if (e.isIntersecting) onScreen.add(id);
        else onScreen.delete(id);
      }
    },
    { threshold: 0.6 },
  ));

function Unit({ sh }: { sh: ShopDef }) {
  const s = app.s;
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current!;
    watch().observe(el);
    return () => (watch().unobserve(el), onScreen.delete(sh.id));
  }, [sh.id]);
  const c = s.crews[sh.region];
  const lv = c.shops[sh.id] ?? 0;
  const d = BATTLERS[sh.battler];
  const now = performance.now();
  const raising = now < (app.raising[sh.id] ?? 0);
  const st = statsOf(s, sh.region, sh.battler, Math.max(1, lv) + tierOf(sh.id));
  const thing = mainThing(sh.region, sh.battler, Math.max(1, lv) + tierOf(sh.id));
  const cost = lv ? renovateCost(sh.id, lv) : sh.lease;
  const cur = lv ? 'cash' : leaseCur(sh);
  const afford = bal(s, sh.region, cur) >= cost;
  const rent = rentOf(s, sh.id, lv);
  const dRent = rentOf(s, sh.id, lv + 1) - rent;
  return (
    <div class={`unit ${lv ? '' : 'vacant'}`} ref={box} data-shop={sh.id}>
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
        <div class="crewline" {...tip(`${d.name}${lv ? ` · Lv ${lv}` : ''}`, d.does, `${d.role} · every ${d.interval}s`, trainedBy(s, sh.region, d.role), d.line)}>
          <img src={crewURL(d.id)} width={16} height={24} alt="" />
          <span class="cl">
            <b class={`role-${d.role}`}>{d.name}</b>
            <span>{statLine(d.role, st.hp, st.dmg)}</span>
            <span class="dim">{lv ? `rent $${fmt(rent)}/s` : `rent $${fmt(sh.rent)}/s`}</span>
          </span>
        </div>
        <div class="next" {...tip('Next renovation', `${thing[0]} ${thing[1]} → ${thing[2]}${sh.rent ? `, rent +20%` : ''}.`, `Lv ${lv} → ${lv + 1}. Every renovation: +20% rent and +10% of what this unit does.`)}>
          {lv ? (
            <>
              <span>
                ▲ {thing[0]} {thing[1]} → {thing[2]}
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
    <button class={`ft ${on ? 'on' : ''}`} onClick={(e) => (e.stopPropagation(), act(toggleField(s, r, id)))} {...tip(on ? 'Fielded' : 'Benched', on ? 'Click to bench. You pick the lineup from here on.' : 'Click to field.', ...(joined(s, r).includes(id) ? ["From the break room: doesn't take a slot."] : []))}>
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
            <div key={id} class="bo" {...tip(d.name, d.does, statLine(d.role, st.hp, st.dmg), trainedBy(s, r, d.role), d.line)}>
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
  if (c.closed) return 'Flip the sign. Sal always opened at 9 sharp.';
  if (!c.shops.dojo && forLease(s, 0).some((x) => x.id === 'dojo')) return 'Lease the Dojo. Somebody has to stand in front.';
  if (forLease(s, 0).length) return 'Something is for lease. Every shop is one more person in the lot.';
  if (regionDone(s, 0)) return 'Now pave it yourself and run it again. Asphalt keeps, and so do the tickets.';
  if (c.tries >= 3) return 'Losing? Renovate, train, or let them farm the fight behind them.';
  if (!c.contracts.includes(0) && s.goodwill >= patrolPrice(s, 0, 0)) return 'Hire a patrol on the Parking Lot sign. The crew climbs on its own.';
  return "Don't let them pave it.";
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
                {...tip(d.name, n > 1 ? `×${n} on the lot.` : 'On the lot.', `+${Math.round(landmarkBuff(s, d.id) * 1000) / 10}% ${d.does}.`, d.art)}
              />
            );
          })}
        </span>
      </h2>
      <div class="uncle">
        <b>Uncle's note:</b> {uncleSays(s, r)}
      </div>
      <div class="strip" ref={strip}>
        {list.map((sh) => (
          <Unit key={sh.id} sh={sh} />
        ))}
      </div>
      <BreakRoom r={r} />
    </section>
  );
}
