import { useEffect, useState } from 'preact/hooks';
import { app, ask } from '../app';
import { newGame } from '../game/economy';
import { saveGame } from '../game/save';
import { Book } from './Book';
import { Lot, Receipt } from './Lot';
import { Pylon } from './Pylon';
import { AskDialog, Boot, HowTo, Story, TipCard } from './Screens';
import { Shops } from './Shops';

function go(screen: typeof app.screen) {
  app.screen = screen;
  app.tip = null;
  app.refresh();
}

function startOver() {
  app.s = newGame();
  app.away = null;
  app.hasSave = true;
  saveGame(app.s);
  go('story');
}

const onNew = () =>
  app.hasSave && app.s.time > 30 ? ask('Start over? The lease, the shops and the crew go in the dumpster behind Unit D.', 'Start over', 'Never mind', startOver) : startOver();

const onResume = () => {
  app.away = null;
  go('game');
};

export function App() {
  const [, setN] = useState(0);
  useEffect(() => {
    app.refresh = () => setN((n) => n + 1);
  }, []);
  const screen =
    app.screen === 'boot' ? (
      <Boot onNew={onNew} onResume={onResume} />
    ) : app.screen === 'howto' ? (
      <HowTo />
    ) : app.screen === 'story' ? (
      <Story all={new URLSearchParams(location.search).get('story') === 'all'} onDone={() => go('game')} />
    ) : (
      <div class="root">
        <Pylon />
        <main class="grid">
          <Shops />
          <div class="col">
            <Lot />
            <Receipt />
          </div>
        </main>
        <Book />
      </div>
    );
  return (
    <>
      {screen}
      {app.toast && performance.now() < app.toastUntil && <div class="toast">{app.toast}</div>}
      <AskDialog />
      <TipCard />
    </>
  );
}
