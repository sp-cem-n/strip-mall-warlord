// Overtime.
import { app, tip, toast } from '../app';
import { OVERTIME_FIGHTS, type RegionId } from '../game/defs';
import { overtime, overtimeCost } from '../game/economy';
import { fmt } from './format';

export function Calls({ r }: { r: RegionId }) {
  const s = app.s;
  const c = s.crews[r];
  const cost = overtimeCost(s, r);
  return (
    <div class="calls">
      <button
        class={`btn small ${c.overtime ? 'hot' : ''}`}
        disabled={c.overtime > 0 || c.cash < cost}
        onClick={() => {
          const err = overtime(s, r);
          if (err) toast(err);
          app.refresh();
        }}
        {...tip('Overtime', `Two minutes of rent: $${fmt(cost)}.`, `The next ${OVERTIME_FIGHTS} fights: +25% HP and damage for the whole crew.`, 'For the boss you almost beat.')}
      >
        {c.overtime ? `Overtime ×${c.overtime}` : `Overtime $${fmt(cost)}`}
      </button>
    </div>
  );
}
