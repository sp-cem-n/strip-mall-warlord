// The Back Office: training (Goodwill / Equity), patrol contracts ($), and later the arcade. One tab at a time.
import { app, tip, toast } from '../app';
import { BATTLERS, CURRENCY_SHORT, GOODWILL_PER_EQUITY, REGIONS, ROLES, TRAIN_STEP, type RegionId, type Role } from '../game/defs';
import { autoCovers, bal, buyPatrol, convert, currencyOf, lotReached, patrolBlock, patrolPrice, purse, retryAfter, roster, secLevel, train, trainCost } from '../game/economy';
import { fmt } from './format';
import { MACHINES, roomOpen } from '../game/room';

const TRACKS: Record<Role, [string, string]> = {
  tank: ['Conditioning', 'tank HP'],
  damage: ['Sparring', 'damage dealer hits'],
  heal: ['First Aid', 'heals'],
  control: ['Paperwork', 'control effects and hits'],
  buffer: ['Team Building', 'buffer auras'],
};
export type OfficeTab = 'training' | 'patrol' | 'arcade';
export const office = { tab: 'training' as OfficeTab };

function Training({ r }: { r: RegionId }) {
  const s = app.s;
  const c = s.crews[r];
  const have = purse(s, r);
  const team = roster(s, r);
  return (
    <>
      {ROLES.map((role) => {
        const [name, what] = TRACKS[role];
        const lv = c.train[role];
        const cost = trainCost(r, lv);
        const who = team.filter(([id]) => BATTLERS[id].role === role).length;
        return (
          <div key={role} class="track">
            <span class={`role-${role}`} {...tip(name, `+${TRAIN_STEP * 100}% ${what} per level.`, `${who} on the crew.`)}>
              <b>{name}</b>
            </span>
            <span class="dim">
              Lv {lv} · +{Math.round(lv * TRAIN_STEP * 100)}%
            </span>
            <button class="btn small" disabled={have < cost} onClick={() => (toast(train(s, r, role) ?? `${name} Lv ${lv + 1}`), app.refresh())}>
              {fmt(cost)} {CURRENCY_SHORT[REGIONS[r].trainIn]}
            </button>
          </div>
        );
      })}
      {s.bypass && (
        <div class="bank" {...tip('The bank', `${GOODWILL_PER_EQUITY} Goodwill buys 1 Equity. One way.`)}>
          <span>
            <b>Bank:</b> {fmt(s.goodwill)} GW → {fmt(Math.floor(s.goodwill / GOODWILL_PER_EQUITY))} EQ
          </span>
          <button class="btn small" disabled={s.goodwill < GOODWILL_PER_EQUITY} onClick={() => (convert(s, Math.max(1, Math.floor(s.goodwill / GOODWILL_PER_EQUITY / 2))), app.refresh())}>
            Half
          </button>
          <button class="btn small hot" disabled={s.goodwill < GOODWILL_PER_EQUITY} onClick={() => (convert(s), app.refresh())}>
            All
          </button>
        </div>
      )}
    </>
  );
}

function Patrol({ r }: { r: RegionId }) {
  const s = app.s;
  const lv = secLevel(s, r);
  return (
    <>
      {REGIONS[r].lots.map((l, z) => {
        if (!lotReached(s, r, z)) return null;
        const on = autoCovers(s, r, z);
        const price = patrolPrice(s, r, z);
        const block = patrolBlock(s, r, z);
        return (
          <div key={l.id} class="track">
            <b {...tip(l.name, on ? 'Patrolled. The crew moves up here on its own.' : 'Unpatrolled. Press ▸ to move up here.')}>{l.short}</b>
            <span class="dim">{on ? 'on patrol' : block && block !== 'Already patrolled' ? block : `$${fmt(price)}`}</span>
            {on ? (
              <span class="auto on">AUTO</span>
            ) : (
              <button class="btn small" disabled={!!block || bal(s, r, 'cash') < price} onClick={() => (toast(buyPatrol(s, r, z) ?? `${l.short}: on patrol`), app.refresh())}>
                Sign ${fmt(price)}
              </button>
            )}
          </div>
        );
      })}
      <div class="dim tnote">
        Security Office Lv {lv}: contracts −{Math.round(Math.min(50, lv * 5))}%, retries after {retryAfter(s, r)} wins.
      </div>
    </>
  );
}

function Arcade({ r }: { r: RegionId }) {
  const s = app.s;
  const open = MACHINES.filter((m) => m.region === r && s.room.unlocked.includes(m.id));
  return (
    <>
      <button class="btn big hot arcade-go" onClick={() => ((app.screen = 'room'), (app.tip = null), app.refresh())}>
        {r === 0 ? 'Walk over to the Fun Zone' : 'Stop in at the Off-Ramp'}
      </button>
      {MACHINES.filter((m) => m.region === r).map((m) => (
        <div key={m.id} class="track">
          <b class={s.room.unlocked.includes(m.id) ? '' : 'dim'}>{m.name}</b>
          <span class="dim">{s.room.unlocked.includes(m.id) ? (s.room.attract[m.id] ? `Attract Lv ${s.room.attract[m.id]}` : m.blurb) : m.needs}</span>
          <span />
        </div>
      ))}
      <div class="dim tnote">
        {r === 0 ? `${fmt(s.tickets)} tickets · ${open.length}/6 machines` : `${open.length}/4 tables`}
      </div>
    </>
  );
}

export function BackOffice() {
  const s = app.s;
  const r = s.view;
  const tabs: [OfficeTab, string][] = [
    ['training', `Training · ${currencyOf(r)}`],
    ['patrol', 'Patrol · $'],
  ];
  if (roomOpen(s, r)) tabs.push(['arcade', r === 0 ? `Arcade · ${fmt(s.tickets)} tk` : 'Bar']);
  if (!tabs.some(([k]) => k === office.tab)) office.tab = 'training';
  return (
    <section class="glass training backoffice">
      <h2>
        Back Office
        <span class="tabs">
          {tabs.map(([k, label]) => (
            <button key={k} class={`tab ${office.tab === k ? 'on' : ''}`} onClick={() => ((office.tab = k), app.refresh())}>
              {label}
            </button>
          ))}
        </span>
      </h2>
      {office.tab === 'training' && <Training r={r} />}
      {office.tab === 'patrol' && <Patrol r={r} />}
      {office.tab === 'arcade' && roomOpen(s, r) && <Arcade r={r} />}
    </section>
  );
}
