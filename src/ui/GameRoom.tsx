// The game rooms: the Fun Zone and the Off-Ramp, each one 2.5D room. Click a machine to open its game; x or Esc puts you back.
// Attract plays on the machine in the room and leaves a YOU WON slip (a napkin at the bar); its levels are bought inside the game.
import { DAWN } from '../game/content/dawn';
import { useEffect, useRef, useState } from 'preact/hooks';
import { app, toast } from '../app';
import { C } from '../art/palette';
import roomFz from '../art/room-fz.png';
import roomOr from '../art/room-or.png';
import { GRAPEVINE, spendSlips, type Reward, ATTRACT_EVERY, QUIZ, BAR_HOUSE, BUFFS, HOUSE_SCORES, postShuffle, MACHINE, PERKS, attractOn, attractPrice, buffOn, buyAttract, buyPerk, canAfford, endPlay, ensurePusher, perk, perkInfo, perkPrice, postScore, serviced, shelfOf, slipText, startPlay, stopAttract, type BuffKind, type Cost, type MachineDef, type MachineId, type PerkId, type PrePerkId } from '../game/room';
import { CURRENCY_SHORT } from '../game/defs';
import { fmt, fmtTime } from './format';
import { idle, newGame, pen, type Game } from './machines';
import { drawSlip } from './arcade';
import { register } from './audio';
import { Pylon } from './Pylon';

export const costText = (c: Cost) => (c.cur === 'tickets' ? `${fmt(c.n)} tickets` : c.cur === 'cash' ? `$${fmt(c.n)}` : `${fmt(c.n)} ${CURRENCY_SHORT[c.cur]}`);
const BAR_IDS = new Set([...QUIZ, ...GRAPEVINE].map(([b]) => b));

// ---- the rooms: 320x157 art (src/art/room-*.png), hotspots back to front, the Attract pips and where a slip gets taped ----
type Rect = [number, number, number, number];
// lay: the parts that sit in front of a neighbor, when it is not the whole box
type Spot = { id: MachineId | 'counter'; r: Rect; pip?: [number, number]; slip?: [number, number]; lay?: Rect[] };
const RW = 320, RH = 157;
const ROOMS: { art: string; spots: Spot[] }[] = [
  {
    art: roomFz,
    spots: [
      { id: 'claw', r: [47, 10, 47, 75], pip: [78, 64], slip: [52, 64] },
      { id: 'cyclone', r: [100, 5, 43, 80], pip: [134, 76], slip: [104, 50] },
      { id: 'pinball', r: [152, 12, 58, 61], pip: [156, 68], slip: [190, 50] },
      { id: 'whac', r: [218, 13, 59, 72], pip: [222, 78], slip: [244, 64] },
      { id: 'pusher', r: [8, 79, 73, 74], pip: [68, 147], slip: [30, 128] },
      { id: 'skee', r: [115, 70, 84, 83], pip: [120, 148], slip: [178, 116], lay: [[130, 69, 52, 32], [110, 100, 90, 53]] },
      { id: 'counter', r: [228, 113, 89, 40] },
    ],
  },
  {
    art: roomOr,
    spots: [
      { id: 'darts', r: [8, 8, 52, 87], pip: [9, 47], slip: [14, 60] },
      { id: 'fairway', r: [59, 6, 50, 91], pip: [93, 86], slip: [70, 62] },
      { id: 'trivia', r: [274, 4, 37, 23], pip: [274, 29], slip: [284, 30] },
      { id: 'poker', r: [115, 25, 31, 31], pip: [117, 51], slip: [118, 58] },
      { id: 'tabs', r: [154, 34, 39, 26], pip: [182, 58], slip: [158, 60] },
      { id: 'counter', r: [191, 22, 26, 32] },
      { id: 'blackjack', r: [275, 44, 44, 18], pip: [304, 60], slip: [282, 62] },
      { id: 'pool', r: [109, 85, 111, 54], pip: [112, 134], slip: [116, 120] },
      { id: 'foos', r: [13, 103, 65, 44], pip: [64, 141], slip: [20, 128] },
      { id: 'shuffle', r: [223, 117, 96, 23], pip: [230, 137], slip: [248, 132] },
    ],
  },
];
// what the thing is, under its name when it's open
const WHAT: Record<MachineId, string> = {
  pusher: 'a glass-front coin pusher', whac: 'a mallet cabinet', skee: 'a nine-ball alley', claw: 'a glass claw case', pinball: 'a pinball table', cyclone: 'a carnival light box',
  darts: 'a bristle board on the wall', pool: 'a coin-op bar table', poker: 'a bartop poker machine', foos: 'a foosball table', shuffle: 'a table shuffleboard', trivia: 'the TV over the bar',
  tabs: 'a cardboard box on the bar', blackjack: 'a bar felt and a shoe', fairway: 'an upright trackball golf cabinet',
};
const PAYS: Partial<Record<MachineId, string>> = { pusher: 'Pays tickets. The Rent Check going over the edge is the rare cash jackpot.', claw: 'Pays a toy from the case. Toys help the crew for a while.', cyclone: 'Pays tickets. The jackpot grows until somebody hits it.' };
const paysOf = (m: MachineDef) => PAYS[m.id] ?? DAWN.pays[m.id as keyof typeof DAWN.pays] ?? (m.region ? DAWN.pays.room : 'Pays tickets for the prize counter.');
const img = (src: string) => Object.assign(new Image(), { src });
const ART = ROOMS.map((r) => img(r.art));
const short = (n: number) => (n >= 1e6 ? `${Math.floor(n / 1e5) / 10}M` : n >= 1e4 ? `${Math.floor(n / 1e3)}K` : `${Math.floor(n)}`);
const hit = (r: 0 | 1, x: number, y: number) => [...ROOMS[r].spots].reverse().find(({ r: [a, b, w, h] }) => x >= a && x < a + w && y >= b && y < b + h);
type Open = MachineId | 'counter' | null;

function Room({ r, onOpen }: { r: 0 | 1; onOpen: (id: Open) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hover = useRef<Spot | undefined>(undefined);
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const ctx = ref.current?.getContext('2d');
      const s = app.s;
      if (ctx && ART[r].complete) {
        ctx.drawImage(ART[r], 0, 0);
        const p = pen(ctx, 0, 0, RW, RH);
        for (const sp of ROOMS[r].spots) {
          const [x, y, w, h] = sp.r;
          if (sp.id === 'counter') continue;
          // painter's order: a dark machine is dimmed, a lit one in front of it is laid back on top
          if (!s.room.unlocked.includes(sp.id)) {
            ctx.fillStyle = 'rgba(12, 9, 16, 0.66)';
            ctx.fillRect(x, y, w, h);
            continue;
          }
          for (const [a, b, c, d] of sp.lay ?? [sp.r]) ctx.drawImage(ART[r], a, b, c, d, a, b, c, d);
          const lv = s.room.attract[sp.id] ?? 0;
          const on = !!attractOn(s, sp.id) && Math.floor(now / 250) % 2 === 0; // running: the pips chase
          if (sp.pip) for (let i = 0; i < 3; i++) p.rect(sp.pip[0] + i * 3, sp.pip[1], 2, 2, on ? (i === Math.floor(now / 250) % 3 ? C.neon : C.sodiumLight) : i < lv ? C.sodiumLight : C.asphalt);
        }
        // the live numbers painted on the art
        if (r === 0) {
          p.rect(163, 33, 34, 5, C.umber).text(short(s.room.best), 164, 33, C.sodiumLight);
          p.rect(115, 38, 13, 5, C.ink).text(short(s.room.jackpot), 115, 38, C.red);
          p.rect(289, 114, 16, 5, C.ink).text(s.tickets >= 1e3 && s.tickets < 1e4 ? `${Math.floor(s.tickets / 100) / 10}K` : short(s.tickets), 289, 114, C.sodiumLight);
        } else {
          // the Grapevine: rumor slips on the bill spike behind the bar, blue pen on a folded bar napkin
          for (let i = 0; i < Math.min(5, s.room.slips ?? 0); i++) p.rect(205 + (i % 2), 44 - i * 3, 8, 3, C.bone).rect(206 + (i % 2), 45 - i * 3, 5, 1, C.blue);
        }
        const hv = hover.current;
        if (hv) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(246, 210, 122, 0.10)';
          ctx.fillRect(...hv.r);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [r]);
  const at = (e: MouseEvent) => {
    const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return hit(r, ((e.clientX - b.left) / b.width) * RW, ((e.clientY - b.top) / b.height) * RH);
  };
  const s = app.s;
  return (
    <div class={`room-stage ${r ? 'pub' : 'fz'}`}>
      <canvas
        ref={ref}
        width={RW}
        height={RH}
        style={{ cursor: hover.current ? 'pointer' : 'default' }}
        onMouseMove={(e) => {
          const sp = at(e);
          if (sp !== hover.current) {
            hover.current = sp;
            (e.currentTarget as HTMLElement).style.cursor = sp ? 'pointer' : 'default';
          }
          if (!sp) return app.tip && ((app.tip = null), app.refresh());
          const title = sp.id === 'counter' ? (r ? DAWN.grapevine.title : 'Prize counter') : MACHINE[sp.id].name;
          const lines = sp.id === 'counter' ? [r ? DAWN.grapevine.pile(s.room.slips ?? 0) : `${fmt(s.tickets)} tickets to spend.`] : s.room.unlocked.includes(sp.id) ? [WHAT[sp.id], `${costText(MACHINE[sp.id].cost(s))} a game.`] : [WHAT[sp.id], MACHINE[sp.id].needs];
          app.tip = { x: e.clientX + 14, y: e.clientY + 18, title, lines };
          app.refresh();
        }}
        onMouseLeave={() => ((hover.current = undefined), (app.tip = null), app.refresh())}
        onClick={(e) => {
          const sp = at(e);
          if (!sp) return;
          if (sp.id !== 'counter' && !s.room.unlocked.includes(sp.id)) return toast(MACHINE[sp.id].needs);
          app.tip = null;
          onOpen(sp.id);
        }}
      />
      {ROOMS[r].spots.map((sp) => {
        const won = sp.id !== 'counter' && s.room.won[sp.id];
        if (!won || !sp.slip) return null;
        return (
          <button key={sp.id} class={`won-slip ${r ? 'napkin' : ''}`} style={{ left: `${(sp.slip[0] / RW) * 100}%`, top: `${(sp.slip[1] / RH) * 100}%` }} onClick={() => onOpen(sp.id)}>
            <b>WON</b>
            {won}
          </button>
        );
      })}
    </div>
  );
}

// ---- an open game: the screen big on the left, how to play, PLAY and Attract on the right ----
const K = 6; // screen pixels per game pixel on the canvas; CSS fits it to the room
const screenOf = (m: MachineDef) => (['pinball', 'pool', 'foos', 'shuffle'].includes(m.id) ? { w: 78, h: 101 } : { w: 78, h: 76 });
function Machine({ m, last }: { m: MachineDef; last: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const ready = useRef(0); // the READY beat: a moment after the coin drops before the game takes input
  const ended = useRef(0); // a beat after a game ends, so the last tap doesn't buy the next one
  const result = useRef<{ text: string; until: number; slip?: { amount: string; sub: string; tickets?: boolean } } | null>(null);
  const autoQ = useRef<number | null>(null); // set while an Attract play is on this screen
  const autoPoked = useRef(false);
  const autoAt = useRef(0);
  const lastRun = useRef(last);
  const [, setN] = useState(0);
  const s = app.s;
  const sc = screenOf(m);
  const opts = () => ({
    shelf: app.s.room.shelf[0],
    field: m.id === 'pusher' ? ensurePusher(app.s) : undefined,
    grip: perk(app.s, 'grip'),
    speed: Math.min(20, 9 + app.s.room.plays * 0.05),
    jackpot: `${app.s.room.jackpot}`,
    house: BAR_HOUSE[Math.min(BAR_HOUSE.length - 1, app.s.room.shuffle)][0],
  });
  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ctx = ref.current?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.setTransform(K, 0, 0, K, 0, 0);
        const att = attractOn(app.s, m.id);
        // an Attract play the sim already paid for: it plays here while you watch
        if (att && !game.current && now >= ended.current) {
          att.held = true;
          autoQ.current = att.q;
          autoPoked.current = false;
          autoAt.current = now;
          ready.current = now + 500;
          game.current = newGame(m.id, { ...opts(), onGrab: () => false });
        }
        const p = pen(ctx, 0, 0, sc.w, sc.h);
        const g = game.current;
        if (g) {
          if (autoQ.current !== null && now >= ready.current) {
            const q = autoQ.current;
            if (!autoPoked.current) {
              autoPoked.current = true;
              g.down(sc.w / 2 + (q - 0.5) * 10, Math.floor(sc.h * 0.35));
            } else if (now >= ready.current + 180) g.up(sc.w / 2, Math.floor(sc.h * 0.35));
            // games that need a hold or a long run still end in a few seconds
            if (now - autoAt.current > 2800 && !g.over) ((g.over = true), (g.q = q));
          }
          if (now >= ready.current) g.update(dt);
          g.draw(p, now / 1000);
          if (now < ready.current) (p.rect(0, Math.floor(sc.h / 2) - 6, sc.w, 13, C.ink), p.center(autoQ.current !== null ? 'ATTRACT' : 'READY', Math.floor(sc.h / 2) - 2, C.sodiumLight));
          if (g.over) finish(g);
        } else {
          const sv = serviced(app.s, m.id);
          const rs = result.current;
          if (rs?.slip && now < rs.until) drawSlip(p, { ...rs.slip, t: 1 - (rs.until - now) / 2800 });
          else idle(p, m.id, now / 1000, sv > 0 ? `SERVICED ${fmtTime(sv)}` : rs && now < rs.until ? rs.text : '');
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      const att = attractOn(app.s, m.id);
      if (att) att.held = false;
    };
  }, [m.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const rs = result.current;
      if (rs?.slip && performance.now() < rs.until && e.type === 'keydown' && e.key !== 'Escape') {
        e.preventDefault();
        rs.until = performance.now();
        return;
      }
      if (game.current?.key && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowUp' || 'aAdDwWhHsSpP123'.includes(e.key))) {
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
    // an Attract play pays once: here if it is still running, else tickRoom already settled it
    const ours = watched === null || !!attractOn(app.s, m.id);
    if (watched !== null) stopAttract(app.s, m.id);
    if (m.id === 'claw' && watched === null) {
      result.current = { text, until: performance.now() + 2500 };
      return app.refresh();
    }
    if (m.id === 'pinball' && g.score !== undefined && postScore(app.s, g.score)) text += ' NEW HIGH';
    if (m.id === 'shuffle' && g.score !== undefined && postShuffle(app.s, g.score)) text += ' NEW HIGH';
    const rw = ours ? endPlay(app.s, m.id, g.q, watched !== null, watched === null) : ({ text: '' } as Reward);
    if (watched !== null && ours) lastRun.current = slipText(rw) || 'NOTHING';
    if (rw.slip) toast(DAWN.grapevine.toast);
    const got = [rw.slips && `+${rw.slips} SLIP${rw.slips > 1 ? 'S' : ''}`, rw.cash && `+$${fmt(rw.cash)}`, rw.goodwill && `+${fmt(rw.goodwill)} GW`, rw.tickets && `+${fmt(rw.tickets)} TICKETS`, rw.equity && `+${fmt(rw.equity)} EQ`].filter(Boolean).join(' ');
    text = got || text;
    if (rw.cash || rw.tickets) register();
    const showSlip = watched === null && (rw.big || !!rw.cash || (rw.tickets ?? 0) >= 20 || !!rw.buff || !!rw.slips);
    result.current = showSlip
      ? { text, until: performance.now() + 2800, slip: { amount: slipText(rw), sub: (g.label ?? rw.text ?? '').toUpperCase().slice(0, 22), tickets: !!rw.tickets } }
      : { text, until: performance.now() + 2500 };
    app.refresh();
  }
  function insert() {
    if (game.current || performance.now() < ended.current) return;
    const err = startPlay(app.s, m.id);
    if (err) return toast(err);
    register();
    ready.current = performance.now() + 700;
    game.current = newGame(m.id, {
      ...opts(),
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
    return [((e.clientX - r.left) / r.width) * sc.w, ((e.clientY - r.top) / r.height) * sc.h] as const;
  };
  const cost = m.cost(s);
  const ap = attractPrice(s, m.id);
  const lv = s.room.attract[m.id] ?? 0;
  const busy = !!game.current || autoQ.current !== null;
  return (
    <>
      <div class="og-screen">
        <canvas
          ref={ref}
          width={sc.w * K}
          height={sc.h * K}
          style={{ aspectRatio: `${sc.w} / ${sc.h}` }}
          onPointerDown={(e) => {
            if (result.current?.slip && performance.now() < result.current.until) return void (result.current.until = performance.now());
            if (autoQ.current !== null) return; // an Attract play: watch it
            if (!game.current) return insert();
            if (performance.now() < ready.current) return;
            game.current.down(...local(e));
          }}
          onPointerMove={(e) => game.current?.move?.(...local(e))}
          onPointerUp={(e) => game.current?.up(...local(e))}
          onPointerLeave={(e) => game.current?.up(...local(e))}
        />
      </div>
      <aside class="og-side">
        <p>{m.blurb}</p>
        <button class="og-play" disabled={busy || !canAfford(s, m.region, cost) || serviced(s, m.id) > 0} onClick={insert}>
          PLAY · {costText(cost)}
        </button>
        <p class="og-pays">{paysOf(m)}</p>
        <hr />
        <h3>
          Attract
          <span class="og-pips">
            {[0, 1, 2].map((i) => (
              <i key={i} class={i < lv ? 'on' : ''} />
            ))}
          </span>
        </h3>
        <p>{lv ? `${m.region ? 'The regulars play it' : 'Plays itself'}, badly, every ${ATTRACT_EVERY[lv] / 60} min. Wins turn up in the room as ${m.region ? 'a napkin' : 'a slip'} on the machine.` : `Off. Lv 1 and it plays a bad game every ${ATTRACT_EVERY[1] / 60} min.`}</p>
        <button class="og-attract" disabled={!ap || !canAfford(s, m.region, ap)} onClick={() => (toast(buyAttract(s, m.id) ?? `Attract Mode Lv ${lv + 1}`), app.refresh())}>
          {ap ? `LV ${lv + 1} · ${costText(ap)}` : `LV ${lv} · TOP SPEED`}
        </button>
        <p class="dim">{autoQ.current !== null ? 'Playing itself now.' : lastRun.current ? `Last run: WON ${lastRun.current}` : lv ? 'Last run: not yet.' : ''}</p>
      </aside>
    </>
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
  const [open, setOpen] = useState<Open>(null);
  const [last, setLast] = useState('');
  const [, setN] = useState(0);
  const r = s.view as 0 | 1;
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => setOpen(null), [r]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (e.preventDefault(), setOpen(null));
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const go = (id: Open) => {
    // opening a machine picks up its YOU WON slip
    if (id && id !== 'counter') (setLast(s.room.won[id] ?? ''), delete s.room.won[id]);
    setOpen(id);
  };
  const m = open && open !== 'counter' ? MACHINE[open] : null;
  return (
    <div class={`screen room ${r ? 'pub' : 'fz'}`}>
      <Pylon room />
      <Room r={r} onOpen={go} />
      {open && (
        <div class={`open-game ${r ? 'pub' : 'fz'}`}>
          <header>
            <h2>
              {m ? m.name : r ? DAWN.grapevine.title : 'Prize counter'}
              <span> · {m ? WHAT[m.id] : r ? 'behind the bar' : 'tickets in, prizes out'}</span>
            </h2>
            <button class="og-x" onClick={() => setOpen(null)} aria-label="Back to the room">
              x
            </button>
          </header>
          <div class="og-body">{m ? <Machine key={m.id} m={m} last={last} /> : r ? <BarCounter /> : <Counter />}</div>
        </div>
      )}
    </div>
  );
}
