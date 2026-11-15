// The Fun Zone: big cabinets you actually play, the prize counter, and Attract Mode. Its own screen.
import { DAWN } from '../game/content/dawn';
import { useEffect, useRef, useState } from 'preact/hooks';
import { app, tip, toast } from '../app';
import { CAB_H, CAB_W, cabinet, carpet, paneling, screenOf, type CabinetLook } from '../art/cabinets';
import { C } from '../art/palette';
import { CURRENCY_SHORT } from '../game/defs';
import { log } from '../game/economy';
import { ATTRACT_EVERY, BAR_BUFFS, QUIZ, BAR_HOUSE, BUFFS, HOUSE_SCORES, postShuffle, MACHINES, PERKS, attractPrice, buffOn, buyAttract, buyPerk, canAfford, endPlay, perk, perkPrice, postScore, serviced, startPlay, type BuffKind, type Cost, type MachineDef, type MachineId, type PerkId } from '../game/room';
import { canvasOf, urlOf } from './art';
import { fmt, fmtTime } from './format';
import { idle, newGame, pen, type Game } from './machines';
import { register } from './audio';

const SCALE = 3;
export const LOOKS: Record<MachineId, CabinetLook> = {
  pusher: { body: C.sodium, trim: C.sodiumLight, marquee: C.sodiumLight, ink: C.umber, title: 'COIN PUSHER', side: 'dots' },
  whac: { body: C.red, trim: C.neon, marquee: C.paper, ink: C.red, title: 'WHAC-A-THIEF', side: 'bolts' },
  skee: { body: C.forest, trim: C.green, marquee: C.sodiumLight, ink: C.forest, title: 'SKEE-BALL', side: 'rings' },
  claw: { body: C.violet, trim: C.neon, marquee: C.neon, ink: C.paper, title: 'CLAW', side: 'stars' },
  pinball: { body: C.navy, trim: C.blue, marquee: C.sodium, ink: C.ink, title: 'NIGHT SHIFT', side: 'moon', tall: true },
  cyclone: { body: C.ink, trim: C.red, marquee: C.red, ink: C.sodiumLight, title: 'CYCLONE', side: 'stripes' },
  darts: { body: C.umber, trim: C.red, marquee: C.neon, ink: C.paper, title: 'DARTS', side: 'dots', bar: 'darts' },
  pool: { body: C.umber, trim: C.blue, marquee: C.mint, ink: C.paper, title: 'POOL', side: 'dots', tall: true, bar: 'pool' },
  poker: { body: C.night, trim: C.sodium, marquee: C.sodium, ink: C.ink, title: 'JACKS OR BETTER', side: 'stars' },
  foos: { body: C.umber, trim: C.mint, marquee: C.mint, ink: C.paper, title: 'FOOSBALL', side: 'dots', tall: true, bar: 'foos' },
  shuffle: { body: C.umber, trim: C.sodium, marquee: C.sodiumLight, ink: C.paper, title: 'SHUFFLEBOARD', side: 'dots', tall: true, bar: 'shuffle' },
  trivia: { body: C.night, trim: C.violet, marquee: C.neon, ink: C.ink, title: 'BAR TRIVIA', side: 'stripes' },
};
const BAR_IDS = new Set([...BAR_BUFFS, ...QUIZ].map(([b]) => b));
// The hand that earned each poker buff (saved in room.hands): a flush pays like trips, so show the real hand.
export const costText = (c: Cost) => (c.cur === 'tickets' ? `${fmt(c.n)} tickets` : c.cur === 'cash' ? `$${fmt(c.n)}` : `${fmt(c.n)} ${CURRENCY_SHORT[c.cur]}`);

function Cabinet({ m }: { m: MachineDef }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const result = useRef<{ text: string; until: number } | null>(null);
  const [, setN] = useState(0);
  const s = app.s;
  const open = s.room.unlocked.includes(m.id);
  const look = LOOKS[m.id];
  const sc = screenOf(look.tall);
  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ctx = ref.current?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        const lit = app.s.room.unlocked.includes(m.id);
        ctx.drawImage(canvasOf(`cab:${m.id}:${lit}`, () => cabinet(look, lit, lit ? undefined : m.needs)), 0, 0);
        if (lit) {
          const p = pen(ctx, sc.x, sc.y, sc.w, sc.h);
          const g = game.current;
          if (g) {
            g.update(dt);
            g.draw(p, now / 1000);
            if (g.over) finish(g);
          } else {
            const sv = serviced(app.s, m.id);
            const r = result.current && now < result.current.until ? result.current.text : '';
            idle(p, m.id, now / 1000, sv > 0 ? `SERVICED ${fmtTime(sv)}` : r);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [m.id]);
  function finish(g: Game) {
    game.current = null;
    let text = g.label ?? '';
    if (m.id !== 'claw') {
      if (m.id === 'pinball' && g.score !== undefined && postScore(app.s, g.score)) text += ' NEW HIGH';
      if (m.id === 'shuffle' && g.score !== undefined && postShuffle(app.s, g.score)) text += ' NEW HIGH';
      if (m.id === 'poker' && g.q > 0) text = g.label ?? text;
      const rw = endPlay(app.s, m.id, g.q, m.id === 'poker');
      if (m.id === 'poker' && rw.buff) {
        const hand = (app.s.room.hands[rw.buff] = g.label![0] + g.label!.slice(1).toLowerCase());
        if (rw.big) log(app.s, m.region, `${m.name}: ${hand}. ${BUFFS[rw.buff].does}.`, 'win');
      }
      const got = m.id === 'poker' ? '' : [rw.cash && `+$${fmt(rw.cash)}`, rw.goodwill && `+${fmt(rw.goodwill)} GW`, rw.tickets && `+${fmt(rw.tickets)} TICKETS`, rw.equity && `+${fmt(rw.equity)} EQ`].filter(Boolean).join(' ');
      text = got || text;
      if (rw.cash || rw.tickets) register();
    }
    result.current = { text, until: performance.now() + 2500 };
    app.refresh();
  }
  function insert() {
    if (game.current) return;
    const err = startPlay(app.s, m.id);
    if (err) return toast(err);
    register();
    game.current = newGame(m.id, {
      shelf: app.s.room.shelf[0],
      speed: Math.min(20, 9 + app.s.room.plays * 0.05),
      jackpot: `${app.s.room.jackpot}`,
      onGrab: (q) => {
        const rw = endPlay(app.s, 'claw', q);
        if (rw.buff) toast(`${BUFFS[rw.buff].name}: ${BUFFS[rw.buff].does}`);
        return !!rw.buff;
      },
    });
    setN((n) => n + 1);
    app.refresh();
  }
  const local = (e: PointerEvent) => {
    const r = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    return [(e.clientX - r.left) / SCALE - sc.x, (e.clientY - r.top) / SCALE - sc.y] as const;
  };
  const cost = m.cost(s);
  const ap = attractPrice(s, m.id);
  const lv = s.room.attract[m.id] ?? 0;
  return (
    <div class={`cab ${open ? '' : 'dark'} ${look.tall ? 'tall' : ''}`}>
      <canvas
        ref={ref}
        width={CAB_W * SCALE}
        height={CAB_H * SCALE}
        onPointerDown={(e) => {
          if (!open) return;
          if (!game.current) return insert();
          const [x, y] = local(e);
          game.current.down(x, y);
        }}
        onPointerMove={(e) => game.current?.move?.(...local(e))}
        onPointerUp={(e) => game.current?.up(...local(e))}
        onPointerLeave={(e) => game.current?.up(...local(e))}
      />
      <div class="cab-plate">
        <b {...tip(m.name, m.blurb, open ? `${costText(cost)} a game.` : m.needs)}>{m.name}</b>
        {open && (
          <>
            <button class="btn small hot" disabled={!!game.current || !canAfford(s, m.region, cost) || serviced(s, m.id) > 0} onClick={insert}>
              Play {costText(cost)}
            </button>
            <button
              class="btn small"
              disabled={!ap || !canAfford(s, m.region, ap)}
              onClick={() => (toast(buyAttract(s, m.id) ?? `Attract Mode Lv ${lv + 1}`), app.refresh())}
              {...tip('Attract Mode', m.region ? 'The regulars play it while you are away. Badly.' : 'Plays itself while you are away. Badly.', lv ? `Lv ${lv}: one game every ${ATTRACT_EVERY[lv] / 60} min.` : 'Off.')}
            >
              {ap ? `Attract ${lv ? `Lv ${lv + 1}` : 'on'} ${costText(ap)}` : `Attract Lv ${lv}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BarCounter() {
  const s = app.s;
  const on = [...BAR_BUFFS, ...QUIZ].filter(([b]) => buffOn(s, b));
  return (
    <section class="counter pub">
      <h2>Behind the bar</h2>
      <h3>On the house</h3>
      {on.map(([b]) => (
        <div key={b} class="perk">
          <span>
            <b>{s.room.hands[b] ?? BUFFS[b].name}</b> <span class="dim">{BUFFS[b].does}</span>
          </span>
          <span class="dim">{fmtTime(s.room.buffs[b] ?? 0)}</span>
        </div>
      ))}
      {!on.length && <div class="dim">Nothing from the poker machine or the trivia yet.</div>}
      <h3>Shuffleboard board</h3>
      {BAR_HOUSE.map(([n, v], i) => (
        <div key={n} class={`perk ${i < s.room.shuffle ? 'beat' : ''}`}>
          <span>{n}</span>
          <span>{v}</span>
        </div>
      ))}
      <div class="dim">
        Yours: {s.room.shuffleBest}{DAWN.shufflePanel(Math.round(s.room.shuffle * 6))}{s.room.shuffle >= 3 ? ' · +1 fighter slot' : ''}
      </div>
    </section>
  );
}

function Counter() {
  const s = app.s;
  return (
    <section class="counter">
      <h2>Prize counter</h2>
      <div class="plush" />
      {(Object.keys(PERKS) as PerkId[]).map((id) => {
        const p = PERKS[id];
        const price = perkPrice(s, id);
        return (
          <div key={id} class="perk">
            <span>
              <b>{p.name}</b>
              <span class="dim">
                {p.does}
                {p.prices.length > 1 ? ` · ${perk(s, id)}/${p.prices.length}` : ''}
              </span>
            </span>
            <button class="btn small" disabled={!isFinite(price) || s.tickets < price} onClick={() => (toast(buyPerk(s, id) ?? p.name), app.refresh())}>
              {isFinite(price) ? `${fmt(price)} tk` : 'Got it'}
            </button>
          </div>
        );
      })}
      <h3>On the shelf</h3>
      {(Object.keys(BUFFS) as BuffKind[]).filter((b) => !BAR_IDS.has(b) && buffOn(s, b)).map((b) => (
        <div key={b} class="perk">
          <span>
            <b>{BUFFS[b].name}</b> <span class="dim">{BUFFS[b].does}</span>
          </span>
          <span class="dim">{fmtTime(s.room.buffs[b] ?? 0)}</span>
        </div>
      ))}
      {!(Object.keys(BUFFS) as BuffKind[]).some((b) => !BAR_IDS.has(b) && buffOn(s, b)) && <div class="dim">Nothing from the claw yet.</div>}
      <h3>Night Shift board</h3>
      {HOUSE_SCORES.map(([n, v], i) => (
        <div key={n} class={`perk ${i < s.room.board ? 'beat' : ''}`}>
          <span>{n}</span>
          <span>{fmt(v)}</span>
        </div>
      ))}
      <div class="dim">Yours: {fmt(s.room.best)} · Goodwill per win +{Math.round(s.room.board * 6)}%</div>
    </section>
  );
}

export function GameRoom() {
  const s = app.s;
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);
  const back = () => ((app.screen = 'game'), (app.tip = null), app.refresh());
  const bar = s.view === 1;
  return (
    <div class={`screen room ${bar ? 'pub' : ''}`} style={{ backgroundImage: `url(${bar ? urlOf('paneling', paneling) : urlOf('carpet', carpet)})` }}>
      <header class="room-bar">
        <span class="room-sign">{bar ? DAWN.bar : 'FUN ZONE ARCADE'}</span>
        <span class="tenant t-cash">
          <span class="k">Cash</span> <span class="v">${fmt(s.crews[s.view].cash)}</span>
        </span>
        {bar ? (
          <span class="tenant t-equity">
            <span class="k">{DAWN.equity}</span> <span class="v">{fmt(s.equity)}</span>
          </span>
        ) : (
          <>
            <span class="tenant t-goodwill">
              <span class="k">Goodwill</span> <span class="v">{fmt(s.goodwill)}</span>
            </span>
            <span class="tenant t-tickets">
              <span class="k">Tickets</span> <span class="v">{fmt(s.tickets)}</span>
            </span>
          </>
        )}
        <button class="btn big" onClick={back}>
          {bar ? DAWN.barBack : 'Back to the plaza'}
        </button>
      </header>
      <div class="room-floor">
        <div class="cabs">
          {MACHINES.filter((m) => m.region === s.view).map((m) => (
            <Cabinet key={m.id} m={m} />
          ))}
        </div>
        {bar ? <BarCounter /> : <Counter />}
      </div>
    </div>
  );
}
