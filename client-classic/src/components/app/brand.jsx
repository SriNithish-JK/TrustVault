// TrustVault mark: a flat shield with a check, drawn with the same thick outline as the rest of the UI.
// The same drawing is in public/favicon.svg - keep them in sync.
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const SHIELD = 'M32 5c7 3.4 14 5.4 21 6v18c0 13.6-8.6 24.2-21 30-12.4-5.8-21-16.4-21-30V11c7-.6 14-2.6 21-6z';

export function LogoMark({ size = 32, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d={SHIELD} transform="translate(4 4)" fill="#0f172a" />
      <path d={SHIELD} fill="#f59e0b" stroke="#0f172a" strokeWidth="4" strokeLinejoin="round" />
      <path d="M22 31l7.5 7.5L43 24" fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="square" />
    </svg>
  );
}

export function Brand({ to = '/', className }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2 text-xl font-bold tracking-tight', className)} aria-label="TrustVault home">
      <LogoMark size={34} />
      <span>Trust<span className="bg-primary px-1 text-ink">Vault</span></span>
    </Link>
  );
}

export function BootLoader({ text = 'Opening TrustVault…' }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-background" role="status">
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={64} className="animate-pulse" />
        <p className="font-mono text-sm tracking-wide text-muted-foreground uppercase">{text}</p>
      </div>
    </div>
  );
}
