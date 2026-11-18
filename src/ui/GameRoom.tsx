// The Fun Zone: big cabinets you actually play, the prize counter, and Attract Mode. Its own screen.
import { DAWN } from '../game/content/dawn';
import { useEffect, useRef, useState } from 'preact/hooks';
import { app, tip, toast } from '../app';
import { CAB_H, CAB_W, cabinet, carpet, paneling, screenOf, type CabinetLook } from '../art/cabinets';
import { C } from '../art/palette';
import { CURRENCY_SHORT } from '../game/defs';
import { GRAPEVINE, spendSlips, type Reward, ATTRACT_EVERY, QUIZ, BAR_HOUSE, BUFFS, HOUSE_SCORES, postShuffle, MACHINES, PERKS, attractPrice, buffOn, buyAttract, buyPerk, canAfford, endPlay, ensurePusher, perk, perkInfo, perkPrice, postScore, serviced, shelfOf, startPlay, type BuffKind, type Cost, type MachineDef, type MachineId, type PerkId, type PrePerkId } from '../game/room';
import { canvasOf, urlOf } from './art';
import { fmt, fmtTime } from './format';
import { idle, newGame, pen, type Game } from './machines';
import { drawSlip } from './arcade';
import { register } from './audio';
import { Pylon } from './Pylon';

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
  tabs: { body: C.brick, trim: C.sodiumLight, marquee: C.sodiumLight, ink: C.ink, title: 'PULL-TABS', side: 'dots' },
  blackjack: { body: C.forest, trim: C.sodium, marquee: C.paper, ink: C.forest, title: 'BLACKJACK', side: 'stars' },
  fairway: { body: C.navy, trim: C.green, marquee: C.mint, ink: C.navy, title: 'FAIRWAY 9', side: 'stripes' },
};
const BAR_IDS = new Set([...QUIZ, ...GRAPEVINE].map(([b]) => b));
// the sticker on the coin door
const tagText = (c: Cost) => (c.cur === 'cash' ? `$${fmt(c.n)}` : `${fmt(c.n)} ${c.cur === 'tickets' ? 'TK' : CURRENCY_SHORT[c.cur]}`);
export const costText = (c: Cost) => (c.cur === 'tickets' ? `${fmt(c.n)} tickets` : c.cur === 'cash' ? `$${fmt(c.n)}` : `${fmt(c.n)} ${CURRENCY_SHORT[c.cur]}`);

function Cabinet({ m }: { m: MachineDef }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const ready = useRef(0); // the READY beat: a moment after the coin drops before the game takes input
  const ended = useRef(0); // a beat after a game ends, so the last tap doesn't buy the next one
  const result = useRef<{ text: string; until: number; slip?: { amount: string; sub: string; tickets?: boolean } } | null>(null);
  const autoQ = useRef<number | null>(null); // set while Attract Mode or test autoplay is on this cabinet
  const autoPoked = useRef(false);
  const autoAt = useRef(0);
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
          const att = app.s.room.attracting;
          // A play the sim already paid for: put it on the screen so you can watch.
          if (att?.id === m.id && !game.current && now >= ended.current) {
            att.held = true;
            autoQ.current = att.q;
            autoPoked.current = false;
            autoAt.current = now;
            ready.current = now + 500;
            game.current = newGame(m.id, {
              shelf: app.s.room.shelf[0],
              field: m.id === 'pusher' ? ensurePusher(app.s) : undefined,
              grip: perk(app.s, 'grip'),
              speed: Math.min(20, 9 + app.s.room.plays * 0.05),
              jackpot: `${app.s.room.jackpot}`,
              house: BAR_HOUSE[Math.min(BAR_HOUSE.length - 1, app.s.room.shuffle)][0],
              onGrab: () => false,
            });
          }
          const p = pen(ctx, sc.x, sc.y, sc.w, sc.h);
          const g = game.current;
          if (g) {
            if (autoQ.current !== null && now >= ready.current) {
              const q = autoQ.current;
              if (!autoPoked.current) {
                autoPoked.current = true;
                const j = (q - 0.5) * 10;
                g.down(sc.w / 2 + j, Math.floor(sc.h * 0.35));
              } else if (now >= ready.current + 180) {
                g.up(sc.w / 2, Math.floor(sc.h * 0.35));
              }
              // games that need a hold or a long run still end in a few seconds so you can see the next one
              if (now - autoAt.current > 2800 && !g.over) {
                g.over = true;
                g.q = q;
              }
            }
            if (now >= ready.current) g.update(dt);
            g.draw(p, now / 1000);
            if (now < ready.current) (p.rect(0, Math.floor(sc.h / 2) - 6, sc.w, 13, C.ink), p.center('READY', Math.floor(sc.h / 2) - 2, C.sodiumLight));
            if (g.over) finish(g);
          } else {
            const sv = serviced(app.s, m.id);
            const rs = result.current;
            if (rs?.slip && now < rs.until) drawSlip(p, { ...rs.slip, t: 1 - (rs.until - now) / 2800 });
            else {
              const r = rs && now < rs.until ? rs.text : '';
              idle(p, m.id, now / 1000, sv > 0 ? `SERVICED ${fmtTime(sv)}` : r);
            }
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      const att = app.s.room.attracting;
      if (att?.id === m.id) att.held = false;
    };
  }, [m.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const rs = result.current;
      if (rs?.slip && performance.now() < rs.until) {
        e.preventDefault();
        rs.until = performance.now();
        return;
      }
      if (game.current?.key && (e.key === 'a' || e.key === 'A' || e.key === 'd' || e.key === 'D' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowUp' || 'wWhHsS123'.includes(e.key))) {
        if (e.repeat) return e.preventDefault();
        e.preventDefault();
        game.current.key(e.key, e.type === 'keydown');
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [m.id]);
  function finish(g: Game) {
    game.current = null;
    ended.current = performance.now() + 700;
    const watched = autoQ.current;
    autoQ.current = null;
    autoPoked.current = false;
    let text = g.label ?? '';
    if (m.id !== 'claw') {
      if (m.id === 'pinball' && g.score !== undefined && postScore(app.s, g.score)) text += ' NEW HIGH';
      if (m.id === 'shuffle' && g.score !== undefined && postShuffle(app.s, g.score)) text += ' NEW HIGH';
      if (m.id === 'poker' && g.q > 0) text = g.label ?? text;
      // Attract / test autoplay already paid; only endPlay once. If we walked off mid-play, tickRoom may have settled it.
      const stillOurs = !watched || app.s.room.attracting?.id === m.id;
      if (watched !== null && app.s.room.attracting?.id === m.id) app.s.room.attracting = null;
      const rw = stillOurs ? endPlay(app.s, m.id, g.q, watched !== null, watched === null) : ({ text: '' } as Reward);
      if (rw.slip) toast(DAWN.grapevine.toast);
      const got = [rw.slips && `+${rw.slips} SLIP${rw.slips > 1 ? 'S' : ''}`, rw.cash && `+$${fmt(rw.cash)}`, rw.goodwill && `+${fmt(rw.goodwill)} GW`, rw.tickets && `+${fmt(rw.tickets)} TICKETS`, rw.equity && `+${fmt(rw.equity)} EQ`].filter(Boolean).join(' ');
      text = got || text;
      if (rw.cash || rw.tickets) register();
      const costN = m.cost(app.s).n;
      const wonCash = (rw.cash ?? 0) > costN && m.cost(app.s).cur === 'cash';
      const showSlip = !watched && (rw.big || wonCash || (rw.tickets ?? 0) >= 20 || !!rw.buff || !!rw.slips);
      if (showSlip) {
        const amount = rw.slips ? `${rw.slips} SLIP${rw.slips > 1 ? 'S' : ''}` : rw.tickets ? `${fmt(rw.tickets)}` : rw.cash ? `$${fmt(rw.cash)}` : rw.buff ? BUFFS[rw.buff].name.toUpperCase() : rw.goodwill ? `${fmt(rw.goodwill)} GW` : rw.equity ? `${fmt(rw.equity)} EQ` : text;
        result.current = { text, until: performance.now() + 2800, slip: { amount, sub: (g.label ?? rw.text ?? '').toUpperCase().slice(0, 22), tickets: !!rw.tickets } };
        app.refresh();
        return;
      }
    } else if (watched !== null && app.s.room.attracting?.id === m.id) {
      app.s.room.attracting = null;
      endPlay(app.s, m.id, g.q, true);
    }
    result.current = { text, until: performance.now() + 2500 };
    app.refresh();
  }
  function insert() {
    if (game.current || performance.now() < ended.current) return;
    const err = startPlay(app.s, m.id);
    if (err) return toast(err);
    register();
    ready.current = performance.now() + 700;
    game.current = newGame(m.id, {
      shelf: app.s.room.shelf[0],
      field: m.id === 'pusher' ? ensurePusher(app.s) : undefined,
      grip: perk(app.s, 'grip'),
      speed: Math.min(20, 9 + app.s.room.plays * 0.05),
      jackpot: `${app.s.room.jackpot}`,
      house: BAR_HOUSE[Math.min(BAR_HOUSE.length - 1, app.s.room.shuffle)][0],
      onGrab: (q, prize) => {
        app.s.room.clawPick = prize;
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
    <div class={`cab ${open ? '' : 'dark'} ${look.tall ? 'tall' : ''} ${s.room.attracting?.id === m.id ? 'attracting' : ''}`}>
      {open && <span class={`price-tag ${canAfford(s, m.region, cost) ? '' : 'short'}`}>{tagText(cost)}</span>}
      <canvas
        ref={ref}
        width={CAB_W * SCALE}
        height={CAB_H * SCALE}
        onPointerDown={(e) => {
          // tap the cabinet: the coin goes in, then the same screen plays
          if (!open) return;
          if (result.current?.slip && performance.now() < result.current.until) {
            result.current.until = performance.now();
            return;
          }
          if (autoQ.current !== null) return; // watching Attract Mode / test autoplay
          if (!game.current) return insert();
          if (performance.now() < ready.current) return;
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
  const on = [...QUIZ, ...GRAPEVINE].filter(([b]) => buffOn(s, b));
  return (
    <section class="counter pub">
      <h2>Behind the bar</h2>
      <h3>On the house</h3>
      {on.map(([b]) => (
        <div key={b} class="perk">
          <span>
            <b>{BUFFS[b].name}</b> <span class="dim">{BUFFS[b].does}</span>
          </span>
          <span class="dim">{fmtTime(s.room.buffs[b] ?? 0)}</span>
        </div>
      ))}
      {!on.length && <div class="dim">Nothing running. Poker and every game at the bar pay rumor slips.</div>}
      <h3>{DAWN.grapevine.title}</h3>
      <div class="dim">{(s.room.slips ?? 0) > 0 ? DAWN.grapevine.pile(s.room.slips ?? 0) : DAWN.grapevine.empty}</div>
      {GRAPEVINE.map(([b, n]) => (
        <div key={b} class="perk">
          <span>
            <b>{BUFFS[b].name}</b> <span class="dim">{BUFFS[b].does}</span>
          </span>
          <button class="btn small" disabled={(s.room.slips ?? 0) < n} onClick={() => { const e = spendSlips(s, b); if (e) toast(e); app.refresh(); }}>
            {DAWN.grapevine.spend(n)}
          </button>
        </div>
      ))}
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

function PerkRow({ id }: { id: PerkId }) {
  const s = app.s;
  const p = perkInfo(s, id);
  if (!p) return null;
  const price = perkPrice(s, id);
  return (
    <div class="perk">
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
}

function Counter() {
  const s = app.s;
  const pre = Object.keys(PERKS) as PrePerkId[];
  const back = shelfOf(s).filter((id) => !(id in PERKS));
  const clawed = (Object.keys(BUFFS) as BuffKind[]).filter((b) => !BAR_IDS.has(b) && buffOn(s, b));
  return (
    <section class="counter">
      <h2>Prize counter</h2>
      <div class="plush" />
      {pre.map((id) => (
        <PerkRow key={id} id={id} />
      ))}
      {!!back.length && <h3>{DAWN.prizeBack}</h3>}
      {back.map((id) => (
        <PerkRow key={id} id={id} />
      ))}
      <h3>On the shelf</h3>
      {clawed.map((b) => (
        <div key={b} class="perk">
          <span>
            <b>{BUFFS[b].name}</b> <span class="dim">{BUFFS[b].does}</span>
          </span>
          <span class="dim">{fmtTime(s.room.buffs[b] ?? 0)}</span>
        </div>
      ))}
      {!clawed.length && <div class="dim">Nothing from the claw yet.</div>}
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
  const bar = s.view === 1;
  return (
    <div class={`screen room ${bar ? 'pub' : ''}`} style={{ backgroundImage: `url(${bar ? urlOf('paneling', paneling) : urlOf('carpet', carpet)})` }}>
      <Pylon room />
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
