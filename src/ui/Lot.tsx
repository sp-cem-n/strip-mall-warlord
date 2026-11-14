import { useEffect, useRef } from 'preact/hooks';
import { app } from '../app';
import { glyph } from '../art/font';
import { C, HEX } from '../art/palette';
import { FIGHTERS, PRESTIGE_MIN_ZONE, SHOPS, SMOKE_BREAK_AFTER, ZONES, type FighterKind } from '../game/defs';
import { heat, regionTaken } from '../game/economy';
import { asphaltGain, bulldoze, canBulldoze } from '../game/sim';
import { saveGame } from '../game/save';
import type { Unit } from '../game/state';
import { crewArt, enemyArt, fieldArt } from './art';
import { fmtTime } from './format';

const W = 320;
const H = 150;
const SCALE = 2;
const KIND_COLOR: Record<FighterKind, number> = { bouncer: C.red, hustler: C.violet, medic: C.blue, fixer: C.sodium, lawyer: C.green };

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

// feet positions: crew fans out left of the lamp, enemies right
function spot(side: 'crew' | 'enemy', i: number): [number, number] {
  const col = Math.floor(i / 3);
  const row = i % 3;
  const x = side === 'crew' ? 132 - col * 22 - (row % 2) * 8 : 172 + col * 24 + (row % 2) * 8;
  return [x, 92 + row * 18];
}

function drawUnit(ctx: CanvasRenderingContext2D, u: Unit, i: number, t: number) {
  const big = u.boss;
  const flash = u.hp > 0 && u.flash > 0.2;
  const art = u.side === 'crew' ? crewArt(u.kind as FighterKind, flash) : enemyArt(u.name, flash);
  const k = big ? 2 : 1;
  let [x, y] = big ? [196, 124] : spot(u.side, i);
  const dir = u.side === 'crew' ? 1 : -1;
  if (u.acted > 0) x += dir * 3; // lunge
  if (u.flash > 0) x -= dir * Math.ceil(u.flash * 6); // knockback
  const w = 16 * k;
  const h = 24 * k;
  if (u.hp <= 0) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.translate(x, y - 4);
    ctx.rotate((dir * Math.PI) / 2);
    ctx.drawImage(art, -w / 2, -h / 2, w, h);
    ctx.restore();
    return;
  }
  const bob = Math.round(Math.sin(t * 4 + u.uid) * 0.6);
  ctx.drawImage(art, x - w / 2, y - h + bob, w, h);
  // hp bar
  const bw = big ? 28 : 14;
  const top = y - h - 4;
  ctx.fillStyle = HEX[C.ink];
  ctx.fillRect(x - bw / 2 - 1, top - 1, bw + 2, 4);
  ctx.fillStyle = HEX[u.side === 'crew' ? C.green : C.red];
  ctx.fillRect(x - bw / 2, top, Math.ceil((bw * u.hp) / u.maxHp), 2);
  if (u.weak) {
    ctx.fillStyle = HEX[C.ink];
    ctx.fillRect(x - 4, top - 9, 7, 7);
    ctx.fillStyle = HEX[KIND_COLOR[u.weak]];
    ctx.fillRect(x - 3, top - 8, 5, 5);
    text(ctx, FIGHTERS[u.weak].name[0], x - 2, top - 8, C.paper, false);
  }
  if (u.flash > 0) {
    const label = u.lastTag || `-${Math.round(u.lastDmg)}`;
    const color = u.lastTag ? C.paper : u.lastMult > 1 ? C.sodiumLight : u.lastMult < 1 ? C.stone : C.red;
    text(ctx, label, center(label, x), top - 16 - Math.round((0.35 - u.flash) * 30), color);
  }
}

function draw(ctx: CanvasRenderingContext2D, t: number) {
  const s = app.s;
  const zd = ZONES[Math.min(s.zone, ZONES.length - 1)];
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(fieldArt(zd.id), 0, 0);
  // heat: cruiser lights at the lot entrance
  if (heat(s) > 0) {
    const on = Math.floor(t * 3) % 2;
    ctx.fillStyle = HEX[on ? C.red : C.blue];
    ctx.fillRect(4, 56, 4, 2);
    ctx.fillStyle = HEX[on ? C.blue : C.red];
    ctx.fillRect(8, 56, 4, 2);
  }
  const b = s.battle;
  if (b) {
    const order = (list: Unit[]) => list.map((u, i) => [u, i] as const).sort((a, c) => spot(a[0].side, a[1])[1] - spot(c[0].side, c[1])[1]);
    for (const [u, i] of order(b.crew)) drawUnit(ctx, u, i, t);
    for (const [u, i] of order(b.enemies.filter((e) => !e.boss))) drawUnit(ctx, u, i, t);
    for (const u of b.enemies.filter((e) => e.boss)) drawUnit(ctx, u, 0, t);
  } else {
    s.slots
      .filter((x) => x.shop)
      .forEach((x, i) => {
        const [px, py] = spot('crew', i);
        ctx.drawImage(crewArt(SHOPS[x.shop!].fighter), px - 8, py - 24);
      });
    const msg = regionTaken(s) ? 'THE REGION IS YOURS' : s.lossStreak >= SMOKE_BREAK_AFTER ? `SMOKE BREAK ${Math.ceil(s.regroup)}S` : s.slots.some((x) => x.shop) ? 'REGROUPING' : 'OPEN A SHOP';
    text(ctx, msg, center(msg, 230), 96, s.lossStreak >= SMOKE_BREAK_AFTER ? C.sodium : C.bone);
  }
  if (s.boost > 0) text(ctx, `WALK-IN +50% ${Math.ceil(s.boost)}S`, 4, 140, C.sodiumLight);
}

function Field() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let id = 0;
    const loop = (now: number) => {
      const ctx = ref.current?.getContext('2d');
      if (ctx) draw(ctx, now / 1000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas ref={ref} width={W} height={H} class="field" style={{ width: `${W * SCALE}px`, height: `${H * SCALE}px` }} />;
}

const Weak = ({ k }: { k: FighterKind }) => <span class={`weak k-${k}`} title={`Weak to ${FIGHTERS[k].plural}`}>{FIGHTERS[k].name[0]}</span>;

function ZoneTrack() {
  const s = app.s;
  const ok = canBulldoze(s);
  const stuck = ok && (regionTaken(s) || s.lossStreak >= SMOKE_BREAK_AFTER);
  return (
    <div class="zones">
      {ZONES.map((z, i) => {
        const state = i < s.zone ? 'done' : i === s.zone ? 'current' : 'locked';
        return (
          <div key={z.id} class={`zone ${state}`} title={[...z.regulars, z.boss].map((e) => `${e.name}: ${e.title}`).join('\n')}>
            <div class="zone-name">{z.name}</div>
            <div class="pips">
              {Array.from({ length: z.rows }, (_, r) => (
                <span key={r} class={`pip ${i < s.zone || (i === s.zone && r < s.row) ? 'won' : i === s.zone && r === s.row ? 'now' : ''} ${r === z.rows - 1 ? 'boss' : ''}`} />
              ))}
            </div>
            <div class="zone-sub">{state === 'done' ? 'Captured' : [...new Set([...z.regulars.map((e) => e.weak), z.boss.weak])].map((k) => <Weak key={k} k={k} />)}</div>
          </div>
        );
      })}
      <div class={`zone pave ${ok ? 'current' : 'locked'} ${stuck ? 'glow' : ''}`}>
        <div class="zone-name">Pave it</div>
        {ok ? (
          <button
            class="btn small danger"
            onClick={() => {
              if (!confirm(`Bulldoze everything for +${asphaltGain(s)} asphalt?`)) return;
              app.s = bulldoze(s);
              saveGame(app.s);
              app.refresh();
            }}
          >
            +{asphaltGain(s)} asphalt
          </button>
        ) : (
          <div class="zone-sub">after {ZONES[PRESTIGE_MIN_ZONE - 1].name}</div>
        )}
      </div>
    </div>
  );
}

export function Lot() {
  const s = app.s;
  const b = s.battle;
  const zd = ZONES[Math.min(s.zone, ZONES.length - 1)];
  const boss = b?.enemies.find((e) => e.boss);
  return (
    <section class="panel lot">
      <h2>
        The Lot <span class="dim">· fights run themselves</span>
      </h2>
      <ZoneTrack />
      <div class="field-head">
        <span>{regionTaken(s) ? 'Region taken' : `${zd.name} · row ${s.row + 1}/${zd.rows}`}</span>
        <span class="dim">{b ? `${b.t.toFixed(0)}s` : ''}</span>
      </div>
      <Field />
      {boss && (
        <div class="boss-card">
          <strong>{boss.name}</strong> <span class="dim">{boss.title}</span>
        </div>
      )}
      <div class="legend dim">Enemies hit your front crew member first. The colored badge is who they're weak to: ×2.5 from them, ×0.5 from everyone else.</div>
    </section>
  );
}

export function Log() {
  return (
    <section class="panel log">
      <ul>
        {app.s.log
          .slice(-7)
          .reverse()
          .map((l, i) => (
            <li key={`${l.t}-${i}`} class={`log-${l.tone}`}>
              <span class="t">{fmtTime(l.t)}</span> {l.text}
              {l.n && <span class="dim"> ×{l.n}</span>}
            </li>
          ))}
      </ul>
    </section>
  );
}
