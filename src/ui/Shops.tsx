// The plaza: one fixed-layout card per storefront. Leased shops renovate; new ones come up for lease in order.
import { app, tip, toast } from '../app';
import { BATTLERS, REGIONS, SHOPS, WALKIN_STAYS, type RegionId, type ShopDef } from '../game/defs';
import { bossLevel, forLease, joined, lease, leased, regionDone, renovate, renovateCost, rentOf } from '../game/economy';
import { statsOf } from '../game/battle';
import { collectFind, walkInValue } from '../game/sim';
import type { GameState } from '../game/state';
import { crewURL, facadeURL, scaffoldURL } from './art';
import { register } from './audio';
import { fmt } from './format';

const act = (err: string | null) => (err && toast(err), app.refresh());
const RAISE_MS = 1400;
const EFFECT = { cash: (v: number) => `+$${fmt(v)} cash`, referral: (v: number) => `+${fmt(v)} ${REGIONS[app.s.view].currency}`, rally: () => 'Crew hits 25% harder for 30s' };

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
      {...tip(`Walk-in at the ${sh.name}`, `${sh.walkin.who}: ${f.name}.`, `Click: ${EFFECT[f.kind](v)}.`, `Leaves in ${Math.ceil(f.left)}s. Ignoring them costs nothing.`)}
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
  const st = statsOf(s, sh.region, sh.battler, Math.max(1, lv));
  const nx = statsOf(s, sh.region, sh.battler, lv + 1);
  const cost = lv ? renovateCost(sh.id, lv) : sh.lease;
  const eq = sh.region === 1;
  const afford = lv ? c.cash >= cost : eq ? s.equity >= cost : c.cash >= cost;
  const rent = rentOf(s, sh.id, lv);
  const dRent = rentOf(s, sh.id, lv + 1) - rent;
  return (
    <div class={`unit ${lv ? '' : 'vacant'}`}>
      <div class="facade" {...tip(sh.name, sh.tagline, lv ? `Rent $${fmt(rent)}/s. Sends one ${d.name}.` : `For lease. Sends one ${d.name}: ${d.does}`)}>
        <img class={!raising && now < (app.raising[sh.id] ?? 0) + 700 ? 'flicker' : ''} src={facadeURL(sh.id, lv > 0 && !raising)} width={128} height={112} alt={sh.name} />
        {raising && <img class="scaffold" src={scaffoldURL()} width={128} height={112} alt="" />}
        {s.find?.shop === sh.id && <WalkIn sh={sh} />}
      </div>
      <div class="unit-info">
        <div class="unit-head">
          <span>{sh.name}</span>
          <span>{lv ? `Lv ${lv}` : 'NEW'}</span>
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
              <span>{sh.rent ? `▲ +$${fmt(dRent)}/s rent` : '▲ watches more lots'}</span>
            </>
          ) : (
            <>
              <span>{d.does}</span>
              <span class="dim">{eq ? 'Bypass leases cost Equity' : ''}</span>
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
          {lv ? `Renovate $${fmt(cost)}` : eq ? `Lease ${fmt(cost)} Equity` : `Lease it $${fmt(cost)}`}
        </button>
      </div>
    </div>
  );
}

// Bosses who quit and joined. No rent, no renovations: they level with the crew's average.
function BackOffice({ r }: { r: RegionId }) {
  const s = app.s;
  const ids = joined(s, r);
  if (!ids.length) return null;
  const lv = bossLevel(s, r);
  return (
    <div class="backoffice">
      <h3>
        Back office <span class="dim">· they quit and joined · Lv {lv}, the crew's average</span>
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
    if (c.wins < 5) return "Sal never made it up here. New road, new crew. Bring Goodwill: the bank turns it into Equity.";
    if (forLease(s, 1).length) return 'Bypass leases cost Equity, not dollars. Convert Goodwill from Route 9, or win it here.';
    return regionDone(s, 1) ? 'Somebody is surveying Route 9 North. Not yet.' : 'Same rules, bigger checks.';
  }
  if (!c.shops.dojo && forLease(s, 0).some((x) => x.id === 'dojo')) return 'Lease the Dojo. Somebody has to stand in front.';
  if (forLease(s, 0).length) return 'Something is for lease. Every shop is one more person in the lot.';
  if (c.streak >= 2) return 'Losing? Renovate, train, call a different play, or let them farm the fight behind them.';
  if (c.shops.security && c.frontier > 0 && REGIONS[0].lots.length > 1 && !regionDone(s, 0)) return 'The Security Office watches more lots the more you renovate it.';
  return regionDone(s, 0) ? "They didn't pave it. You might. Asphalt keeps." : "Don't let them pave it.";
}

export function Shops() {
  const s = app.s;
  const r = s.view;
  const list = [...leased(s, r), ...forLease(s, r)];
  const order = Object.keys(SHOPS);
  list.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return (
    <section class="wall shops">
      <h2>
        {r === 0 ? 'Pinewood Plaza' : 'Exit 14, Rt. 9 Bypass'} <span class="dim">· every shop pays rent and sends one crew member</span>
      </h2>
      <div class="strip">
        {list.map((sh) => (
          <Unit key={sh.id} sh={sh} />
        ))}
      </div>
      <BackOffice r={r} />
      <div class="uncle" {...tip("Uncle's note", 'Taped to the register. Updated, somehow.')}>
        <b>Uncle's note:</b> {uncleSays(s, r)}
      </div>
    </section>
  );
}
