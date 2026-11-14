// Every sound is synthesized with WebAudio: no files, nothing to license.
// Nothing plays until the first click or key press; mute is saved in localStorage.
const KEY = 'smw.settings';
const VOLUME = 0.3; // starts quiet

function loadMuted(): boolean {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return v?.muted === true;
  } catch {
    return false;
  }
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let lastHit = 0;
export const sound = { muted: loadMuted() };

export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = sound.muted ? 0 : VOLUME;
  master.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  hum();
}

export function setMuted(m: boolean) {
  sound.muted = m;
  try {
    localStorage.setItem(KEY, JSON.stringify({ muted: m }));
  } catch {
    /* ignore */
  }
  if (ctx && master) master.gain.setTargetAtTime(m ? 0 : VOLUME, ctx.currentTime, 0.05);
}

const live = () => (ctx && master && !sound.muted ? ctx : null);

function tone(type: OscillatorType, f0: number, f1: number, at: number, dur: number, vol: number) {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, at);
  o.frequency.exponentialRampToValueAtTime(f1, at + dur);
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + dur + 0.02);
}

function burst(at: number, dur: number, vol: number, type: BiquadFilterType, freq: number) {
  const c = ctx!;
  const n = c.createBufferSource();
  n.buffer = noise;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  n.connect(f).connect(g).connect(master!);
  n.start(at);
  n.stop(at + dur + 0.02);
}

// the sodium lamp: 120 Hz buzz, barely there, with the occasional flicker
function hum() {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = 120;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 320;
  const g = c.createGain();
  g.gain.value = 0.018;
  o.connect(lp).connect(g).connect(master!);
  o.start();
  setInterval(() => {
    if (Math.random() < 0.3) {
      const t = c.currentTime;
      g.gain.setValueAtTime(0.004, t);
      g.gain.setValueAtTime(0.018, t + 0.06 + Math.random() * 0.1);
    }
  }, 4000);
}

// cash register: drawer thunk, then the bell
export function register() {
  const c = live();
  if (!c) return;
  const t = c.currentTime;
  burst(t, 0.05, 0.1, 'bandpass', 2500);
  tone('sine', 120, 60, t, 0.08, 0.15);
  tone('triangle', 1568, 1560, t + 0.06, 0.5, 0.07);
  tone('triangle', 2093, 2090, t + 0.09, 0.45, 0.05);
}

// a hollow thump, throttled so a big fight doesn't become a drum solo
export function hit(heavy = false) {
  const c = live();
  if (!c || c.currentTime - lastHit < 0.09) return;
  lastHit = c.currentTime;
  const t = c.currentTime;
  tone('sine', heavy ? 120 : 170, heavy ? 40 : 55, t, 0.13, 0.22);
  burst(t, 0.05, 0.08, 'lowpass', 700);
}

// a shopping cart wheel that needs oil: somebody walked in
export function squeak() {
  const c = live();
  if (!c) return;
  const t = c.currentTime;
  for (const d of [0, 0.22]) {
    tone('triangle', 1500, 2300, t + d, 0.12, 0.035);
    tone('triangle', 2300, 1700, t + d + 0.1, 0.09, 0.03);
  }
}

// captured a lot: four notes, square wave, one held
export function jingle() {
  const c = live();
  if (!c) return;
  const t = c.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => tone('square', f, f, t + i * 0.11, i === 3 ? 0.45 : 0.12, 0.045));
}
