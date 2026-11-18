// The lot signs across the top of the Lot: progress, weakness badges, auto-advance.
import { app, tip, toast } from '../app';
import { BATTLERS, FIGHTS, PATROL_WINS, REGIONS, WEAK_BONUS, type RegionId } from '../game/defs';
import { autoCovers, buyPatrol, currencyOf, patrolPrice, purse } from '../game/economy';
import { fmt } from './format';

function Weak({ id, r, zone }: { id: string; r: RegionId; zone: number }) {
  const lot = REGIONS[r].lots[zone];
  const d = BATTLERS[id];
  const who = [...lot.regulars, lot.boss].filter((e) => e.weak === id).map((e) => e.name);
  return (
    <span class={`weak role-bg-${d.role}`} {...tip(`Weak to the ${d.name}`, `${who.join(', ')}.`, `+${WEAK_BONUS * 100}% damage from them.`, d.line)}>
      {d.name[0]}
    </span>
  );
}

export function ZoneTrack({ r }: { r: RegionId }) {
  const s = app.s;
  const c = s.crews[r];
  const cur = currencyOf(r);
  const price = (z: number) => patrolPrice(s, r, z);
  return (
    <div class="zones">
      {REGIONS[r].lots.map((z, i) => {
        const start = FIGHTS[r].findIndex((f) => f.zone === i);
        const total = z.fights + 1;
        const won = Math.max(0, Math.min(total, c.frontier - start));
        const state = won >= total ? 'done' : c.frontier >= start ? 'current' : 'locked';
        const auto = autoCovers(s, r, i);
        return (
          <div key={z.id} class={`zone ${state}`}>
            <div class="zone-name" {...tip(z.name, z.blurb, ...[...z.regulars, z.boss].map((e) => `${e.name}: ${e.title}${e.tell ? ` (${e.tell === 'tanky' ? 'tanky' : 'hits hard'})` : ''}`))}>
              {z.short}
            </div>
            <div class="bar">
              <i style={{ width: `${(won / total) * 100}%` }} />
            </div>
            <div class="zone-sub">
              {state === 'done' ? (
                'Captured'
              ) : state === 'locked' ? (
                '???'
              ) : (
                <>
                  {won}/{total} {[...new Set([...z.regulars, z.boss].map((e) => e.weak))].map((k) => <Weak key={k} id={k} r={r} zone={i} />)}
                </>
              )}
            </div>
            {state !== 'locked' && state !== 'done' && (
              auto ? (
                <div class="auto on" {...tip('On patrol', 'The crew moves up here on its own, and drops back a fight when a new one is too much.')}>
                  AUTO
                </div>
              ) : (
                <button class="auto hire" disabled={purse(s, r) < price(i)} onClick={() => (toast(buyPatrol(s, r, i) ?? `${z.short}: on patrol`), app.refresh())} {...tip('Hire a patrol', `${fmt(price(i))} ${cur}, about ${PATROL_WINS} wins at this lot.`, 'The crew moves up here on its own, and drops back a fight when a new one is too much.', 'Without one, press ▸.')}>
                  PATROL {fmt(price(i))} {cur}
                </button>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
