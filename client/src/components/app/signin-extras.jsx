// Sign-in extras: the step tracker, the "welcome back" memory for a trusted device, and the vault doors
// that close and reopen when a sign-in succeeds.
import { useEffect, useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { store } from '@/lib/theme';
import { sfx } from '@/lib/sound';
import { cn } from '@/lib/utils';
import '../../landing-extras.css';

// ---------- Step tracker: glowing nodes joined by a line that fills as you go ----------
export function StepTracker({ steps, at }) {
  return (
    <ol className="st" aria-label={`Step ${at + 1} of ${steps.length}: ${steps[at]}`}>
      {steps.map((label, i) => (
        <li key={label} className={cn(i < at && 'done', i === at && 'now')} aria-current={i === at ? 'step' : undefined}>
          <span className="st-node">{i < at ? <Check className="size-3.5" /> : i + 1}</span>
          <span className="st-label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

// ---------- Welcome back: only remembered on a device the person chose to trust ----------
const KEY = 'tv-known';
export const getKnown = () => { try { return JSON.parse(store.get(KEY)); } catch { return null; } };
export const setKnown = (user) => store.set(KEY, JSON.stringify({ name: user.name, email: user.email, at: Date.now() }));
export const touchKnown = () => { const k = getKnown(); if (k) store.set(KEY, JSON.stringify({ ...k, at: Date.now() })); };
export const clearKnown = () => { try { localStorage.removeItem(KEY); } catch { /* fine */ } };
export const initialsOf = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// ---------- Vault doors: close over the page, show "Access granted", open on the dashboard ----------
export const closeDoors = () => window.dispatchEvent(new Event('tv-doors'));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function DoorTransition() {
  const [run, setRun] = useState(0);
  useEffect(() => {
    let timer;
    const start = () => {
      if (reduced()) return;
      sfx('success');
      setRun((n) => n + 1);
      clearTimeout(timer);
      timer = setTimeout(() => setRun(0), 2300);
    };
    window.addEventListener('tv-doors', start);
    return () => { window.removeEventListener('tv-doors', start); clearTimeout(timer); };
  }, []);
  if (!run) return null;
  return (
    <div className="vd vd-in" key={run} aria-hidden="true" style={{ cursor: 'default' }}>
      <div className="door l" /><div className="door r" />
      <div className="dial">
        <svg viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" stroke="rgb(255 255 255 / 0.12)" strokeWidth="1.5" />
          <circle className="arc" cx="50" cy="50" r="46" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" pathLength="100" transform="rotate(-90 50 50)" />
        </svg>
        <span className="core"><ShieldCheck className="size-1/2" /></span>
      </div>
      <p className="msg"><b>Access granted</b></p>
    </div>
  );
}
