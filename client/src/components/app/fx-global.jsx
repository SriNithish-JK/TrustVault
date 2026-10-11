// App-wide extras: the glowing cursor, click sounds and the sound on/off button.
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setSound, sfx, soundOn } from '@/lib/sound';

const CLICKABLE = 'a, button, [role="button"], summary, label, select, input[type="checkbox"], input[type="radio"], input[type="range"], [data-spot]';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"]';

// A dot that sticks to the pointer and a ring that trails it; the ring grows over anything clickable
// and squeezes on press. Mouse only; the normal cursor stays for text fields and with reduced motion.
export function GlowCursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const html = document.documentElement;
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0, seen = false;
    const frame = () => {
      rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(frame) : 0;
    };
    const onMove = (e) => {
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; rx = x; ry = y; html.classList.add('glow-cursor'); }
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const t = e.target;
      html.classList.toggle('gc-hot', Boolean(t.closest?.(CLICKABLE)));
      html.classList.toggle('gc-text', Boolean(t.closest?.(TEXT)));
      raf ||= requestAnimationFrame(frame);
    };
    const down = () => html.classList.add('gc-down');
    const up = () => html.classList.remove('gc-down');
    const leave = () => html.classList.remove('glow-cursor');
    const enter = () => seen && html.classList.add('glow-cursor');
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerdown', down); addEventListener('pointerup', up);
    html.addEventListener('pointerleave', leave); html.addEventListener('pointerenter', enter);
    return () => {
      removeEventListener('pointermove', onMove); removeEventListener('pointerdown', down); removeEventListener('pointerup', up);
      html.removeEventListener('pointerleave', leave); html.removeEventListener('pointerenter', enter);
      cancelAnimationFrame(raf); html.classList.remove('glow-cursor', 'gc-hot', 'gc-text', 'gc-down');
    };
  }, []);
  return <><div ref={ring} className="gc-ring" aria-hidden="true" /><div ref={dot} className="gc-dot" aria-hidden="true" /></>;
}

// One listener: a soft blip on every button or link press (only when sound is on).
export function ClickSounds() {
  useEffect(() => {
    const onDown = (e) => { if (e.target.closest?.('a, button, [role="button"], summary')) sfx('tap'); };
    addEventListener('pointerdown', onDown, { passive: true });
    return () => removeEventListener('pointerdown', onDown);
  }, []);
  return null;
}

export function SoundToggle({ className }) {
  const [on, setOn] = useState(soundOn);
  useEffect(() => {
    const sync = () => setOn(soundOn());
    window.addEventListener('tv-sound', sync);
    return () => window.removeEventListener('tv-sound', sync);
  }, []);
  return (
    <Button type="button" variant="outline" size="icon-sm" className={className} onClick={() => setSound(!on)} aria-pressed={on} aria-label={on ? 'Turn sound off' : 'Turn sound on'}>
      <span key={String(on)} className="grid animate-pop place-items-center">{on ? <Volume2 /> : <VolumeX />}</span>
    </Button>
  );
}
