import { app } from '../app';
import { FIGHTERS, FIGHT_TIMEOUT, PRESTIGE_MIN_ZONE, SHOPS, ZONES, type FighterKind } from '../game/defs';
import { regionTaken } from '../game/economy';
import { asphaltGain, bulldoze, canBulldoze } from '../game/sim';
import { saveGame } from '../game/save';
import type { Unit } from '../game/state';
import { fmtTime } from './format';

const GLYPH: Record<string, string> = { bouncer: 'B', hustler: 'H', medic: '+', fixer: 'F', lawyer: '§' };
const Weak = ({ k }: { k: FighterKind }) => <span class={`weak k-${k}`} title={`Weak to ${FIGHTERS[k].plural}`}>{GLYPH[k]}</span>;

function Token({ u }: { u: Unit }) {
  const dead = u.hp <= 0;
  const initials = u.side === 'enemy' ? u.name.split(/[\s-]+/).map((w) => w[0]).join('').slice(0, 3) : GLYPH[u.kind];
  return (
    <div class={`token ${u.side} k-${u.kind} ${dead ? 'dead' : ''} ${u.flash > 0 ? 'flash' : ''} ${u.acted > 0 ? 'acted' : ''} ${u.boss ? 'boss' : ''}`} title={`${u.name} — ${u.title}`}>
      <div class="chip">{initials}</div>
      <div class="token-body">
        <div class="token-name">{u.name}</div>
        <div class="hp">
          <div class="hp-fill" style={{ width: `${Math.max(0, u.hp / u.maxHp) * 100}%` }} />
        </div>
        <div class="token-meta">
          {dead ? 'out' : `${Math.ceil(u.hp)}/${u.maxHp}`}
          {u.weak && (
            <span class="dim">
              weak to <Weak k={u.weak} />
            </span>
          )}
          {u.flash > 0 && !dead && <span class="dmg">−{Math.round(u.lastDmg)}</span>}
        </div>
      </div>
    </div>
  );
}

function ZoneTrack() {
  const s = app.s;
  const ok = canBulldoze(s);
  return (
    <div class="zones">
      {ZONES.map((z, i) => {
        const state = i < s.zone ? 'done' : i === s.zone ? 'current' : 'locked';
        const weak = [...new Set([...z.regulars.map((e) => e.weak), z.boss.weak])];
        return (
          <div key={z.id} class={`zone ${state}`}>
            <div class="zone-name">{z.name}</div>
            <div class="pips">
              {Array.from({ length: z.rows }, (_, r) => (
                <span key={r} class={`pip ${i < s.zone || (i === s.zone && r < s.row) ? 'won' : i === s.zone && r === s.row ? 'now' : ''} ${r === z.rows - 1 ? 'boss' : ''}`} />
              ))}
            </div>
            <div class="zone-sub">
              {state === 'done' ? 'Captured' : (
                <>
                  weak to {weak.map((k) => <Weak key={k} k={k} />)}
                </>
              )}
            </div>
          </div>
        );
      })}
      <div class={`zone pave ${ok ? 'current' : 'locked'}`}>
        <div class="zone-name">Pave it</div>
        <div class="zone-sub">
          {ok ? `+${asphaltGain(s)} asphalt (1 per row taken). +2% to everything each, forever.` : `Bulldoze unlocks after ${ZONES[PRESTIGE_MIN_ZONE - 1].name}.`}
        </div>
        {ok && (
          <button
            class="btn danger small"
            onClick={() => {
              if (!confirm(`Bulldoze everything for +${asphaltGain(s)} asphalt?`)) return;
              app.s = bulldoze(s);
              saveGame(app.s);
              app.refresh();
            }}
          >
            Bulldoze
          </button>
        )}
        {ok && !regionTaken(s) && s.time - s.lastCapture > 300 && <div class="hint">Stuck {fmtTime(s.time - s.lastCapture)}. Paving is the move.</div>}
      </div>
    </div>
  );
}

export function Battle() {
  const s = app.s;
  const b = s.battle;
  const done = regionTaken(s);
  const zd = ZONES[Math.min(s.zone, ZONES.length - 1)];
  const crew = s.slots.filter((x) => x.shop).length;
  return (
    <section class="panel battle">
      <h2>
        The Lot <span class="dim">· fights run themselves</span>
      </h2>
      <ZoneTrack />
      <div class="field-head">
        <div>
          <strong>{done ? 'Region taken' : zd.name}</strong>
          {!done && <span class="dim"> · {s.row === zd.rows - 1 ? `boss: ${zd.boss.name}` : `row ${s.row + 1}/${zd.rows}`}</span>}
        </div>
        <div class="dim">{done ? '' : b ? `${b.t.toFixed(0)}s / ${FIGHT_TIMEOUT}s` : crew ? `Regrouping… ${Math.max(0, s.regroup).toFixed(0)}s` : 'No crew. Open a shop.'}</div>
      </div>
      <div class="field">
        <div class="side crew">
          {b?.crew.map((u) => <Token key={u.uid} u={u} />)}
          {!b &&
            s.slots
              .filter((x) => x.shop)
              .map((x) => (
                <div key={x.id} class={`token crew k-${SHOPS[x.shop!].fighter} idle`}>
                  <div class="chip">{GLYPH[SHOPS[x.shop!].fighter]}</div>
                  <div class="token-body">
                    <div class="token-name">{FIGHTERS[SHOPS[x.shop!].fighter].name}</div>
                    <div class="token-meta dim">by the cart corral</div>
                  </div>
                </div>
              ))}
        </div>
        <div class="vs">{b ? 'vs' : ''}</div>
        <div class="side enemy">{b ? b.enemies.map((u) => <Token key={u.uid} u={u} />) : <div class="dim field-note">{done ? 'Quiet. The developer sends a fruit basket.' : zd.blurb}</div>}</div>
      </div>
      <div class="field-foot dim">Enemies hit your front crew member first. Their weak-to type deals ×2.5; everyone else deals ×0.5.</div>
    </section>
  );
}

export function Log() {
  const lines = app.s.log.slice(-40).reverse();
  return (
    <section class="panel log">
      <h2>Incident log</h2>
      <ul>
        {lines.map((l, i) => (
          <li key={`${l.t}-${i}`} class={`log-${l.tone}`}>
            <span class="t">{fmtTime(l.t)}</span> {l.text}
            {l.n && <span class="dim"> ×{l.n}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
