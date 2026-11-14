// The play (Even / Rush / Dig In) and Overtime.
import { app, tip, toast } from '../app';
import { OVERTIME_FIGHTS, STANCE, type RegionId, type Stance } from '../game/defs';
import { overtime, overtimeCost, setStance } from '../game/economy';
import { fmt } from './format';

const PLAYS: [Stance, string, string][] = [
  ['even', 'Even', 'No adjustments.'],
  ['rush', 'Rush', `+${Math.round((STANCE.rush.dmg - 1) * 100)}% damage, ${Math.round((STANCE.rush.hp - 1) * 100)}% HP. For tanky enemies and running out the clock.`],
  ['dig', 'Dig In', `+${Math.round((STANCE.dig.hp - 1) * 100)}% HP, ${Math.round((STANCE.dig.dmg - 1) * 100)}% damage. For enemies who hit hard.`],
];
export 
function Calls({ r }: { r: RegionId }) {
  const s = app.s;
  const c = s.crews[r];
  const cost = overtimeCost(s, r);
  return (
    <div class="calls">
      <span class="dim">The play:</span>
      {PLAYS.map(([k, label, what]) => (
        <button key={k} class={`btn small ${c.stance === k ? 'hot' : ''}`} onClick={() => (setStance(s, r, k), app.refresh())} {...tip(`${label}`, what, 'Applies from the next fight. Stays until you change it.')}>
          {label}
        </button>
      ))}
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
