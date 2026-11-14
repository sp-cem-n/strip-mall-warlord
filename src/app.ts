// Shared runtime state for the UI. The sim never imports this.
import type { AwaySummary } from './game/sim';
import type { GameState } from './game/state';

export const app = {
  s: null as unknown as GameState,
  speed: 1,
  paused: false,
  away: null as AwaySummary | null,
  toast: '' as string,
  toastUntil: 0,
  refresh: () => {},
};

export function toast(msg: string) {
  app.toast = msg;
  app.toastUntil = performance.now() + 2200;
  app.refresh();
}
