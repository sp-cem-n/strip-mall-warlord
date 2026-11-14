import { app, tip, toast } from '../app';
import { FIGHTERS, HEAT_PER_PAYDAY_LEVEL, SHOPS, STAT_GROWTH, WALKINS, WALKIN_STAYS, ZONES } from '../game/defs';
import { asphaltMult, collectFind, renovate, renovateCost, slotIncome, unlockedShops } from '../game/economy';
import { canBulldoze } from '../game/sim';
import type { GameState, Slot } from '../game/state';
import { crewURL, facadeURL, scaffoldURL } from './art';
import { register } from './audio';
import { fmt } from './format';

const act = (err: string | null) => (err && toast(err), app.refresh());
const openBook = (id: number) => ((app.book = id), (app.tip = null), app.refresh());

function WalkIn({ slot }: { slot: Slot }) {
  const s = app.s;
  const f = s.find!;
  const w = WALKINS[f.kind];
  return (
    <button
      class={`walkin w-${f.kind}`}
      onClick={(e) => {
        e.stopPropagation();
        if (f.kind === 'vape' || f.kind === 'payday') register();
        act(collectFind(s));
        app.tip = null;
      }}
      {...tip(`Walk-in at ${slot.label}`, `${w.who}: ${f.name}.`, `Click: ${w.effect}`, `Leaves in ${Math.ceil(f.left)}s. Ignoring them costs nothing.`)}
    >
      <b>{w.who}</b>
      <span>{f.name}</span>
      <i style={{ width: `${(f.left / WALKIN_STAYS) * 100}%` }} />
    </button>
  );
}

function Storefront({ slot }: { slot: Slot }) {
  const s = app.s;
  const d = slot.shop ? SHOPS[slot.shop] : null;
  const f = d ? FIGHTERS[d.fighter] : null;
  const m = STAT_GROWTH ** (slot.level - 1) * asphaltMult(s);
  const cost = renovateCost(slot.level);
  const now = performance.now();
  const up = app.raising[slot.id] ?? 0;
  const scaffolding = app.book === slot.id || now < up;
  const facadeTip = d
    ? tip(d.name, d.tagline, `Rent $${fmt(slotIncome(s, slot))}/s. Sends one ${f!.name}.`, 'Click the sign to rebrand. The building keeps its renovations.')
    : tip('Vacant', 'Whitewashed windows. Faint outline of the word VIDEO.', 'Click to open a shop here.');
  return (
    <div class={`unit ${slot.shop ? '' : 'vacant'}`}>
      <div class="facade" {...facadeTip}>
        <img class={!scaffolding && now < up + 700 ? 'flicker' : ''} src={facadeURL(slot.shop, slot.id)} width={128} height={112} alt={d ? d.name : 'Vacant storefront'} />
        {scaffolding && <img class="scaffold" src={scaffoldURL()} width={128} height={112} alt="" />}
        <button class={slot.shop ? 'sign-hit' : 'lease-hit'} onClick={() => openBook(slot.id)} aria-label={slot.shop ? `Rebrand ${slot.label}` : `Open a shop in ${slot.label}`} />
        {s.find?.slot === slot.id && <WalkIn slot={slot} />}
      </div>
      <div class="unit-info">
        <div class="unit-head">
          <span>{slot.label}</span>
          <span>Lv {slot.level}</span>
        </div>
        {f ? (
          <div class="crewline" {...tip(`${f.name} · Lv ${slot.level}`, f.does, `${Math.round(f.hp * m)} hp · ${f.kind === 'medic' ? `heals ${Math.round(f.dmg * m)}` : `hits ${Math.round(f.dmg * m)}`} every ${f.interval}s`)}>
            <img src={crewURL(f.kind)} width={16} height={24} alt="" />
            <span>
              <strong>{f.name}</strong> {Math.round(f.hp * m)}hp · {f.kind === 'medic' ? `+${Math.round(f.dmg * m)}` : Math.round(f.dmg * m)}
              <br />
              <span class="dim">rent ${fmt(slotIncome(s, slot))}/s</span>
              {slot.shop === 'payday' && <span class="heat-tag"> heat +{Math.round(slot.level * HEAT_PER_PAYDAY_LEVEL * 100)}%</span>}
            </span>
          </div>
        ) : (
          <div class="crewline dim">For lease. Click the window.</div>
        )}
        {slot.shop && (
          <button class="btn" disabled={s.cash < cost} onClick={() => act(renovate(s, slot.id))}>
            Renovate ${fmt(cost)}
          </button>
        )}
      </div>
    </div>
  );
}

// The uncle's note: one line about what to do next. The story's nudge toward the pawn shop lives here.
function uncleSays(s: GameState): string {
  const owns = (k: string) => s.slots.some((x) => x.shop === k);
  const open = unlockedShops(s);
  if (!owns('dojo') && s.zone === 0) return 'Put a Dojo in front. Hustlers are better at talking than standing.';
  if (s.zone === 0) return 'Take the parking lot. The old video store on the end still has a pawn license nobody cancelled.';
  if (open.includes('pawn') && !owns('pawn')) return 'Open a Pawn Shop. People walk in with all kinds of things. Some of them are useful.';
  if (open.includes('payday') && !owns('payday')) return "Payday Loans pays the most rent. It also brings Heat. I never opened one. I also never paid off the van.";
  if (canBulldoze(s) && s.lossStreak >= 3) return "If they're going to pave it, pave it yourself. Asphalt keeps.";
  return "Don't let them pave it.";
}

export function Shops() {
  const s = app.s;
  const locked = ZONES.slice(s.zone).flatMap((z) => (z.unlocks ? [SHOPS[z.unlocks].name] : []));
  return (
    <section class="wall shops">
      <h2>
        Pinewood Plaza <span class="dim">· est. 1991 · every storefront pays rent and sends one crew member</span>
      </h2>
      <div class="strip">
        {s.slots.map((sl) => (
          <Storefront key={sl.id} slot={sl} />
        ))}
      </div>
      <div class="uncle" {...tip("Uncle's note", 'Taped to the register. Updated, somehow.', locked.length ? `Still to come: ${locked.join(', ')}.` : 'Every shop type is open.')}>
        <b>Uncle's note:</b> {uncleSays(s)}
      </div>
    </section>
  );
}
