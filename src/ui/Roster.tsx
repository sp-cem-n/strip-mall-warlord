// Click the battlefield: a real popup over the still-visible plaza, with renovated stats, DPS, Field/Bench, and curb buffers.
import { app, tip } from '../app';
import { BATTLERS, REGIONS, type RegionId } from '../game/defs';
import { auras, statsOf } from '../game/battle';
import { autoPick, curb, fighters, lineupOf, toggleField } from '../game/economy';
import { crewURL } from './art';
import { fmt } from './format';

export function closeRoster() {
  app.roster = false;
  app.tip = null;
  app.refresh();
}

function dps(dmg: number, interval: number) {
  return dmg / Math.max(0.2, interval);
}

export function RosterPopup() {
  if (!app.roster) return null;
  const s = app.s;
  const r = s.view as RegionId;
  const lv = new Map(fighters(s, r));
  const fielded = new Set(lineupOf(s, r));
  const team = [...lv.keys()];
  const buffers = curb(s, r);
  const aur = auras(s, [...team.map((id) => [id, lv.get(id) ?? 1] as [string, number]), ...buffers], r);
  return (
    <div class="roster-back" onClick={closeRoster}>
      <div class="roster" onClick={(e) => e.stopPropagation()}>
        <div class="roster-head">
          <h2>Night shift · {REGIONS[r].name}</h2>
          <span class="dim">{fielded.size} on the lot · {buffers.length} on the curb</span>
          <button class="btn small" onClick={() => (autoPick(s, r), app.refresh())}>AUTO</button>
          <button class="btn small" onClick={closeRoster}>✕</button>
        </div>
        <div class="roster-grid">
          {team.map((id) => {
            const d = BATTLERS[id];
            const level = lv.get(id) ?? 1;
            const st = statsOf(s, r, id, level);
            const on = fielded.has(id);
            const dp = dps(st.dmg, st.interval);
            return (
              <div key={id} class={`roster-card ${d.role}`} {...tip(d.name, d.does, `${d.role} · Lv ${level}`, `HP ${fmt(st.hp)} · dmg ${fmt(st.dmg)} / ${st.interval}s`, `DPS ${fmt(dp)}`)}>
                <div class="who">
                  <img src={crewURL(id)} width={32} height={48} alt="" />
                  <div>
                    <b>{d.name}</b>
                    <div class="role">{d.role} · Lv {level}</div>
                  </div>
                </div>
                <div class="dps">{fmt(dp)} DPS</div>
                <div class="meta">HP {fmt(st.hp)} · {fmt(st.dmg)} / {st.interval}s</div>
                <button class={`btn small ${on ? 'on' : ''}`} onClick={() => (toggleField(s, r, id), app.refresh())}>
                  {on ? 'FIELD' : 'BENCH'}
                </button>
              </div>
            );
          })}
        </div>
        <div class="roster-curb">
          <h2>On the curb</h2>
          {buffers.length === 0 && <div class="dim">Nobody waiting. Curb-side help never takes a field slot.</div>}
          {buffers.map(([id]) => {
            const d = BATTLERS[id];
            const from = aur.filter((a) => a.from === id);
            const text = from.length ? from.map((a) => ('v' in a.fx ? `${a.fx.k} ${Math.round((a.fx.v as number) * 100)}%` : a.fx.k)).join(' · ') : d.does;
            return (
              <div key={id} class="roster-buf" {...tip(d.name, d.does, 'Always on. Does not take a field slot.')}>
                <img src={crewURL(id)} width={24} height={36} alt="" />
                <b>{d.name}</b>
                <span class="dim">{text}</span>
              </div>
            );
          })}
        </div>
        <div class="roster-totals dim">The lot, R, or Esc closes this. The fight keeps going under the sodium lights.</div>
      </div>
    </div>
  );
}
