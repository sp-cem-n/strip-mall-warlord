import { useEffect, useState } from 'preact/hooks';
import { app, ask } from '../app';
import { newGame } from '../game/economy';
import { saveGame } from '../game/save';
import { Lot } from './Lot';
import { Pylon } from './Pylon';
import { closeRoster, RosterPopup } from './Roster';
import { AskDialog, Boot, HowTo, SavePopup, Story, TipCard, WinCard } from './Screens';
import { Shops } from './Shops';
import { BackOffice } from './BackOffice';
import { GameRoom } from './GameRoom';

function go(screen: typeof app.screen) {
  app.screen = screen;
  app.tip = null;
  app.refresh();
}

function startOver() {
  app.s = newGame();
  app.away = null;
  app.hasSave = true;
  app.oldSave = false;
  saveGame(app.s);
  go('story');
}

const onNew = () =>
  app.hasSave && app.s.totalTime > 30 ? ask('Start over? Every lease and all the Goodwill go in the dumpster behind Unit D.', 'Start over', 'Never mind', startOver) : startOver();

const onResume = () => {
  app.away = null;
  go('game');
};

export function App() {
  const [, setN] = useState(0);
  useEffect(() => {
    app.refresh = () => setN((n) => n + 1);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === 'Escape') {
        if (app.savePop) return (e.preventDefault(), (app.savePop = false), app.refresh());
        if (app.roster) return (e.preventDefault(), closeRoster());
      }
      if ((e.key === 'r' || e.key === 'R') && (app.screen === 'game' || app.roster)) {
        e.preventDefault();
        app.roster = !app.roster;
        app.tip = null;
        app.refresh();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const screen =
    app.screen === 'boot' ? (
      <Boot onNew={onNew} onResume={onResume} />
    ) : app.screen === 'room' ? (
      <GameRoom />
    ) : app.screen === 'howto' ? (
      <HowTo />
    ) : app.screen === 'story' ? (
      <Story all={new URLSearchParams(location.search).get('story') === 'all'} onDone={() => go('game')} />
    ) : (
      <div class="root">
        <Pylon />
        <main class="grid">
          <Shops />
          <div class="side">
            <Lot />
            <BackOffice />
          </div>
        </main>
      </div>
    );
  return (
    <>
      {screen}
      {app.toast && performance.now() < app.toastUntil && <div class="toast">{app.toast}</div>}
      <RosterPopup />
      <SavePopup />
      <WinCard />
      <AskDialog />
      <TipCard />
      {app.testPanel && app.screen !== 'boot' && <app.testPanel />}
    </>
  );
}
