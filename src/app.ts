// Shared runtime state for the UI. The sim never imports this.
import type { AwaySummary } from './game/sim';
import type { GameState } from './game/state';

export type Screen = 'boot' | 'howto' | 'story' | 'game' | 'room';
export interface Tip {
  x: number;
  y: number;
  title: string;
  lines: string[];
}
export interface Ask {
  text: string;
  yes: string;
  no: string;
  onYes: () => void;
}

export const app = {
  s: null as unknown as GameState,
  screen: 'boot' as Screen,
  howFrom: 'boot' as Screen,
  hasSave: false,
  oldSave: false, // a pre-v0.5 save was found and set aside
  speed: 1,
  paused: false,
  away: null as AwaySummary | null,
  tip: null as Tip | null,
  ask: null as Ask | null,
  raising: {} as Record<string, number>, // shop id -> performance.now() when the scaffolding comes down
  toast: '' as string,
  toastUntil: 0,
  refresh: () => {},
};

export function toast(msg: string) {
  app.toast = msg;
  app.toastUntil = performance.now() + 2200;
  app.refresh();
}

export function ask(text: string, yes: string, no: string, onYes: () => void) {
  app.ask = { text, yes, no, onYes };
  app.refresh();
}

// hover cards: spread onto any element
export function tip(title: string, ...lines: string[]) {
  return {
    onMouseEnter: (e: MouseEvent) => {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      app.tip = { x: r.left, y: r.bottom + 6, title, lines };
      app.refresh();
    },
    onMouseLeave: () => {
      app.tip = null;
      app.refresh();
    },
  };
}
