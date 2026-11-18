// Click the lot or press R: a modal over the still-running fight, laid out like Toad's roster card.
import { useEffect, useState } from 'preact/hooks';
import { app, tip } from '../app';
import { BATTLERS, CURRENCY_NAME, FIGHTS, REGIONS, type Fx, type RegionId, type Target } from '../game/defs';
import { enemyLineup, statsOf } from '../game/battle';
import { autoPick, curb, fighters, lineupOf, slotsOf, toggleField } from '../game/economy';
import { crewURL } from './art';
import { fmt } from './format';
import { trainedBy } from './BackOffice';

export function closeRoster() {
  app.roster = false;
  app.tip = null;
  app.refresh();
}

function dps(dmg: number, interval: number) {
  return dmg / Math.max(0.2, interval);
}

function every(n: number) {
  return `${n.toFixed(n < 10 ? 1 : 0)}s`;
}

function whoOf(to: Target) {
  if (to === 'all') return 'Everyone on the field';
  if (to === 'tank') return 'Tanks';
  if (to === 'damage') return 'Damage dealers';
  if (to === 'heal') return 'Healers';
  if (to === 'control') return 'Control';
  return BATTLERS[to]?.name ?? to;
}

function bufferWho(fx: Fx | undefined, does: string) {
  if (!fx) return does;
  if (fx.k === 'copy') return 'Copies the best aura';
  if (fx.k === 'payUp') return 'Every win';
  if (fx.k === 'regen') return 'Tanks';
  if (fx.k === 'revive') return 'The first ally down';
  if ('to' in fx) return whoOf(fx.to);
  return 'Everyone on the field';
}

function chipOf(fx: Fx, r: RegionId) {
  if (fx.k === 'copy') return `at ${Math.round(fx.v * 100)}%`;
  if (!('v' in fx)) return fx.k;
  const pct = `${fx.v >= 0 ? '+' : ''}${Math.round(fx.v * 100)}%`;
  if (fx.k === 'hpUp') return `${pct} HP`;
  if (fx.k === 'dmgUp') return `${pct} DMG`;
  if (fx.k === 'haste') return `${pct} speed`;
  if (fx.k === 'payUp') return `${pct} ${r ? CURRENCY_NAME.equity : 'Goodwill'}`;
  if (fx.k === 'regen') return `${pct} regen`;
  if (fx.k === 'revive') return `${pct} revive`;
  if (fx.k === 'dr') return `${pct} less damage`;
  if (fx.k === 'mark') return `${pct} mark`;
  if (fx.k === 'slow') return `${pct} slow`;
  if (fx.k === 'weaken') return `${pct} weaken`;
  if (fx.k === 'stun') return `${pct} stun`;
  if (fx.k === 'confuse') return `${pct} confuse`;
  return pct;
}

function fightLine(r: RegionId) {
  const s = app.s;
  const c = s.crews[r];
  const ladder = FIGHTS[r];
  const f = ladder[Math.min(c.at, ladder.length - 1)];
  const lot = REGIONS[r].lots[f.zone];
  const tells = [...new Set(enemyLineup(r, Math.min(c.at, ladder.length - 1)).map((e) => e.def.tell).filter(Boolean))].map((t) => (t === 'tanky' ? 'tanky' : 'hits hard'));
  const where = f.boss ? lot.boss.name : `fight ${f.i + 1}/${lot.fights} · ${lot.name}`;
  return tells.length ? `${where} · ${tells.join(', ')}` : where;
}

export function RosterPopup() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 6000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!app.roster) return null;
  const s = app.s;
  const r = s.view as RegionId;
  const c = s.crews[r];
  const lv = new Map(fighters(s, r));
  const fielded = new Set(lineupOf(s, r));
  const team = [...lv.keys()];
  const buffers = curb(s, r);
  const slots = slotsOf(s, r);
  const auto = !c.lineup;
  const live = new Map((c.battle?.crew ?? []).map((u) => [u.id, u]));

  let fieldDps = 0,
    fieldHp = 0,
    tanks = 0,
    healers = 0;
  for (const id of fielded) {
    const st = statsOf(s, r, id, lv.get(id) ?? 1);
    const d = BATTLERS[id];
    fieldDps += dps(st.dmg, st.interval);
    fieldHp += live.get(id)?.hp ?? st.hp;
    if (d.role === 'tank') tanks++;
    if (d.role === 'heal') healers++;
  }

  const setField = (id: string, on: boolean) => {
    if (fielded.has(id) === on) return;
    setMsg(toggleField(s, r, id));
    app.refresh();
  };

  return (
    <div class="roster-back" onClick={closeRoster}>
      <div class="roster" onClick={(e) => e.stopPropagation()}>
        <div class="roster-head">
          <span class="t">THE LOT</span>
          <span class="sub">{fightLine(r)}</span>
          <span class="slots">
            ON THE FIELD <b>{fielded.size} / {slots}</b>
          </span>
          <button class="roster-x" onClick={closeRoster} aria-label="Close" {...tip('Close', 'Esc also works. The fight keeps going.')}>
            ✕
          </button>
        </div>

        <div class="roster-body">
          <section class="roster-fighters">
            <div class="sec">
              FIGHTERS <em>click a card to field or bench</em>
            </div>
            <div class="roster-grid">
              {team.map((id) => {
                const d = BATTLERS[id];
                const level = lv.get(id) ?? 1;
                const st = statsOf(s, r, id, level);
                const on = fielded.has(id);
                const dp = dps(st.dmg, st.interval);
                const unit = live.get(id);
                const hpMax = unit?.maxHp ?? st.hp;
                const hpNow = unit ? Math.max(0, unit.hp) : st.hp;
                const hpPct = hpMax ? Math.max(0, Math.min(100, (hpNow / hpMax) * 100)) : 0;
                return (
                  <div
                    key={id}
                    class={`fc ${d.role} ${on ? '' : 'bench'}`}
                    onClick={() => setField(id, !on)}
                    {...tip(d.name, d.does, `${d.role} · Lv ${level} · HP ${fmt(hpNow)} / ${fmt(hpMax)} · DPS ${fmt(dp)}`, trainedBy(s, r, d.role))}
                  >
                    <div class="pt">
                      <img src={crewURL(id)} width={48} height={72} alt="" />
                      <span class="lv">LV {level}</span>
                    </div>
                    <div class="info">
                      <div class="nm">{d.name}</div>
                      <div class={`role ${d.role}`}>{d.role}</div>
                      <div class="hp">
                        <i style={{ width: `${hpPct}%` }} />
                        <span>HP {fmt(hpNow)}</span>
                      </div>
                      <div class="st">
                        <span>
                          <b>DMG</b> {fmt(st.dmg)}
                        </span>
                        <span>
                          <b>EVERY</b> {every(st.interval)}
                        </span>
                      </div>
                    </div>
                    <div class="dps">
                      <small>DPS</small>
                      {fmt(dp)}
                    </div>
                    <div class="tog">
                      <span
                        class={on ? 'on' : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          setField(id, true);
                        }}
                      >
                        FIELD
                      </span>
                      <span
                        class={on ? '' : 'on'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setField(id, false);
                        }}
                      >
                        BENCH
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div class="totals">
              <span>
                <b>FIELD DPS</b>
                {fmt(fieldDps)}
              </span>
              <span>
                <b>FIELD HP</b>
                {fmt(fieldHp)}
              </span>
              <span>
                <b>TANKS</b>
                {tanks}
              </span>
              <span>
                <b>HEALERS</b>
                {healers}
              </span>
            </div>
          </section>

          <section class="roster-curb">
            <div class="sec v">
              ON THE CURB <em>always on</em>
            </div>
            {buffers.length === 0 && <div class="curb-empty">Nobody on the curb yet. They never take a field slot.</div>}
            {buffers.map(([id]) => {
              const d = BATTLERS[id];
              const who = bufferWho(d.fx, d.does);
              const chip = d.fx ? chipOf(d.fx, r) : d.does;
              return (
                <div key={id} class="bc" {...tip(d.name, d.does, 'Always on. Does not take a field slot.', trainedBy(s, r, d.role))}>
                  <img src={crewURL(id)} width={32} height={48} alt="" />
                  <div>
                    <div class="nm">{d.name}</div>
                    <div class="who">{who}</div>
                    <div class="chip">{chip}</div>
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        {msg && (
          <div class="roster-full" role="alert" onClick={() => setMsg(null)}>
            <b>FIELD FULL</b>
            <span>{msg}</span>
            <em>click to dismiss</em>
          </div>
        )}
        <div class="roster-foot">
          <button class={`auto ${auto ? 'on' : ''}`} onClick={() => (autoPick(s, r), app.refresh())} {...tip('Auto lineup', 'Best tank, a healer, counters for this fight, then raw power.')}>
            <i />
            AUTO
          </button>
          <span class="hint">Best tank, a healer, counters, then raw power. Renovations are already in the numbers.</span>
          <span class="esc">ESC to close</span>
        </div>
      </div>
    </div>
  );
}
