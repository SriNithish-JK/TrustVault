// Frame for pages anyone can open without signing in.
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Brand } from './brand';
import { ThemeToggle } from './account';

export function PublicShell({ children, brandTo = '/welcome', nav, className }) {
  return (
    <div className="bg-grid min-h-dvh">
      <header className="sticky top-0 z-20 border-b-2 border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Brand to={brandTo} />
          <div className="flex items-center gap-2.5">
            {nav}
            <ThemeToggle />
            <Button asChild size="sm" variant="secondary"><Link to="/login">Sign in</Link></Button>
          </div>
        </div>
      </header>
      <main className={cn('mx-auto grid max-w-6xl gap-16 px-4 py-10 sm:py-16', className)}>{children}</main>
      <footer className="border-t-2 border-border bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm">
          <span className="font-mono text-xs uppercase">TrustVault · AES-256 · SHA-256 ledger · TOTP 2FA</span>
          <span className="flex gap-5 font-semibold"><Link to="/privacy" className="underline underline-offset-4">Privacy policy</Link><Link to="/verify" className="underline underline-offset-4">Public verifier</Link></span>
        </div>
      </footer>
    </div>
  );
}

export const Kicker = ({ children, className }) => (
  <span className={cn('inline-block w-fit border-2 border-border bg-violet px-2 py-0.5 font-mono text-xs font-semibold tracking-widest text-ink uppercase', className)}>{children}</span>
);
