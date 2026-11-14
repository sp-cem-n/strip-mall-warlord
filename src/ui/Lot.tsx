// The parking lot: the whole crew in ranks by role, the fight ladder, and the two calls an active player gets to make.
import { useEffect, useRef } from 'preact/hooks';
import { app, tip, toast } from '../app';
import { glyph } from '../art/font';
import { C, HEX } from '../art/palette';
import { BATTLERS, FIGHTS, OVERTIME_FIGHTS, REGIONS, ROLES, SECURITY_LEVELS, STANCE, WEAK_BONUS, type RegionId, type Role, type Stance } from '../game/defs';
import { advance, autoCovers, lotsTaken, overtime, overtimeCost, regionDone, roster, setStance, topFight, view } from '../game/economy';
import { enemyLineup } from '../game/battle';
import type { Unit } from '../game/state';
import { crewArt, enemyArt, fieldArt } from './art';
import { hit } from './audio';
import { fmt } from './format';

const W = 320;
const H = 150;
const SCALE = 2;
export const ROLE_COLOR: Record<Role, number> = { tank: C.red, damage: C.sodium, control: C.green, heal: C.blue, buffer: C.violet };

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, c: number, shadow = true) {
  for (const pass of shadow ? [1, 0] : [0]) {
    ctx.fillStyle = HEX[pass ? C.ink : c];
    let cx = x + pass;
    for (const ch of s.toUpperCase()) {
      const g = glyph(ch);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i]) ctx.fillRect(cx + i, y + j + pass, 1, 1);
      cx += 4;
    }
  }
}
const center = (s: string, x: number) => x - Math.floor((s.length * 4 - 1) / 2);

// Feet positions. The crew stands in ranks, 4 deep, front rank (tanks) nearest the lamp, then damage, control, heal, buffers.
// Columns are 17px apart so no two sprites overlap side to side; odd columns sit half a row lower.
function crewSpots(roles: Role[]): [number, number][] {
  return roles.map((_, i) => {
    const col = Math.floor(i / 4);
    return [150 - col * 17, 82 + (i % 4) * 18 + (col % 2 ? 9 : 0)];
  });
}
const enemySpot = (i: number): [number, number] => [184 + Math.floor(i / 3) * 24 + (i % 3 === 1 ? 12 : 0), 88 + (i % 3) * 20];
const BOSS_SPOT: [number, number] = [262, 134];
const lastFlash = new Map<number, number>();
const downAt = new Map<number, number>();

function drawUnit(ctx: CanvasRenderingContext2D, u: Unit, [x, y]: [number, number], t: number) {
  const big = u.boss;
  const flash = u.hp > 0 && u.flash > 0.2;
  const art = u.side === 'crew' ? crewArt(u.id, flash) : enemyArt(u.name, flash);
  const k = big ? 2 : 1;
  const was = lastFlash.get(u.uid) ?? 0;
  if (u.side === 'enemy' && u.flash > was + 0.05) hit(u.boss);
  lastFlash.set(u.uid, u.flash);
  const dir = u.side === 'crew' ? 1 : -1;
  if (u.acted > 0) x += dir * 3; // lunge
  if (u.flash > 0) x -= dir * Math.ceil(u.flash * 6); // knockback
  const w = 16 * k;
  const h = 24 * k;
  if (u.hp <= 0) {
    // fallen fighters fade out and leave the lot instead of piling up
    const at = downAt.get(u.uid) ?? (downAt.set(u.uid, t), t);
    const a = 0.5 - (t - at) * 0.6;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y - 4);
    ctx.rotate((dir * Math.PI) / 2);
    ctx.drawImage(art, -w / 2, -h / 2, w, h);
    ctx.restore();
    return;
  }
  const bob = Math.round(Math.sin(t * 4 + u.uid) * 0.6);
  ctx.drawImage(art, x - w / 2, y - h + bob, w, h);
  const top = y - h - 3;
  if (u.hp < u.maxHp) {
    const bw = big ? 28 : 12;
    ctx.fillStyle = HEX[C.ink];
    ctx.fillRect(x - bw / 2 - 1, top - 1, bw + 2, 3);
    ctx.fillStyle = HEX[u.side === 'crew' ? C.green : C.red];
    ctx.fillRect(x - bw / 2, top, Math.ceil((bw * u.hp) / u.maxHp), 1);
  }
  if (u.side !== 'enemy') return;
  if (u.weak) {
    const d = BATTLERS[u.weak];
    ctx.fillStyle = HEX[C.ink];
    ctx.fillRect(x - 4, top - 9, 7, 7);
    ctx.fillStyle = HEX[ROLE_COLOR[d.role]];
    ctx.fillRect(x - 3, top - 8, 5, 5);
    text(ctx, d.name[0], x - 2, top - 8, C.paper, false);
  }
  if (u.flash > 0) {
    const label = `-${fmt(u.lastDmg)}`;
    text(ctx, label, center(label, x), top - 16 - Math.round((0.35 - u.flash) * 30), u.lastWeak ? C.sodiumLight : C.paper);
  }
}

function draw(ctx: CanvasRenderingContext2D, t: number, r: RegionId) {
  const s = app.s;
  const c = s.crews[r];
  const f = FIGHTS[r][Math.min(c.at, FIGHTS[r].length - 1)];
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(fieldArt(REGIONS[r].lots[f.zone].id), 0, 0);
  const b = c.battle;
  if (b) {
    const spots = crewSpots(b.crew.map((u) => u.role as Role));
    const order = b.crew.map((u, i) => [u, spots[i]] as const).sort((a, z) => a[1][1] - z[1][1]);
    for (const [u, p] of order) drawUnit(ctx, u, p, t);
    const regs = b.enemies.filter((e) => !e.boss);
    regs.map((u, i) => [u, enemySpot(i)] as const).sort((a, z) => a[1][1] - z[1][1]).forEach(([u, p]) => drawUnit(ctx, u, p, t));
    for (const u of b.enemies.filter((e) => e.boss)) drawUnit(ctx, u, BOSS_SPOT, t);
    const down = b.crew.filter((u) => u.hp <= 0).length;
    if (down) text(ctx, `${down} DOWN`, 4, 140, C.red);
  } else {
    const team = roster(s, r);
    const spots = crewSpots(team.map(([id]) => BATTLERS[id].role));
    team.map((m, i) => [m[0], spots[i]] as const).sort((a, z) => a[1][1] - z[1][1]).forEach(([id, [x, y]]) => ctx.drawImage(crewArt(id), x - 8, y - 24));
    text(ctx, 'REGROUPING', center('REGROUPING', 236), 96, C.bone);
  }
  let by = 132;
  if (c.rally > 0) text(ctx, `RALLY +25% ${Math.ceil(c.rally)}S`, 196, (by += 8), C.sodiumLight);
  if (c.overtime > 0 || b?.overtime) text(ctx, `OVERTIME ${b?.overtime ? 'ON' : ''}`, 196, by - 8, C.mint);
}

function Field({ r }: { r: RegionId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rr = useRef(r);
  rr.current = r;
  useEffect(() => {
    let id = 0;
    const loop = (now: number) => {
      const ctx = ref.current?.getContext('2d');
      if (ctx) draw(ctx, now / 1000, rr.current);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas ref={ref} width={W} height={H} class="field" style={{ width: `${W * SCALE}px`, height: `${H * SCALE}px` }} />;
}

function Weak({ id, r, zone }: { id: string; r: RegionId; zone: number }) {
  const lot = REGIONS[r].lots[zone];
  const d = BATTLERS[id];
  const who = [...lot.regulars, lot.boss].filter((e) => e.weak === id).map((e) => e.name);
  return (
    <span class={`weak role-bg-${d.role}`} {...tip(`Weak to the ${d.name}`, `${who.join(', ')}.`, `+${WEAK_BONUS * 100}% damage from them. Nice to have, never required.`, d.line)}>
      {d.name[0]}
    </span>
  );
}

function ZoneTrack({ r }: { r: RegionId }) {
  const s = app.s;
  const c = s.crews[r];
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
            <div class={`auto ${auto ? 'on' : ''}`} {...tip(auto ? 'Auto-advance: on' : 'Auto-advance: off', i === 0 ? 'The first lot always moves up by itself.' : `Security Office Lv ${SECURITY_LEVELS(i)} watches this lot.`)}>
              {auto ? 'AUTO' : `SEC ${SECURITY_LEVELS(i)}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PLAYS: [Stance, string, string][] = [
  ['even', 'Even', 'No adjustments.'],
  ['rush', 'Rush', `+${Math.round((STANCE.rush.dmg - 1) * 100)}% damage, ${Math.round((STANCE.rush.hp - 1) * 100)}% HP. For tanky enemies and running out the clock.`],
  ['dig', 'Dig In', `+${Math.round((STANCE.dig.hp - 1) * 100)}% HP, ${Math.round((STANCE.dig.dmg - 1) * 100)}% damage. For enemies who hit hard.`],
];

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

export function Lot() {
  const s = app.s;
  const r = s.view;
  const c = s.crews[r];
  const ladder = FIGHTS[r];
  const done = regionDone(s, r);
  const f = ladder[Math.min(c.at, ladder.length - 1)];
  const lot = REGIONS[r].lots[f.zone];
  const atFrontier = c.at === c.frontier;
  const lineup = enemyLineup(r, Math.min(c.at, ladder.length - 1));
  const tells = [...new Set(lineup.map((e) => e.def.tell).filter(Boolean))];
  const boss = f.boss ? lot.boss : null;
  return (
    <section class="glass lot">
      <h2>
        <span>
          The Lot <span class="dim">· fights run themselves</span>
        </span>
        {s.bypass && (
          <span class="tabs">
            {REGIONS.map((reg) => (
              <button key={reg.id} class={`tab ${r === reg.id ? 'on' : ''}`} onClick={() => (view(s, reg.id), app.refresh())} {...tip(reg.name, `${lotsTaken(s, reg.id)}/${reg.lots.length} lots. Its own crew, its own till.`, 'Both crews fight all the time. This picks which one you manage.')}>
                {reg.name}
              </button>
            ))}
          </span>
        )}
      </h2>
      <ZoneTrack r={r} />
      <div class="field-head">
        <button class="btn small" disabled={c.at === 0} onClick={() => (advance(s, r, -1), app.refresh())} {...tip('Back one fight', 'Farm an easier fight. Wins still pay.')}>
          ◂
        </button>
        <span class="fh-main">
          <b>{boss ? boss.name : `${lot.name} · fight ${f.i + 1}/${lot.fights}`}</b>
          <span class="dim">
            {done && c.at === ladder.length - 2 ? ' · keeping the lights on' : atFrontier ? ` · ${c.kills}/${f.need} wins to move up` : ` · farming (${c.farmed} wins)`}
            {tells.length ? ` · ${tells.map((t) => (t === 'tanky' ? 'tanky' : 'hits hard')).join(', ')}` : ''}
          </span>
        </span>
        <button class="btn small" disabled={c.at >= topFight(s, r)} onClick={() => (advance(s, r, 1), app.refresh())} {...tip('Advance', 'Move up a fight now instead of waiting.', autoCovers(s, r, f.zone) ? 'This lot moves up by itself after the crew farms a while.' : 'Nobody is watching this lot yet: advance by hand.')}>
          ▸
        </button>
      </div>
      <Field r={r} />
      <Calls r={r} />
      <div class="legend dim">
        Front to back: {ROLES.map((ro) => <b key={ro} class={`role-${ro}`}>{ro} </b>)}. Enemies hit the front first. The badge is who they're weak to (+{WEAK_BONUS * 100}%).
      </div>
    </section>
  );
}
