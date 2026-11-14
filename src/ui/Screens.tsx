// Title screen, how to play, the story card, and the shared pixel dialogs.
import { useEffect, useState } from 'preact/hooks';
import { app } from '../app';
import { ZONES } from '../game/defs';
import { regionTaken } from '../game/economy';
import { bootURL } from './art';
import { fmt, fmtTime } from './format';
import { Speaker } from './Speaker';

function AwayStats() {
  const a = app.away;
  const s = app.s;
  if (!app.hasSave) return <p class="away dim">No lease on file.</p>;
  const where = regionTaken(s) ? 'the whole region' : `${ZONES[s.zone].name}, row ${s.row + 1}`;
  if (!a)
    return (
      <p class="away dim">
        Lease on file: {where}. {fmtTime(s.time)} in.
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
        <span>Fights won / lost</span>
        <b>
          {a.wins} / {a.losses}
        </b>
      </div>
      <div class="away-row">
        <span>Rows taken</span>
        <b>{a.rows}</b>
      </div>
      {a.captured.length > 0 && (
        <div class="away-row">
          <span>Captured</span>
          <b>{a.captured.join(', ')}</b>
        </div>
      )}
      {a.onBreak && <div class="hint">The crew is on a smoke break. Change something and they'll go back out.</div>}
      {!a.wins && !a.losses && <div class="dim">The plaza kept its hours. Nobody fought anybody.</div>}
    </div>
  );
}

export function Boot({ onNew, onResume }: { onNew: () => void; onResume: () => void }) {
  const kinds = app.hasSave ? app.s.slots.slice(0, 4).map((x) => x.shop) : (['vape', null, null, null] as const);
  return (
    <div class="screen boot">
      <Speaker corner />
      <img class="boot-scene" src={bootURL([...kinds])} width={960} height={540} alt="Pinewood Plaza at night" />
      <div class="boot-menu panel-brick">
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
  ['The deal', 'Every storefront pays rent and sends one person to fight in the parking lot next door. That is the whole business plan.'],
  ['Fights', 'They run themselves, including while the tab is closed (up to 8 hours). Enemies hit your front crew member first, so keep a Bouncer up front.'],
  ['Losing', 'The receipt says why, usually in one sentence. Most enemies wear a badge for who they are weak to: ×2.5 from that crew, ×0.5 from everyone else.'],
  ['Renovate', 'More rent, tougher crew member. Renovations belong to the building.'],
  ['Rebrand', "Click a shop's sign. Pick a new one from the sample book. Same building, same renovations, different crew."],
  ['Walk-ins', 'Only while you are watching, somebody walks into one of your shops. Click them for a little something. Ignore them and nothing bad happens.'],
  ['Heat', 'Payday Loans pays the most rent. Every level of it also makes every enemy 2% stronger.'],
  ['Pave it', 'When the crew is stuck for good, bulldoze it all for Asphalt. Everything runs better next time. Your uncle would hate this.'],
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
  { text: 'Your uncle left you the lease on Unit A, his vape shop, and a note:' },
  { text: "Don't let them pave it.", note: true },
  { text: "Pinewood Plaza peaked in 1991. The developer thinks it's done." },
  { text: "It isn't." },
  { text: 'P.S. Get a pawn shop going. People walk in with all kinds of things.', note: true },
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
