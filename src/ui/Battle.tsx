import { app } from '../app';
import { BATTLE_TIMEOUT, SQUAD_SIZE, ZONES } from '../game/defs';
import { currentZoneIndex, squad } from '../game/battle';
import { fmt, lossRent, waveReward } from '../game/sim';
import type { Unit } from '../game/state';

const GLYPH: Record<string, string> = { bouncer: 'B', hustler: 'H', medic: '+', fixer: 'F', lawyer: '§', enemy: '' };

function Token({ u }: { u: Unit }) {
  const pct = Math.max(0, u.hp / u.maxHp) * 100;
  const dead = u.hp <= 0;
  const initials = u.side === 'enemy' ? u.name.split(/[\s-]+/).map((w) => w[0]).join('').slice(0, 3) : GLYPH[u.kind];
  return (
    <div class={`token ${u.side} k-${u.kind} ${dead ? 'dead' : ''} ${u.flash > 0 ? 'flash' : ''} ${u.acted > 0 ? 'acted' : ''} ${u.boss ? 'boss' : ''}`} title={`${u.name} — ${u.title}`}>
      <div class="chip">{initials}</div>
      <div class="token-body">
        <div class="token-name">{u.name}</div>
        <div class="hp">
          <div class="hp-fill" style={{ width: `${pct}%` }} />
        </div>
        <div class="token-meta">
          {dead ? 'out' : `${Math.ceil(u.hp)}/${u.maxHp}`}
          {u.stunned > 0 && !dead && <span class="tag stun">C&amp;D</span>}
          {u.dotLeft > 0 && !dead && <span class="tag sued">SUED</span>}
        </div>
      </div>
    </div>
  );
}

export function ZoneTrack() {
  const s = app.s;
  return (
    <div class="zones">
      {ZONES.map((z, i) => {
        const state = i < s.zone ? 'done' : i === s.zone ? 'current' : 'locked';
        return (
          <div key={z.id} class={`zone ${state}`}>
            <div class="zone-name">{z.name}</div>
            <div class="pips">
              {Array.from({ length: z.waves }, (_, w) => (
                <span key={w} class={`pip ${i < s.zone || (i === s.zone && w < s.wave) ? 'won' : i === s.zone && w === s.wave ? 'now' : ''} ${w === z.waves - 1 ? 'boss' : ''}`} />
              ))}
            </div>
            <div class="zone-sub">{state === 'done' ? 'Captured' : state === 'current' ? `Row ${s.wave + 1} of ${z.waves}` : z.unlocks ? 'Unlocks a tenant' : 'Final lot'}</div>
          </div>
        );
      })}
    </div>
  );
}

export function Battle() {
  const s = app.s;
  const b = s.battle;
  const z = currentZoneIndex(s);
  const zd = ZONES[z];
  const wave = s.won ? zd.waves - 1 : s.wave;
  const isBoss = wave === zd.waves - 1;
  const members = squad(s);
  return (
    <section class="panel battle">
      <h2>
        The Lot <span class="dim">· fights run themselves</span>
      </h2>
      <ZoneTrack />
      <div class="field-head">
        <div>
          <strong>{b?.kind === 'raid' ? 'RAID — Pinewood Plaza' : zd.name}</strong>
          <span class="dim"> · {b?.kind === 'raid' ? 'they came to you' : isBoss ? `boss: ${zd.boss.name}` : `row ${wave + 1}/${zd.waves}`}</span>
        </div>
        <div class="dim">
          {b ? `${b.t.toFixed(0)}s / ${BATTLE_TIMEOUT}s` : members.length ? `Regrouping… ${Math.max(0, s.regroup).toFixed(0)}s` : 'No crew yet. Open a dojo.'}
          {b && b.debuff > 0 && <span class="tag fix">fixers −{Math.round(b.debuff * 100)}%</span>}
        </div>
      </div>
      <div class={`field ${b?.kind === 'raid' ? 'raid' : ''}`}>
        <div class="side crew">
          {b
            ? b.crew.map((u) => <Token key={u.uid} u={u} />)
            : members.map((k, i) => (
                <div key={i} class={`token crew k-${k} idle`}>
                  <div class="chip">{GLYPH[k]}</div>
                  <div class="token-body">
                    <div class="token-name">{k[0].toUpperCase() + k.slice(1)}</div>
                    <div class="token-meta dim">waiting by the cart corral</div>
                  </div>
                </div>
              ))}
        </div>
        <div class="vs">{b ? 'vs' : ''}</div>
        <div class="side enemy">{b ? b.enemies.map((u) => <Token key={u.uid} u={u} />) : <div class="dim field-note">{zd.blurb}</div>}</div>
      </div>
      <div class="field-foot dim">
        Win: +${fmt(waveReward(s, z, wave))} · Lose: pay ${fmt(lossRent(s, z, wave))} rent, fall back a row · Squad size {members.length}/{SQUAD_SIZE(s.zone)}
      </div>
    </section>
  );
}
