import { app } from '../app';
import { FIGHTERS, LEVEL_STATS, SHOPS, type FighterKind } from '../game/defs';
import { fighterCap, fighterLevel } from '../game/economy';
import { benchBonus, squad } from '../game/battle';
import { GEAR_SLOT_LABEL } from '../game/gear';
import { fmtTime } from '../game/sim';
import type { GearSlot } from '../game/state';

const KINDS: FighterKind[] = ['bouncer', 'hustler', 'medic', 'fixer', 'lawyer'];
const SOURCE: Record<FighterKind, string> = Object.fromEntries(Object.values(SHOPS).map((d) => [d.fighter, d.name])) as Record<FighterKind, string>;

export function Crew() {
  const s = app.s;
  const sq = squad(s);
  return (
    <section class="panel crew-panel">
      <h2>Crew</h2>
      <div class="roster">
        {KINDS.map((k) => {
          const d = FIGHTERS[k];
          const cap = fighterCap(s, k);
          const n = s.roster[k];
          const inSquad = sq.filter((x) => x === k).length;
          const bb = benchBonus(s, k);
          const m = LEVEL_STATS(fighterLevel(s, k)) * bb;
          return (
            <div key={k} class={`rost k-${k} ${cap === 0 ? 'none' : ''}`} title={d.blurb}>
              <div class="rost-top">
                <span class="chip sm">{k === 'medic' ? '+' : k === 'lawyer' ? '§' : d.name[0]}</span>
                <strong>{d.plural}</strong>
                <span class="dim">{d.role}</span>
                <span class="rost-n">
                  {n}/{cap}
                </span>
              </div>
              <div class="rost-sub dim">
                {cap === 0 ? `Trained at a ${SOURCE[k]}` : `${inSquad} in squad${bb > 1 ? ` (+${Math.round((bb - 1) * 100)}% bench)` : ''} · Lv ${fighterLevel(s, k)} · ${Math.round(d.hp * m)} HP · ${d.heal ? `heals ${Math.round(d.heal * m)}` : `${Math.round(d.dmg * m)} dmg`}`}
              </div>
            </div>
          );
        })}
      </div>
      <h3>Gear (from the pawn shop)</h3>
      <div class="gear">
        {(['weapon', 'armor', 'kit'] as GearSlot[]).map((g) => (
          <div key={g} class="gear-slot">
            <span class="dim">{GEAR_SLOT_LABEL[g]}</span>
            <span>{s.gear[g] ? `${s.gear[g]!.name} (+${Math.round(s.gear[g]!.bonus * 100)}%)` : '—'}</span>
          </div>
        ))}
      </div>
      <div class="stats dim">
        Record {s.stats.wins}–{s.stats.losses} · Raids {s.stats.raidsWon}–{s.stats.raidsLost} · Rent paid ${Math.round(s.stats.rentPaid)} · Run time {fmtTime(s.time)}
      </div>
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
          </li>
        ))}
      </ul>
    </section>
  );
}
