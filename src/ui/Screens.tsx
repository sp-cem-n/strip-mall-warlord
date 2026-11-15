// Title screen, how to play, the story card, the win card, and the shared pixel dialogs.
import { DAWN } from '../game/content/dawn';
import { useEffect, useState } from 'preact/hooks';
import { app, ask, toast } from '../app';
import { ASPHALT_BONUS, FIGHTS, REGIONS } from '../game/defs';
import { asphaltGain, leased, pave, view } from '../game/economy';
import { fightLabel } from '../game/sim';
import { exportCode, importCode, old, saveGame } from '../game/save';
import { HOW, STORY } from '../game/content/copy';
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
        <span>Goodwill{s.bypass ? DAWN.awayPay : ''}</span>
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

export function SaveBox() {
  const [code, setCode] = useState(() => (app.hasSave ? exportCode(app.s) : ''));
  const copyOut = async () => {
    const out = exportCode(app.s);
    setCode(out);
    try {
      await navigator.clipboard.writeText(out);
      toast('Lease code copied.');
    } catch {
      toast('Copy failed. Select the code in the box and copy it yourself.');
    }
  };
  const load = () => {
    const raw = code.trim();
    if (!raw) return;
    ask('Load this lease? The current run will be overwritten.', 'Load', 'Never mind', () => {
      const got = importCode(raw);
      if (typeof got === 'string') return toast(got);
      app.s = got;
      app.away = null;
      app.hasSave = true;
      app.oldSave = false;
      saveGame(got);
      app.savePop = false;
      toast('Lease loaded.');
      app.refresh();
    });
  };
  return (
    <div class="save-box">
      <b>Lease code</b>
      <span class="dim">Copy a code out, or paste one in.</span>
      <textarea value={code} spellcheck={false} onFocus={(e) => (e.target as HTMLTextAreaElement).select()} placeholder="SMW1." onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)} />
      <div class="tp-row">
        <button class="btn small" onClick={copyOut}>Copy lease code</button>
        <button class="btn small" disabled={!code.trim()} onClick={load}>Load lease</button>
      </div>
    </div>
  );
}

// The floppy in the top bar: the same lease code box, as a popup over the game.
export function SavePopup() {
  if (!app.savePop) return null;
  const close = () => ((app.savePop = false), app.refresh());
  return (
    <div class="roster-back" onClick={close}>
      <div class="save-pop panel-brick" onClick={(e) => e.stopPropagation()}>
        <button class="roster-x" onClick={close} aria-label="Close">✕</button>
        <SaveBox />
        <span class="dim">Select the code to copy it yourself, or use the button. Esc closes.</span>
      </div>
    </div>
  );
}

export function Boot({ onNew, onResume }: { onNew: () => void; onResume: () => void }) {
  const kinds = app.hasSave ? leased(app.s, 0).slice(0, 4).map((x) => x.id) : ['pawn'];
  while (kinds.length < 4) kinds.push(null as unknown as string);
  return (
    <div class="screen boot">
      <Speaker corner />
      <div class="boot-scene-wrap"><img class="boot-scene" src={bootURL(kinds)} width={960} height={540} alt="Pinewood Plaza at night" /></div>
      <div class="boot-menu panel-brick tenant-board">
        {app.oldSave && (
          <div class="notice">
            <b>Notice to tenants:</b> The lease was renegotiated. Your old plaza ({old.from}) is still open at <a href={`./${old.from}/`}>/{old.from}/</a>{old.from === 'v0.5' ? ', save and all' : ''}. Nothing carries over here. Uncle Sal's pawn shop is open at 9.
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
        <button class="btn big" onClick={() => ((app.howFrom = 'boot'), (app.screen = 'howto'), app.refresh())}>
          How to Play
        </button>
        <SaveBox />
      </div>
      <p class="boot-foot dim">Fall 1997 · Route 9 · Ample parking</p>
    </div>
  );
}



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
        <button class="btn big" onClick={() => ((app.screen = app.howFrom), app.refresh())}>
          Back
        </button>
      </div>
    </div>
  );
}



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
        <h2>{r === 0 ? 'Dawn on Route 9' : DAWN.bypass}</h2>
        <p>{REGIONS[r].ending}</p>
        {r === 0 ? (
          <>
            <p class="dim">
              The Developer is on your crew. Pinewood Commons is a parking lot. You can keep the lights on and farm it, or pave Route 9 and do it again faster: +{gain} asphalt, +{Math.round(gain * ASPHALT_BONUS * 100)}% Route 9 rent, stats and Goodwill, forever.
            </p>
            {s.paves === 0 && (
              <div class="reveal">
                <b>One more thing.</b> {DAWN.reveal[0]} <b>{DAWN.reveal[1]}</b>
                {DAWN.reveal[2]}
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
