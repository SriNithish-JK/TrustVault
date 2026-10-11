// TrustVault mark for the Aurora interface: a teal-to-blue shield with a check that draws itself.
// The same drawing is in public/favicon.svg - keep them in sync.
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export const SHIELD = 'M32 5c7 3.4 14 5.4 21 6v18c0 13.6-8.6 24.2-21 30-12.4-5.8-21-16.4-21-30V11c7-.6 14-2.6 21-6z';

export function LogoMark({ size = 32, className, draw = false }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="10" y1="5" x2="54" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5eead4" /><stop offset="0.55" stopColor="#14b8a6" /><stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <path d={SHIELD} fill={`url(#${id})`} />
      <path d={SHIELD} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
      <motion.path d="M22 31l7.5 7.5L43 24" fill="none" stroke="#04141c" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"
        initial={draw ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }} />
    </svg>
  );
}

export function Brand({ to = '/', className }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight', className)} aria-label="TrustVault home">
      <LogoMark size={34} className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-110 group-hover:-rotate-6" />
      <span>Trust<span className="text-gradient">Vault</span></span>
    </Link>
  );
}

// Shown while a page's code is still arriving: a neon bar across the top, nothing else to wait on.
export function PageLoader({ inline = false }) {
  return (
    <div role="status" aria-label="Loading" className={inline ? 'grid gap-4' : 'min-h-dvh bg-background'}>
      <div className="pl-bar" />
      {inline && [0, 1, 2].map((i) => <div key={i} className="pl-block" style={{ height: i ? 120 : 220, animationDelay: `${i * 120}ms` }} />)}
    </div>
  );
}

export function BootLoader({ text = 'Opening TrustVault…' }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-background" role="status">
      <div className="flex flex-col items-center gap-5">
        <span className="relative grid place-items-center">
          <span className="absolute size-16 animate-pulse-ring rounded-full border border-primary" />
          <LogoMark size={64} draw />
        </span>
        <p className="font-mono text-sm tracking-wide text-muted-foreground uppercase">{text}</p>
      </div>
    </div>
  );
}
