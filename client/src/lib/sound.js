// Tiny synthesised sound effects (Web Audio, no files). Off by default; the choice is remembered.
//   sfx('tap' | 'tick' | 'success' | 'error' | 'open')
import { store } from './theme';

const KEY = 'tv-sound';
let ctx;
export const soundOn = () => store.get(KEY) === 'on';
export function setSound(on) {
  store.set(KEY, on ? 'on' : 'off');
  window.dispatchEvent(new Event('tv-sound'));
  if (on) sfx('success');
}

// [frequency Hz, start s, length s] per note; 'type' is the oscillator shape
const SOUNDS = {
  tap: { type: 'sine', gain: 0.05, notes: [[520, 0, 0.06]] },
  tick: { type: 'triangle', gain: 0.05, notes: [[880, 0, 0.05]] },
  open: { type: 'sine', gain: 0.05, notes: [[392, 0, 0.09], [587, 0.07, 0.12]] },
  success: { type: 'sine', gain: 0.07, notes: [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.22]] },
  error: { type: 'sawtooth', gain: 0.035, notes: [[220, 0, 0.12], [174, 0.11, 0.2]] },
};

export function sfx(name) {
  if (!soundOn()) return;
  const s = SOUNDS[name];
  if (!s) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    for (const [freq, at, len] of s.notes) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = s.type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now + at);
      g.gain.linearRampToValueAtTime(s.gain, now + at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + at + len);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + len + 0.02);
    }
  } catch { /* audio not available: stay silent */ }
}
