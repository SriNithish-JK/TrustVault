// Signed-in shell: sidebar on desktop, bottom navigation on phones, top bar with the session countdown.
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderLock, Link2, History, ShieldCheck, ClipboardCheck, GraduationCap, Settings, ScanSearch, LogOut, KeyRound, Clock, Ellipsis,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Brand } from './brand';
import { AccountMenu, NotificationCenter, ThemeToggle } from './account';
import { VaultLock } from './secure';
import { Modal, OtpInput, ErrorText, toast } from './kit';

const NAV = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { to: '/documents', label: 'My Documents', short: 'Docs', icon: FolderLock },
  { to: '/review', label: 'Verification Queue', short: 'Queue', icon: ClipboardCheck, roles: ['verifier', 'admin'] },
  { to: '/records', label: 'Student Records', short: 'Records', icon: GraduationCap, roles: ['verifier', 'admin'] },
  { to: '/access', label: 'Access Requests', short: 'Access', icon: KeyRound, roles: ['student'] },
  { to: '/shares', label: 'Shared Links', short: 'Shares', icon: Link2 },
  { to: '/activity', label: 'Activity Log', short: 'Activity', icon: History },
  { to: '/security', label: 'Security', short: 'Security', icon: ShieldCheck },
  { to: '/admin', label: 'Admin Console', short: 'Admin', icon: Settings, roles: ['admin'] },
];

// ---------- Session countdown + "Stay signed in" warning 2 minutes before the hour ends ----------
function SessionTimer() {
  const { expiresAt, refresh, logout } = useAuth();
  const [left, setLeft] = useState(() => new Date(expiresAt) - Date.now());
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    const tick = () => {
      const ms = new Date(expiresAt) - Date.now();
      setLeft(ms);
      if (ms <= 0) window.dispatchEvent(new Event('session-expired'));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  const m = Math.max(0, Math.floor(left / 60000));
  const s = String(Math.max(0, Math.floor(left / 1000) % 60)).padStart(2, '0');

  const extend = async (e) => {
    e.preventDefault();
    try {
      await api('/auth/reauth', { method: 'POST', body: { code: new FormData(e.currentTarget).get('code') } });
      await refresh();
      setError('');
      toast('Session extended for another 60 minutes.');
    } catch (err) {
      setError(err.message);
      setAttempt((a) => a + 1);
    }
  };

  return <>
    <Badge variant={left < 5 * 60e3 ? 'destructive' : 'outline'} className="h-8 px-2.5 text-xs tabular-nums" title="Sessions end after 60 minutes">
      <Clock /> <span className="sr-only">Session time left</span>{m}:{s}
    </Badge>
    {left > 0 && left < 2 * 60e3 && (
      <Modal title="Your secure session is ending" locked>
        <form className="grid gap-4" onSubmit={extend}>
          <p className="text-sm text-muted-foreground">For your safety, sessions last 60 minutes. You will be signed out in <b className="font-mono text-foreground">{m}:{s}</b>.
            Enter your Google Authenticator code to stay signed in.</p>
          <OtpInput key={attempt} invalid={Boolean(error)} />
          <ErrorText>{error}</ErrorText>
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={async () => { await logout(); navigate('/welcome'); }}>Log out</Button>
            <Button>Stay signed in</Button>
          </div>
        </form>
      </Modal>
    )}
  </>;
}

const sideLink = ({ isActive }) => cn(
  'flex items-center gap-3 border-2 px-3 py-2 text-sm font-semibold transition-[transform,box-shadow] duration-100',
  isActive ? 'border-border bg-primary text-ink shadow-brutal-sm' : 'border-transparent hover:border-border hover:bg-card',
);
const dockLink = ({ isActive }) => cn(
  'grid flex-1 justify-items-center gap-0.5 border-border py-2 text-[11px] font-semibold [&:not(:last-child)]:border-r-2',
  isActive ? 'bg-primary text-ink' : 'bg-card',
);

export function Layout() {
  const { user, logout, pendingAccess, vaultUnlocked } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [more, setMore] = useState(false);
  const signOut = async () => { await logout(); navigate('/welcome'); toast('You are signed out.'); };

  useEffect(() => { setMore(false); window.scrollTo(0, 0); }, [pathname]);

  const nav = NAV.filter((n) => !n.roles || n.roles.includes(user.role));
  const [dock, rest] = [nav.slice(0, 4), nav.slice(4)];
  const badge = (to) => to === '/access' && pendingAccess > 0 && <Badge variant="destructive" className="ml-auto">{pendingAccess}</Badge>;

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:border-2 focus:border-border focus:bg-primary focus:px-3 focus:py-2 focus:text-ink">Skip to content</a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r-2 border-border bg-muted p-4 lg:flex">
        <Brand />
        <nav aria-label="Main" className="grid gap-1.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={sideLink}><Icon className="size-4.5" />{label}{badge(to)}</NavLink>
          ))}
        </nav>
        <div className="mt-auto grid gap-1.5 border-t-2 border-border pt-4">
          <NavLink to="/verify" className={sideLink}><ScanSearch className="size-4.5" />Public Verifier</NavLink>
          <button type="button" className={sideLink({ isActive: false })} onClick={signOut}><LogOut className="size-4.5" />Log out</button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b-2 border-border bg-background px-4 lg:px-8">
        <Brand className="lg:hidden [&>span]:hidden sm:[&>span]:inline" />
        <span className="hidden font-mono text-xs tracking-widest text-muted-foreground uppercase lg:block">Encrypted · 2FA protected</span>
        <div className="flex items-center gap-2.5">
          <SessionTimer />
          <ThemeToggle />
          <NotificationCenter />
          <Badge variant="violet" className="hidden h-8 px-2.5 sm:inline-flex">{user.role}</Badge>
          <AccountMenu />
        </div>
      </header>

      <main id="main" key={pathname} className="mx-auto w-full max-w-6xl animate-rise px-4 py-6 pb-28 lg:px-8 lg:py-10 lg:pb-16">
        <Outlet />
      </main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-border bg-card lg:hidden">
        {dock.map(({ to, short, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={dockLink}><Icon className="size-5" />{short}</NavLink>
        ))}
        <Popover open={more} onOpenChange={setMore}>
          <PopoverTrigger className={cn(dockLink({ isActive: rest.some((n) => pathname.startsWith(n.to)) }), 'relative')}>
            <Ellipsis className="size-5" />More
            {pendingAccess > 0 && rest.some((n) => n.to === '/access') && <span className="absolute top-1 right-1/4 size-2.5 border border-border bg-destructive" />}
          </PopoverTrigger>
          <PopoverContent align="end" side="top" className="grid w-60 gap-1.5 p-2">
            {rest.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={sideLink}><Icon className="size-4.5" />{label}{badge(to)}</NavLink>
            ))}
            <NavLink to="/verify" className={sideLink}><ScanSearch className="size-4.5" />Public Verifier</NavLink>
            <button type="button" className={sideLink({ isActive: false })} onClick={signOut}><LogOut className="size-4.5" />Log out</button>
          </PopoverContent>
        </Popover>
      </nav>

      {user.hasVaultPin && !vaultUnlocked && <VaultLock />}
    </div>
  );
}
