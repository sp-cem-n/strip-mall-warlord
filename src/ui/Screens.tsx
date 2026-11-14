// Title screen, how to play, the story card, the win card, and the shared pixel dialogs.
import { useEffect, useState } from 'preact/hooks';
import { app } from '../app';
import { ASPHALT_BONUS, FIGHTS, GOODWILL_PER_EQUITY, REGIONS } from '../game/defs';
import { asphaltGain, leased, pave, view } from '../game/economy';
import { fightLabel } from '../game/sim';
import { saveGame } from '../game/save';
import { bootURL } from './art';
import { fmt, fmtTime } from './format';
import { Speaker } from './Speaker';

const where = (r: 0 | 1) => (app.s.crews[r].frontier >= FIGHTS[r].length ? `${REGIONS[r].name}, all of it` : fightLabel(r, app.s.crews[r].at));

function AwayStats() {
  const a = app.away;
  const s = app.s;
  if (!app.hasSave) return <p class="away dim">No lease on file.</p>;
  if (!a)
    return (
      <p class="away dim">
        Lease on file: {where(0)}. {fmtTime(s.totalTime)} in.
      </p>
    );
  return (
    <div class="away">
      <div class="away-head">
        While you were away · {fmtTime(a.seconds)}
        {a.seconds >= 8 * 3600 ? ' (8h cap)' : ''}
      </div>
      <div class="away-row">
        <span>Rent collected</span>
        <b>${fmt(a.earned)}</b>
      </div>
      <div class="away-row">
        <span>Goodwill{s.bypass ? ' / Equity' : ''}</span>
        <b>
          +{fmt(a.goodwill)}
          {s.bypass ? ` / +${fmt(a.equity)}` : ''}
        </b>
      </div>
      <div class="away-row">
        <span>Fights won / lost</span>
        <b>
          {a.wins} / {a.losses}
        </b>
      </div>
      <div class="away-row">
        <span>Fights cleared</span>
        <b>{a.cleared}</b>
      </div>
      {a.captured.length > 0 && (
        <div class="away-row">
          <span>Captured</span>
          <b>{a.captured.join(', ')}</b>
        </div>
      )}
      {a.forLease > 0 && <div class="hint">{a.forLease === 1 ? 'A storefront is' : `${a.forLease} storefronts are`} for lease and waiting on you.</div>}
    </div>
  );
}

export function Boot({ onNew, onResume }: { onNew: () => void; onResume: () => void }) {
  const kinds = app.hasSave ? leased(app.s, 0).slice(0, 4).map((x) => x.id) : ['pawn'];
  while (kinds.length < 4) kinds.push(null as unknown as string);
  return (
    <div class="screen boot">
      <Speaker corner />
      <img class="boot-scene" src={bootURL(kinds)} width={960} height={540} alt="Pinewood Plaza at night" />
      <div class="boot-menu panel-brick">
        {app.oldSave && (
          <div class="notice">
            <b>Notice to tenants:</b> The lease was renegotiated. Your old plaza (v0.4) is still open at <a href="../v0.4/">/v0.4/</a>, but nothing carries over. Uncle Sal's pawn shop is open at 9.
          </div>
        )}
        <button class="btn big" onClick={onNew}>
          New Game
        </button>
        <div class="resume">
          <button class="btn big" disabled={!app.hasSave} onClick={onResume}>
            Resume
          </button>
          <AwayStats />
        </div>
        <button class="btn big" onClick={() => ((app.screen = 'howto'), app.refresh())}>
          How to Play
        </button>
      </div>
      <p class="boot-foot dim">Fall 1997 · Route 9 · Ample parking</p>
    </div>
  );
}

const HOW = [
  ['The deal', 'Every shop pays rent and sends one person to fight in the parking lot. You start with Uncle Sal\'s pawn shop.'],
  ['Fights', 'They run themselves, including while the tab is closed (up to 8 hours). Win a fight enough times and the crew moves up. Every win pays Goodwill.'],
  ['Dollars', 'Rent buys leases and renovations. A renovation is the big stat jump: +10% HP and damage, +15% rent. The card says exactly what the next one does.'],
  ['Goodwill', 'Spend it on training: five tracks, one per role. Small, permanent, and for the whole crew.'],
  ['New shops', 'They come up for lease as you clear fights, in order. No choosing, no rebranding. Lease it and somebody new joins.'],
  ['Stuck?', 'Three losses in a row and the crew falls back one fight to farm. It tries again after ten wins or anything you buy. The receipt says why it lost.'],
  ['The play', 'Even, Rush or Dig In. Some enemies are tanky, some hit hard. Calling the right play saves time. Calling none is fine too.'],
  ['Overtime', 'Pay two minutes of rent: the next three fights get +25% HP and damage. Good for a boss you almost beat.'],
  ['Security', 'The Parking Lot moves up by itself. The Security Office watches the rest of the plaza: more levels, more lots on auto. Otherwise, hit Advance.'],
  ['Walk-ins', 'Only while you watch, somebody walks into a shop: cash, a referral, or a rally. Ignore them and nothing bad happens.'],
];

export function HowTo() {
  return (
    <div class="screen howto">
      <div class="panel-brick howto-card">
        <h2>How to play</h2>
        <dl>
          {HOW.map(([k, v]) => (
            <div key={k} class="how-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <button class="btn big" onClick={() => ((app.screen = 'boot'), app.refresh())}>
          Back
        </button>
      </div>
    </div>
  );
}

const STORY: { text: string; note?: boolean }[] = [
  { text: 'Fall 1997. Route 9.' },
  { text: 'Your uncle Sal left you the lease on Unit A, his pawn shop, and a note:' },
  { text: "Don't let them pave it.", note: true },
  { text: "Pinewood Plaza peaked in 1991. The developer thinks it's done." },
  { text: "It isn't." },
  { text: 'P.S. The rest of the row is for lease. Fill it with people who can stand in a parking lot.', note: true },
];

export function Story({ all, onDone }: { all: boolean; onDone: () => void }) {
  const [n, setN] = useState(all ? STORY.length : 1);
  useEffect(() => {
    if (n >= STORY.length) return;
    const id = setTimeout(() => setN(n + 1), 1500);
    return () => clearTimeout(id);
  }, [n]);
  const done = n >= STORY.length;
  return (
    <div class="screen story" onClick={() => (done ? onDone() : setN(n + 1))}>
      <button
        class="btn small skip"
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}
      >
        Skip
      </button>
      <div class="panel-brick story-card">
        {STORY.slice(0, n).map((l, i) => (
          <p key={i} class={l.note ? 'note' : ''}>
            {l.text}
          </p>
        ))}
        {done ? (
          <button class="btn big" onClick={onDone}>
            Open up
          </button>
        ) : (
          <p class="dim tap">click to continue</p>
        )}
      </div>
    </div>
  );
}

export function AskDialog() {
  const a = app.ask;
  if (!a) return null;
  const close = () => ((app.ask = null), app.refresh());
  return (
    <div class="modal-bg" onClick={close}>
      <div class="panel-brick ask" onClick={(e) => e.stopPropagation()}>
        <p>{a.text}</p>
        <div class="ask-buttons">
          <button
            class="btn danger"
            onClick={() => {
              close();
              a.onYes();
            }}
          >
            {a.yes}
          </button>
          <button class="btn" onClick={close}>
            {a.no}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TipCard() {
  const t = app.tip;
  if (!t) return null;
  const x = Math.max(6, Math.min(t.x, innerWidth - 316));
  const y = t.y + 150 > innerHeight ? Math.max(6, t.y - 170) : t.y;
  return (
    <div class="tipcard" style={{ left: `${x}px`, top: `${y}px` }}>
      <div class="tip-title">{t.title}</div>
      {t.lines.map((l, i) => (
        <div key={i} class={i === t.lines.length - 1 && t.lines.length > 1 ? 'tip-quip' : ''}>
          {l}
        </div>
      ))}
    </div>
  );
}

// The ending. Nothing before it hints that there's a road north.
export function WinCard() {
  const s = app.s;
  if (!s.ending || app.screen !== 'game') return null;
  const r = (s.ending - 1) as 0 | 1;
  const close = () => ((s.ending = 0), saveGame(s), app.refresh());
  const gain = asphaltGain(s);
  return (
    <div class="modal-bg">
      <div class="panel-brick wincard">
        <img src={bootURL(leased(s, 0).slice(0, 4).map((x) => x.id), true)} width={640} height={360} alt="Pinewood Plaza at dawn" />
        <h2>{r === 0 ? 'Dawn on Route 9' : 'The Bypass'}</h2>
        <p>{REGIONS[r].ending}</p>
        {r === 0 ? (
          <>
            <p class="dim">
              The Developer is on your crew. Pinewood Commons is a parking lot. You can keep the lights on and farm it, or pave Route 9 and do it again faster: +{gain} asphalt, +{Math.round(gain * ASPHALT_BONUS * 100)}% Route 9 rent, stats and Goodwill, forever.
            </p>
            {s.paves === 0 && (
              <div class="reveal">
                <b>One more thing.</b> The state opened the Route 9 Bypass this morning. Exit 14 has a Self Storage with your name on the lease. New road, new crew, new money: <b>Equity</b>. The bank will turn {GOODWILL_PER_EQUITY} Goodwill into 1 Equity, any time.
              </div>
            )}
            <div class="ask-buttons">
              <button class="btn" onClick={close}>
                Keep the lights on
              </button>
              <button class="btn danger" onClick={() => (pave(s), close())}>
                Pave Route 9 (+{gain})
              </button>
              <button class="btn hot" onClick={() => (view(s, 1), close())}>
                Drive north
              </button>
            </div>
          </>
        ) : (
          <div class="ask-buttons">
            <button class="btn" onClick={close}>
              Keep the lights on
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
